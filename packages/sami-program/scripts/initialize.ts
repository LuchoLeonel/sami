import * as anchor from "@coral-xyz/anchor";
import { Keypair } from "@solana/web3.js";
import dotenv from "dotenv";
import fs from "fs";

dotenv.config(); // Load environment variables

// Load wallet from environment variable
const WALLET_PATH = process.env.WALLET_KEYPAIR_PATH;
if (!WALLET_PATH) {
  throw new Error("Missing WALLET_KEYPAIR_PATH in .env");
}

// Read and parse the keypair file
const secretKey = Uint8Array.from(JSON.parse(fs.readFileSync(WALLET_PATH, "utf-8")));
const wallet = Keypair.fromSecretKey(secretKey);

const provider = new anchor.AnchorProvider(
  new anchor.web3.Connection("https://api.devnet.solana.com"),
  new anchor.Wallet(wallet),
  anchor.AnchorProvider.defaultOptions()
);
anchor.setProvider(provider);

const program = anchor.workspace.SamiProgram; // Replace with actual program if necessary

(async () => {
  const gameState = anchor.web3.Keypair.generate(); // Generates a new game state account

  await program.rpc.initialize(new anchor.BN(50_000_000), {
    accounts: {
      gameState: gameState.publicKey,
      owner: wallet.publicKey, // Use the loaded wallet
      systemProgram: anchor.web3.SystemProgram.programId,
    },
    signers: [gameState], // Sign transaction with game state
  });

  console.log(`Game state initialized: ${gameState.publicKey.toBase58()}`);
})();