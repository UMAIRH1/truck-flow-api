# TruckFlow Backend Deployment Guide

## Auto-Seeding Manager Account

The backend is configured to automatically seed the manager account on deployment. This happens in two ways:

### 1. On Server Start
When you run `npm start`, the system will:
1. Run the seed script (`seed.js`)
2. Check if manager exists
3. Create manager if not exists
4. Start the server

### 2. Manager Account Credentials

**Default Manager Account:**
- **Email**: `manager@truckflow.com`
- **Password**: `manager123`

⚠️ **IMPORTANT**: Change the password after first login in production!

## Deployment Platforms

### Option 1: Render.com (Recommended)

1. **Create New Web Service**
   - Connect your GitHub repository
   - Select `truckflow-backend` folder

2. **Configuration**
   - Build Command: `npm install`
   - Start Command: `node start.js`
   - Environment: Node

3. **Environment Variables**
   ```
   NODE_ENV=production
   MONGO_URI=your_mongodb_connection_string
   JWT_SECRET=your_jwt_secret_key
   FRONTEND_URL=https://your-frontend-url.com
   PORT=5000
   ```

4. **Deploy**
   - Click "Create Web Service"
   - Seed script runs automatically on first deploy
   - Manager account created automatically

### Option 2: Railway.app

1. **Create New Project**
   - Connect GitHub repository
   - Select `truckflow-backend`

2. **Configuration**
   - Railway auto-detects Node.js
   - Uses `railway.json` configuration
   - Start command: `node start.js`

3. **Environment Variables**
   ```
   NODE_ENV=production
   MONGO_URI=your_mongodb_connection_string
   JWT_SECRET=your_jwt_secret_key
   FRONTEND_URL=https://your-frontend-url.com
   ```

4. **Deploy**
   - Push to main branch
   - Railway auto-deploys
   - Seed runs on startup

### Option 3: Heroku

1. **Create New App**
   ```bash
   heroku create truckflow-backend
   ```

2. **Set Environment Variables**
   ```bash
   heroku config:set NODE_ENV=production
   heroku config:set MONGO_URI=your_mongodb_connection_string
   heroku config:set JWT_SECRET=your_jwt_secret_key
   heroku config:set FRONTEND_URL=https://your-frontend-url.com
   ```

3. **Deploy**
   ```bash
   git push heroku main
   ```
   - `Procfile` configures the deployment
   - Seed runs during release phase
   - Server starts automatically

### Option 4: Vercel

1. **Install Vercel CLI**
   ```bash
   npm i -g vercel
   ```

2. **Deploy**
   ```bash
   cd truckflow-backend
   vercel
   ```

3. **Set Environment Variables**
   - Go to Vercel Dashboard
   - Add environment variables
   - Redeploy

**Note**: Vercel is serverless, so seed script should run on first API call or use a separate initialization endpoint.

### Option 5: DigitalOcean App Platform

1. **Create New App**
   - Connect GitHub repository
   - Select `truckflow-backend`

2. **Configuration**
   - Build Command: `npm install`
   - Run Command: `node start.js`

3. **Environment Variables**
   - Add all required variables in dashboard

4. **Deploy**
   - Click "Create Resources"
   - Seed runs on startup

### Option 6: AWS Elastic Beanstalk

1. **Install EB CLI**
   ```bash
   pip install awsebcli
   ```

2. **Initialize**
   ```bash
   cd truckflow-backend
   eb init
   ```

3. **Create Environment**
   ```bash
   eb create truckflow-production
   ```

4. **Set Environment Variables**
   ```bash
   eb setenv NODE_ENV=production MONGO_URI=your_uri JWT_SECRET=your_secret
   ```

5. **Deploy**
   ```bash
   eb deploy
   ```

## Manual Seeding

If you need to manually seed the database:

```bash
# Local
npm run seed

# Production (SSH into server)
node seed.js
```

## Verification

After deployment, verify the manager account:

1. **Check Logs**
   - Look for: "✅ Manager account created successfully!"
   - Or: "✅ Manager account already exists!"

2. **Test Login**
   - Go to your frontend
   - Login with: `manager@truckflow.com` / `manager123`
   - Should successfully authenticate

3. **Check Database**
   ```javascript
   // MongoDB Shell
   use your_database_name
   db.users.findOne({ email: 'manager@truckflow.com' })
   ```

## Environment Variables

### Required Variables

| Variable | Description | Example |
|----------|-------------|---------|
| `NODE_ENV` | Environment | `production` |
| `MONGO_URI` | MongoDB connection string | `mongodb+srv://user:pass@cluster.mongodb.net/dbname` |
| `JWT_SECRET` | Secret for JWT tokens | `your-super-secret-key-min-32-chars` |
| `FRONTEND_URL` | Frontend URL for CORS | `https://truckflow.vercel.app` |
| `PORT` | Server port (optional) | `5000` |

### Optional Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `JWT_EXPIRE` | JWT expiration time | `30d` |
| `JWT_REFRESH_EXPIRE` | Refresh token expiration | `90d` |

## Troubleshooting

### Manager Not Created

**Problem**: Manager account not showing in database

**Solutions**:
1. Check logs for seed script errors
2. Verify `MONGO_URI` is correct
3. Check database connection
4. Run seed manually: `node seed.js`

### Seed Script Fails

**Problem**: Seed script exits with error

**Solutions**:
1. Check MongoDB connection string
2. Verify network access to MongoDB
3. Check MongoDB Atlas IP whitelist
4. Verify database user permissions

### Server Won't Start

**Problem**: Server fails to start after seed

**Solutions**:
1. Check if seed script completed successfully
2. Verify all environment variables are set
3. Check server logs for errors
4. Try starting directly: `npm run start:direct`

## Docker Deployment

If using Docker:

```dockerfile
# Dockerfile
FROM node:18-alpine

WORKDIR /app

COPY package*.json ./
RUN npm install --production

COPY . .

# Run seed and start server
CMD ["node", "start.js"]

EXPOSE 5000
```

```yaml
# docker-compose.yml
version: '3.8'
services:
  backend:
    build: ./truckflow-backend
    ports:
      - "5000:5000"
    environment:
      - NODE_ENV=production
      - MONGO_URI=${MONGO_URI}
      - JWT_SECRET=${JWT_SECRET}
      - FRONTEND_URL=${FRONTEND_URL}
    restart: unless-stopped
```

## CI/CD Pipeline

### GitHub Actions Example

```yaml
# .github/workflows/deploy.yml
name: Deploy Backend

on:
  push:
    branches: [main]
    paths:
      - 'truckflow-backend/**'

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      
      - name: Setup Node.js
        uses: actions/setup-node@v2
        with:
          node-version: '18'
      
      - name: Install dependencies
        run: |
          cd truckflow-backend
          npm install
      
      - name: Run seed script
        env:
          MONGO_URI: ${{ secrets.MONGO_URI }}
        run: |
          cd truckflow-backend
          node seed.js
      
      - name: Deploy to production
        run: |
          # Your deployment command here
```

## Security Best Practices

1. **Change Default Password**
   - Login as manager
   - Go to Settings → Security
   - Change password immediately

2. **Use Strong JWT Secret**
   - Minimum 32 characters
   - Random alphanumeric + special chars
   - Never commit to repository

3. **Secure MongoDB**
   - Use MongoDB Atlas with IP whitelist
   - Strong database password
   - Enable authentication

4. **HTTPS Only**
   - Use SSL/TLS certificates
   - Redirect HTTP to HTTPS
   - Set secure cookie flags

5. **Environment Variables**
   - Never commit `.env` file
   - Use platform's secret management
   - Rotate secrets regularly

## Monitoring

After deployment, monitor:

1. **Server Health**
   - Check `/api/health` endpoint
   - Monitor response times
   - Track error rates

2. **Database**
   - Monitor connection pool
   - Check query performance
   - Track storage usage

3. **Logs**
   - Check for seed script success
   - Monitor authentication attempts
   - Track API errors

## Rollback

If deployment fails:

1. **Revert to Previous Version**
   ```bash
   git revert HEAD
   git push origin main
   ```

2. **Manual Rollback**
   - Use platform's rollback feature
   - Restore previous deployment
   - Verify manager account still exists

## Support

If you encounter issues:

1. Check deployment logs
2. Verify environment variables
3. Test database connection
4. Run seed script manually
5. Check MongoDB Atlas network access

## Summary

✅ **Automatic Seeding**: Manager account created on every deployment
✅ **Idempotent**: Safe to run multiple times (checks if exists)
✅ **Platform Agnostic**: Works on all major platforms
✅ **Secure**: Password hashing with bcrypt
✅ **Verified**: Logs confirm creation/existence

**Default Credentials**:
- Email: `manager@truckflow.com`
- Password: `manager123`

**Remember**: Change the password after first login!
