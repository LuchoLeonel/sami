"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getSamiPlayer = exports.calculateNumberOfPlayers = exports.getGameById = exports.endVotingPhase = exports.sendMessageToAI = exports.recordVote = exports.startGame = exports.joinGame = exports.createNewGame = exports.createOrJoin = exports.findFreeGame = exports.findBetGame = exports.cachedRoomsMessages = exports.roomsMessages = exports.rooms = exports.SAMI_URI = void 0;
const playerService_1 = require("./playerService");
const events_1 = require("events");
const uuid_1 = require("uuid");
const lodash_1 = __importDefault(require("lodash"));
const contractConfig_1 = require("../config/contractConfig");
const server_1 = require("../server"); // Import player mapping
const supabaseClient_1 = __importDefault(require("@config/supabaseClient"));
class GameServiceEmitter extends events_1.EventEmitter {
}
const gameServiceEmitter = new GameServiceEmitter();
exports.default = gameServiceEmitter;
const AGENT_URL = process.env.AGENT_URL;
exports.SAMI_URI = AGENT_URL || "http://localhost:3000";
const MIN_PLAYERS = 3;
const CONVERTATION_PHASE_TIME = 2 * 60 * 1000;
const VOTING_PHASE_TIME = 30 * 1000;
exports.rooms = {};
exports.roomsMessages = {};
exports.cachedRoomsMessages = {};
// Encuentra una partida SOLO si es del mismo tipo (apuesta o gratuita)
const findBetGame = () => {
    return lodash_1.default.find(lodash_1.default.reverse(Object.values(exports.rooms)), (game) => game.status === "waiting" && game.players.length < MIN_PLAYERS && game.isBetGame === true) || null;
};
exports.findBetGame = findBetGame;
const findFreeGame = () => {
    return lodash_1.default.find(lodash_1.default.reverse(Object.values(exports.rooms)), (game) => game.status === "waiting" && game.players.length < MIN_PLAYERS && game.isBetGame === false) || null;
};
exports.findFreeGame = findFreeGame;
// Main function to handle the creation or join to a new match
const createOrJoin = (playerId, isBetGame = false) => {
    let game = isBetGame ? (0, exports.findBetGame)() : (0, exports.findFreeGame)(); // find based on type bet or not
    if (!game) {
        const newRoomId = `room-${Object.keys(exports.rooms).length + 1}`;
        game = (0, exports.createNewGame)(newRoomId, isBetGame);
    }
    if (!game) {
        console.error(`Error creating the match for ${playerId} (isBetGame: ${isBetGame})`);
        return { roomId: "", success: false };
    }
    const success = (0, exports.joinGame)(game.roomId, playerId, isBetGame);
    if (!success) {
        console.warn(`⚠️ The player ${playerId} could not join the game${game.roomId}`);
        return { roomId: "", success: false };
    }
    console.log(`Player ${playerId} joined the match ${game.roomId} (isBetGame: ${isBetGame})`);
    return { roomId: game.roomId, success: true };
};
exports.createOrJoin = createOrJoin;
// Create a new Match
const createNewGame = (roomId, isBetGame) => {
    const newGame = {
        roomId,
        players: [],
        status: "waiting",
        votes: {},
        isBetGame,
    };
    exports.rooms[roomId] = newGame; //  Se almacena en la memoria correctamente
    console.log(`New match created ${roomId} | Bet: ${isBetGame}`);
    return newGame;
};
exports.createNewGame = createNewGame;
const joinGame = (roomId, playerId, isBetGame) => {
    // Get instance of the created game
    const game = exports.rooms[roomId];
    if (!game)
        return false;
    // Forbid joining if game is active or finished
    if (game.status !== "waiting")
        return false;
    if (game.isBetGame !== isBetGame) {
        console.warn(`Player ${playerId} tried to join a mismatched game type (expected: ${game.isBetGame}, received: ${isBetGame})`);
        return false;
    }
    // Check if the player already exists
    const existingPlayer = lodash_1.default.find(game.players, { id: playerId });
    if (existingPlayer) {
        return false;
    }
    // Add the new player
    const newPlayer = (0, playerService_1.createPlayer)(playerId, false);
    game.players.push(newPlayer);
    // If the game reaches 5 players, add SAMI and start the game
    if (game.players.length === MIN_PLAYERS) {
        const samiID = (0, uuid_1.v4)();
        const samiPlayer = (0, playerService_1.createPlayer)(samiID, true);
        game.players.push(samiPlayer); // Add SAMI as the sixth player
        // Start the game
        (0, exports.startGame)(roomId);
    }
    // If everything succeeds, return true
    return true;
};
exports.joinGame = joinGame;
const startGame = async (roomId) => {
    const game = exports.rooms[roomId];
    if (!game)
        return null;
    game.players = lodash_1.default.shuffle(game.players);
    game.status = "active";
    console.log(`[${roomId}] Starting game...`);
    console.log(`[${roomId}] Players in the game:`);
    game.players.forEach((player, index) => {
        game.players[index].index = index;
        console.log(`Index: ${index}, ID: ${player.id}, Role: ${player.isAI ? "AI" : "Human"}`);
    });
    // Emit event start of the game
    await new Promise((resolve) => setTimeout(resolve, 500));
    const timeBeforeEnds = CONVERTATION_PHASE_TIME;
    const serverTime = Date.now();
    gameServiceEmitter.emit("gameStarted", { roomId, game, timeBeforeEnds, serverTime });
    await new Promise((resolve) => setTimeout(resolve, 100));
    gameServiceEmitter.emit("startConversation", { roomId, timeBeforeEnds, serverTime });
    setTimeout(() => endConversationPhase(roomId), timeBeforeEnds);
    return game;
};
exports.startGame = startGame;
const recordVote = (roomId, voterId, votedPlayerId) => {
    const game = exports.rooms[roomId];
    if (!game) {
        console.error(`[recordVote] Game not found for room: ${roomId}`);
        return false;
    }
    // Verify the player is in the match
    const voter = lodash_1.default.find(game.players, { id: voterId });
    const votedPlayer = lodash_1.default.find(game.players, { id: votedPlayerId });
    if (!voter || !votedPlayer) {
        console.warn(`[recordVote]Invalid vote in room : ${roomId}`);
        return false;
    }
    // Register the vote
    game.votes[voterId] = votedPlayerId;
    console.log(`[${roomId}] ${voterId} Voted for ${votedPlayerId}.`);
    gameServiceEmitter.emit("voteSubmitted", { roomId, voterId, votedId: votedPlayerId });
    //  Verify that all the players have voted
    if (Object.keys(game.votes).length === game.players.length - 1) {
        (0, exports.endVotingPhase)(roomId);
    }
    return true;
};
exports.recordVote = recordVote;
const sendMessageToAI = async (roomId) => {
    const game = exports.rooms[roomId];
    const samiPlayer = (0, exports.getSamiPlayer)(game);
    // Copiar los mensajes actuales en una variable temporal
    const cachedMessages = [...exports.cachedRoomsMessages[roomId]];
    exports.cachedRoomsMessages[roomId].length = 0;
    const messages = {};
    for (const index in cachedMessages) {
        const { playerIndex, message } = cachedMessages[index];
        messages[index] = {
            instruction: `YOU ARE PLAYER ${samiPlayer.index + 1} AND PLAYER ${playerIndex + 1} SENT THIS MESSAGE TO THE GROUP CHAT`,
            message,
        };
    }
    console.log(`[${roomId}] Input to Sami: ${JSON.stringify(messages)}`);
    try {
        const startTime = Date.now();
        // Iniciar solicitud a la IA sin esperar la respuesta (se manejará con timeout)
        const aiResponse = await fetch(`${exports.SAMI_URI}/SAMI-AGENT/message`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                text: JSON.stringify(messages),
                userId: samiPlayer.id,
                userName: roomId,
            }),
        });
        // Convertir la respuesta en texto
        const responseText = await aiResponse.text();
        console.log(`[${roomId}] Output of Sami: ${responseText}`);
        // Intentar parsear la respuesta
        const responseData = safeParseJSON(responseText);
        if (!responseData) {
            return console.error("[Backend] Invalid AI response.");
        }
        const agentMessage = responseData[0].text;
        if (responseData.length > 0 && game.status === "active" && responseData[0].action !== "IGNORE") {
            const endTime = Date.now();
            const elapsedTimeSeconds = (endTime - startTime) / 1000;
            console.log(`[${roomId}] Time taken for AI response: ${elapsedTimeSeconds} seconds.`);
            gameServiceEmitter.emit("newMessage", {
                roomId,
                playerId: samiPlayer.id,
                playerIndex: samiPlayer.index,
                message: agentMessage
            });
            exports.roomsMessages[roomId].push({
                roomId,
                playerId: samiPlayer.id,
                playerIndex: samiPlayer.index,
                isPlayerAI: true,
                message: agentMessage,
            });
        }
    }
    catch (error) {
        console.error("[Backend] AI Response Timeout or Error:", error);
    }
};
exports.sendMessageToAI = sendMessageToAI;
const endConversationPhase = async (roomId) => {
    const game = exports.rooms[roomId];
    console.log(`[${roomId}] Ending conversation phase...`);
    game.status = "voting";
    const timeBeforeEnds = VOTING_PHASE_TIME;
    const serverTime = Date.now();
    gameServiceEmitter.emit("conversationEnded", { roomId });
    await new Promise((resolve) => setTimeout(resolve, 100)); // Controlar tiempos
    gameServiceEmitter.emit("startVoting", { roomId, timeBeforeEnds, serverTime });
    setTimeout(() => (0, exports.endVotingPhase)(roomId), timeBeforeEnds);
};
const endVotingPhase = (roomId) => {
    const game = exports.rooms[roomId];
    if (!game || game.status !== "voting")
        return; // Ensure game is in the voting phase
    console.log(`[${roomId}] Ending voting phase...`);
    const isBetGame = exports.rooms[roomId].isBetGame;
    const results = [];
    const winnerAddresses = []; // Guardamos las direcciones de los ganadores
    game.players.forEach((player) => {
        const votedPlayerId = game.votes[player.id];
        const votedPlayer = lodash_1.default.find(game.players, { id: votedPlayerId });
        if (!votedPlayer) {
            console.log(`[${roomId}] ${player.id} no votó correctamente.`);
            results.push({ playerId: player.id, won: false });
            return;
        }
        if (votedPlayer.isAI) {
            console.log(`[${roomId}] ¡${player.id} ganó! Identificó a SAMI.`);
            results.push({ playerId: player.id, won: true });
            if (isBetGame) {
                const winnerAddress = server_1.players[player.id]?.walletAddress;
                if (winnerAddress) {
                    winnerAddresses.push(winnerAddress); // Agregamos la dirección del ganador al array
                }
                else {
                    console.error(`No wallet address found for player ID: ${player.id}`);
                }
            }
        }
        else {
            console.log(`[${roomId}] ${player.id} falló. SAMI gana.`);
            results.push({ playerId: player.id, won: false });
        }
    });
    // Enviar premios a todos los ganadores o llamar a sendPrizes([]) si nadie ganó
    (0, contractConfig_1.sendPrizesToWinners)(winnerAddresses);
    // Emit game over event
    gameServiceEmitter.emit("gameOver", { roomId, isBetGame, results });
    // Mark game as finished
    game.status = "finished";
    const samiIsTheWinner = lodash_1.default.every(results, (r) => r.won === false);
    saveGameData(game, samiIsTheWinner);
};
exports.endVotingPhase = endVotingPhase;
const saveGameData = async (game, samiIsTheWinner) => {
    const room = await saveRoom(game, samiIsTheWinner);
    if (!room) {
        console.error("[Backend] Error saving room, aborting...");
        return;
    }
    await savePlayers(game.players);
    await saveVotes(room.id, game.votes);
    await saveMessages(game.roomId, room.id);
    console.log(`[${room.id}] Game data saved successfully.`);
};
const saveRoom = async (game, samiIsTheWinner) => {
    const { data, error } = await supabaseClient_1.default
        .from("rooms")
        .insert([{
            status: game.status,
            is_bet_game: game.isBetGame,
            players: game.players.map(p => p.id),
            is_ai_winner: samiIsTheWinner,
        }])
        .select()
        .single();
    if (error) {
        console.error("[Backend] Error saving room:", error);
        return null;
    }
    return data;
};
const savePlayers = async (players) => {
    const playerRecords = players.map(player => ({
        id: player.id,
        is_ai: player.isAI,
        is_eliminated: player.isEliminated,
        index: player.index,
    }));
    const { error } = await supabaseClient_1.default.from("players").upsert(playerRecords);
    if (error) {
        console.error("[Backend] Error saving players:", error);
    }
    else {
        console.log("[Backend] Players saved successfully.");
    }
};
const saveVotes = async (roomId, votes) => {
    const voteRecords = Object.entries(votes).map(([voter, voted]) => ({
        room_id: roomId,
        from_player_id: voter,
        to_player_id: voted,
    }));
    const { error } = await supabaseClient_1.default
        .from("votes")
        .upsert(voteRecords);
    if (error) {
        console.error("[Backend] Error saving votes:", error);
    }
};
const saveMessages = async (tempRoomId, roomId) => {
    const messageRecords = exports.roomsMessages[tempRoomId].map((message) => ({
        room_id: roomId,
        player_id: message.playerId,
        message: message.message,
        is_player_ai: message.isPlayerAI,
    }));
    const { error } = await supabaseClient_1.default
        .from("messages")
        .upsert(messageRecords);
    if (error) {
        console.error("[Backend] Error saving messages:", error);
    }
};
// AUXILIAR FUNCTIONS
// Get a Match by his ID
const getGameById = (roomId) => {
    return exports.rooms[roomId] || null;
};
exports.getGameById = getGameById;
const calculateNumberOfPlayers = ({ roomId }) => {
    const game = (0, exports.getGameById)(roomId);
    if (!game)
        return [-1, -1];
    //  Only count players in the same game, no need for `player.isBetGame`
    const amountOfPlayers = game.players.length > MIN_PLAYERS ? MIN_PLAYERS : game.players.length;
    return [amountOfPlayers, MIN_PLAYERS];
};
exports.calculateNumberOfPlayers = calculateNumberOfPlayers;
const getSamiPlayer = (game) => {
    return lodash_1.default.find(game.players, { isAI: true });
};
exports.getSamiPlayer = getSamiPlayer;
const safeParseJSON = (text) => {
    try {
        return JSON.parse(text);
    }
    catch (error) {
        console.error("[Backend] Error parsing JSON:", error);
        return null;
    }
};
const processRoomsMessages = async () => {
    while (true) {
        try {
            // Obtener todos los roomIds que tienen mensajes guardados
            const activeRoomIds = Object.keys(exports.cachedRoomsMessages).filter((roomId) => exports.cachedRoomsMessages[roomId].length > 0);
            // Ejecutar sendMessageToAI para cada roomId encontrado
            await Promise.all(activeRoomIds.map((roomId) => (0, exports.sendMessageToAI)(roomId)));
        }
        catch (error) {
            console.error("[Backend] Error in processRoomsMessages:", error);
        }
        // Esperar entre 2 y 13 segundos de manera aleatoria antes de la siguiente ejecución
        const delay = Math.floor(Math.random() * (15000 - 2000 + 1)) + 2000;
        await new Promise((resolve) => setTimeout(resolve, delay));
    }
};
processRoomsMessages();
