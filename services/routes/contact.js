const express = require('express');
const router = express.Router();
const rateLimit = require('express-rate-limit');
const {
    createContact
} = require('../controllers/contactController');

// Rate limiting for contact form submissions
const contactLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 3, // limit each IP to 3 contact submissions per windowMs
    message: {
        success: false,
        message: 'Too many contact submissions. Please wait 15 minutes before trying again.'
    },
    standardHeaders: true,
    legacyHeaders: false,
    // Skip rate limiting in development
    skip: (req) => process.env.NODE_ENV !== 'production'
});

// CORS middleware for contact endpoint
const corsOptions = {
    origin: function (origin, callback) {
        // Allow requests with no origin (mobile apps, curl, etc.)
        if (!origin) return callback(null, true);

        // In development, allow all origins
        if (process.env.NODE_ENV !== 'production') {
            return callback(null, true);
        }

        // In production, add your website domains here
        const allowedOrigins = [
            'https://splitlyr.clestiq.com',
            'https://www.splitlyr.clestiq.com',
            'http://localhost:3000',
            'http://localhost:3001'
        ];

        if (allowedOrigins.indexOf(origin) !== -1) {
            callback(null, true);
        } else {
            callback(new Error('Not allowed by CORS'));
        }
    },
    credentials: true
};

// Apply CORS to all contact routes
router.use(require('cors')(corsOptions));

// Public routes
router.post('/', contactLimiter, createContact);

module.exports = router;
