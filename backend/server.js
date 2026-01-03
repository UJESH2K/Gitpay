// Main Express server for GitHub Pay API

require("dotenv").config();
const express = require("express");
const cors = require("cors");
const { v4: uuidv4 } = require("uuid");

const { Reward, User } = require("./database");
const { handleWebhook } = require("./webhook");
const {
  initializeSolana,
  transferSOL,
  checkBalance
} = require("./solana");
const { Octokit } = require("@octokit/rest");

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(express.json());
app.use(cors({
  origin: ["http://localhost:3000", "http://localhost:5173", "https://github.com"],
  credentials: true
}));

// GitHub API client
const octokit = new Octokit({
  auth: process.env.GITHUB_TOKEN
});

// Initialize Solana on startup
let solanaReady = false;
initializeSolana();
solanaReady = true;

console.log("\n🚀 GitHub Pay Backend");
console.log("====================");
console.log("Solana Network:", process.env.SOLANA_NETWORK || "devnet");
console.log("Backend URL:", `http://localhost:${PORT}`);
console.log("====================\n");

// Routes

// 1. Health check
app.get("/health", (req, res) => {
  res.json({
    status: "ok",
    solana: solanaReady,
    timestamp: new Date().toISOString()
  });
});

// 2. GitHub webhook handler
app.post("/webhook/github", async (req, res) => {
  try {
    const signature = req.headers["x-hub-signature-256"];
    const payload = req.body;

    console.log("\n📌 GitHub Webhook received");

    // In production, verify webhook signature
    // For development, we'll trust it
    if (process.env.NODE_ENV === "production" && !signature) {
      return res.status(401).json({ error: "Invalid signature" });
    }

    const result = await handleWebhook(payload);

    res.json({
      success: true,
      reward: result
    });
  } catch (error) {
    console.error("Webhook error:", error);
    res.status(500).json({
      error: error.message
    });
  }
});

// 3. Get pending reward for a PR
app.get("/api/reward", async (req, res) => {
  try {
    const { repo, pr } = req.query;

    if (!repo || !pr) {
      return res.status(400).json({
        error: "Missing repo or pr parameter"
      });
    }

    const reward = await Reward.findByRepoAndPR(repo, parseInt(pr));

    if (!reward) {
      return res.status(404).json({
        error: "No pending reward"
      });
    }

    res.json({
      id: reward.id,
      repo: reward.repo,
      pr: reward.pr,
      amount: reward.amount,
      status: reward.status,
      issuedBy: reward.issued_by,
      recipient: reward.recipient,
      createdAt: reward.created_at
    });
  } catch (error) {
    console.error("Reward fetch error:", error);
    res.status(500).json({
      error: error.message
    });
  }
});

// 4. Get pending rewards for a user
app.get("/api/rewards/:username", async (req, res) => {
  try {
    const { username } = req.params;

    const rewards = await Reward.findByRecipient(username);

    res.json({
      username,
      rewards: rewards.map(r => ({
        id: r.id,
        repo: r.repo,
        pr: r.pr,
        amount: r.amount,
        issuedBy: r.issued_by,
        status: r.status,
        createdAt: r.created_at
      }))
    });
  } catch (error) {
    console.error("Rewards fetch error:", error);
    res.status(500).json({
      error: error.message
    });
  }
});

// 5. Verify GitHub user exists
app.get("/api/verify-github/:username", async (req, res) => {
  try {
    const { username } = req.params;

    const user = await octokit.users.getByUsername({
      username
    });

    res.json({
      exists: true,
      username: user.data.login,
      avatar: user.data.avatar_url
    });
  } catch (error) {
    console.error("GitHub verify error:", error.message);
    res.status(404).json({
      exists: false,
      error: "User not found"
    });
  }
});

// 6. Redeem reward (main transaction)
app.post("/api/redeem", async (req, res) => {
  try {
    const {
      rewardId,
      recipientWallet,
      recipientGithub,
      repo,
      pr,
      amount
    } = req.body;

    console.log(`\n💰 Redeem request:`);
    console.log(`   Reward ID: ${rewardId}`);
    console.log(`   Amount: ${amount} SOL`);
    console.log(`   To: ${recipientWallet}`);

    // Validate inputs
    if (!rewardId || !recipientWallet || !recipientGithub) {
      return res.status(400).json({
        error: "Missing required fields"
      });
    }

    // Get reward from database
    const reward = await Reward.findById(rewardId);
    if (!reward) {
      return res.status(404).json({
        error: "Reward not found"
      });
    }

    // Verify reward hasn't been redeemed
    if (reward.status !== "pending") {
      return res.status(400).json({
        error: `Reward already ${reward.status}`
      });
    }

    // Verify recipient matches
    if (reward.recipient !== recipientGithub) {
      return res.status(403).json({
        error: "Reward recipient mismatch"
      });
    }

    // Store user wallet
    await User.create(recipientGithub, recipientWallet);

    // Update reward with wallet
    await Reward.updateWallet(rewardId, recipientWallet);

    // Transfer SOL
    console.log(`Sending ${amount} SOL...`);
    const txHash = await transferSOL(recipientWallet, amount);

    console.log(`✅ Redeem successful: ${txHash}`);

    // Mark reward as redeemed
    await Reward.updateStatus(rewardId, "redeemed", txHash);

    res.json({
      success: true,
      txHash,
      amount,
      recipient: recipientWallet,
      status: "redeemed"
    });
  } catch (error) {
    console.error("Redeem error:", error);
    res.status(500).json({
      error: error.message
    });
  }
});

// 7. Check escrow balance
app.get("/api/balance", async (req, res) => {
  try {
    if (!solanaReady) {
      return res.status(500).json({
        error: "Solana not initialized"
      });
    }

    const balance = await checkBalance();

    res.json({
      balance,
      currency: "SOL"
    });
  } catch (error) {
    console.error("Balance check error:", error);
    res.status(500).json({
      error: error.message
    });
  }
});

// 8. Get webhook info (for debugging)
app.get("/api/webhook-info", (req, res) => {
  res.json({
    endpoint: `${process.env.BACKEND_URL || "http://localhost:3000"}/webhook/github`,
    events: ["issue_comment"],
    description: "GitHub Pay webhook receiver"
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    error: "Not found"
  });
});

// Error handler
app.use((err, req, res, next) => {
  console.error("Server error:", err);
  res.status(500).json({
    error: "Internal server error",
    message: err.message
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`\n✅ Server running on http://localhost:${PORT}`);
  console.log(`\n📍 Endpoints:`);
  console.log(`   POST /webhook/github - GitHub webhook receiver`);
  console.log(`   GET  /api/reward - Get pending reward for PR`);
  console.log(`   GET  /api/rewards/:username - Get all pending rewards`);
  console.log(`   POST /api/redeem - Redeem a reward`);
  console.log(`   GET  /api/balance - Check escrow balance`);
  console.log(`   GET  /health - Health check\n`);
});
