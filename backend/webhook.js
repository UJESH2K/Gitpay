// GitHub webhook handler - listens for /pay commands

const { Octokit } = require("@octokit/rest");
const { v4: uuidv4 } = require("uuid");
const { Reward, User, Maintainer } = require("./database");

const octokit = new Octokit({
  auth: process.env.GITHUB_TOKEN
});

// Parse /pay command from comment
function parsePayCommand(comment) {
  const match = comment.match(/\/pay\s+(\d+(?:\.\d+)?)\s*(?:sol)?/i);
  if (match) {
    return {
      amount: parseFloat(match[1]),
      found: true
    };
  }
  return { found: false };
}

// Check if user is maintainer of repo
async function isMaintainer(owner, repo, username) {
  try {
    const response = await octokit.repos.getCollaboratorPermissionLevel({
      owner,
      repo,
      username
    });

    const permission = response.data.permission;
    // Accept admin, maintain, and write permissions
    return ["admin", "maintain", "write"].includes(permission);
  } catch (error) {
    console.error("Permission check error:", error.message);
    return false;
  }
}

// Handle webhook payload
async function handleWebhook(payload) {
  try {
    // Check if this is a PR comment
    if (!payload.issue || !payload.issue.pull_request) {
      console.log("Not a PR comment, ignoring");
      return null;
    }

    // Check if comment contains /pay command
    const payCmd = parsePayCommand(payload.comment.body);
    if (!payCmd.found) {
      console.log("No /pay command found");
      return null;
    }

    const {
      repository,
      comment,
      issue,
      action
    } = payload;

    const owner = repository.owner.login;
    const repo = repository.name;
    const repoFull = `${owner}/${repo}`;
    const pr = issue.number;
    const commentAuthor = comment.user.login;
    const contributor = issue.user.login;
    const amount = payCmd.amount;

    console.log(`\n📨 Webhook received:`);
    console.log(`   Repo: ${repoFull}`);
    console.log(`   PR: #${pr}`);
    console.log(`   Command: /pay ${amount}`);
    console.log(`   By: ${commentAuthor}`);
    console.log(`   To: ${contributor}`);

    // Only process on comment creation
    if (action !== "created") {
      console.log("Not a new comment, ignoring");
      return null;
    }

    // Verify maintainer permission
    const maintainer = await isMaintainer(owner, repo, commentAuthor);
    if (!maintainer) {
      console.log(`❌ ${commentAuthor} is not a maintainer`);

      // Reply with error (optional)
      try {
        await octokit.issues.createComment({
          owner,
          repo,
          issue_number: pr,
          body: `❌ @${commentAuthor}, you don't have permission to issue rewards. Only maintainers can use the \`/pay\` command.`
        });
      } catch (err) {
        console.error("Failed to post error comment:", err.message);
      }

      return null;
    }

    // Check if contributor exists / get user info
    let contributorUser;
    try {
      contributorUser = await octokit.users.getByUsername({
        username: contributor
      });
    } catch (error) {
      console.log(`❌ Contributor ${contributor} not found`);
      return null;
    }

    // Create reward in database
    const rewardId = uuidv4();
    await Reward.create({
      id: rewardId,
      repo: repoFull,
      pr,
      amount,
      issuedBy: commentAuthor,
      recipient: contributor
    });

    console.log(`✅ Reward created: ${rewardId}`);

    // Reply with success message
    try {
      await octokit.issues.createComment({
        owner,
        repo,
        issue_number: pr,
        body: `💰 **Reward Created!**\n\n@${contributor}, you have a pending reward of **${amount} SOL** from @${commentAuthor}.\n\nYour GitHub Pay extension will show a redeem button. Connect your Solana wallet and click "Redeem" to claim it.`
      });
    } catch (err) {
      console.error("Failed to post success comment:", err.message);
    }

    return {
      rewardId,
      repo: repoFull,
      pr,
      amount,
      contributor,
      issuedBy: commentAuthor
    };
  } catch (error) {
    console.error("Webhook processing error:", error);
    throw error;
  }
}

module.exports = {
  handleWebhook,
  parsePayCommand,
  isMaintainer
};
