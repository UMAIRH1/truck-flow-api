# Database Seeding

## Manager Account Auto-Seeding

The TruckFlow backend automatically creates a default manager account on startup.

### How It Works

1. **On Server Start**: The `start.js` script runs `seed.js` before starting the server
2. **Check Existing**: Seed script checks if manager already exists
3. **Create If Needed**: If no manager exists, creates one with default credentials
4. **Skip If Exists**: If manager exists, skips creation and continues

### Default Manager Credentials

```
Email: manager@truckflow.com
Password: manager123
```

⚠️ **SECURITY WARNING**: Change this password immediately after first login in production!

## Running Seed Manually

### Local Development
```bash
npm run seed
```

### Production
```bash
node seed.js
```

### With Custom Environment
```bash
MONGO_URI=your_uri node seed.js
```

## Seed Script Behavior

### Success Cases

**Manager Created**:
```
✅ MongoDB Connected
✅ Manager account created successfully!
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📧 Email: manager@truckflow.com
🔑 Password: manager123
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
⚠️  IMPORTANT: Change the password after first login!
```

**Manager Already Exists**:
```
✅ MongoDB Connected
✅ Manager account already exists!
📧 Email: manager@truckflow.com
🔑 Password: manager123
ℹ️  No action needed - skipping seed
```

### Error Cases

**No Database Connection**:
```
❌ Error: MONGO_URI environment variable is not set
```

**Connection Failed**:
```
❌ Seed Error: connect ECONNREFUSED
```

**Duplicate Email** (shouldn't happen):
```
❌ Seed Error: E11000 duplicate key error
```

## Environment Variables

The seed script uses:

- `MONGO_URI` (primary) or `MONGODB_URI` (fallback)
- Must be set in `.env` file or environment

Example `.env`:
```env
MONGO_URI=mongodb+srv://user:password@cluster.mongodb.net/truckflow
```

## Integration with Deployment

### Automatic Seeding

The seed script runs automatically on:

1. **npm start**: Via `start.js` wrapper
2. **Heroku**: Via `Procfile` release phase
3. **Railway**: Via `railway.json` start command
4. **Render**: Via `render.yaml` start command

### Manual Seeding

If automatic seeding fails, you can:

1. SSH into your server
2. Run `node seed.js`
3. Check logs for success/failure

## Customizing the Manager Account

To change default manager details, edit `seed.js`:

```javascript
const manager = await User.create({
    name: 'Your Name',              // Change this
    email: 'your@email.com',        // Change this
    password: hashedPassword,       // Change password variable
    phone: '+1 234 567 8900',       // Change this
    role: 'manager',
    preferredLanguage: 'en',
    country: 'Your Country',        // Change this
    isActive: true,
});
```

## Security Best Practices

1. **Change Password**: Immediately after first login
2. **Strong Password**: Use minimum 12 characters with mixed case, numbers, symbols
3. **Unique Email**: Use a real email address you control
4. **2FA**: Consider adding two-factor authentication (future feature)
5. **Audit Logs**: Monitor manager account activity

## Troubleshooting

### Seed Script Doesn't Run

**Check**:
1. Is `MONGO_URI` set?
2. Can you connect to MongoDB?
3. Are there any firewall rules blocking connection?
4. Is the database user authorized?

**Solution**:
```bash
# Test connection
node -e "require('mongoose').connect(process.env.MONGO_URI).then(() => console.log('Connected')).catch(e => console.error(e))"
```

### Manager Not Created

**Check**:
1. Look at seed script logs
2. Check database for existing manager
3. Verify email is unique

**Solution**:
```bash
# Check if manager exists
mongo your_database_uri
> db.users.findOne({ email: 'manager@truckflow.com' })
```

### Can't Login with Default Credentials

**Check**:
1. Is manager account in database?
2. Is password correct?
3. Is account active?

**Solution**:
```bash
# Reset manager password
node -e "
const bcrypt = require('bcryptjs');
const mongoose = require('mongoose');
require('dotenv').config();

mongoose.connect(process.env.MONGO_URI).then(async () => {
  const User = mongoose.model('User', new mongoose.Schema({
    email: String,
    password: String
  }));
  
  const salt = await bcrypt.genSalt(10);
  const hash = await bcrypt.hash('manager123', salt);
  
  await User.updateOne(
    { email: 'manager@truckflow.com' },
    { password: hash }
  );
  
  console.log('Password reset to: manager123');
  process.exit(0);
});
"
```

## Testing

### Test Seed Script Locally

```bash
# 1. Set environment variable
export MONGO_URI=your_test_database_uri

# 2. Run seed
npm run seed

# 3. Verify in database
mongo your_test_database_uri
> db.users.findOne({ email: 'manager@truckflow.com' })

# 4. Test login
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"manager@truckflow.com","password":"manager123"}'
```

### Test in Production

```bash
# 1. Deploy to production
git push origin main

# 2. Check deployment logs for seed success

# 3. Test login via frontend
# Go to: https://your-frontend.com/auth/signin
# Email: manager@truckflow.com
# Password: manager123

# 4. Verify you can access manager dashboard
```

## FAQ

**Q: Will seed script run every time server starts?**
A: Yes, but it checks if manager exists first. If exists, it skips creation.

**Q: Can I have multiple managers?**
A: Yes, create additional managers through the UI or API after logging in.

**Q: What if I forget the password?**
A: Use the password reset script above or create a new manager account.

**Q: Is the password secure?**
A: Yes, it's hashed with bcrypt (10 salt rounds) before storing.

**Q: Can I disable auto-seeding?**
A: Yes, use `npm run start:direct` instead of `npm start`.

**Q: Will seed script delete existing data?**
A: No, it only creates the manager if it doesn't exist. Never deletes data.

## Summary

✅ Automatic seeding on deployment
✅ Idempotent (safe to run multiple times)
✅ Secure password hashing
✅ Clear success/error messages
✅ Works on all deployment platforms

**Default Login**:
- Email: `manager@truckflow.com`
- Password: `manager123`

**Remember**: Change password after first login!
