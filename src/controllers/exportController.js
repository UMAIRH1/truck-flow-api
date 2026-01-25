const ExcelJS = require('exceljs');
const Load = require('../models/Load');

// @desc    Export loads to Excel (manager only)
// @route   GET /api/exports/loads
// @access  Private/Manager
exports.exportLoads = async (req, res) => {
    try {
        const { status, startDate, endDate } = req.query;

        // Build query
        const query = { managerId: req.user._id };

        if (status) {
            query.status = status;
        }

        if (startDate || endDate) {
            query.createdAt = {};
            if (startDate) {
                query.createdAt.$gte = new Date(startDate);
            }
            if (endDate) {
                query.createdAt.$lte = new Date(endDate);
            }
        }

        // Fetch loads
        const loads = await Load.find(query)
            .populate('driverId', 'name email phone')
            .sort({ createdAt: -1 });

        // Create workbook
        const workbook = new ExcelJS.Workbook();
        const worksheet = workbook.addWorksheet('Loads');

        // Define columns
        worksheet.columns = [
            { header: 'Load Number', key: 'loadNumber', width: 15 },
            { header: 'Origin City', key: 'originCity', width: 20 },
            { header: 'Origin Postal', key: 'originPostal', width: 15 },
            { header: 'Destination City', key: 'destCity', width: 20 },
            { header: 'Destination Postal', key: 'destPostal', width: 15 },
            { header: 'Distance (km)', key: 'distanceKm', width: 15 },
            { header: 'Duration', key: 'duration', width: 15 },
            { header: 'Load Amount', key: 'loadAmount', width: 15 },
            { header: 'Payment Terms (days)', key: 'paymentTerms', width: 20 },
            { header: 'Expected Payout', key: 'expectedPayout', width: 20 },
            { header: 'Status', key: 'status', width: 15 },
            { header: 'Driver Name', key: 'driverName', width: 20 },
            { header: 'Driver Email', key: 'driverEmail', width: 25 },
            { header: 'Driver Phone', key: 'driverPhone', width: 20 },
            { header: 'POD Image', key: 'podImage', width: 50 },
            { header: 'Created At', key: 'createdAt', width: 20 },
        ];

        // Add rows
        loads.forEach((load) => {
            worksheet.addRow({
                loadNumber: load.loadNumber,
                originCity: load.origin.city,
                originPostal: load.origin.postalCode,
                destCity: load.destination.city,
                destPostal: load.destination.postalCode,
                distanceKm: load.distanceKm || 'N/A',
                duration: load.estimatedDuration || 'N/A',
                loadAmount: load.loadAmount,
                paymentTerms: load.paymentTerms,
                expectedPayout: load.expectedPayoutDate
                    ? load.expectedPayoutDate.toISOString().split('T')[0]
                    : 'N/A',
                status: load.status,
                driverName: load.driverId?.name || 'Not Assigned',
                driverEmail: load.driverId?.email || 'N/A',
                driverPhone: load.driverId?.phone || 'N/A',
                podImage: load.pod?.imageUrl || 'N/A',
                createdAt: load.createdAt.toISOString().split('T')[0],
            });
        });

        // Style header row
        worksheet.getRow(1).font = { bold: true };
        worksheet.getRow(1).fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: 'FFD3D3D3' },
        };

        // Set response headers
        res.setHeader(
            'Content-Type',
            'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
        );
        res.setHeader(
            'Content-Disposition',
            `attachment; filename=loads_${Date.now()}.xlsx`
        );

        // Write to response
        await workbook.xlsx.write(res);
        res.end();
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};
