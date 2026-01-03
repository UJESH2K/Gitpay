// Background service worker
// Handles wallet connection, Solana transactions, and message passing

const BACKEND_URL = "http://localhost:3000";

// Listen for messages from content script
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  console.log("Background received:", request.type);

  if (request.type === "REDEEM_REWARD") {
    redeemReward(request, sendResponse);
    return true; // Keep channel open for async response
  }

  if (request.type === "GET_WALLET") {
    chrome.storage.local.get("wallet", (result) => {
      sendResponse({ wallet: result.wallet });
    });
    return true;
  }

  if (request.type === "GET_USER") {
    chrome.storage.local.get(["githubUser", "wallet"], (result) => {
      sendResponse({
        githubUser: result.githubUser,
        wallet: result.wallet
      });
    });
    return true;
  }
});

async function redeemReward(request, sendResponse) {
  try {
    // Get stored wallet
    const { wallet, githubUser } = await new Promise((resolve) => {
      chrome.storage.local.get(["wallet", "githubUser"], resolve);
    });

    if (!wallet || !githubUser) {
      sendResponse({
        success: false,
        error: "Wallet not connected. Please connect Phantom first."
      });
      return;
    }

    console.log(`Redeeming ${request.amount} SOL to ${wallet}`);

    // Call backend to verify and process reward
    const response = await fetch(`${BACKEND_URL}/api/redeem`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      credentials: "include",
      body: JSON.stringify({
        rewardId: request.rewardId,
        recipientWallet: wallet,
        recipientGithub: githubUser,
        repo: request.repo,
        pr: request.pr,
        amount: request.amount
      })
    });

    const result = await response.json();

    if (response.ok) {
      console.log("Reward redeemed:", result);
      sendResponse({
        success: true,
        txHash: result.txHash
      });
    } else {
      console.error("Redeem failed:", result);
      sendResponse({
        success: false,
        error: result.error || "Backend error"
      });
    }
  } catch (error) {
    console.error("Error in redeemReward:", error);
    sendResponse({
      success: false,
      error: error.message
    });
  }
}

// Store wallet and user info
function storeWalletInfo(wallet, githubUser) {
  chrome.storage.local.set({
    wallet,
    githubUser,
    connectedAt: new Date().toISOString()
  });
  console.log("Wallet stored:", wallet);
}

// Export for popup script
chrome.runtime.onInstalled.addListener(() => {
  console.log("GitHub Pay extension installed");
});
