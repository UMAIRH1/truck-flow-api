const mongoose = require('mongoose');

/**
 * ROUTE MODEL
 * 
 * A Route represents the actual truck trip/journey.
 * 
 * Key Concept:
 * - A Route defines: origin, destination, distance, tolls, assigned truck, assigned driver
 * - Multiple Loads can be attached to a single Route
 * - The system calculates total costs (fuel, driver, truck, tolls) and compares against
 *   total revenue from all attached loads to determine profit per route
 * 
 * Example:
 * Route: Athens → Thessaloniki
 * - Truck: TZI-24
 * - Driver: Nikos
 * - Distance: 500 km
 * - Tolls: €50
 * 
 * Attached Loads:
 * - Client A: 3 pallets, €500
 * - Client B: 5 pallets, €800
 * - Client C: 2 pallets, €400
 * 
 * Total Revenue: €1,700
 * Total Cost: Fuel (€300) + Driver (€100) + Truck (€250) + Tolls (€50) = €700
 * Profit: €1,000
 */

const routeSchema = mongoose.Schema(
    {
        // Route identification
        routeName: {
            type: String,
            required: [true, 'Please add route name'],
            trim: true,
        },

        // Route locations (origin → destination)
        origin: {
            type: String,
            trim: true,
        },
        destination: {
            type: String,
            trim: true,
        },
        driverStartingLocation: {
            type: String,
            trim: true,
        },
        originCoords: {
            lat: Number,
            lng: Number
        },
        destinationCoords: {
            lat: Number,
            lng: Number
        },
        driverStartingCoords: {
            lat: Number,
            lng: Number
        },

        // Assigned resources
        assignedDriver: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: [true, 'Please assign a driver'],
        },
        assignedTruck: {
            truckNumber: String,
            truckType: String,
            capacity: Number,
        },

        // Route details
        startDate: {
            type: Date,
            required: [true, 'Please add start date'],
        },
        endDate: {
            type: Date,
        },

        // Status
        status: {
            type: String,
            enum: ['pending', 'accepted', 'rejected', 'in-progress', 'completed'],
            default: 'pending',
        },

        // Loads attached to this route
        loads: [{
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Load',
        }],
        
        // Load sequence (ordered array of load IDs)
        loadSequence: [{
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Load',
        }],

        // Cost Model (calculated from all loads in route)
        totalDistance: {
            type: Number,
            default: 0,
        },
        preRouteDistance: {
            type: Number,
            default: 0,
        },
        routeDistance: {
            type: Number,
            default: 0,
        },
        fuelConsumption: {
            type: Number,
            default: 30, // liters per 100km
        },
        fuelPricePerLiter: {
            type: Number,
            default: 0,
        },
        driverDailyCost: {
            type: Number,
            default: 0,
        },
        truckCostPerKm: {
            type: Number,
            default: 0,
        },

        // Calculated Costs (for entire route)
        fuelCost: {
            type: Number,
            default: 0,
        },
        driverCost: {
            type: Number,
            default: 0,
        },
        truckCost: {
            type: Number,
            default: 0,
        },
        totalCost: {
            type: Number,
            default: 0,
        },
        totalRevenue: {
            type: Number,
            default: 0,
        },
        profit: {
            type: Number,
            default: 0,
        },
        profitPerKm: {
            type: Number,
            default: 0,
        },

        // Additional expenses
        tolls: {
            type: Number,
            default: 0,
        },
        otherExpenses: {
            type: Number,
            default: 0,
        },

        // Notes
        notes: {
            type: String,
            trim: true,
        },

        // Creator reference
        createdBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true,
        },

        // Timeline for status changes
        timeline: [{
            status: String,
            timestamp: Date,
            note: String,
        }],

        completedAt: {
            type: Date,
        },
    },
    {
        timestamps: true,
    }
);

// Index for faster queries
routeSchema.index({ status: 1, createdBy: 1 });
routeSchema.index({ assignedDriver: 1, status: 1 });
routeSchema.index({ createdAt: -1 });

// Pre-save middleware to calculate route costs
routeSchema.pre('save', async function() {
    // 0. Automatically aggregate revenue from all attached loads
    if (this.loads && this.loads.length > 0) {
        const Load = mongoose.model('Load');
        const populatedLoads = await Load.find({ _id: { $in: this.loads } });
        this.totalRevenue = populatedLoads.reduce((sum, load) => sum + (load.clientPrice || 0), 0);
    } else {
        this.totalRevenue = 0;
    }

    // COST CALCULATION FORMULA (as per client requirements):
    // 1. Fuel Cost = distance × (fuel consumption / 100) × fuel price per liter
    // 2. Driver Cost = daily driver cost × number of days
    // 3. Truck Cost = distance × cost per km
    // 4. Total Cost = fuel cost + driver cost + truck cost + tolls + other expenses
    // 5. Profit = total revenue - total cost
    // 6. Profit per km = profit / distance

    if (this.totalDistance > 0) {
        // 1. Fuel Cost = distance × (fuel consumption / 100) × fuel price per liter
        if (this.fuelConsumption > 0 && this.fuelPricePerLiter > 0) {
            this.fuelCost = this.totalDistance * (this.fuelConsumption / 100) * this.fuelPricePerLiter;
        } else {
            this.fuelCost = 0;
        }

        // 2. Driver Cost = daily driver cost × duration (minimum 1 day)
        if (this.startDate && this.endDate) {
            const start = new Date(this.startDate);
            const end = new Date(this.endDate);
            const diffTime = Math.abs(end - start);
            const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) || 1;
            this.driverCost = (this.driverDailyCost || 0) * diffDays;
        } else {
            this.driverCost = this.driverDailyCost || 0;
        }

        // 3. Truck Cost = distance × cost per km
        if (this.truckCostPerKm > 0) {
            this.truckCost = this.totalDistance * this.truckCostPerKm;
        } else {
            this.truckCost = 0;
        }

        // 4. Total Cost = fuel + driver + truck + tolls + otherExpenses
        this.totalCost = this.fuelCost + this.driverCost + this.truckCost + (this.tolls || 0) + (this.otherExpenses || 0);

        // 5. Profit = total revenue - total cost
        this.profit = (this.totalRevenue || 0) - this.totalCost;

        // 6. Profit per km
        this.profitPerKm = this.totalDistance > 0 ? this.profit / this.totalDistance : 0;

        // Round to 2 decimal places
        this.fuelCost = Math.round(this.fuelCost * 100) / 100;
        this.driverCost = Math.round(this.driverCost * 100) / 100;
        this.truckCost = Math.round(this.truckCost * 100) / 100;
        this.totalCost = Math.round(this.totalCost * 100) / 100;
        this.profit = Math.round(this.profit * 100) / 100;
        this.profitPerKm = Math.round(this.profitPerKm * 100) / 100;
    }
});

// Virtual for route number (using _id)
routeSchema.virtual('routeNumber').get(function() {
    return 'R-' + this._id.toString().slice(-8).toUpperCase();
});

// Ensure virtuals are included in JSON
routeSchema.set('toJSON', { virtuals: true });
routeSchema.set('toObject', { virtuals: true });

module.exports = mongoose.model('Route', routeSchema);
