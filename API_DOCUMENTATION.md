# TruckFlow API Documentation

Base URL: `http://localhost:5000`

---

## Authentication

All protected endpoints require a Bearer token in the Authorization header:
```
Authorization: Bearer <your_token_here>
```

---

## 1. Auth Endpoints

### 1.1 Login
```http
POST /api/auth/login
```

**Body:**
```json
{
  "email": "manager@truckflow.com",
  "password": "manager123"
}
```

**Response:**
```json
{
  "success": true,
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "507f1f77bcf86cd799439011",
    "name": "Admin Manager",
    "email": "manager@truckflow.com",
    "phone": "+30 210 1234567",
    "role": "manager",
    "preferredLanguage": "en"
  }
}
```

---

### 1.2 Get Current User
```http
GET /api/auth/me
```

**Headers:**
```
Authorization: Bearer <token>
```

**Response:**
```json
{
  "success": true,
  "user": {
    "id": "507f1f77bcf86cd799439011",
    "name": "Admin Manager",
    "email": "manager@truckflow.com",
    "phone": "+30 210 1234567",
    "role": "manager",
    "preferredLanguage": "en",
    "createdAt": "2026-01-16T10:00:00.000Z"
  }
}
```

---

### 1.3 Refresh Token
```http
POST /api/auth/refresh-token
```

**Body:**
```json
{
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

**Response:**
```json
{
  "success": true,
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

---

### 1.4 Logout
```http
POST /api/auth/logout
```

**Response:**
```json
{
  "success": true,
  "message": "Logged out successfully"
}
```

---

## 2. User Management (Manager Only)

### 2.1 Create Driver
```http
POST /api/users
```

**Headers:**
```
Authorization: Bearer <manager_token>
Content-Type: application/json
```

**Body:**
```json
{
  "name": "John Driver",
  "email": "john@truckflow.com",
  "password": "driver123",
  "phone": "+30 210 9876543",
  "preferredLanguage": "el"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Driver created successfully",
  "driver": {
    "id": "507f1f77bcf86cd799439012",
    "name": "John Driver",
    "email": "john@truckflow.com",
    "phone": "+30 210 9876543",
    "role": "driver",
    "isActive": true,
    "preferredLanguage": "el",
    "createdAt": "2026-01-16T11:00:00.000Z"
  }
}
```

---

### 2.2 Get All Drivers
```http
GET /api/users
```

**Headers:**
```
Authorization: Bearer <manager_token>
```

**Response:**
```json
{
  "success": true,
  "count": 2,
  "drivers": [
    {
      "id": "507f1f77bcf86cd799439012",
      "name": "John Driver",
      "email": "john@truckflow.com",
      "phone": "+30 210 9876543",
      "role": "driver",
      "isActive": true,
      "preferredLanguage": "el",
      "createdAt": "2026-01-16T11:00:00.000Z"
    }
  ]
}
```

---

### 2.3 Get Single Driver
```http
GET /api/users/:id
```

**Headers:**
```
Authorization: Bearer <manager_token>
```

---

### 2.4 Toggle Driver Status
```http
PATCH /api/users/:id/status
```

**Headers:**
```
Authorization: Bearer <manager_token>
```

**Response:**
```json
{
  "success": true,
  "message": "Driver deactivated successfully",
  "driver": {
    "id": "507f1f77bcf86cd799439012",
    "name": "John Driver",
    "email": "john@truckflow.com",
    "isActive": false
  }
}
```

---

## 3. Load Management

### 3.1 Create Load (Manager Only)
```http
POST /api/loads
```

**Headers:**
```
Authorization: Bearer <manager_token>
Content-Type: application/json
```

**Body:**
```json
{
  "origin": {
    "city": "Athens",
    "postalCode": "10431"
  },
  "destination": {
    "city": "Thessaloniki",
    "postalCode": "54624"
  },
  "loadAmount": 2500,
  "paymentTerms": 30
}
```

**Response:**
```json
{
  "success": true,
  "message": "Load created successfully",
  "load": {
    "loadNumber": "LOAD-1001",
    "managerId": "507f1f77bcf86cd799439011",
    "origin": {
      "city": "Athens",
      "postalCode": "10431"
    },
    "destination": {
      "city": "Thessaloniki",
      "postalCode": "54624"
    },
    "loadAmount": 2500,
    "paymentTerms": 30,
    "expectedPayoutDate": "2026-02-15T00:00:00.000Z",
    "status": "pending",
    "createdAt": "2026-01-16T12:00:00.000Z"
  }
}
```

---

### 3.2 Get All Loads
```http
GET /api/loads
GET /api/loads?status=pending
```

**Headers:**
```
Authorization: Bearer <token>
```

**Note:** Manager sees all loads, Driver sees only assigned loads.

---

### 3.3 Get Single Load
```http
GET /api/loads/:id
```

**Headers:**
```
Authorization: Bearer <token>
```

---

### 3.4 Delete Load (Manager Only)
```http
DELETE /api/loads/:id
```

**Headers:**
```
Authorization: Bearer <manager_token>
```

---

### 3.5 Assign Driver to Load (Manager Only)
```http
PATCH /api/loads/:id/assign
```

**Headers:**
```
Authorization: Bearer <manager_token>
Content-Type: application/json
```

**Body:**
```json
{
  "driverId": "507f1f77bcf86cd799439012"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Driver assigned successfully",
  "load": {
    "loadNumber": "LOAD-1001",
    "driverId": {
      "id": "507f1f77bcf86cd799439012",
      "name": "John Driver",
      "email": "john@truckflow.com",
      "phone": "+30 210 9876543"
    },
    "status": "pending"
  }
}
```

---

### 3.6 Accept Load (Driver Only)
```http
PATCH /api/loads/:id/accept
```

**Headers:**
```
Authorization: Bearer <driver_token>
```

**Response:**
```json
{
  "success": true,
  "message": "Load accepted successfully",
  "load": {
    "loadNumber": "LOAD-1001",
    "status": "accepted"
  }
}
```

---

### 3.7 Decline Load (Driver Only)
```http
PATCH /api/loads/:id/decline
```

**Headers:**
```
Authorization: Bearer <driver_token>
```

**Response:**
```json
{
  "success": true,
  "message": "Load declined",
  "load": {
    "loadNumber": "LOAD-1001",
    "status": "declined"
  }
}
```

---

### 3.8 Upload POD (Driver Only)
```http
POST /api/loads/:id/pod
```

**Headers:**
```
Authorization: Bearer <driver_token>
Content-Type: multipart/form-data
```

**Body (form-data):**
```
image: <file>
```

**Response:**
```json
{
  "success": true,
  "message": "POD uploaded successfully. Load marked as completed.",
  "load": {
    "loadNumber": "LOAD-1001",
    "status": "completed",
    "pod": {
      "imageUrl": "https://res.cloudinary.com/...",
      "uploadedAt": "2026-01-16T15:00:00.000Z"
    }
  }
}
```

---

## 4. Dashboard

### 4.1 Manager Dashboard
```http
GET /api/dashboard/manager
```

**Headers:**
```
Authorization: Bearer <manager_token>
```

**Response:**
```json
{
  "success": true,
  "dashboard": {
    "totalLoads": 10,
    "acceptedLoads": 5,
    "completedLoads": 3,
    "pendingLoads": 2,
    "declinedLoads": 0,
    "totalIncome": 7500,
    "pendingPayments": 12500
  }
}
```

---

### 4.2 Driver Dashboard
```http
GET /api/dashboard/driver
```

**Headers:**
```
Authorization: Bearer <driver_token>
```

**Response:**
```json
{
  "success": true,
  "dashboard": {
    "assignedLoads": 2,
    "acceptedLoads": 3,
    "completedLoads": 5,
    "declinedLoads": 1,
    "totalEarnings": 12500,
    "pendingEarnings": 7500
  }
}
```

---

## 5. Export

### 5.1 Export Loads to Excel (Manager Only)
```http
GET /api/exports/loads
GET /api/exports/loads?status=completed
GET /api/exports/loads?startDate=2026-01-01&endDate=2026-01-31
GET /api/exports/loads?status=completed&startDate=2026-01-01
```

**Headers:**
```
Authorization: Bearer <manager_token>
```

**Query Parameters:**
- `status` (optional): Filter by load status (pending, accepted, declined, completed)
- `startDate` (optional): Filter loads created after this date (YYYY-MM-DD)
- `endDate` (optional): Filter loads created before this date (YYYY-MM-DD)

**Response:** Excel file download

---

## 6. Health Check

### 6.1 Server Health
```http
GET /api/health
```

**Response:**
```json
{
  "success": true,
  "message": "Server is healthy",
  "timestamp": "2026-01-16T12:00:00.000Z"
}
```

---

## Error Responses

All endpoints return errors in this format:

```json
{
  "success": false,
  "message": "Error description here"
}
```

**Common HTTP Status Codes:**
- `200` - Success
- `201` - Created
- `400` - Bad Request (validation error)
- `401` - Unauthorized (missing/invalid token)
- `403` - Forbidden (insufficient permissions)
- `404` - Not Found
- `500` - Server Error

---

## Setup Instructions

1. **Install dependencies:**
```bash
npm install
```

2. **Configure environment variables:**
Copy `.env.example` to `.env` and fill in:
- MongoDB URI
- JWT secrets
- Cloudinary credentials (sign up at https://cloudinary.com)

3. **Seed manager account:**
```bash
node src/scripts/seedManager.js
```

4. **Start server:**
```bash
npm run dev
```

---

## Testing with Postman

1. Import this documentation or create requests manually
2. Login as manager to get token
3. Use token in Authorization header for protected routes
4. Create a driver account
5. Login as driver to test driver endpoints
6. Test the complete flow: create load → assign driver → accept → upload POD

---

## Notes

- All dates are in ISO 8601 format
- File uploads use `multipart/form-data`
- Maximum image size: 5MB
- Supported image formats: jpg, jpeg, png, gif, webp
- Load numbers are auto-generated (LOAD-1001, LOAD-1002, etc.)
- Expected payout date is auto-calculated from payment terms
