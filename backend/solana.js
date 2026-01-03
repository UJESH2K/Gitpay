// Solana transaction handler - manages payments and transfers

const {
  Connection,
  Keypair,
  PublicKey,
  SystemProgram,
  Transaction,
  sendAndConfirmTransaction
} = require("@solana/web3.js");

const NETWORK = process.env.SOLANA_NETWORK || "devnet";
const ENDPOINT = {
  devnet: "https://api.devnet.solana.com",
  mainnet: "https://api.mainnet-beta.solana.com",
  testnet: "https://api.testnet.solana.com"
}[NETWORK];

let connection = null;
let escrowWallet = null;

// Initialize Solana connection
function initializeSolana() {
  try {
    connection = new Connection(ENDPOINT, "confirmed");

    // Load escrow keypair from private key
    const privKeyString = process.env.SOLANA_PRIVATE_KEY;
    if (!privKeyString) {
      throw new Error("SOLANA_PRIVATE_KEY not set in .env");
    }

    const privKeyArray = JSON.parse(privKeyString);
    escrowWallet = Keypair.fromSecretKey(new Uint8Array(privKeyArray));

    console.log("✓ Solana initialized on", NETWORK);
    console.log("✓ Escrow wallet:", escrowWallet.publicKey.toString());

    return true;
  } catch (error) {
    console.error("Failed to initialize Solana:", error.message);
    return false;
  }
}

// Send SOL transfer
async function transferSOL(toWallet, amountSOL) {
  if (!connection || !escrowWallet) {
    throw new Error("Solana not initialized");
  }

  try {
    const toPublicKey = new PublicKey(toWallet);

    // Validate wallet address
    if (!PublicKey.isOnCurve(toPublicKey)) {
      throw new Error("Invalid Solana wallet address");
    }

    const lamports = Math.round(amountSOL * 1e9);

    console.log(`Transferring ${amountSOL} SOL to ${toWallet}`);

    // Create transaction
    const transaction = new Transaction().add(
      SystemProgram.transfer({
        fromPubkey: escrowWallet.publicKey,
        toPubkey: toPublicKey,
        lamports
      })
    );

    // Set recent blockhash
    const { blockhash } = await connection.getLatestBlockhash();
    transaction.recentBlockhash = blockhash;
    transaction.feePayer = escrowWallet.publicKey;

    // Sign and send
    const signature = await sendAndConfirmTransaction(
      connection,
      transaction,
      [escrowWallet],
      {
        commitment: "confirmed",
        skipPreflight: false,
        preflightCommitment: "confirmed"
      }
    );

    console.log("✓ Transaction successful:", signature);
    return signature;
  } catch (error) {
    console.error("Transfer error:", error);
    throw error;
  }
}

// Check wallet balance
async function checkBalance() {
  if (!connection || !escrowWallet) {
    throw new Error("Solana not initialized");
  }

  const balance = await connection.getBalance(escrowWallet.publicKey);
  return balance / 1e9; // Convert to SOL
}

// Verify transaction
async function verifyTransaction(signature) {
  if (!connection) {
    throw new Error("Solana not initialized");
  }

  try {
    const tx = await connection.getTransaction(signature, {
      commitment: "confirmed"
    });
    return tx !== null;
  } catch (error) {
    console.error("Verification error:", error);
    return false;
  }
}

module.exports = {
  initializeSolana,
  transferSOL,
  checkBalance,
  verifyTransaction
};
