const mongoose = require('mongoose');

const loadSchema = mongoose.Schema(
    {
        // Location fields (simple strings matching UI)
        pickupLocation: {
            type: String,
            required: [true, 'Please add pickup location'],
            trim: true,
        },
        dropoffLocation: {
            type: String,
            required: [true, 'Please add dropoff location'],
            trim: true,
        },

        // Distance information
        distance: {
            type: Number,
            default: 0,
        },
        distanceUnit: {
            type: String,
            default: 'km',
        },

        // Cost Model Fields
        fuelConsumption: {
            type: Number,
            default: 30, // liters per 100km (default for trucks)
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

        // Calculated Costs
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
        profit: {
            type: Number,
            default: 0,
        },
        profitPerKm: {
            type: Number,
            default: 0,
        },

        // Client information
        clientName: {
            type: String,
            required: [true, 'Please add client name'],
            trim: true,
        },
        clientPrice: {
            type: Number,
            required: [true, 'Please add client price'],
            min: 0,
        },

        // Driver information
        driverPrice: {
            type: Number,
            default: 0,
            min: 0,
        },
        assignedDriver: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
        },

        // Route reference (if load is part of a route)
        routeId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Route',
        },

        // Load details
        shippingType: {
            type: String,
            enum: ['FTL', 'LTL', 'Partial', 'Expedited'],
            default: 'FTL',
        },
        loadWeight: {
            type: Number,
            default: 0,
        },
        pallets: {
            type: Number,
        },

        // Dates and times
        loadingDate: {
            type: Date,
            required: [true, 'Please add loading date'],
        },
        loadingTime: {
            type: String,
            required: [true, 'Please add loading time'],
        },
        paymentTerms: {
            type: Number,
            enum: [30, 45, 60, 90, 120],
            default: 45,
        },
        expectedPayoutDate: {
            type: Date,
        },

        // Expenses
        fuel: {
            type: Number,
            default: 0,
            min: 0,
        },
        tolls: {
            type: Number,
            default: 0,
            min: 0,
        },
        otherExpenses: {
            type: Number,
            default: 0,
            min: 0,
        },

        // Status
        status: {
            type: String,
            enum: ['pending', 'accepted', 'rejected', 'in-progress', 'in-transit', 'delivered', 'completed'],
            default: 'pending',
        },

        // Additional information
        notes: {
            type: String,
            trim: true,
        },
        podImage: {
            type: String,
        },
        podImages: [{
            type: String,
        }],
        invoices: [{
            type: String,
        }],
        documents: [{
            type: String,
        }],

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
loadSchema.index({ status: 1, createdBy: 1 });
loadSchema.index({ assignedDriver: 1, status: 1 });
loadSchema.index({ createdAt: -1 });

// Pre-save middleware to calculate costs
loadSchema.pre('save', function(next) {
    // Only calculate if we have distance
    if (this.distance > 0) {
        // Calculate fuel cost: distance × consumption / 100 × fuel_price
        this.fuelCost = (this.distance * this.fuelConsumption / 100) * this.fuelPricePerLiter;

        // Driver cost is daily cost (already set)
        this.driverCost = this.driverDailyCost || 0;

        // Truck cost: distance × cost_per_km
        this.truckCost = this.distance * this.truckCostPerKm;

        // Total cost: fuel + driver + truck + tolls + other expenses
        this.totalCost = this.fuelCost + this.driverCost + this.truckCost + 
                        (this.tolls || 0) + (this.otherExpenses || 0);

        // Profit: revenue (clientPrice) - total_cost
        this.profit = (this.clientPrice || 0) - this.totalCost;

        // Profit per km
        this.profitPerKm = this.distance > 0 ? this.profit / this.distance : 0;

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

// Virtual for load number (using _id)
loadSchema.virtual('loadNumber').get(function() {
    return this._id.toString().slice(-8).toUpperCase();
});

// Ensure virtuals are included in JSON
loadSchema.set('toJSON', { virtuals: true });
loadSchema.set('toObject', { virtuals: true });

module.exports = mongoose.model('Load', loadSchema);
