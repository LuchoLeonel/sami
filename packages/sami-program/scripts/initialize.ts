import * as anchor from "@coral-xyz/anchor";
import { PublicKey, SystemProgram } from "@solana/web3.js";
import dotenv from "dotenv";
import fs from "fs";

// Load environment variables
dotenv.config();

// Network cluster (Devnet/Mainnet/Testnet)
const CLUSTER_URL = process.env.CLUSTER_URL || "https://api.devnet.solana.com";
// Load wallet from `.env`
const WALLET_KEYPAIR_PATH = process.env.WALLET_KEYPAIR_PATH;
if (!WALLET_KEYPAIR_PATH) throw new Error("Missing WALLET_KEYPAIR_PATH in .env");

const secretKey = Uint8Array.from(JSON.parse(fs.readFileSync(WALLET_KEYPAIR_PATH, "utf-8")));
const walletKeypair = anchor.web3.Keypair.fromSecretKey(secretKey);
const wallet = new anchor.Wallet(walletKeypair);

// Connect to Solana cluster
const connection = new anchor.web3.Connection(CLUSTER_URL, "confirmed");

// Set up Anchor provider
const provider = new anchor.AnchorProvider(connection, wallet, {
  commitment: "confirmed",
});
anchor.setProvider(provider);

// Load IDL & Program ID
const idl = require("../target/idl/sami_program.json"); // Ensure IDL exists 
const program = new anchor.Program(idl, provider);

(async () => {
  // Generate the Game State Account
  const gameState = anchor.web3.Keypair.generate();

  console.log("Initializing the game...");

  try {
    // Call the `initialize` function with 0.05 SOL (50M lamports)
    const tx = await program.rpc.initialize(new anchor.BN(50_000_000), {
      accounts: {
        gameState: gameState.publicKey,
        owner: wallet.publicKey, // This wallet becomes the owner
        systemProgram: SystemProgram.programId,
      },
      signers: [gameState], // Game state is created and initialized
    });

    console.log(`✅ Game state initialized successfully!`);
    console.log(`Game State Account: ${gameState.publicKey.toBase58()}`);
    console.log(`Transaction Signature: ${tx}`);
  } catch (err) {
    console.error("❌ Error initializing game:", err);
  }
})();