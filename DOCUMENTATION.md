# GPT Earn - Installation & Setup Guide

## 📋 Requirements

- **Node.js** 18+ 
- **MySQL** 8.0+
- **npm** or **yarn**

---

## 🚀 Quick Start (5 Minutes)

### Step 1: Extract Files
```bash
unzip gpt-earn.zip
cd gpt-earn
```

### Step 2: Setup Backend
```bash
cd backend
cp .env.example .env
npm install
```

### Step 3: Configure Database
Edit `backend/.env`:
```env
DB_HOST=localhost
DB_USER=your_mysql_user
DB_PASSWORD=your_mysql_password
DB_NAME=gpt_earn
JWT_SECRET=your-secret-key-here
```

### Step 4: Create Database
```sql
CREATE DATABASE gpt_earn;
```

Then run migrations:
```bash
node run-migration.js
```

### Step 5: Setup Frontend
```bash
cd ../frontend
cp .env.example .env.local
npm install
```

Edit `frontend/.env.local`:
```env
NEXT_PUBLIC_API_URL=http://localhost:5000/api
```

### Step 6: Start the Application
Terminal 1 (Backend):
```bash
cd backend
node server.js
```

Terminal 2 (Frontend):
```bash
cd frontend
npm run dev
```

Visit: `http://localhost:3000`

---

## ⚙️ Configuration

### Environment Variables

| Variable | Description | Example |
|----------|-------------|---------|
| `DB_HOST` | MySQL host | `localhost` |
| `DB_USER` | MySQL username | `root` |
| `DB_PASSWORD` | MySQL password | `password123` |
| `DB_NAME` | Database name | `gpt_earn` |
| `JWT_SECRET` | Secret for tokens | `random-string` |
| `PORT` | Backend port | `5000` |

### Admin Account
Default admin credentials:
- **Email:** `admin@gpt-earn.com`
- **Password:** `admin123`

⚠️ **Change this immediately after installation!**

---

## 🌐 Production Deployment

### Option 1: VPS (DigitalOcean, Linode)
1. Install Node.js 18+, MySQL, Nginx
2. Clone your files to `/var/www/gpt-earn`
3. Configure Nginx as reverse proxy
4. Use PM2 for process management
5. Setup SSL with Let's Encrypt

### Option 2: Vercel + Railway
- **Frontend:** Deploy to Vercel
- **Backend:** Deploy to Railway
- **Database:** Use PlanetScale or Railway MySQL

---

## 🔧 Offerwall Setup

### Step 1: Get API Keys
Sign up as publisher on:
- AdGate Media
- CPX Research
- OfferToro
- Lootably
- TimeWall

### Step 2: Configure in Admin Panel
1. Go to `/admin/offerwalls`
2. Edit each network
3. Paste your secret key
4. Save

### Step 3: Set Postback URLs
In each offerwall dashboard, set postback URL:
```
https://yourdomain.com/postback/{network}
```

---

## 📞 Support

- Email: your-email@example.com
- Documentation: /docs
- Video Tutorial: [Link]

---

## 📄 License

Regular License: Single site use
Extended License: Multiple sites + resale

© 2024 GPT Earn. All rights reserved.
