"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.contract = exports.signer = exports.provider = exports.useTicket = exports.sendPrizesToWinners = void 0;
const ethers_1 = require("ethers");
const dotenv_1 = __importDefault(require("dotenv"));
const TicketSystem_json_1 = __importDefault(require("@abi/TicketSystem.json"));
dotenv_1.default.config();
//  set provider
const provider = new ethers_1.JsonRpcProvider(process.env.RPC_URL);
exports.provider = provider;
//  Set the signer with the private key
const privateKey = process.env.PRIVATE_KEY || "Debes configurar una clave privada";
const signer = new ethers_1.ethers.Wallet(privateKey, provider);
exports.signer = signer;
//  Instance of the contract in order to read and write
const contract = new ethers_1.ethers.Contract("0x8d06D63e2D74413b972dCd23F943b3E73028f96F", TicketSystem_json_1.default.abi, signer);
exports.contract = contract;
const sendPrizesToWinners = async (winners) => {
    try {
        console.log(`sendPrizesToWinners called with winners: ${JSON.stringify(winners)}`);
        if (winners.length === 0) {
            console.log("No winners, calling sendPrizes([]) to update SAMI stats.");
        }
        else {
            console.log(`Sending prizes to: ${winners.join(", ")}`);
        }
        const tx = await contract.sendPrizes(winners);
        console.log("sendPrizes transaction sent:", tx.hash);
        await tx.wait();
        console.log(`Prizes sent successfully to: ${winners.length > 0 ? winners.join(", ") : "No winners, SAMI won"}`);
    }
    catch (error) {
        console.error(`Error sending prizes:`, error);
    }
};
exports.sendPrizesToWinners = sendPrizesToWinners;
const useTicket = async (ticketId) => {
    try {
        console.log(`Using ticket ${ticketId}`);
        const tx = await contract.useTicket(ticketId);
        await tx.wait();
        console.log(`Ticket ${ticketId} has been used`);
    }
    catch (error) {
        console.error(`Error using ticket ${ticketId}:`, error);
    }
};
exports.useTicket = useTicket;
