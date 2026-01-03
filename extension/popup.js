// Popup script - handles wallet connection and GitHub linking

const BACKEND_URL = "http://localhost:3000";

// Elements
const connectBtn = document.getElementById("connectBtn");
const disconnectBtn = document.getElementById("disconnectBtn");
const linkGithubBtn = document.getElementById("linkGithubBtn");
const unlinkGithubBtn = document.getElementById("unlinkGithubBtn");
const walletStatus = document.getElementById("walletStatus");
const walletConnected = document.getElementById("walletConnected");
const githubStatus = document.getElementById("githubStatus");
const githubLinked = document.getElementById("githubLinked");
const walletAddress = document.getElementById("walletAddress");
const githubUsername = document.getElementById("githubUsername");

// Initialize on load
document.addEventListener("DOMContentLoaded", initializePopup);

async function initializePopup() {
  await updateUI();
}

async function updateUI() {
  // Get stored data
  const { wallet, githubUser } = await new Promise((resolve) => {
    chrome.storage.local.get(["wallet", "githubUser"], resolve);
  });

  // Update wallet UI
  if (wallet) {
    walletStatus.style.display = "none";
    walletConnected.style.display = "block";
    walletAddress.innerText = wallet;
  } else {
    walletStatus.style.display = "block";
    walletConnected.style.display = "none";
  }

  // Update GitHub UI
  if (githubUser) {
    githubStatus.style.display = "none";
    githubLinked.style.display = "block";
    githubUsername.innerText = githubUser;
  } else {
    githubStatus.style.display = "block";
    githubLinked.style.display = "none";
  }
}

// Connect Phantom Wallet
connectBtn.addEventListener("click", async () => {
  try {
    connectBtn.disabled = true;
    connectBtn.innerText = "⏳ Connecting...";

    // Check if Phantom is installed
    const phantom = window.solana;
    if (!phantom || !phantom.isPhantom) {
      alert("Please install Phantom wallet: https://phantom.app");
      connectBtn.disabled = false;
      connectBtn.innerText = "Connect Phantom Wallet";
      return;
    }

    // Connect to Phantom
    const response = await phantom.connect();
    const walletPubKey = response.publicKey.toString();

    console.log("Connected wallet:", walletPubKey);

    // Store wallet in extension storage
    chrome.storage.local.set({
      wallet: walletPubKey,
      connectedAt: new Date().toISOString()
    });

    connectBtn.innerText = "✅ Connected";
    await updateUI();
  } catch (error) {
    console.error("Connection error:", error);
    alert("Failed to connect: " + error.message);
    connectBtn.disabled = false;
    connectBtn.innerText = "Connect Phantom Wallet";
  }
});

// Disconnect Wallet
disconnectBtn.addEventListener("click", async () => {
  chrome.storage.local.remove("wallet");
  disconnectBtn.innerText = "Disconnecting...";
  setTimeout(async () => {
    await updateUI();
    disconnectBtn.innerText = "Unlink";
  }, 500);
});

// Link GitHub Account
linkGithubBtn.addEventListener("click", async () => {
  try {
    linkGithubBtn.disabled = true;
    linkGithubBtn.innerText = "⏳ Linking...";

    // Open GitHub OAuth or prompt for username
    const username = prompt("Enter your GitHub username:");

    if (!username) {
      linkGithubBtn.disabled = false;
      linkGithubBtn.innerText = "Link GitHub Account";
      return;
    }

    // Verify username exists via backend
    const response = await fetch(`${BACKEND_URL}/api/verify-github/${username}`);

    if (!response.ok) {
      alert("GitHub user not found");
      linkGithubBtn.disabled = false;
      linkGithubBtn.innerText = "Link GitHub Account";
      return;
    }

    // Store GitHub username
    chrome.storage.local.set({
      githubUser: username
    });

    linkGithubBtn.innerText = "✅ Linked";
    await updateUI();
  } catch (error) {
    console.error("GitHub linking error:", error);
    alert("Failed to link GitHub: " + error.message);
    linkGithubBtn.disabled = false;
    linkGithubBtn.innerText = "Link GitHub Account";
  }
});

// Unlink GitHub Account
unlinkGithubBtn.addEventListener("click", async () => {
  chrome.storage.local.remove("githubUser");
  unlinkGithubBtn.innerText = "Unlinking...";
  setTimeout(async () => {
    await updateUI();
    unlinkGithubBtn.innerText = "Unlink";
  }, 500);
});
