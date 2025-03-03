"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.assignIARole = exports.eliminatePlayer = exports.createPlayer = void 0;
const events_1 = require("events");
class PlayerServiceEmitter extends events_1.EventEmitter {
}
const playerServiceEmitter = new PlayerServiceEmitter();
exports.default = playerServiceEmitter;
// Create a new player
const createPlayer = (playerId, isAI = false) => {
    return {
        id: playerId,
        isAI,
        isEliminated: false
    };
};
exports.createPlayer = createPlayer;
/*
// Increment the amount of chars while he is sendind messages
// If he reach 20 it does not keep counting
export const addCharsToPlayer = (roomId: string, playerId: string, charCount: number) => {
    const game = rooms[roomId];
    if (!game) return false;
    // find the player
    const player = game.players.find((p: Player) => p.id === playerId);
    if (!player) return false;

    // Incrementar chars (tope en 20, si quieres)
    player.totalChars = Math.min(player.totalChars + charCount, 20);
}*/
const eliminatePlayer = (player) => {
    player.isEliminated = true;
};
exports.eliminatePlayer = eliminatePlayer;
const assignIARole = (player) => {
    player.isAI = true;
};
exports.assignIARole = assignIARole;
