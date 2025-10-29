const Contact = require('../models/Contact');
const Joi = require('joi');

// Validation schema
const contactValidationSchema = Joi.object({
    firstName: Joi.string().trim().max(50).required().messages({
        'string.empty': 'First name is required',
        'string.max': 'First name cannot exceed 50 characters'
    }),
    lastName: Joi.string().trim().max(50).required().messages({
        'string.empty': 'Last name is required',
        'string.max': 'Last name cannot exceed 50 characters'
    }),
    email: Joi.string().email().required().messages({
        'string.email': 'Please enter a valid email address',
        'string.empty': 'Email is required'
    }),
    subject: Joi.string().valid(
        'general', 'support', 'feature', 'bug',
        'expense-help', 'account', 'partnership', 'other'
    ).required().messages({
        'any.only': 'Please select a valid subject',
        'string.empty': 'Subject is required'
    }),
    message: Joi.string().trim().max(2000).required().messages({
        'string.empty': 'Message is required',
        'string.max': 'Message cannot exceed 2000 characters'
    })
});

// Create contact inquiry
exports.createContact = async (req, res) => {
    try {
        // Validate request body
        const { error, value } = contactValidationSchema.validate(req.body);
        if (error) {
            console.log(`❌ CONTACT_VALIDATION_ERROR: ${error.details[0].message} - IP: ${req.ip}`);
            return res.status(400).json({
                success: false,
                message: error.details[0].message
            });
        }

        // Extract client information
        const ipAddress = req.ip || req.connection.remoteAddress || 'unknown';
        const userAgent = req.get('User-Agent') || 'unknown';

        // Create contact record
        const contactData = {
            ...value,
            ipAddress,
            userAgent
        };

        const contact = new Contact(contactData);
        await contact.save();

        // Log successful contact creation with distinctive formatting
        console.log(`
🔔 ===== NEW CONTACT INQUIRY =====
📧 Email: ${contact.email}
👤 Name: ${contact.firstName} ${contact.lastName}
📋 Subject: ${contact.subject}
💬 Message: ${contact.message.substring(0, 100)}${contact.message.length > 100 ? '...' : ''}
🌐 IP: ${ipAddress}
🕒 Time: ${new Date().toISOString()}
📱 User Agent: ${userAgent}
🆔 Contact ID: ${contact._id}
================================
        `);

        // Set priority based on subject
        if (['bug', 'account', 'support'].includes(contact.subject)) {
            contact.priority = 'high';
            await contact.save();
            console.log(`⚡ HIGH PRIORITY contact inquiry detected: ${contact.subject} - ID: ${contact._id}`);
        }

        res.status(201).json({
            success: true,
            message: 'Thank you for your message! We\'ll get back to you within 24 hours.',
            data: {
                id: contact._id,
                status: contact.status,
                priority: contact.priority
            }
        });

    } catch (error) {
        console.error(`❌ CONTACT_CREATE_ERROR: ${error.message} - IP: ${req.ip}`);
        res.status(500).json({
            success: false,
            message: 'Something went wrong. Please try again later.'
        });
    }
};
