const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const dotenv = require('dotenv');

// Load env vars
dotenv.config();

const seedManager = async () => {
    try {
        // Use MONGO_URI (the correct env variable name)
        const mongoUri = process.env.MONGO_URI || process.env.MONGODB_URI;
        
        if (!mongoUri) {
            console.error('❌ Error: MONGO_URI environment variable is not set');
            process.exit(1);
        }

        await mongoose.connect(mongoUri);
        console.log('✅ MongoDB Connected');

        // Define User schema inline
        const userSchema = new mongoose.Schema({
            name: String,
            email: { type: String, unique: true },
            password: String,
            phone: String,
            role: { type: String, enum: ['manager', 'driver'], default: 'driver' },
            isActive: { type: Boolean, default: true },
            preferredLanguage: { type: String, enum: ['en', 'el'], default: 'en' },
            country: { type: String, default: 'Greece' },
            avatar: { type: String, default: '' },
        }, { timestamps: true });

        const User = mongoose.models.User || mongoose.model('User', userSchema);

        // Check if manager already exists
        const existingManager = await User.findOne({ email: 'manager@truckflow.com' });

        if (existingManager) {
            console.log('\n✅ Manager account already exists!');
            console.log('📧 Email: manager@truckflow.com');
            console.log('🔑 Password: manager123');
            console.log('ℹ️  No action needed - skipping seed');
            await mongoose.connection.close();
            process.exit(0);
        }

        // Hash password
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash('manager123', salt);

        // Create manager
        const manager = await User.create({
            name: 'Admin Manager',
            email: 'manager@truckflow.com',
            password: hashedPassword,
            phone: '+30 210 1234567',
            role: 'manager',
            preferredLanguage: 'en',
            country: 'Greece',
            isActive: true,
        });

        console.log('\n✅ Manager account created successfully!');
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        console.log('📧 Email: manager@truckflow.com');
        console.log('🔑 Password: manager123');
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        console.log('\n⚠️  IMPORTANT: Change the password after first login!');

        await mongoose.connection.close();
        process.exit(0);
    } catch (err) {
        console.error('❌ Seed Error:', err.message);
        await mongoose.connection.close();
        process.exit(1);
    }
};

// Run seed
seedManager();
