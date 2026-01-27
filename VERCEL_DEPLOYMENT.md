# Vercel Deployment Guide for TruckFlow Backend

## Important: Vercel is Serverless

Vercel runs your backend as **serverless functions**, which means:
- ❌ No persistent server process
- ❌ No "server start" event
- ❌ Auto-seed script won't run automatically
- ✅ Each API request runs in isolation

## Solution: Manual Seed Endpoint

We've created a special API endpoint for seeding on Vercel.

## Deployment Steps

### 1. Deploy to Vercel

```bash
cd truckflow-backend
vercel
```

Or connect via Vercel Dashboard:
1. Go to https://vercel.com
2. Import your GitHub repository
3. Select `truckflow-backend` folder
4. Deploy

### 2. Set Environment Variables

In Vercel Dashboard, add these environment variables:

**Required:**
```
MONGO_URI=mongodb+srv://user:pass@cluster.mongodb.net/dbname
JWT_SECRET=your-super-secret-key-min-32-chars
FRONTEND_URL=https://your-frontend-url.vercel.app
NODE_ENV=production
```

**For Seed Endpoint:**
```
SEED_SECRET=your-random-secret-for-seeding
```

Generate a random secret:
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

### 3. Redeploy

After adding environment variables:
1. Go to Deployments tab
2. Click "Redeploy" on latest deployment
3. Wait for deployment to complete

### 4. Run Seed Endpoint

**Option A: Using cURL**

```bash
curl -X POST https://your-backend.vercel.app/api/seed \
  -H "Content-Type: application/json" \
  -d '{"secret":"your-seed-secret-here"}'
```

**Option B: Using Postman**

```
POST https://your-backend.vercel.app/api/seed
Content-Type: application/json

Body:
{
  "secret": "your-seed-secret-here"
}
```

**Option C: Using JavaScript**

```javascript
fetch('https://your-backend.vercel.app/api/seed', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    secret: 'your-seed-secret-here'
  })
})
.then(res => res.json())
.then(data => console.log(data));
```

### 5. Verify Response

**Success (Manager Created):**
```json
{
  "success": true,
  "message": "Manager account created successfully",
  "credentials": {
    "email": "manager@truckflow.com",
    "password": "manager123"
  },
  "warning": "Change the password after first login!"
}
```

**Success (Already Exists):**
```json
{
  "success": true,
  "message": "Manager account already exists",
  "credentials": {
    "email": "manager@truckflow.com",
    "password": "manager123"
  }
}
```

**Error (Wrong Secret):**
```json
{
  "success": false,
  "message": "Unauthorized. Invalid secret."
}
```

### 6. Test Login

Go to your frontend and login with:
```
Email: manager@truckflow.com
Password: manager123
```

## Complete Setup Checklist

- [ ] Backend deployed to Vercel
- [ ] Environment variables added (MONGO_URI, JWT_SECRET, FRONTEND_URL, SEED_SECRET)
- [ ] Redeployed after adding env vars
- [ ] Seed endpoint called successfully
- [ ] Manager account created in database
- [ ] Login tested and working
- [ ] Password changed after first login

## Vercel-Specific Configuration

### vercel.json

```json
{
  "version": 2,
  "builds": [
    {
      "src": "src/index.js",
      "use": "@vercel/node"
    },
    {
      "src": "api/seed.js",
      "use": "@vercel/node"
    }
  ],
  "routes": [
    {
      "src": "/api/seed",
      "dest": "api/seed.js"
    },
    {
      "src": "/(.*)",
      "dest": "src/index.js"
    }
  ]
}
```

### File Structure

```
truckflow-backend/
├── api/
│   └── seed.js          ← Serverless seed function
├── src/
│   ├── index.js         ← Main API
│   └── ...
├── vercel.json          ← Vercel configuration
└── package.json
```

## Security Notes

### Protect the Seed Endpoint

1. **Use Strong Secret**
   - Generate random 32+ character string
   - Store in Vercel environment variables
   - Never commit to repository

2. **Delete After Use** (Optional)
   - After seeding, you can remove the endpoint
   - Delete `api/seed.js`
   - Remove from `vercel.json`
   - Redeploy

3. **Rate Limiting**
   - Vercel has built-in rate limiting
   - Seed endpoint is protected by secret
   - Only accessible with correct secret

## Troubleshooting

### Seed Endpoint Returns 404

**Problem**: `/api/seed` not found

**Solution**:
1. Check `vercel.json` has correct routes
2. Verify `api/seed.js` exists
3. Redeploy: `vercel --prod`

### Unauthorized Error

**Problem**: "Invalid secret"

**Solution**:
1. Check `SEED_SECRET` in Vercel env vars
2. Verify secret in request body matches
3. No extra spaces or quotes

### MongoDB Connection Error

**Problem**: "Failed to connect to MongoDB"

**Solution**:
1. Check `MONGO_URI` is set correctly
2. Verify MongoDB Atlas IP whitelist (allow all: 0.0.0.0/0)
3. Check database user permissions
4. Test connection string manually

### Manager Not Created

**Problem**: Seed succeeds but manager not in database

**Solution**:
1. Check MongoDB connection
2. Verify database name in connection string
3. Check for duplicate email errors
4. Look at Vercel function logs

## Alternative: One-Time Setup Script

If you prefer not to expose a seed endpoint, run this locally once:

```bash
# Set environment variables
export MONGO_URI=your_production_mongodb_uri

# Run seed script
node seed.js

# Verify in database
mongo your_production_mongodb_uri
> db.users.findOne({ email: 'manager@truckflow.com' })
```

## Vercel Function Logs

To check seed execution:

1. Go to Vercel Dashboard
2. Select your project
3. Go to "Functions" tab
4. Click on `/api/seed`
5. View logs

## Environment Variables Reference

| Variable | Required | Description | Example |
|----------|----------|-------------|---------|
| `MONGO_URI` | Yes | MongoDB connection string | `mongodb+srv://...` |
| `JWT_SECRET` | Yes | Secret for JWT tokens | `random-32-char-string` |
| `FRONTEND_URL` | Yes | Frontend URL for CORS | `https://app.vercel.app` |
| `SEED_SECRET` | Yes | Secret for seed endpoint | `random-32-char-string` |
| `NODE_ENV` | No | Environment | `production` |

## Limitations on Vercel

### What Works ✅
- All API endpoints
- Authentication
- Database operations
- File uploads (base64)
- JWT tokens

### What Doesn't Work ❌
- WebSocket (Socket.io) - Use Vercel's WebSocket support or deploy WS separately
- Long-running processes
- Persistent connections
- Auto-seed on startup

### WebSocket Alternative

For WebSocket notifications on Vercel:

**Option 1**: Deploy WebSocket server separately
- Use Railway, Render, or Heroku for WebSocket
- Keep REST API on Vercel
- Frontend connects to both

**Option 2**: Use Vercel's WebSocket support (Beta)
- Enable in Vercel dashboard
- Update Socket.io configuration
- May have limitations

**Option 3**: Use polling instead
- Frontend polls `/api/notifications` every 30s
- Less real-time but works on Vercel
- No WebSocket needed

## Recommended: Hybrid Deployment

For best results with TruckFlow:

1. **Vercel**: REST API endpoints
2. **Railway/Render**: WebSocket server
3. **Frontend**: Connect to both

This gives you:
- ✅ Serverless scaling for API
- ✅ Real-time WebSocket notifications
- ✅ Best of both worlds

## Summary

### Vercel Deployment Steps:

1. ✅ Deploy backend to Vercel
2. ✅ Add environment variables (including SEED_SECRET)
3. ✅ Redeploy
4. ✅ Call `/api/seed` endpoint with secret
5. ✅ Verify manager account created
6. ✅ Test login
7. ✅ Change password

### Manager Credentials:

```
Email: manager@truckflow.com
Password: manager123
```

### Seed Endpoint:

```
POST https://your-backend.vercel.app/api/seed
Body: { "secret": "your-seed-secret" }
```

**Remember**: Vercel is serverless, so manual seeding is required!
