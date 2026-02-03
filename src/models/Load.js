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
            enum: ['pending', 'accepted', 'rejected', 'in-transit', 'delivered', 'completed'],
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

// Virtual for load number (using _id)
loadSchema.virtual('loadNumber').get(function() {
    return this._id.toString().slice(-8).toUpperCase();
});

// Ensure virtuals are included in JSON
loadSchema.set('toJSON', { virtuals: true });
loadSchema.set('toObject', { virtuals: true });

module.exports = mongoose.model('Load', loadSchema);
