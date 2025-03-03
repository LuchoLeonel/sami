"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getPlayerRoomId = exports.getPlayerIndex = exports.disconnectPlayer = void 0;
const playerService_1 = __importDefault(require("@services/playerService"));
const server_1 = require("../server");
const gameService_1 = require("@services/gameService");
const lodash_1 = __importDefault(require("lodash"));
playerService_1.default.on("playerIndex", (data) => {
    server_1.io.to(data.roomId).emit("playerIndex", {
        playerId: data.playerId,
        playerIndex: data.playerIndex,
    });
});
playerService_1.default.on("playerRoomId", (data) => {
    server_1.io.to(data.roomId).emit("playerRoomId", {
        roomId: data.roomId,
        playerId: data.playerId,
    });
});
const disconnectPlayer = (data) => {
    const { roomId, playerId } = data;
    const game = gameService_1.rooms[roomId];
    if (game) {
        lodash_1.default.remove(game.players, (player) => player.id === playerId);
    }
};
exports.disconnectPlayer = disconnectPlayer;
const getPlayerIndex = (data) => {
    const { roomId, playerId } = data;
    const game = gameService_1.rooms[roomId];
    if (!game)
        return -1;
    const player = game.players.find((p) => p.id === playerId);
    if (!player)
        return -1;
    playerService_1.default.emit("playerIndex", { roomId, playerId, playerIndex: player.index });
};
exports.getPlayerIndex = getPlayerIndex;
const getPlayerRoomId = (data) => {
    const { playerId } = data;
    const reverseGames = lodash_1.default.reverse(Object.entries(gameService_1.rooms)); // Convertimos a [roomId, game] y lo invertimos
    // Buscamos el jugador junto con su roomId
    const result = lodash_1.default.find(reverseGames, ([roomId, game]) => lodash_1.default.find(game.players, { id: playerId }));
    if (result) {
        const [roomId, _] = result;
        playerService_1.default.emit("playerRoomId", { roomId, playerId });
        return roomId;
    }
};
exports.getPlayerRoomId = getPlayerRoomId;
