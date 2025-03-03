"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const gameService_1 = __importDefault(require("./gameService"));
const contractConfig_1 = require("../config/contractConfig");
const main = async () => {
    console.log(" Starting event listeners...");
    // Remove previous listeners 
    contractConfig_1.contract.removeAllListeners();
    // Listen when someoen purchase a ticket
    contractConfig_1.contract.on(contractConfig_1.contract.filters.TicketBought, async (owner, ticketId) => {
        console.log(`Handling ticket purchase for ${owner}, Ticket ID: ${ticketId}`);
        try {
            // Solo marcar el ticket como usado, sin crear partidas
            await (0, contractConfig_1.useTicket)(ticketId);
            console.log(` Ticket ${ticketId} used by ${owner}`);
        }
        catch (error) {
            console.error(`Error using the ticket for ${owner}:`, error);
        }
    });
    // Emit when a ticket is used
    contractConfig_1.contract.on(contractConfig_1.contract.filters.TicketUsed, (owner, ticketId) => {
        console.log(`🎯 Ticket ${ticketId} used by ${owner}`);
    });
    // Listen when a prize is sent
    contractConfig_1.contract.on(contractConfig_1.contract.filters.PrizeSent, async (winner, amount) => {
        console.log(`Prize sent to ${winner}: ${amount} MODE`);
        gameService_1.default.emit("prizeSent", { winner, amount });
    });
    // Listen when a en error happens sending prize
    contractConfig_1.contract.on(contractConfig_1.contract.filters.ErrorSendingPrize, async (user, amount) => {
        console.log(`Error sending prize to ${user}: ${amount} MODE`);
        gameService_1.default.emit("ErrorSendingPrize", { user, amount });
    });
    console.log("Event listeners are now running.");
};
main().catch((error) => console.error(" Error initializing event listeners:", error));
