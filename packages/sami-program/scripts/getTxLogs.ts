import { Connection } from "@solana/web3.js";
import dotenv from "dotenv";

dotenv.config();

const CLUSTER_URL = process.env.CLUSTER_URL || "https://api.devnet.solana.com";
const connection = new Connection(CLUSTER_URL, "confirmed");

// Pega aquí la firma de la transacción
const TRANSACTION_SIGNATURE = "3CpNdGJYBQZfE2cAHtDbhUE28H78rPcgri23MsTwirqgRqsBXY4E1RZbPxE8TDfxbpYaxitL6JaEspe8wVFypEes";

(async () => {
  try {
    const txInfo = await connection.getTransaction(TRANSACTION_SIGNATURE, {
      commitment: "confirmed",
      maxSupportedTransactionVersion: 0,
    });

    if (!txInfo) {
      console.log(" Transacción no encontrada.");
      return;
    }

    console.log("✅ Logs de la transacción:");
    console.log(txInfo.meta?.logMessages);
  } catch (error) {
    console.error("❌ Error obteniendo logs de la transacción:", error);
  }
})();