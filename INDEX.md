# GitHub Pay - Project Index

**A Chrome Extension + Solana system for rewarding GitHub contributors**

---

## 📍 Navigation Guide

### 🚀 **Just Getting Started?**
→ Start with [START-HERE.md](START-HERE.md) (10 min read)

### ⚡ **Want Quick Setup?**
→ Read [QUICKSTART.md](QUICKSTART.md) (5 min setup)

### 🪟 **On Windows?**
→ Follow [SETUP-WINDOWS.md](SETUP-WINDOWS.md) (step-by-step)

### 📚 **Need Complete Guide?**
→ Read [README.md](README.md) (comprehensive)

### 🏗 **Understand Architecture?**
→ Study [ARCHITECTURE.md](ARCHITECTURE.md) (technical deep dive)

### 🔗 **Setting up GitHub Webhooks?**
→ Follow [GITHUB-WEBHOOK-SETUP.md](GITHUB-WEBHOOK-SETUP.md)

### 📊 **What's Been Built?**
→ Read [BUILD_SUMMARY.md](BUILD_SUMMARY.md) (overview)

---

## 🗂 Project Structure

```
gitpay/
├── extension/
│   ├── manifest.json          # Extension config
│   ├── content.js             # Injects UI into GitHub
│   ├── background.js          # Wallet & Solana logic
│   ├── popup.html/js          # Settings UI
│   └── .env.example
│
├── backend/
│   ├── server.js              # Express API
│   ├── database.js            # SQLite wrapper
│   ├── webhook.js             # GitHub handler
│   ├── solana.js              # SOL transfers
│   ├── test.js                # Test utilities
│   ├── package.json
│   └── .env.example
│
├── Documentation/
│   ├── START-HERE.md          # 👈 Begin here
│   ├── QUICKSTART.md
│   ├── SETUP-WINDOWS.md
│   ├── README.md
│   ├── ARCHITECTURE.md
│   ├── GITHUB-WEBHOOK-SETUP.md
│   ├── BUILD_SUMMARY.md
│   └── INDEX.md (this file)
│
├── .gitignore
├── package.json
└── setup.sh
```

---

## 🎯 Quick Links

| Document | Purpose | Read Time |
|----------|---------|-----------|
| [START-HERE.md](START-HERE.md) | Quick start guide | 10 min |
| [QUICKSTART.md](QUICKSTART.md) | 5-minute setup | 5 min |
| [SETUP-WINDOWS.md](SETUP-WINDOWS.md) | Windows instructions | 15 min |
| [README.md](README.md) | Complete reference | 30 min |
| [ARCHITECTURE.md](ARCHITECTURE.md) | Technical design | 20 min |
| [GITHUB-WEBHOOK-SETUP.md](GITHUB-WEBHOOK-SETUP.md) | Webhook config | 15 min |
| [BUILD_SUMMARY.md](BUILD_SUMMARY.md) | What's built | 10 min |

---

## 💻 Code Files

### Extension (Frontend)
- [extension/manifest.json](extension/manifest.json) - Chrome extension config
- [extension/content.js](extension/content.js) - Injects "Redeem" button into GitHub PRs
- [extension/background.js](extension/background.js) - Handles wallet & messages
- [extension/popup.html](extension/popup.html) - Settings UI HTML
- [extension/popup.js](extension/popup.js) - Wallet connection logic

### Backend (API)
- [backend/server.js](backend/server.js) - Express REST API (6 endpoints)
- [backend/database.js](backend/database.js) - SQLite database wrapper
- [backend/webhook.js](backend/webhook.js) - GitHub webhook parser
- [backend/solana.js](backend/solana.js) - Solana payment handler
- [backend/test.js](backend/test.js) - Test utilities

---

## 🚀 Getting Started Path

### Fastest Route (10 minutes)
1. Read [START-HERE.md](START-HERE.md)
2. Copy credentials to `.env`
3. Run `npm start`
4. Load extension
5. Done!

### Thorough Route (30 minutes)
1. Read [README.md](README.md)
2. Understand each section
3. Follow setup steps
4. Test locally
5. Deploy

### Complete Route (1 hour)
1. Study [ARCHITECTURE.md](ARCHITECTURE.md)
2. Read code comments in `server.js`, `webhook.js`, `solana.js`
3. Understand data flows
4. Customize as needed

---

## 🧪 Testing

After setup:

```bash
# Test 1: Health check
curl http://localhost:3000/health

# Test 2: Send fake webhook
cd backend && node test.js webhook

# Test 3: Real GitHub PR
# Comment "/pay 50" on GitHub PR
```

---

## 🚢 Deployment

```bash
# Vercel (easiest)
vercel deploy

# Heroku
git push heroku main

# Docker
docker build -t github-pay .
```

---

## 📊 What Each Document Covers

### START-HERE.md
- **What**: Fastest way to get running
- **Audience**: Everyone
- **Time**: 10 minutes
- **Contains**: Step-by-step commands

### QUICKSTART.md
- **What**: 5-minute MVP setup
- **Audience**: Experienced developers
- **Time**: 5 minutes
- **Contains**: Commands only, minimal explanation

### SETUP-WINDOWS.md
- **What**: Windows-specific setup
- **Audience**: Windows users
- **Time**: 15 minutes
- **Contains**: Detailed Windows instructions

### README.md
- **What**: Complete documentation
- **Audience**: All levels
- **Time**: 30 minutes
- **Contains**: Everything (setup, API, troubleshooting)

### ARCHITECTURE.md
- **What**: Technical deep dive
- **Audience**: Developers, judges
- **Time**: 20 minutes
- **Contains**: System design, data flows, security

### GITHUB-WEBHOOK-SETUP.md
- **What**: GitHub webhook configuration
- **Audience**: Anyone setting up GitHub integration
- **Time**: 15 minutes
- **Contains**: App creation, webhook setup, testing

### BUILD_SUMMARY.md
- **What**: Overview of what's built
- **Audience**: Project overview
- **Time**: 10 minutes
- **Contains**: Feature list, file structure, status

---

## 🎯 By Use Case

### "I want to demo this to judges"
→ [QUICKSTART.md](QUICKSTART.md) → [ARCHITECTURE.md](ARCHITECTURE.md)

### "I want to understand everything"
→ [START-HERE.md](START-HERE.md) → [README.md](README.md) → [ARCHITECTURE.md](ARCHITECTURE.md)

### "I want to deploy it"
→ [QUICKSTART.md](QUICKSTART.md) → [README.md](README.md#production-deployment)

### "I want to customize it"
→ [ARCHITECTURE.md](ARCHITECTURE.md) → Read code files

### "I want to fix an issue"
→ [README.md](README.md#troubleshooting) → Check logs

### "I'm on Windows"
→ [SETUP-WINDOWS.md](SETUP-WINDOWS.md)

---

## 🔑 Key Concepts

**`/pay 50` Command**
- Maintainer types in PR comment
- Backend hears via GitHub webhook
- Creates pending reward
- Bot confirms with comment

**Redeem Button**
- Appears on PR via content script
- Only visible to contributor
- Calls backend API
- Triggers Solana transfer

**Solana Escrow**
- Backend-controlled wallet
- Maintainer deposits SOL
- Transfers to contributor on redemption
- Transaction signed & verified

**Database**
- `rewards` - Tracks payments
- `users` - Maps GitHub → Solana wallet
- `maintainers` - Permission tracking

---

## 📈 Stats

- **Total Files**: 17
- **Extension Code**: 5 files (~500 lines)
- **Backend Code**: 5 files (~800 lines)
- **Documentation**: 7 files (~3000 lines)
- **Setup Time**: 10-15 minutes
- **Test Time**: 5 minutes
- **Deploy Time**: 5 minutes

---

## ✅ Pre-Flight Checklist

Before you start:

- [ ] Have Node.js 16+ installed
- [ ] Have Solana keypair (escrow wallet)
- [ ] Have GitHub personal access token
- [ ] Have Phantom wallet installed
- [ ] Have GitHub account
- [ ] Have Chrome browser

---

## 🆘 Help Resources

| Topic | Document |
|-------|----------|
| Setup | [START-HERE.md](START-HERE.md) or [SETUP-WINDOWS.md](SETUP-WINDOWS.md) |
| Errors | [README.md#troubleshooting](README.md#troubleshooting) |
| API | [README.md#api-endpoints](README.md#api-endpoints) |
| Design | [ARCHITECTURE.md](ARCHITECTURE.md) |
| GitHub | [GITHUB-WEBHOOK-SETUP.md](GITHUB-WEBHOOK-SETUP.md) |
| Deploy | [README.md#production-deployment](README.md#production-deployment) |

---

## 🎉 Ready?

### Choose your path:

**🏃 Fast Track (10 min)**
→ [START-HERE.md](START-HERE.md)

**⚡ Speed Run (5 min)**
→ [QUICKSTART.md](QUICKSTART.md)

**🪟 Windows Path**
→ [SETUP-WINDOWS.md](SETUP-WINDOWS.md)

**🧠 Deep Dive**
→ [README.md](README.md)

---

## 📞 Questions?

All documents have troubleshooting sections. Check the relevant guide for your situation.

---

**Happy building! 🚀**

*GitHub Pay v0.1.0 - Solana Hackathon 2026*
