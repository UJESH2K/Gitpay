# GitHub Pay - Start Here! 🚀

## The Fastest Way to Get Running

This is the **only file you need to read** if you want to run this in the next 10 minutes.

---

## 📥 Prerequisites (Have These Ready)

Before you start, gather:

1. **Solana Keypair** (escrow wallet)
   - Run: `solana-keygen new`
   - Then: `solana-keygen show ~/.config/solana/id.json --output json`
   - Copy the array of numbers

2. **GitHub Token**
   - Go: https://github.com/settings/tokens
   - Click: "Generate new token (classic)"
   - Scopes: `repo`, `admin:repo_hook`, `read:user`
   - Copy the token value

3. **Phantom Wallet** (Chrome Extension)
   - Install: https://phantom.app/
   - Create a wallet
   - Switch to **Devnet** in settings

---

## ⚡ Step-by-Step (5 minutes)

### 1. Open Terminal & Navigate

```bash
cd c:\Users\ujesh\gitpay
```

### 2. Install Backend Dependencies

```bash
cd backend
npm install
```

(Wait 2-3 minutes for packages...)

### 3. Create & Configure .env

```bash
# Copy example to actual .env
copy .env.example .env

# Open .env in your editor
code .env
```

Edit these lines (paste your credentials):

```env
SOLANA_NETWORK=devnet
SOLANA_PRIVATE_KEY=[1,2,3,...]    # Paste your keypair array here
GITHUB_TOKEN=ghp_xxxxxxxxxxxxx     # Paste your GitHub token here
BACKEND_URL=http://localhost:3000
```

Save and close.

### 4. Start Backend

```bash
npm start
```

You should see:
```
✅ Server running on http://localhost:3000
✅ Solana initialized on devnet
✓ Rewards table initialized
✓ Users table initialized
✓ Maintainers table initialized
```

**Keep this terminal open!**

### 5. Load Extension in Chrome

Open a **new terminal window** (keep the backend one running):

```bash
# Just navigate to the extension folder
cd c:\Users\ujesh\gitpay\extension
# Then open Chrome
```

**In Chrome:**
1. Go to: `chrome://extensions/`
2. Top right: Enable **Developer mode**
3. Click: **Load unpacked**
4. Select: `c:\Users\ujesh\gitpay\extension`
5. ✅ Extension now shows in toolbar!

### 6. Connect Wallet

1. **Click extension icon** in Chrome toolbar
2. Click: **Connect Phantom Wallet**
3. In Phantom popup: Click **Connect**
4. You'll see your wallet address in extension popup

### 7. Link GitHub

1. In same extension popup
2. Click: **Link GitHub Account**
3. Enter your GitHub username
4. ✅ Linked!

---

## 🧪 Test It (2 minutes)

### Test 1: Backend Health

```bash
# In a third terminal:
curl http://localhost:3000/health
```

Should return:
```json
{"status":"ok","solana":true}
```

### Test 2: Send Fake Webhook

```bash
# In that same terminal:
cd c:\Users\ujesh\gitpay\backend
node test.js webhook
```

Should see in backend terminal:
```
📌 GitHub Webhook received
✅ Reward created
```

### Test 3: Check if Extension Works

1. Open any **GitHub PR page**
2. Look for **💰 Redeem SOL** button
3. You might not see it yet (need real reward from PR comment)

---

## 🎯 Now Test with Real GitHub

### Step 1: Create Test Repo

1. Go to GitHub
2. Create a **public** repo (anything)
3. Create one PR (any changes)

### Step 2: Issue Reward

1. On the PR, write a comment:
   ```
   /pay 50
   ```
2. Post the comment

### Step 3: Watch Backend

Check your backend terminal. You should see:
```
❌ maintainer is not a maintainer
```

**Why?** The user who commented isn't a maintainer on that repo.

**Fix:** 
- Go to repo Settings → Collaborators
- Add yourself as a collaborator (with write access)
- Try again

### Step 4: After You're Added as Maintainer

Comment again: `/pay 50`

Backend should now show:
```
📨 Webhook received:
   Repo: your-username/repo-name
   PR: #1
   Command: /pay 50
   By: your-username
   To: your-username
✅ Reward created
```

And GitHub should show a bot comment:
```
💰 Reward Created!

@contributor, you have a pending reward of 50 SOL...
```

### Step 5: See Redeem Button

1. Refresh the PR page
2. Should see **💰 Redeem 50 SOL** button
3. Click it
4. Check your Solana wallet (Phantom)
5. ✅ SOL received!

---

## 🎉 Success Signs

You know it's working when:

- ✅ Backend starts without errors
- ✅ Extension loads in Chrome
- ✅ Wallet connects to Phantom
- ✅ GitHub links in extension
- ✅ Webhook test returns reward created
- ✅ Real `/pay 50` comment is detected
- ✅ Bot replies with confirmation
- ✅ "Redeem" button appears on PR
- ✅ Clicking "Redeem" transfers SOL
- ✅ Solana transaction succeeds

---

## ❌ Common Issues (30 seconds)

| Problem | Fix |
|---------|-----|
| Port 3000 already in use | Close other app or: `netstat -ano \| findstr :3000` |
| "Solana not initialized" | Check .env has SOLANA_PRIVATE_KEY |
| Extension won't load | Check you selected the `extension` folder, not gitpay folder |
| Phantom not connecting | Install Phantom first, make wallet, switch to Devnet |
| No bot comment on PR | Check backend logs for errors |
| Reward not showing button | Refresh PR page (F5) |

---

## 📚 After This Works

Once you have everything running:

1. **Understand the code**: Read [ARCHITECTURE.md](ARCHITECTURE.md)
2. **Full documentation**: Read [README.md](README.md)
3. **Deploy**: Follow [README.md#production-deployment](README.md)
4. **Customize**: Check [Future Features](README.md#future-features)

---

## 🚀 Deploy (5 min extra)

When ready to deploy:

### Option A: Vercel (Easiest)
```bash
npm i -g vercel
cd backend
vercel deploy
```

### Option B: Heroku
```bash
heroku create
git push heroku main
heroku config:set GITHUB_TOKEN=xxx SOLANA_PRIVATE_KEY=xxx
```

---

## 🤔 Questions?

**"Why did I use devnet?"**
- Testnet SOL is free
- No real money risked
- Perfect for hackathons
- Can switch to mainnet in `.env`

**"What about mainnet?"**
- Same code
- Change `SOLANA_NETWORK=mainnet` in .env
- Need real SOL in escrow wallet
- Use for production

**"How do I show judges?"**
- Demo on testnet first (safer)
- Show `/pay 50` command
- Show "Redeem" button
- Show transaction hash
- ✅ Judges understand it instantly

**"Can I customize it?"**
- Yes! See [ARCHITECTURE.md](ARCHITECTURE.md)
- Change amounts, messages, tokens
- Add features

---

## ✨ That's It!

You now have a **working GitHub Pay system**.

**Next 5 minutes**: Test on real PR
**Next hour**: Deploy to production
**Next week**: Add custom features

---

## 📞 Need Help?

- **Setup issues?** Check [SETUP-WINDOWS.md](SETUP-WINDOWS.md)
- **API questions?** Check [README.md](README.md)
- **Architecture?** Check [ARCHITECTURE.md](ARCHITECTURE.md)
- **GitHub setup?** Check [GITHUB-WEBHOOK-SETUP.md](GITHUB-WEBHOOK-SETUP.md)

---

**You've got this! 🚀**

Go reward some amazing open source contributors! 💰

---

**Total time invested: ~15 minutes**
**Payoff: A complete Solana hackathon project that actually works**
