# TruckFlow MVP - Development TODO

> Last Updated: January 25, 2026
> Status: **MVP COMPLETE** ✅ (Phases 1-7 Done)

---

## Current State Analysis

### ✅ Already Implemented
- [x] Basic Express server setup
- [x] MongoDB connection (Mongoose)
- [x] User model (manager/driver roles, isActive, preferredLanguage)
- [x] Auth controller (login, getMe, refresh-token, logout)
- [x] Auth routes
- [x] JWT authentication (access + refresh tokens)
- [x] Password hashing (bcryptjs)
- [x] Health check endpoint
- [x] Security middleware (helmet, cors) - properly ordered
- [x] Dev logging (morgan)
- [x] Auth middleware (protect, authorize)
- [x] Seed script for initial manager account

### ❌ Still Missing
- Distance calculation service (optional - not critical)
- i18n (English/Greek)
- Input validation
- Global error handler
- Security enhancements (rate limiting, sanitization, etc.)

---

## Phase 1: Fix Existing Code (Foundation) ✅ COMPLETED

### 1.1 Update User Model
- [x] Change roles from `['shipper', 'driver']` to `['manager', 'driver']`
- [x] Add `isActive` field (Boolean, default: true)
- [x] Add `preferredLanguage` field (enum: 'en', 'el', default: 'en')
- [x] Remove `isVerified` field (not needed for MVP)
- [x] Remove `vehicleDetails` (not in Figma/MVP scope)
- [x] Remove `refreshToken` from model (stateless JWT approach)
- [x] Add proper indexes for performance

### 1.2 Simplify Auth Controller
- [x] Remove OTP verification flow (not in MVP)
- [x] Remove `register` endpoint (managers create drivers, no self-registration)
- [x] Keep only: `login`, `logout`, `refreshToken`
- [x] Add `getMe` endpoint (`GET /api/auth/me`)
- [x] Update login to work with new User model

### 1.3 Create Auth Middleware
- [x] Create `src/middleware/auth.js`
- [x] `protect` - verify JWT token
- [x] `authorize(...roles)` - role-based access control

### 1.4 Fix index.js Middleware Order
- [x] Move `cors()` and `helmet()` BEFORE routes

### 1.5 Cleanup
- [x] Delete `src/models/OTP.js` (not needed)
- [x] Delete `src/utils/sendEmail.js` (not needed for MVP)
- [x] Create `src/scripts/seedManager.js` for initial manager account

---

## Phase 2: Core Models ✅ COMPLETED

### 2.1 Load Model
- [x] Create `src/models/Load.js`
- [x] Fields:
  - `loadNumber` (auto-generated, unique) - Format: LOAD-1001, LOAD-1002...
  - `managerId` (ref: User)
  - `driverId` (ref: User, optional)
  - `origin` { city, postalCode }
  - `destination` { city, postalCode }
  - `distanceKm` (Number)
  - `estimatedDuration` (String)
  - `loadAmount` (Number)
  - `paymentTerms` (enum: 30, 45, 60, 90, 120)
  - `expectedPayoutDate` (Date, auto-calculated from paymentTerms)
  - `status` (enum: pending, accepted, declined, completed)
  - `pod` { imageUrl, uploadedAt }h
  - `createdAt`, `updatedAt`
- [x] Indexes for performance (managerId, driverId, status, loadNumber, createdAt)
- [x] Pre-save hooks for auto-generating loadNumber and expectedPayoutDate

### 2.2 Cleanup (Completed in Phase 1)
- [x] Deleted `src/models/OTP.js` (not needed for MVP)

---

## Phase 3: User Management APIs (Manager Only) ✅ COMPLETED

### 3.1 User Controller
- [x] Create `src/controllers/userController.js`
- [x] `POST /api/users` - Create driver (manager only)
- [x] `GET /api/users` - List all drivers (manager only)
- [x] `GET /api/users/:id` - Get single driver (manager only)
- [x] `PATCH /api/users/:id/status` - Toggle driver active/inactive (manager only)

### 3.2 User Routes
- [x] Create `src/routes/userRoutes.js`
- [x] Apply `protect` and `authorize('manager')` middleware to all routes
- [x] Mount routes in index.js

---

## Phase 4: Load Management APIs ✅ COMPLETED

### 4.1 Load Controller
- [x] Create `src/controllers/loadController.js`
- [x] `POST /api/loads` - Create load (manager only)
  - Auto-generate loadNumber
  - Calculate expectedPayoutDate from paymentTerms
- [x] `GET /api/loads` - List loads
  - Manager: all loads
  - Driver: only assigned loads
  - Optional status filter via query param
- [x] `GET /api/loads/:id` - Get single load
- [x] `DELETE /api/loads/:id` - Delete load (manager only)
- [x] `PATCH /api/loads/:id/assign` - Assign driver to load (manager only)
- [x] `PATCH /api/loads/:id/accept` - Accept load (driver only)
- [x] `PATCH /api/loads/:id/decline` - Decline load (driver only)

### 4.2 Load Routes
- [x] Create `src/routes/loadRoutes.js`
- [x] Apply appropriate middleware per endpoint
- [x] Mount routes in index.js

### 4.3 Pending (Phase 5)
- [x] `POST /api/loads/:id/pod` - Upload POD image (driver only) - Cloudinary setup complete
- [ ] Distance calculation on load creation - needs external API (optional)

---

## Phase 5: External Services

### 5.1 Distance Calculation Service (Optional - Not Critical for MVP)
- [ ] Create `src/services/distanceService.js`
- [ ] Integrate with distance API (Google Maps / OpenRouteService / similar)
- [ ] Input: origin (city/postal), destination (city/postal)
- [ ] Output: { distanceKm, estimatedDuration }
- [ ] Add API key to `.env`

### 5.2 File Upload Service (POD) ✅ COMPLETED
- [x] Install `multer` for file handling
- [x] Install `cloudinary` SDK
- [x] Install `streamifier` for buffer streaming
- [x] Create `src/services/uploadService.js`
- [x] Create `src/config/cloudinary.js`
- [x] Add Cloudinary credentials to `.env`
- [x] Configure upload middleware for images
- [x] Validate file type (images only)
- [x] Validate file size (max 5MB)
- [x] Add POD upload endpoint to loadController

---

## Phase 6: Dashboard APIs ✅ COMPLETED

### 6.1 Dashboard Controller
- [x] Create `src/controllers/dashboardController.js`
- [x] `GET /api/dashboard/manager`
  - Total loads
  - Accepted loads count
  - Completed loads count
  - Pending loads count
  - Declined loads count
  - Total income (sum of loadAmount for completed)
  - Pending payments
- [x] `GET /api/dashboard/driver`
  - Assigned loads count
  - Accepted loads count
  - Completed loads count
  - Declined loads count
  - Total earnings (sum of completed load amounts)
  - Pending earnings

### 6.2 Dashboard Routes
- [x] Create `src/routes/dashboardRoutes.js`
- [x] Mount routes in index.js

---

## Phase 7: Export API ✅ COMPLETED

### 7.1 Export Controller
- [x] Install `exceljs` package
- [x] Create `src/controllers/exportController.js`
- [x] `GET /api/exports/loads` - Export loads to Excel (manager only)
  - Filter by date range (optional query params)
  - Filter by status (optional query param)
  - Include all load fields
  - Styled Excel with headers

### 7.2 Export Routes
- [x] Create `src/routes/exportRoutes.js`
- [x] Mount routes in index.js

---

## Phase 8: Internationalization (i18n) - English & Greek

### 8.1 i18n Setup
- [ ] Install `i18next` and `i18next-http-middleware`
- [ ] Create `src/locales/en.json` (English translations)
- [ ] Create `src/locales/el.json` (Greek translations)
- [ ] Create `src/config/i18n.js` configuration
- [ ] Add i18n middleware to Express app

### 8.2 Translation Structure
- [ ] Error messages (validation, auth, not found, etc.)
- [ ] Success messages (created, updated, deleted, etc.)
- [ ] Email templates (if needed)
- [ ] API response messages

### 8.3 Language Detection
- [ ] Support `Accept-Language` header (primary method)
- [ ] Support `?lang=en` or `?lang=el` query parameter (override)
- [ ] Default to English if not specified

### 8.4 User Language Preference
- [ ] Add `preferredLanguage` field to User model (enum: 'en', 'el')
- [ ] Use user's saved preference when authenticated

---

## Phase 9: Validation & Error Handling

### 9.1 Input Validation
- [ ] Install `express-validator` or `joi`
- [ ] Create validation middleware for all endpoints
- [ ] Validate required fields
- [ ] Validate data types
- [ ] Validate enum values

### 9.2 Global Error Handler
- [ ] Create `src/middleware/errorHandler.js`
- [ ] Centralized error response format (with i18n)
- [ ] Handle Mongoose validation errors
- [ ] Handle duplicate key errors
- [ ] Handle cast errors (invalid ObjectId)

---

## Phase 10: Security & Production Readiness

### 9.1 Security Enhancements
- [ ] Add rate limiting (`express-rate-limit`)
- [ ] Add request sanitization (`express-mongo-sanitize`)
- [ ] Add XSS protection (`xss-clean`)
- [ ] Add HTTP parameter pollution prevention (`hpp`)
- [ ] Secure JWT secrets (use strong random strings)

### 9.2 Environment Configuration
- [ ] Update `.env` with all required variables
- [ ] Create `.env.example` for documentation
- [ ] Add Cloudinary/S3 credentials
- [ ] Add Distance API key

---

## Phase 11: Testing & Documentation

### 10.1 API Testing
- [ ] Create Postman collection
- [ ] Test all 18 endpoints
- [ ] Test on mobile browser (Android + iOS)
- [ ] Test image upload from phone camera

### 10.2 Documentation
- [ ] Create API documentation (README or separate doc)
- [ ] Document all endpoints with request/response examples

---

## Dependencies to Install

```bash
# Required for MVP
npm install multer cloudinary exceljs express-validator express-rate-limit express-mongo-sanitize xss-clean hpp

# Internationalization (i18n)
npm install i18next i18next-http-middleware

# Optional (if using S3 instead of Cloudinary)
npm install @aws-sdk/client-s3
```

---

## API Endpoints Summary (18 Total)

| # | Method | Endpoint | Access | Status |
|---|--------|----------|--------|--------|
| 1 | POST | /api/auth/login | Public | ✅ Done |
| 2 | GET | /api/auth/me | Protected | ✅ Done |
| 3 | POST | /api/users | Manager | ✅ Done |
| 4 | GET | /api/users | Manager | ✅ Done |
| 5 | GET | /api/users/:id | Manager | ✅ Done |
| 6 | PATCH | /api/users/:id/status | Manager | ✅ Done |
| 7 | POST | /api/loads | Manager | ✅ Done |
| 8 | GET | /api/loads | Protected | ✅ Done |
| 9 | GET | /api/loads/:id | Protected | ✅ Done |
| 10 | DELETE | /api/loads/:id | Manager | ✅ Done |
| 11 | PATCH | /api/loads/:id/assign | Manager | ✅ Done |
| 12 | PATCH | /api/loads/:id/accept | Driver | ✅ Done |
| 13 | PATCH | /api/loads/:id/decline | Driver | ✅ Done |
| 14 | POST | /api/loads/:id/pod | Driver | ✅ Done |
| 15 | GET | /api/dashboard/manager | Manager | ✅ Done |
| 16 | GET | /api/dashboard/driver | Driver | ✅ Done |
| 17 | GET | /api/exports/loads | Manager | ✅ Done |
| 18 | GET | /api/health | Public | ✅ Done |

---

## Recommended Development Order

1. **Phase 1** - Fix foundation (User model, auth middleware, index.js)
2. **Phase 2** - Create Load model
3. **Phase 3** - User management APIs
4. **Phase 4** - Load management APIs (without distance/POD first)
5. **Phase 5** - Integrate distance service & file upload
6. **Phase 6** - Dashboard APIs
7. **Phase 7** - Export API
8. **Phase 8** - Internationalization (i18n) - English & Greek
9. **Phase 9** - Validation & error handling
10. **Phase 10** - Security hardening
11. **Phase 11** - Testing & documentation

---

## Notes & Observations

1. **OTP Flow Not Needed**: The MVP doesn't require email verification. Managers create drivers directly.

2. **Role Mismatch**: Current model uses `shipper/driver`, but MVP needs `manager/driver`.

3. **Middleware Order Bug**: In `index.js`, CORS and Helmet are applied AFTER routes - should be BEFORE.

4. **No Self-Registration**: Drivers don't register themselves. Managers create driver accounts.

5. **Distance API**: Consider free options like OpenRouteService if Google Maps is too expensive.

6. **Mobile-First**: All APIs must be tested on actual mobile browsers before deployment.

---

## Questions to Clarify

- [ ] Which distance API to use? (Google Maps / OpenRouteService / other)
- [ ] Cloudinary or AWS S3 for POD images?
- [ ] Is there a seed manager account, or should we create one via script?
- [ ] Any specific Excel format requirements for export?

---

*Mark items as [x] when completed. Update status in API table.*
