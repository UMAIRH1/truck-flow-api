const mongoose = require('mongoose');

const loadSchema = mongoose.Schema(
    {
        loadNumber: {
            type: String,
            unique: true,
        },
        managerId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true,
        },
        driverId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            default: null,
        },
        origin: {
            city: {
                type: String,
                required: [true, 'Origin city is required'],
            },
            postalCode: {
                type: String,
                required: [true, 'Origin postal code is required'],
            },
        },
        destination: {
            city: {
                type: String,
                required: [true, 'Destination city is required'],
            },
            postalCode: {
                type: String,
                required: [true, 'Destination postal code is required'],
            },
        },
        distanceKm: {
            type: Number,
            default: null,
        },
        estimatedDuration: {
            type: String,
            default: null,
        },
        loadAmount: {
            type: Number,
            required: [true, 'Load amount is required'],
            min: [0, 'Load amount cannot be negative'],
        },
        paymentTerms: {
            type: Number,
            enum: [30, 45, 60, 90, 120],
            required: [true, 'Payment terms are required'],
        },
        expectedPayoutDate: {
            type: Date,
        },
        status: {
            type: String,
            enum: ['pending', 'accepted', 'declined', 'completed'],
            default: 'pending',
        },
        pod: {
            imageUrl: {
                type: String,
                default: null,
            },
            uploadedAt: {
                type: Date,
                default: null,
            },
        },
    },
    {
        timestamps: true,
    }
);

// Indexes for faster queries
loadSchema.index({ managerId: 1, status: 1 });
loadSchema.index({ driverId: 1, status: 1 });
loadSchema.index({ loadNumber: 1 });
loadSchema.index({ createdAt: -1 });

module.exports = mongoose.model('Load', loadSchema);
