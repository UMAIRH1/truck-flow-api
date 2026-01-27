# Seed Endpoint - Quick Setup

## Overview
A simple public endpoint to seed the manager account. Just visit the URL in your browser!

## Endpoint

```
GET /seed
```

**No authentication required** - Public endpoint for easy deployment setup.

## Usage

### Local Development
```
http://localhost:5000/seed
```

### Production
```
https://your-backend-url.com/seed
```

Just open this URL in your browser after deployment!

## Response

### If Manager Created
```json
{
  "success": true,
  "message": "Manager account created successfully!",
  "credentials": {
    "email": "manager@truckflow.com",
    "password": "manager123",
    "warning": "⚠️ Change this password after first login!"
  },
  "manager": {
    "id": "507f1f77bcf86cd799439011",
    "name": "Admin Manager",
    "email": "manager@truckflow.com",
    "role": "manager"
  }
}
```

### If Manager Already Exists
```json
{
  "success": true,
  "message": "Manager account already exists",
  "credentials": {
    "email": "manager@truckflow.com",
    "password": "manager123",
    "note": "Use these credentials to login"
  }
}
```

### If Error
```json
{
  "success": false,
  "message": "Failed to seed manager account",
  "error": "Error details here"
}
```

## Deployment Steps

1. **Deploy your backend** to any platform (Render, Railway, Heroku, etc.)

2. **Get your backend URL** (e.g., `https://truckflow-backend.onrender.com`)

3. **Visit the seed endpoint** in your browser:
   ```
   https://truckflow-backend.onrender.com/seed
   ```

4. **See the response** with manager credentials

5. **Login to your frontend** with:
   - Email: `manager@truckflow.com`
   - Password: `manager123`

6. **Change the password** immediately!

## Testing

### Test Locally

1. Start your backend:
   ```bash
   cd truckflow-backend
   npm start
   ```

2. Open browser and visit:
   ```
   http://localhost:5000/seed
   ```

3. You should see the success response with credentials

4. Try logging in at:
   ```
   http://localhost:3000/auth/signin
   ```

### Test in Production

1. After deployment, visit:
   ```
   https://your-backend-url.com/seed
   ```

2. Check the response for credentials

3. Login at your frontend URL

## Security Notes

⚠️ **This is a temporary solution for easy deployment**

**Important**:
- This endpoint is PUBLIC (no authentication)
- Anyone can access it
- It's safe because it only creates if manager doesn't exist
- **Remove this endpoint** after initial setup if security is a concern

**To Remove Later**:
1. Delete `src/routes/seedRoutes.js`
2. Delete `src/controllers/seedController.js`
3. Remove the route from `src/index.js`:
   ```javascript
   // Remove this line:
   app.use('/seed', seedRoutes);
   ```

## Alternative: Use Script

If you prefer not to use a public endpoint, you can still use:

```bash
npm run seed
```

But this requires SSH access to your server.

## Troubleshooting

### 404 Not Found

**Problem**: `/seed` returns 404

**Solution**: 
- Check if backend is running
- Verify the route is registered in `src/index.js`
- Check deployment logs

### 500 Server Error

**Problem**: Seed endpoint returns 500 error

**Solution**:
- Check `MONGO_URI` environment variable
- Verify database connection
- Check server logs for details

### Manager Not Created

**Problem**: Success response but can't login

**Solution**:
- Check database directly
- Verify manager exists: `db.users.findOne({ email: 'manager@truckflow.com' })`
- Try running seed again

## Examples

### Using cURL
```bash
curl https://your-backend-url.com/seed
```

### Using Postman
```
GET https://your-backend-url.com/seed
```

### Using Browser
Just paste the URL in address bar:
```
https://your-backend-url.com/seed
```

## Manager Credentials

After running seed endpoint:

```
Email: manager@truckflow.com
Password: manager123
```

**🔐 Change password after first login!**

## Summary

✅ Simple public endpoint
✅ No authentication needed
✅ Safe to run multiple times
✅ Works in any browser
✅ Perfect for quick deployment setup
✅ Can be removed later

**Quick Start**:
1. Deploy backend
2. Visit: `https://your-url.com/seed`
3. Login with credentials shown
4. Done! 🎉
