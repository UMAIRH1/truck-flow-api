const mongoose = require('mongoose');

const routeSchema = mongoose.Schema(
    {
        // Route identification
        routeName: {
            type: String,
            required: [true, 'Please add route name'],
            trim: true,
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

        // Cost Model (calculated from all loads in route)
        totalDistance: {
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
routeSchema.pre('save', function(next) {
    // Calculate costs based on total distance
    if (this.totalDistance > 0) {
        // Fuel cost: distance × consumption / 100 × fuel_price
        this.fuelCost = (this.totalDistance * this.fuelConsumption / 100) * this.fuelPricePerLiter;

        // Driver cost is daily cost
        this.driverCost = this.driverDailyCost || 0;

        // Truck cost: distance × cost_per_km
        this.truckCost = this.totalDistance * this.truckCostPerKm;

        // Total cost: fuel + driver + truck + tolls + other
        this.totalCost = this.fuelCost + this.driverCost + this.truckCost + 
                        (this.tolls || 0) + (this.otherExpenses || 0);

        // Profit: revenue - total_cost
        this.profit = (this.totalRevenue || 0) - this.totalCost;

        // Profit per km
        this.profitPerKm = this.totalDistance > 0 ? this.profit / this.totalDistance : 0;

        // Round to 2 decimal places
        this.fuelCost = Math.round(this.fuelCost * 100) / 100;
        this.driverCost = Math.round(this.driverCost * 100) / 100;
        this.truckCost = Math.round(this.truckCost * 100) / 100;
        this.totalCost = Math.round(this.totalCost * 100) / 100;
        this.profit = Math.round(this.profit * 100) / 100;
        this.profitPerKm = Math.round(this.profitPerKm * 100) / 100;
    }
    next();
});

// Virtual for route number (using _id)
routeSchema.virtual('routeNumber').get(function() {
    return 'R-' + this._id.toString().slice(-8).toUpperCase();
});

// Ensure virtuals are included in JSON
routeSchema.set('toJSON', { virtuals: true });
routeSchema.set('toObject', { virtuals: true });

module.exports = mongoose.model('Route', routeSchema);
