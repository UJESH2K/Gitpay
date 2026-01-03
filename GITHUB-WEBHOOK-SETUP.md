# GitHub Pay - GitHub App & Webhook Setup

This guide explains how to set up the GitHub App and webhooks for GitHub Pay.

## 🎯 What You'll Create

1. **GitHub App** - Application that can read PRs and comments
2. **Webhook** - Notification system that sends `/pay` commands to your backend
3. **Permissions** - Scopes that let the app verify maintainers

---

## 📋 Step 1: Create GitHub App

### 1.1 Create App

1. Go to: https://github.com/settings/apps/new
2. Fill in the form:

| Field | Value |
|-------|-------|
| App name | `GitHub-Pay` (or your preferred name) |
| Description | `Reward contributors with Solana payments` |
| Homepage URL | `http://localhost:3000` (or your backend URL) |
| Webhook URL | `http://localhost:3000/webhook/github` (or backend URL) |
| Webhook active | ✓ Check this |
| Webhook secret | Generate one (copy this) |
| Permissions | See section 1.2 |
| Subscribe to events | See section 1.3 |

### 1.2 Required Permissions

Under **Repository permissions**, set:

| Permission | Access | Reason |
|-----------|--------|--------|
| Pull requests | Read-only | Read PR comments |
| Issues | Read-only | Read issue comments |
| Repository metadata | Read-only | Access repo info |
| Members | Read-only | Verify maintainers |

### 1.3 Subscribe to Events

Check these events:

- [ ] Issue comment
- [ ] Pull request
- [ ] Push

Your form should look like:
```
✓ Issue comment
✓ Pull request  
✓ Push
```

### 1.4 Install App

1. Click "Create GitHub App"
2. Go to "Install App" tab
3. Click "Install" next to your GitHub account/org
4. Select repositories where you want /pay to work
5. Authorize

**Save this info:**
```
App ID: <copy this>
Webhook Secret: <copy this>
```

---

## 🔐 Step 2: Generate App Credentials

### 2.1 Get Personal Access Token (for API calls)

1. In app page, go to "About"
2. Copy the **App ID** and **Webhook Secret**
3. Go to: https://github.com/settings/tokens
4. Click "Generate new token (classic)"
5. Select scopes:
   - `repo` (all checkboxes)
   - `admin:repo_hook` (write access)
   - `read:user`
6. Generate and copy the token

### 2.2 Update .env

Edit `backend/.env`:

```env
GITHUB_TOKEN=ghp_xxxxxxxxxxxxxxxxxxxx
GITHUB_WEBHOOK_SECRET=whsec_xxxxxxxxxxxx
GITHUB_APP_ID=12345
```

---

## 🌐 Step 3: Configure Webhook (Local Development)

### 3.1 Problem

GitHub can't send webhooks to `localhost:3000` (private).

### 3.2 Solution: Use ngrok

ngrok exposes localhost to the internet.

```bash
# Install ngrok
# Download from: https://ngrok.com/download

# Run ngrok
ngrok http 3000

# Output:
# Forwarding   https://abc123.ngrok.io -> localhost:3000
```

Copy the URL: `https://abc123.ngrok.io`

### 3.3 Update GitHub App Webhook

1. Go back to: https://github.com/settings/apps
2. Select your GitHub Pay app
3. Click "Webhook"
4. Change **Payload URL** to:
   ```
   https://abc123.ngrok.io/webhook/github
   ```
5. Save

Now webhooks will reach your local backend!

---

## ✅ Step 4: Test Webhook

### 4.1 Test Locally

```bash
# Terminal 1: Start backend
cd backend
npm start

# Terminal 2: Test webhook
cd backend
node test.js webhook
```

### 4.2 Test on Real PR

1. Go to a test GitHub repo you own
2. Create a PR or find an existing one
3. Comment on the PR:
   ```
   /pay 50
   ```
4. Check backend logs - should see:
   ```
   📌 GitHub Webhook received
   📨 Webhook received:
      Repo: owner/repo
      PR: #123
      Command: /pay 50
      By: your-username
      To: contributor
   ✅ Reward created: uuid
   ```
5. GitHub should show a bot comment:
   ```
   💰 Reward Created!
   
   @contributor, you have a pending reward of 50 SOL...
   ```

---

## 🚀 Step 5: Deploy & Production

### 5.1 Production Webhook URL

Once you deploy backend to production:

1. Get your backend URL:
   ```
   https://your-domain.com
   ```

2. Update GitHub App webhook:
   - Payload URL: `https://your-domain.com/webhook/github`
   - Webhook Secret: Keep your secret safe in .env

3. No more ngrok needed!

### 5.2 Deployment Platforms

**Vercel**
```bash
vercel deploy
```

**Heroku**
```bash
git push heroku main
heroku config:set GITHUB_TOKEN=xxx GITHUB_WEBHOOK_SECRET=xxx
```

**AWS Lambda**
- Convert to serverless handler
- Use API Gateway for webhook endpoint

---

## 🔍 Debugging

### Webhook Not Arriving?

1. Check GitHub App is installed on repo
2. Check webhook URL is correct
3. Check firewall allows incoming requests
4. Check backend is running (`npm start`)

### Check Recent Deliveries

1. Go to your GitHub App: https://github.com/settings/apps
2. Select your app
3. Click "Advanced"
4. Scroll to "Recent deliveries"
5. Click a delivery to see:
   - Request payload (what was sent)
   - Response status (what backend returned)

### Enable Webhook Logging

Add to `backend/server.js`:

```javascript
app.post("/webhook/github", (req, res, next) => {
  console.log("Webhook received at:", new Date().toISOString());
  console.log("Body:", JSON.stringify(req.body, null, 2));
  next();
});
```

---

## 📊 Webhook Payload Example

When someone comments `/pay 50` on a PR:

```json
{
  "action": "created",
  "comment": {
    "id": 123456,
    "body": "/pay 50",
    "user": {
      "login": "alice-maintainer",
      "type": "User"
    }
  },
  "issue": {
    "number": 5248,
    "title": "Add feature X",
    "user": {
      "login": "bob-contributor"
    },
    "pull_request": {
      "url": "https://api.github.com/repos/org/repo/pulls/5248"
    }
  },
  "repository": {
    "id": 12345,
    "name": "my-repo",
    "full_name": "org/my-repo",
    "owner": {
      "login": "org"
    }
  }
}
```

Your backend extracts:
- **Maintainer**: `alice-maintainer`
- **Contributor**: `bob-contributor`
- **Repo**: `org/my-repo`
- **PR**: `5248`
- **Amount**: `50` (from comment body)

---

## 🎯 Verification

When maintainer comments `/pay 50`:

1. GitHub sends webhook ✓
2. Backend receives it ✓
3. Parses `/pay 50` ✓
4. Checks if `alice` is maintainer ✓
5. Creates reward in DB ✓
6. Posts bot comment ✓

When contributor opens PR:

1. Extension detects PR page ✓
2. Fetches pending reward ✓
3. Injects "Redeem" button ✓
4. Contributor clicks button ✓
5. SOL transferred to wallet ✓

---

## 🔗 Quick Reference

| Step | URL | What to Do |
|------|-----|-----------|
| Create App | https://github.com/settings/apps/new | Create new app |
| Get Token | https://github.com/settings/tokens | Generate token |
| Manage Apps | https://github.com/settings/apps | View your apps |
| Test Webhook | GitHub App > Advanced > Recent deliveries | See webhook logs |
| Deploy | Vercel/Heroku/AWS | Push backend live |

---

## 🆘 Common Issues

### "Invalid Signature" Error

Your webhook signature is wrong:

```javascript
// In production, verify signature:
const signature = req.headers['x-hub-signature-256'];

// For now (dev), comment this out
// if (!verifySignature(signature, body, secret)) {
//   return res.status(401).json({error: "Invalid"});
// }
```

### "Maintainer not found" Error

The person who commented doesn't have write access:

```
❌ alice is not a maintainer

Only maintainers can use the /pay command.
```

Solution: Add them as a collaborator to the repo.

### Webhook Goes to Old Server

GitHub is still sending to old URL.

Solution: Update webhook in GitHub App settings.

---

## 💡 Tips

1. **Test locally first** with ngrok before deploying
2. **Watch recent deliveries** in GitHub App settings to debug
3. **Check backend logs** for detailed error messages
4. **Use unique webhook secret** for each environment
5. **Never commit .env** with secrets to GitHub

---

You're all set! 🎉 Now contributors can be rewarded instantly.
