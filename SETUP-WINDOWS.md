# Windows Setup Guide for GitHub Pay

## Prerequisites Installation

### 1. Install Node.js
- Download from: https://nodejs.org/ (LTS version)
- Run installer, accept defaults
- Verify: Open PowerShell and type:
```powershell
node --version
npm --version
```

### 2. Install Solana CLI (Optional but Recommended)
```powershell
# Open PowerShell as Administrator
iwr https://release.solana.com/v1.18.0/solana-install-init.ps1 -OutFile solana-install-init.ps1
.\solana-install-init.ps1
```

### 3. Install Git (if not already installed)
Download from: https://git-scm.com/download/win

---

## Setup Steps

### Step 1: Clone or Extract Repository
```powershell
cd c:\Users\ujesh\gitpay
```

### Step 2: Install Backend Dependencies
```powershell
cd backend
npm install
```

### Step 3: Create Solana Keypair (Escrow Wallet)

**Option A: Using Solana CLI**
```powershell
# Generate new keypair
solana-keygen new

# View in array format (for .env)
solana-keygen show -f C:\Users\YourUsername\.config\solana\id.json --output json
```

**Option B: Using web generator**
1. Go to: https://solflare.com/access (test mode)
2. Generate keypair
3. Export as JSON
4. Convert to array format

### Step 4: Get GitHub Token
1. Go to: https://github.com/settings/tokens
2. Click "Generate new token (classic)"
3. Select scopes:
   - `repo` (all)
   - `admin:repo_hook` (write)
   - `read:user`
4. Copy the token

### Step 5: Configure .env

Open `backend\.env` in Notepad:

```env
PORT=3000
NODE_ENV=development

SOLANA_NETWORK=devnet
SOLANA_PRIVATE_KEY=[1,2,3,4,5,...]   # Paste your keypair array here

GITHUB_TOKEN=ghp_xxxxxxxxxxxxxxx      # Paste your GitHub token here

BACKEND_URL=http://localhost:3000
```

### Step 6: Start Backend

```powershell
cd backend
npm start
```

You should see:
```
✅ Server running on http://localhost:3000
```

---

## Load Chrome Extension

1. Open Chrome
2. Go to: `chrome://extensions/`
3. Enable "Developer mode" (top right toggle)
4. Click "Load unpacked"
5. Navigate to and select: `C:\Users\ujesh\gitpay\extension`
6. Extension should appear in toolbar

---

## Test It!

### Local Test (No Real PR)

```powershell
# In a new PowerShell window, run:
$body = @{
    action = "created"
    comment = @{
        body = "/pay 50"
        user = @{ login = "your-github-username" }
    }
    issue = @{
        number = 999
        pull_request = @{}
        user = @{ login = "contributor-username" }
    }
    repository = @{
        name = "test-repo"
        owner = @{ login = "your-github-username" }
    }
} | ConvertTo-Json

$headers = @{
    "Content-Type" = "application/json"
}

Invoke-WebRequest -Uri "http://localhost:3000/webhook/github" `
  -Method POST `
  -Headers $headers `
  -Body $body
```

### Real Test (On Actual PR)

1. Go to a GitHub repo you own/maintain
2. Create a PR or use existing one
3. Comment: `/pay 50`
4. Backend processes it (check console logs)
5. Contributor sees "Redeem" button on PR

---

## Troubleshooting

### Port 3000 already in use
```powershell
# Find process using port 3000
netstat -ano | findstr :3000

# Kill the process (replace PID with actual number)
taskkill /PID <PID> /F
```

### Phantom not found error
1. Install Phantom wallet extension: https://phantom.app/
2. Create wallet
3. Switch to Devnet in Phantom settings

### "Invalid wallet address" error
- Make sure wallet address in extension matches Phantom
- Make sure Phantom is connected to Devnet

### GitHub token not working
- Verify token has correct scopes
- Token might be expired, generate new one

---

## Next: Configure GitHub Webhook (Optional)

For real GitHub integration:

1. Go to repo: Settings → Webhooks → Add webhook
2. Set:
   - **Payload URL:** `http://your-ip:3000/webhook/github` (if using ngrok)
   - **Content type:** `application/json`
   - **Events:** Issue comments
   - **Active:** ✓

*(For local dev, use ngrok to expose localhost)*

---

## Files Structure

```
c:\Users\ujesh\gitpay\
├── extension/              # Chrome extension
│   ├── manifest.json
│   ├── content.js
│   ├── background.js
│   ├── popup.html
│   └── popup.js
├── backend/                # Node.js API
│   ├── server.js
│   ├── database.js
│   ├── webhook.js
│   ├── solana.js
│   ├── package.json
│   ├── .env.example
│   └── data/               # SQLite database
├── README.md               # Full documentation
└── setup.sh                # Linux/Mac setup script
```

---

## Commands Reference

```powershell
# Start backend
cd backend; npm start

# Install dependencies
npm install

# View logs
Get-Content backend/data/github-pay.db

# Test API
Invoke-WebRequest http://localhost:3000/health
```

---

## Success Indicators ✅

You'll know it's working when:

1. Backend starts: `✅ Server running on http://localhost:3000`
2. Extension loads: Icon appears in Chrome toolbar
3. Wallet connects: Extension popup shows wallet address
4. GitHub receives webhook: Backend logs show `/pay` command detected
5. Reward created: Database has entry
6. Button appears: "💰 Redeem SOL" visible on PR page
7. Redeem works: SOL transferred to wallet

---

Good luck! 🚀
