# 🌐 GPT Earn - InfinityFree Hosting Guide

## ⚠️ IMPORTANT: InfinityFree Limitations

**InfinityFree does NOT support Node.js!**

InfinityFree only supports PHP. Your backend (Node.js) won't work there.

### Solution: Use Split Hosting

| Component | Host On | Cost |
|-----------|---------|------|
| **Frontend** | InfinityFree | FREE |
| **Backend** | Render.com | FREE |
| **Database** | InfinityFree MySQL | FREE |

---

## 📋 Step-by-Step Hosting Setup

### Step 1: Host Backend on Render.com (FREE)

1. Go to https://render.com
2. Sign up with GitHub or email
3. Click "New" → "Web Service"
4. Connect your GitHub or upload files
5. Settings:
   - Name: `gpt-earn-api`
   - Runtime: `Node`
   - Build Command: `npm install`
   - Start Command: `node server.js`
6. Add Environment Variables (from .env file)
7. Click "Create Web Service"
8. Wait for deployment
9. Copy your URL: `https://gpt-earn-api.onrender.com`

### Step 2: Setup InfinityFree Account

1. Go to https://infinityfree.com
2. Create account
3. Create new hosting account
4. Note your:
   - Username: `if0_xxxxxxx`
   - Domain: `yoursite.infinityfreeapp.com`

### Step 3: Create MySQL Database on InfinityFree

1. In InfinityFree panel → MySQL Databases
2. Create new database
3. Note your:
   - Host: `sql.infinityfree.com`
   - Database: `if0_xxxxxxx_gptEarn`
   - Username: `if0_xxxxxxx`
   - Password: (your password)

### Step 4: Import Database Schema

1. Go to phpMyAdmin (from InfinityFree panel)
2. Select your database
3. Click "Import"
4. Upload `database/schema.sql`
5. Click "Go"

### Step 5: Update Backend Environment

In Render.com, update environment variables:
```
DB_HOST=sql.infinityfree.com
DB_USER=if0_xxxxxxx
DB_PASSWORD=your_password
DB_NAME=if0_xxxxxxx_gptEarn
```

### Step 6: Build Frontend for Production

```bash
cd hosting/frontend
npm install
npm run build
```

### Step 7: Export Frontend as Static

Add to `next.config.js`:
```js
module.exports = {
  output: 'export',
  images: { unoptimized: true }
}
```

Then run:
```bash
npm run build
```

This creates an `out` folder.

### Step 8: Upload Frontend to InfinityFree

1. In InfinityFree → File Manager
2. Go to `htdocs` folder
3. Upload ALL files from `out` folder
4. Done!

---

## 🔗 Update API URL

Before building frontend, update `.env.local`:
```
NEXT_PUBLIC_API_URL=https://gpt-earn-api.onrender.com/api
```

---

## 🧪 Test Your Site

1. Visit: `https://yoursite.infinityfreeapp.com`
2. Try registering a new account
3. Try the admin login
4. Check if tasks load

---

## ❓ Troubleshooting

| Problem | Solution |
|---------|----------|
| Database connection error | Check InfinityFree MySQL credentials |
| CORS error | Add your domain to backend CORS |
| 404 errors | Upload `404.html` to htdocs |
| API not working | Check Render.com logs |

---

## 🆓 Free Hosting Alternatives

| Service | Backend | Frontend | Database |
|---------|---------|----------|----------|
| Render.com | ✅ FREE | ✅ FREE | ❌ |
| Railway.app | ✅ FREE | ✅ FREE | ✅ FREE |
| Vercel | ❌ | ✅ FREE | ❌ |
| Netlify | ❌ | ✅ FREE | ❌ |
| PlanetScale | ❌ | ❌ | ✅ FREE |

---

## 💡 Recommended: All-in-One with Railway

For easier setup, use Railway.app for everything:
1. Go to https://railway.app
2. Deploy backend + MySQL in one click
3. Free tier: 500 hours/month

---

Good luck with your deployment! 🚀
