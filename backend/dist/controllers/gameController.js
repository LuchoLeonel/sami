"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getGame = exports.handleGameOver = exports.handleMessage = exports.castVote = exports.createOrJoinGame = exports.getNumberOfPlayers = void 0;
const gameService_1 = require("../services/gameService");
const server_1 = require("../server");
const gameService_2 = __importDefault(require("@services/gameService"));
gameService_2.default.on("startConversation", (data) => {
    const message = { message: "Conversation phase has started" };
    server_1.io.to(data.roomId).emit("startConversationPhase", {
        message,
        timeBeforeEnds: data.timeBeforeEnds,
        serverTime: data.serverTime
    });
});
gameService_2.default.on("conversationEnded", (data) => { });
gameService_2.default.on("voteSubmitted", (data) => {
    server_1.io.to(data.roomId).emit("voteSubmitted", { voterId: data.voterId, votedId: data.votedId });
});
gameService_2.default.on("newMessage", (data) => {
    server_1.io.to(data.roomId).emit("newMessage", data);
});
gameService_2.default.on("startVoting", (data) => {
    const game = gameService_1.rooms[data.roomId];
    if (!game)
        return;
    // Get list of active players
    const activePlayers = game.players
        .filter((player) => !player.isEliminated)
        .map((player) => ({ id: player.id, index: player.index }));
    console.log(`[${data.roomId}] Starting voting phase.`);
    server_1.io.to(data.roomId).emit("startVotePhase", {
        message: "Voting phase has started",
        roomId: data.roomId,
        players: activePlayers, // Send list of active players
        timeBeforeEnds: data.timeBeforeEnds,
        serverTime: data.serverTime,
    });
});
gameService_2.default.on("gameStarted", ({ roomId, game, timeBeforeEnds, serverTime }) => {
    console.log(`[${roomId}] Game started.`);
    server_1.io.to(roomId).emit("gameStarted", {
        roomId: game.roomId,
        players: game.players,
        timeBeforeEnds,
        serverTime,
    });
});
gameService_2.default.on("gameOver", ({ roomId, isBetGame, results }) => {
    console.log(`[${roomId}] Game over`);
    server_1.io.to(roomId).emit("gameOver", {
        message: "The game is over! Here are the results:",
        isBetGame,
        results, // Array con los resultados de todos los jugadores
    });
});
const getNumberOfPlayers = (data, socket, io) => {
    const { roomId, isBetGame } = data;
    if (!roomId || isBetGame === undefined) {
        console.error(`[getNumberOfPlayers] Invalid data:`, data);
        return socket.emit("error", { message: "Incomplete data for retrieving number of players" });
    }
    // Get info of the room
    const game = gameService_1.rooms[roomId];
    if (!game) {
        console.error(`[getNumberOfPlayers] Room not found:`, roomId);
        return socket.emit("error", { message: "Room not found" });
    }
    // Validar the type of the game match
    if (game.isBetGame !== isBetGame) {
        console.error(`[getNumberOfPlayers] Game type mismatch for room ${roomId}. Expected isBetGame: ${game.isBetGame}`);
        return socket.emit("error", { message: "Game type mismatch" });
    }
    // Calculate number of players
    const [amountOfPlayers, neededPlayers] = (0, gameService_1.calculateNumberOfPlayers)({ roomId });
    io.to(roomId).emit("numberOfPlayers", { roomId, amountOfPlayers, neededPlayers, isBetGame });
};
exports.getNumberOfPlayers = getNumberOfPlayers;
// Create or join a new match
const createOrJoinGame = (data, socket, io) => {
    const { playerId, isBetGame } = data; // Extract `isBetGame`
    console.log(`Creating or joining game. Player: ${playerId}, isBetGame: ${isBetGame}`);
    // Delegate to the service, passing and `isBetGame`
    const { roomId, success } = (0, gameService_1.createOrJoin)(playerId, isBetGame);
    if (!success) {
        console.error(` Error joining the player ${playerId} into the room ${roomId}`);
        return socket.emit("error", { message: "There was an error creating or joining the match" });
    }
    // Store playerId inside `players`
    if (server_1.players[socket.id]) {
        server_1.players[socket.id].playerId = playerId;
        server_1.players[playerId] = { ...server_1.players[socket.id] }; // Store playerId separately
        console.log(`Mapped playerId: ${playerId} to wallet: ${server_1.players[socket.id].walletAddress}`);
    }
    else {
        console.warn(`No socket entry found for player ${playerId}`);
    }
    // Notify the client that the player joined successfully
    socket.join(roomId);
    io.to(roomId).emit("playerJoined", { playerId, roomId });
    // Send response to the specific player who joined
    socket.emit("gameJoined", { roomId, success, isBetGame });
    console.log(` Player ${playerId} joined room ${roomId} (isBetGame: ${isBetGame})`);
};
exports.createOrJoinGame = createOrJoinGame;
const castVote = (data, socket, io) => {
    const { roomId, voterId, voteIndex, votedId } = data;
    if (!roomId || !voterId || voteIndex === undefined) {
        console.error(`[castVote] Invalid data:`, data);
        socket.emit("error", { message: "Incomplete data for voting" });
        return;
    }
    const game = (0, gameService_1.getGameById)(roomId);
    if (!game || game.status !== "voting") {
        console.error(`[castVote] Voting phase is not active for room: ${roomId}`);
        socket.emit("error", { message: "Voting phase is not active" });
        return;
    }
    // Validate voteIndex
    if (voteIndex < 0 || voteIndex >= game.players.length) {
        console.error(`[castVote] Invalid voteIndex: ${voteIndex} for room: ${roomId}`);
        socket.emit("error", { message: "Invalid vote index" });
        return;
    }
    const votedPlayer = game.players[voteIndex]?.id;
    if (!votedPlayer) {
        console.error(`[castVote] Voted player not found for index: ${voteIndex} in room: ${roomId}`);
        socket.emit("error", { message: "Voted player does not exist" });
        return;
    }
    // Prevent self-voting
    if (votedPlayer === voterId) {
        console.error(`[castVote] Player ${voterId} attempted to vote for themselves in room: ${roomId}`);
        socket.emit("error", { message: "You cannot vote for yourself" });
        return;
    }
    // Register the vote
    const success = (0, gameService_1.recordVote)(roomId, voterId, votedPlayer);
    if (!success) {
        console.error(`[castVote] Failed to register vote from ${voterId} to ${votedPlayer} in room: ${roomId}`);
        socket.emit("error", { message: "Failed to register the vote" });
        return;
    }
};
exports.castVote = castVote;
const handleMessage = async (data, socket, io) => {
    const { roomId } = data;
    data.isPlayerAI = false;
    const game = gameService_1.rooms[roomId];
    if (!game) {
        return socket.emit("error", { message: "Room doesn't exist" });
    }
    if (game.status !== "active") {
        return socket.emit("error", { message: "La partida no ha comenzado" });
    }
    if (!gameService_1.cachedRoomsMessages[roomId])
        gameService_1.cachedRoomsMessages[roomId] = [];
    if (!gameService_1.roomsMessages[roomId])
        gameService_1.roomsMessages[roomId] = [];
    gameService_1.cachedRoomsMessages[roomId].push(data);
    gameService_1.roomsMessages[roomId].push(data);
    gameService_2.default.emit("newMessage", data);
};
exports.handleMessage = handleMessage;
const handleGameOver = (roomId, winner, io) => {
    // Notify clients about the game result
    io.to(roomId).emit("gameOver", {
        message: winner === "humans" ? "Humans win!" : "SAMI wins!",
        winner,
    });
};
exports.handleGameOver = handleGameOver;
// Get info of the match
const getGame = (req, res) => {
    const { id } = req.params;
    const game = (0, gameService_1.getGameById)(id);
    if (!game) {
        res.status(404).json({ message: "Match not founf" });
        return;
    }
    res.status(200).json(game);
    return;
};
exports.getGame = getGame;
