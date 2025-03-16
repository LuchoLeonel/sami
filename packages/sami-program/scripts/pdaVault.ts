import { PublicKey } from "@solana/web3.js";

const PROGRAM_ID = new PublicKey("BZniWBwyNJzUi4Ru1kS8w3Kej2rnNJpdP8sMFM11f4LE");
const GAME_STATE_PUBKEY = new PublicKey("3RNcct6MzEhxRWKFX1udneA47aBhtDiWB7J2ZZoVZi16");

const [vaultPDA] = PublicKey.findProgramAddressSync(
    [Buffer.from("vault"), GAME_STATE_PUBKEY.toBuffer()],
    PROGRAM_ID
);

console.log("Vault PDA:", vaultPDA.toBase58());