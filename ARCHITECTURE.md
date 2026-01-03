# GitHub Pay - Architecture & Technical Deep Dive

## 🏗 System Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     GITHUB ECOSYSTEM                         │
│  ┌──────────────────────────────────────────────────────┐   │
│  │  GitHub PR Comment: "/pay 50"                        │   │
│  │  (Maintainer writes comment on contributor's PR)     │   │
│  └──────────────────────────┬───────────────────────────┘   │
└─────────────────────────────┼──────────────────────────────┘
                              │ GitHub Webhook Event
                              │ (issue_comment.created)
                              ▼
┌─────────────────────────────────────────────────────────────┐
│              EXPRESS BACKEND (Node.js)                       │
│  ┌──────────────────────────────────────────────────────┐   │
│  │  webhook.js                                          │   │
│  │  ├─ Parse: /pay 50                                  │   │
│  │  ├─ Verify: Is commentator a maintainer?            │   │
│  │  ├─ Extract: PR number, contributor, amount         │   │
│  │  └─ Create: Reward record                           │   │
│  └──────────────────────────────────────────────────────┘   │
│  ┌──────────────────────────────────────────────────────┐   │
│  │  database.js (SQLite)                               │   │
│  │  └─ Store: Reward(id, repo, pr, amount, status)     │   │
│  └──────────────────────────────────────────────────────┘   │
│  ┌──────────────────────────────────────────────────────┐   │
│  │  server.js (REST API)                               │   │
│  │  ├─ GET /api/reward                                 │   │
│  │  ├─ POST /api/redeem                                │   │
│  │  └─ GET /api/balance                                │   │
│  └──────────────────────────────────────────────────────┘   │
└─────────────────────────────┬──────────────────────────────┘
                              │
              ┌───────────────┴───────────────┐
              │                               │
              ▼                               ▼
    ┌──────────────────┐          ┌──────────────────┐
    │  Chrome Extension│          │  Solana Network  │
    │  (Contributor)   │          │  (Devnet/Mainnet)│
    └──────────────────┘          └──────────────────┘
```

---

## 🔄 Data Flow

### 1️⃣ **Reward Issuance Flow**

```
Maintainer
  │
  ├─ Goes to GitHub PR
  ├─ Writes comment: "/pay 50"
  │
  └─→ GitHub Sends Webhook
        │
        └─→ Backend Receives POST /webhook/github
              │
              ├─ Parse: amount = 50
              ├─ Verify: Is maintainer? (GitHub API check)
              ├─ Extract: contributor = PR author
              │
              └─→ Database.create({
                    id: uuid,
                    repo: "owner/repo",
                    pr: 123,
                    amount: 50,
                    recipient: "contributor",
                    status: "pending"
                  })
              │
              └─→ Reply: "✅ Reward created"
                    (Posted as bot comment on PR)
```

### 2️⃣ **Reward Redemption Flow**

```
Contributor
  │
  ├─ Opens GitHub PR (has reward)
  │
  └─→ Chrome Extension (content.js)
        │
        ├─ Detect: /repos/owner/repo/pull/123
        ├─ Fetch: GET /api/reward?repo=owner/repo&pr=123
        │
        └─→ Backend Returns:
              {
                id: "uuid",
                amount: 50,
                status: "pending"
              }
        │
        ├─ Inject: <button>💰 Redeem 50 SOL</button>
        │
        └─ Contributor Clicks Button
              │
              ├─ Check: Is wallet connected? (chrome.storage)
              ├─ Check: Is GitHub account linked?
              │
              └─→ Send to background.js:
                    {
                      type: "REDEEM_REWARD",
                      rewardId: "uuid",
                      amount: 50
                    }
              │
              └─→ background.js Calls Backend:
                    POST /api/redeem
                    {
                      rewardId: "uuid",
                      recipientWallet: "7xK...abc",
                      recipientGithub: "contributor",
                      amount: 50
                    }
              │
              └─→ Backend Processes:
                    ├─ Verify: Does reward exist?
                    ├─ Verify: Status is "pending"?
                    ├─ Verify: Recipient matches?
                    │
                    └─→ solana.js.transferSOL()
                          │
                          ├─ Create Transaction:
                          │   from: escrow wallet
                          │   to: contributor wallet
                          │   amount: 50 SOL
                          │
                          ├─ Sign: escrow keypair
                          ├─ Send: to Solana RPC
                          │
                          └─ Return: transaction hash
                    │
                    ├─ Update: Reward.status = "redeemed"
                    ├─ Store: tx_hash
                    │
                    └─ Return: { success: true, txHash: "abc123" }
              │
              └─→ Extension Shows:
                    ✅ Redeemed!
                    Tx: abc123...
```

---

## 🗄 Database Schema

### **rewards** Table
```sql
id                 TEXT PRIMARY KEY
repo               TEXT NOT NULL          -- owner/repo
pr                 INTEGER NOT NULL       -- PR number
amount             REAL NOT NULL          -- SOL amount
token              TEXT DEFAULT 'SOL'
issued_by          TEXT NOT NULL          -- maintainer username
recipient          TEXT NOT NULL          -- contributor username
recipient_wallet   TEXT                   -- Solana address
status             TEXT DEFAULT 'pending'  -- pending|redeemed|failed
tx_hash            TEXT                   -- Solana transaction hash
created_at         DATETIME DEFAULT NOW
redeemed_at        DATETIME
```

### **users** Table
```sql
github_username    TEXT PRIMARY KEY
solana_wallet      TEXT NOT NULL          -- Associated wallet
created_at         DATETIME DEFAULT NOW
updated_at         DATETIME DEFAULT NOW
```

### **maintainers** Table
```sql
github_username    TEXT PRIMARY KEY
repos              TEXT                   -- JSON list of repos
verified           BOOLEAN DEFAULT 0
created_at         DATETIME DEFAULT NOW
```

---

## 🔐 Security Model

### **Permission Checks**

1. **Maintainer Verification**
   ```javascript
   // Check GitHub API for collaborator permission
   GET /repos/{owner}/{repo}/collaborators/{username}/permission
   
   // Accept: admin, maintain, write
   // Reject: read, triage
   ```

2. **Reward Binding**
   ```
   Each reward is bound to:
   - Specific repo (owner/repo)
   - Specific PR (#123)
   - Specific contributor (GitHub username)
   
   Cannot be transferred or reassigned
   ```

3. **Idempotency**
   ```
   Once redeemed (status = "redeemed"):
   - Cannot redeem again
   - txHash prevents double-spending
   ```

### **Wallet Safety**

- Private keys stored **only** on backend (never sent to extension)
- Extension never handles private keys
- Extension uses Phantom API (external wallet provider)
- Wallet connection verified via signature

### **Transaction Verification**

```javascript
// Before sending SOL:
1. Verify reward exists
2. Verify status == "pending"
3. Verify recipient == authenticated user
4. Verify wallet address format
5. Estimate gas (lamports)
6. Create + sign transaction
7. Send with confirmation
8. Store hash in DB
```

---

## 📡 API Endpoints

### **Webhook**

```
POST /webhook/github
Content-Type: application/json

Receives GitHub event payload:
{
  action: "created",
  comment: {
    body: "/pay 50",
    user: { login: "maintainer" }
  },
  issue: {
    pull_request: {...},
    user: { login: "contributor" }
  },
  repository: { full_name: "owner/repo" }
}

Response:
{
  success: true,
  reward: {
    rewardId: "uuid",
    repo: "owner/repo",
    amount: 50
  }
}
```

### **Get Reward**

```
GET /api/reward?repo=owner/repo&pr=123

Response (200):
{
  id: "uuid",
  repo: "owner/repo",
  pr: 123,
  amount: 50,
  status: "pending",
  issuedBy: "maintainer",
  recipient: "contributor"
}

Response (404):
{
  error: "No pending reward"
}
```

### **Redeem Reward**

```
POST /api/redeem
Content-Type: application/json

{
  rewardId: "uuid",
  recipientWallet: "7xK...abc",
  recipientGithub: "contributor",
  amount: 50
}

Response (200):
{
  success: true,
  txHash: "abc123...",
  status: "redeemed"
}

Response (400):
{
  error: "Reward already redeemed"
}
```

---

## 🧬 Component Details

### **Extension: content.js**

Runs on GitHub PR pages (`https://github.com/*/*/pull/*`)

```javascript
// 1. Detect PR location
const pr = detectPR() // owner/repo/pull/number

// 2. Fetch reward status
const reward = await fetchReward(owner, repo, pr)

// 3. If pending, inject button
if (reward.status === "pending") {
  injectRedeemButton(reward)
}

// 4. On button click
btn.onclick = () => {
  // Send message to background script
  chrome.runtime.sendMessage({
    type: "REDEEM_REWARD",
    rewardId: reward.id,
    amount: reward.amount
  })
}
```

### **Extension: background.js**

Background service worker

```javascript
// Listen for messages
chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  if (msg.type === "REDEEM_REWARD") {
    redeemReward(msg)
  }
})

// Get wallet from storage
const wallet = chrome.storage.local.get("wallet")

// Call backend
fetch("/api/redeem", {
  method: "POST",
  body: JSON.stringify({
    rewardId,
    recipientWallet: wallet,
    recipientGithub: githubUser
  })
})
```

### **Backend: webhook.js**

Handles GitHub webhooks

```javascript
async function handleWebhook(payload) {
  // 1. Parse /pay command
  const amount = parsePayCommand(payload.comment.body)
  
  // 2. Verify maintainer
  const isMaint = await isMaintainer(owner, repo, username)
  
  // 3. Create reward
  await Reward.create({
    repo, pr, amount, recipient, issuedBy
  })
  
  // 4. Reply on PR
  await github.issues.createComment({
    body: "💰 Reward created..."
  })
}
```

### **Backend: solana.js**

Solana transaction handler

```javascript
async function transferSOL(toWallet, amountSOL) {
  // 1. Create transaction
  const tx = new Transaction().add(
    SystemProgram.transfer({
      fromPubkey: escrowWallet,
      toPubkey: toWallet,
      lamports: amountSOL * 1e9
    })
  )
  
  // 2. Sign with escrow key
  // 3. Send to RPC
  // 4. Wait for confirmation
  // 5. Return signature
}
```

---

## ⚡ Performance Considerations

### **Database**
- SQLite for MVP (upgrade to Postgres for production)
- Index on: `(repo, pr)`, `recipient`, `status`
- Cleanup job for old redeemed rewards

### **API**
- Webhook validation (signature check)
- Rate limiting: 100 req/min per IP
- CORS for Chrome extension origin
- Request/response compression

### **Solana**
- Use devnet for testing
- Use "confirmed" commitment (3-5 sec)
- Batch multiple transfers if needed
- Retry logic with exponential backoff

### **Extension**
- Cache reward status (5 min)
- Debounce button clicks
- Store wallet in chrome.storage.local (encrypted)
- Lazy load Solana SDK

---

## 🚀 Deployment Checklist

- [ ] Use mainnet Solana (not devnet)
- [ ] HTTPS enabled
- [ ] Environment variables configured
- [ ] Database backups enabled
- [ ] Webhook signature validation enabled
- [ ] CORS restricted to your domain
- [ ] Rate limiting configured
- [ ] Error logging (Sentry, etc.)
- [ ] Monitoring alerts set up
- [ ] GitHub App registered
- [ ] Webhook configured in GitHub
- [ ] Extension code reviewed
- [ ] Private key secure (HSM or vault)

---

## 🔮 Future Architecture

### **v2 Features**
- Multi-token support (USDC, etc.)
- Non-custodial escrow (signature-based)
- DAO governance for reward amounts
- Batch processing
- Email notifications
- Discord integration

### **Scale**
- Move to microservices
- GraphQL API
- WebSocket for real-time updates
- Message queue for async processing
- CDN for extension distribution

---

**This architecture balances simplicity (MVP) with security and scalability.** 🎯
