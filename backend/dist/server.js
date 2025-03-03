"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.players = exports.io = void 0;
const http_1 = __importDefault(require("http"));
const socket_io_1 = require("socket.io");
const app_1 = __importDefault(require("./app"));
const gameController = __importStar(require("@controllers/gameController"));
const playerController = __importStar(require("@controllers/playerController"));
require("@services/eventListener");
const HOST = process.env.HOST || 'localhost';
const PORT = parseInt(process.env.PORT || '5001', 10);
const server = http_1.default.createServer(app_1.default);
// Socket configuration.IO for the server
exports.io = new socket_io_1.Server(server, {
    cors: {
        origin: '*', // Allowing connections from any origin
        methods: ['GET', 'POST', 'OPTIONS'],
    },
    transports: ["websocket", "polling"],
    allowEIO3: true
});
exports.players = {};
// Manage WebSocket event
exports.io.on('connection', (socket) => {
    console.log("Player connected :)", socket.id);
    socket.on("registerWallet", (data) => {
        const { walletAddress } = data;
        if (!walletAddress) {
            console.warn(`⚠️ No wallet address provided for socket ${socket.id}`);
            return;
        }
        exports.players[socket.id] = {
            socketId: socket.id,
            walletAddress,
        };
        console.log(`Wallet ${walletAddress} linked to socket ${socket.id}`);
        console.log(` Players mapping now:`, exports.players); // Log stored player data
    });
    socket.on("createOrJoinGame", (data) => {
        console.log(`createOrJoinGame: Received data:`, data);
        try {
            const { playerId, isBetGame } = data;
            const result = gameController.createOrJoinGame({ playerId, isBetGame }, socket, exports.io);
            // Enviar confirmación al cliente
            socket.emit("gameJoined", result);
        }
        catch (error) {
            console.error(`createOrJoinGame: An error occurred`, error);
            socket.emit("error", { message: "An unexpected error occurred while processing your request." });
        }
    });
    socket.on('getNumberOfPlayers', (data) => {
        try {
            gameController.getNumberOfPlayers(data, socket, exports.io);
        }
        catch (error) {
            console.error(`createOrJoinGame: An error occurred`, error);
            // Emitir un error al cliente para informarle del problema
            socket.emit('error', { message: 'An unexpected error occurred while processing your request.' });
        }
    });
    socket.on('castVote', (data) => {
        try {
            gameController.castVote(data, socket, exports.io);
        }
        catch (error) {
            console.error(`[castVote] Error processing vote for room: ${data.roomId}`, error);
        }
    });
    socket.on("message", (data) => {
        try {
            gameController.handleMessage(data, socket, exports.io);
        }
        catch (error) {
            console.error(`message: An error occurred`, error);
            // Emitir un error al cliente, si es necesario
            socket.emit("error", { message: "An error occurred while processing the message." });
        }
    });
    socket.on("getPlayerIndex", (data) => {
        try {
            playerController.getPlayerIndex(data);
        }
        catch (error) {
            console.error(`message: An error occurred`, error);
            // Emitir un error al cliente, si es necesario
            socket.emit("error", { message: "An error occurred while processing the message." });
        }
    });
    socket.on("getPlayerRoomId", (data) => {
        try {
            const roomId = playerController.getPlayerRoomId(data);
            if (exports.players[socket.id]) {
                exports.players[socket.id].roomId = roomId;
                exports.players[socket.id].playerId = data.playerId;
            }
            else {
                exports.players[socket.id] = {
                    socketId: socket.id,
                    roomId,
                    playerId: data.playerId,
                };
            }
        }
        catch (error) {
            console.error(`message: An error occurred`, error);
            socket.emit("error", { message: "An error occurred while processing the message." });
        }
    });
    socket.on('disconnect', () => {
        const player = exports.players[socket.id];
        if (player) {
            console.log(`Player disconnected: ${socket.id}`);
            // Si el jugador estaba en una partida, llamar a disconnectPlayer
            if (player.roomId && player.playerId) {
                playerController.disconnectPlayer({
                    roomId: player.roomId,
                    playerId: player.playerId,
                });
                console.log(`Removed player ${player.playerId} from room ${player.roomId}`);
            }
            // Eliminar al jugador del mapa de players
            delete exports.players[socket.id];
        }
        else {
            console.log(` No tracked player found for socket ${socket.id}, ignoring.`);
        }
    });
});
server.listen(PORT, HOST, () => {
    console.log(`Server running at http://${HOST}:${PORT}`);
});
