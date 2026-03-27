require('dotenv').config();
const mongoose = require('mongoose');
const Route = require('./src/models/Route');
const Load = require('./src/models/Load');
const User = require('./src/models/User');

async function verify() {
  try {
    if (!process.env.MONGODB_URI) {
        throw new Error('MONGODB_URI is not defined in .env');
    }
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    // Create a dummy user
    const user = new User({
        name: 'Test Manager',
        email: `testmanager_${Date.now()}@test.com`,
        password: 'password',
        role: 'manager'
    });
    await user.save();

    // Create Load 1
    const load1 = new Load({
        createdBy: user._id,
        pickupLocation: 'Athens',
        dropoffLocation: 'Thessaloniki',
        clientName: 'Client A',
        clientPrice: 500, // Revenue 500
        loadingDate: new Date(),
        loadingTime: '10:00'
    });
    await load1.save();

    // Create Load 2
    const load2 = new Load({
        createdBy: user._id,
        pickupLocation: 'Patras',
        dropoffLocation: 'Athens',
        clientName: 'Client B',
        clientPrice: 1000, // Revenue 1000
        loadingDate: new Date(),
        loadingTime: '14:00'
    });
    await load2.save();

    // Create a Route
    const route = new Route({
        routeName: 'Test Route ' + Date.now(),
        origin: 'Patras',
        destination: 'Thessaloniki',
        totalDistance: 1000,
        assignedDriver: user._id,
        startDate: new Date(),
        createdBy: user._id,
        fuelConsumption: 30,
        fuelPricePerLiter: 1.5,
        driverDailyCost: 100,
        truckCostPerKm: 0.5,
        loads: [load1._id, load2._id]
    });
    
    // Test the pre-save hook aggregating from attached Loads
    await route.save(); 

    console.log('--- After Route save with loads attached ---');
    console.log(`Route Revenue: €${route.totalRevenue} (Expected: €1500)`);
    console.log(`Route Fuel Cost: €${route.fuelCost} (Expected: 1000 * 0.3 * 1.5 = €450)`);
    console.log(`Route Total Cost: €${route.totalCost} (Expected: 450 + 100 + 500 = €1050)`);
    console.log(`Route Profit: €${route.profit} (Expected: 1500 - 1050 = €450)`);

    if (route.totalRevenue !== 1500) {
        throw new Error('❌ Route totalRevenue calculation FAILED');
    }

    // Now let's test Load update triggering Route save
    // Simulate what loadController does when updateLoad is called
    load1.clientPrice = 800; // Increase by 300
    load1.routeId = route._id; // Ensure routeId is linked, addLoadsToRoute does this
    await load1.save();

    // In loadController.js, we added:
    if (load1.routeId) {
        const routeInstance = await Route.findById(load1.routeId);
        if (routeInstance) {
            await routeInstance.save();
        }
    }

    const updatedRoute = await Route.findById(route._id);
    console.log('--- After attaching and updating Load 1 ---');
    console.log(`Updated Route Revenue: €${updatedRoute.totalRevenue} (Expected: 800 + 1000 = €1800)`);
    console.log(`Updated Route Profit: €${updatedRoute.profit} (Expected: 1800 - 1050 = €750)`);

    if (updatedRoute.totalRevenue !== 1800) {
        throw new Error('❌ Route recalculation on Load update FAILED');
    }

    console.log('✅ ALL VERIFICATIONS PASSED');
    
    // Cleanup generated data
    await User.findByIdAndDelete(user._id);
    await Load.deleteMany({ _id: { $in: [load1._id, load2._id] }});
    await Route.findByIdAndDelete(route._id);

  } catch (err) {
    console.error('Test Error:', err);
  } finally {
    await mongoose.disconnect();
  }
}

verify();
