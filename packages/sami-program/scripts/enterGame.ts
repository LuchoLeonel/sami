import * as anchor from "@coral-xyz/anchor";
import { PublicKey, SystemProgram, Transaction } from "@solana/web3.js";
import dotenv from "dotenv";
import fs from "fs";

dotenv.config();

// Set devnet conection
const CLUSTER_URL = process.env.CLUSTER_URL || "https://api.devnet.solana.com";
const WALLET_KEYPAIR_PATH = process.env.WALLET_KEYPAIR_PATH || "~/.config/solana/test.json";
const PROGRAM_ID = new PublicKey("79B1S7BVpw2DucU74pZZK2SAZTBfe7w16gd52SfcoopZ"); // ID del programa
const GAME_STATE_PUBKEY = new PublicKey("3sJS1ubE65QhhLL1HhKBVAdxYWkaZgPdiSfKyWXb17it"); // Dirección del estado del juego

(async () => {
  console.log("joinning the game");

  // Conenct with Solana
  const connection = new anchor.web3.Connection(CLUSTER_URL, "confirmed");

  // Load de key pair signer
  const walletKeypair = anchor.web3.Keypair.fromSecretKey(
    Uint8Array.from(JSON.parse(fs.readFileSync(WALLET_KEYPAIR_PATH, "utf-8")))
  );
  const wallet = new anchor.Wallet(walletKeypair);

  // Create and config the provider
  const provider = new anchor.AnchorProvider(connection, wallet, {
    commitment: "confirmed",
  });
  anchor.setProvider(provider);

  // Load the IDL of the program
  const idl = require("../target/idl/sami_program.json"); 
  const program = new anchor.Program(idl, provider);

  // Get Vault address (PDA)
  const [vaultPDA] = PublicKey.findProgramAddressSync(
    [Buffer.from("vault"), GAME_STATE_PUBKEY.toBuffer()],
    PROGRAM_ID
  );

  // execute enter_game
  try {
    // @ts-ignore
    const tx = await program.methods
      .enterGame()
      .accounts({
        player: wallet.publicKey,
        gameState: GAME_STATE_PUBKEY,
        vault: vaultPDA,
        systemProgram: SystemProgram.programId,
      })
      .signers([wallet.payer])
      .rpc();

    console.log("Transaction succesful!");
    console.log("Transaction Signature:", tx);
    console.log(`Verify the transaction at Solana Explorer: https://explorer.solana.com/tx/${tx}?cluster=devnet`);
  } catch (error) {
    console.error("Error trying to enter the game:", error);
  }
})();