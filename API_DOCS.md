# GPT Earn - API Documentation

## 🔐 Authentication

All authenticated endpoints require JWT token in header:
```
Authorization: Bearer <token>
```

---

## 📍 Base URL
```
http://localhost:5000/api
```

---

## 👤 Auth Endpoints

### Register
```http
POST /auth/register
```
**Body:**
```json
{
  "username": "john_doe",
  "email": "john@example.com",
  "password": "password123",
  "referralCode": "ABC123" // optional
}
```

### Login
```http
POST /auth/login
```
**Body:**
```json
{
  "email": "john@example.com",
  "password": "password123"
}
```
**Response:**
```json
{
  "token": "eyJhbGc...",
  "user": {
    "id": 1,
    "username": "john_doe",
    "email": "john@example.com",
    "balance": "0.00"
  }
}
```

---

## 📊 Dashboard

### Get Dashboard Data
```http
GET /dashboard
Authorization: Bearer <token>
```
**Response:**
```json
{
  "balance": 25.50,
  "pendingBalance": 5.00,
  "totalEarned": 150.00,
  "todayEarned": 3.25,
  "isVIP": true,
  "availableTasks": 10,
  "completedToday": 5,
  "referralCount": 12
}
```

---

## ✅ Tasks

### Get Available Tasks
```http
GET /tasks/available
Authorization: Bearer <token>
```

### Submit Task Answer
```http
POST /tasks/:id/submit
Authorization: Bearer <token>
```
**Body:**
```json
{
  "answer": "user answer here"
}
```

---

## 💰 Withdrawals

### Get Withdrawal Info
```http
GET /withdrawals/info
Authorization: Bearer <token>
```

### Request Withdrawal
```http
POST /withdrawals/request
Authorization: Bearer <token>
```
**Body:**
```json
{
  "amount": 10.00,
  "paymentMethod": "jazzcash",
  "paymentDetails": {
    "accountNumber": "03001234567"
  }
}
```

---

## 👥 Referrals

### Get Referral Stats
```http
GET /referrals/stats
Authorization: Bearer <token>
```

---

## 🎁 Offerwalls

### Get Available Offerwalls
```http
GET /offerwalls
Authorization: Bearer <token>
```

### Get Offerwall URL
```http
GET /offerwalls/:network/url
Authorization: Bearer <token>
```

---

## 🔔 Postback (Server-to-Server)

### Offerwall Postback
```http
GET /postback/:network
```
**Query Parameters vary by network**

Example (AdGate):
```
/postback/adgate?user_id=123&points=0.50&tx_id=abc123&signature=hash
```

---

## 🛡️ Admin Endpoints

All admin endpoints require admin authentication.

### Admin Login
```http
POST /admin/login
```

### Get Users
```http
GET /admin/users
Authorization: Bearer <admin_token>
```

### Manage Tasks
```http
GET /admin/tasks
POST /admin/tasks
PUT /admin/tasks/:id
DELETE /admin/tasks/:id
```

### Process Withdrawals
```http
GET /admin/withdrawals
PUT /admin/withdrawals/:id/approve
PUT /admin/withdrawals/:id/reject
```

---

## ❌ Error Responses

```json
{
  "error": "Error message here"
}
```

**Status Codes:**
- `400` - Bad Request
- `401` - Unauthorized
- `403` - Forbidden
- `404` - Not Found
- `500` - Server Error

---

## 📝 Rate Limits

- Auth endpoints: 5 requests/minute
- API endpoints: 100 requests/minute
- Postbacks: No limit (server-to-server)
