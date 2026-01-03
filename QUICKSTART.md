# GitHub Pay - Quick Start (5 Minutes)

**TL;DR** - Get GitHub Pay running in 5 minutes.

## 🎯 What is GitHub Pay?

A Chrome extension that lets GitHub repo maintainers reward contributors with Solana by commenting:

```
/pay 50
```

Contributors see a "Redeem" button and get instant SOL payments.

---

## ⚡ Quick Setup

### 1. Install Dependencies (1 min)

```bash
cd backend
npm install
```

### 2. Get Credentials (2 min)

**Solana Keypair** (escrow wallet):
```bash
solana-keygen new
solana-keygen show ~/.config/solana/id.json --output json
# Copy the array and save for step 3
```

**GitHub Token:**
- Go to: https://github.com/settings/tokens
- Generate token with: `repo`, `admin:repo_hook`, `read:user`
- Copy token

### 3. Configure Backend (1 min)

Edit `backend/.env`:
```env
SOLANA_NETWORK=devnet
SOLANA_PRIVATE_KEY=[1,2,3,...]  # Your keypair array from step 2
GITHUB_TOKEN=ghp_xxx            # Your token from step 2
```

### 4. Start Backend (1 min)

```bash
cd backend
npm start
```

Should print:
```
✅ Server running on http://localhost:3000
```

### 5. Load Extension (1 min)

1. Open: `chrome://extensions/`
2. Enable "Developer mode"
3. Click "Load unpacked"
4. Select the `extension/` folder

---

## 🧪 Test It (2 min)

### Test 1: Health Check

```bash
curl http://localhost:3000/health
```

Should return:
```json
{"status":"ok","solana":true}
```

### Test 2: Send Test Webhook

```bash
# In another terminal:
cd backend
node test.js webhook
```

Should see reward created in logs.

### Test 3: Real GitHub PR

1. Create a test GitHub repo
2. Create a PR or use existing
3. Comment: `/pay 50`
4. Check backend logs
5. Extension should show "Redeem" button

---

## 🎨 How to Use

### For Maintainers

```
Pull request comment:
/pay 50
```

That's it! Bot confirms the reward is pending.

### For Contributors

1. Install extension
2. Connect Phantom wallet
3. Link GitHub username
4. See PR with reward
5. Click "💰 Redeem SOL"
6. Done! SOL in wallet

---

## 📁 Project Structure

```
gitpay/
├── extension/          # Chrome extension code
│   ├── manifest.json
│   ├── content.js      # Injects UI into GitHub
│   ├── background.js   # Wallet + Solana logic
│   ├── popup.html/js   # Wallet connect UI
├── backend/            # Node.js API
│   ├── server.js       # Main Express app
│   ├── database.js     # SQLite wrapper
│   ├── webhook.js      # GitHub webhook handler
│   ├── solana.js       # Solana transaction logic
│   ├── package.json
│   ├── .env.example
│   ├── test.js
└── README.md           # Full documentation
```

---

## 🐛 Troubleshooting (30 sec)

| Problem | Solution |
|---------|----------|
| "Port already in use" | Kill process: `lsof -i :3000` or `taskkill /PID xxx /F` |
| "Solana not initialized" | Check `.env` has `SOLANA_PRIVATE_KEY` |
| "Wallet not connecting" | Install Phantom: https://phantom.app/ |
| "No pending reward" | Check webhook in backend logs |
| "Extension not loading" | Go `chrome://extensions/` → enable Developer mode |

---

## 🚀 Next Steps

1. **Test on real PR**: Create a GitHub repo, issue `/pay 50` command
2. **Deploy backend**: Use Vercel, Heroku, or AWS Lambda
3. **Publish extension**: Submit to Chrome Web Store
4. **Add features**: Token support, batch rewards, etc.

---

## 📚 Full Docs

- **Backend setup**: [README.md](README.md)
- **Windows setup**: [SETUP-WINDOWS.md](SETUP-WINDOWS.md)
- **API reference**: [README.md#api-endpoints](README.md#api-endpoints)

---

## ✅ Success Checklist

- [ ] Dependencies installed
- [ ] Solana keypair generated
- [ ] GitHub token created
- [ ] `.env` configured
- [ ] Backend running (`npm start`)
- [ ] Health check passes (`curl /health`)
- [ ] Extension loaded in Chrome
- [ ] Phantom wallet installed
- [ ] Wallet connected in extension
- [ ] GitHub linked in extension
- [ ] Test webhook works (`node test.js webhook`)

---

**🎉 You're ready!** Start rewarding contributors now! 🚀
