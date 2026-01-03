// Content script - runs on GitHub PR pages
// This script injects the Redeem button into the PR page

const BACKEND_URL = "http://localhost:3000"; // Change to your backend URL

async function detectPR() {
  const path = window.location.pathname;
  const parts = path.split("/");

  // Expected format: /owner/repo/pull/number
  if (parts.length < 5 || parts[3] !== "pull") {
    return null;
  }

  return {
    owner: parts[1],
    repo: parts[2],
    pr: parseInt(parts[4])
  };
}

async function fetchReward(owner, repo, pr) {
  try {
    const response = await fetch(
      `${BACKEND_URL}/api/reward?repo=${owner}/${repo}&pr=${pr}`,
      {
        credentials: "include",
        headers: {
          "Content-Type": "application/json"
        }
      }
    );

    if (!response.ok) {
      console.log("No pending reward");
      return null;
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error("Error fetching reward:", error);
    return null;
  }
}

function injectRedeemButton(reward) {
  // Find PR header actions (where merge button is)
  const headerActions = document.querySelector(
    "[class*='gh-header-actions']"
  ) || document.querySelector("div[class*='Flex']");

  if (!headerActions && !document.querySelector(".gh-header")) {
    // Fallback: inject in the first available action area
    const prTitle = document.querySelector('[data-testid="pr-title-heading"]');
    if (!prTitle) return;
  }

  // Check if button already exists
  if (document.querySelector(".github-pay-redeem-btn")) {
    return;
  }

  // Create button
  const btn = document.createElement("button");
  btn.className = "github-pay-redeem-btn";
  btn.innerText = `💰 Redeem ${reward.amount} SOL`;
  btn.style.cssText = `
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    color: white;
    padding: 10px 16px;
    border: none;
    border-radius: 6px;
    font-weight: 600;
    cursor: pointer;
    font-size: 14px;
    margin-left: 8px;
    transition: all 0.3s ease;
    box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
  `;

  btn.onmouseover = () => {
    btn.style.transform = "translateY(-2px)";
    btn.style.boxShadow = "0 6px 12px rgba(0, 0, 0, 0.15)";
  };

  btn.onmouseout = () => {
    btn.style.transform = "translateY(0)";
    btn.style.boxShadow = "0 4px 6px rgba(0, 0, 0, 0.1)";
  };

  btn.onclick = async () => {
    btn.disabled = true;
    btn.innerText = "⏳ Processing...";

    chrome.runtime.sendMessage(
      {
        type: "REDEEM_REWARD",
        amount: reward.amount,
        rewardId: reward.id,
        repo: reward.repo,
        pr: reward.pr
      },
      (response) => {
        if (response && response.success) {
          btn.innerText = "✅ Redeemed!";
          btn.style.background = "#22c55e";
        } else {
          btn.disabled = false;
          btn.innerText = `💰 Redeem ${reward.amount} SOL`;
          alert(
            "Redeem failed: " + (response?.error || "Unknown error")
          );
        }
      }
    );
  };

  // Inject into page
  const prActions = document.querySelector(".gh-header-actions");
  if (prActions) {
    prActions.appendChild(btn);
  } else {
    const primaryButton = document.querySelector(
      "button[aria-label*='merge'], button[class*='merge']"
    );
    if (primaryButton) {
      primaryButton.parentElement.appendChild(btn);
    } else {
      document.body.appendChild(btn);
    }
  }
}

async function main() {
  const pr = await detectPR();
  if (!pr) {
    console.log("Not a PR page");
    return;
  }

  console.log(`Detected PR: ${pr.owner}/${pr.repo}#${pr.pr}`);

  const reward = await fetchReward(pr.owner, pr.repo, pr.pr);
  if (reward && reward.status === "pending") {
    console.log("Reward found:", reward);
    injectRedeemButton(reward);
  }
}

// Run on page load
if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", main);
} else {
  main();
}

// Also run periodically to catch dynamic updates
setInterval(main, 3000);
