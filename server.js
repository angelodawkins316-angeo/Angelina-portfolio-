const express = require('express');
const mysql = require('mysql2/promise');
const cors = require('cors');
const nodemailer = require('nodemailer');
const path = require('path');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static('public'));

// Database connection pool
const pool = mysql.createPool({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'angelina_db',
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
});

// Email transporter configuration
const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.EMAIL_USER || 'angelodawkins010@gmail.com',
        pass: process.env.EMAIL_PASS || 'your-app-password'
    }
});

// ============================================
// API ROUTES
// ============================================

// Health check endpoint
app.get('/api/health', (req, res) => {
    res.json({ status: 'OK', message: 'Server is running', timestamp: new Date() });
});

// Submit appointment
app.post('/api/appointments', async (req, res) => {
    const connection = await pool.getConnection();
    
    try {
        const {
            firstName,
            middleName,
            surname,
            email,
            whatsapp,
            phone,
            location,
            work,
            ranking,
            budget,
            timeline,
            description,
            reference,
            maintenance,
            hosting,
            seo,
            hear
        } = req.body;

        // Validation
        if (!firstName || !surname || !email || !whatsapp || !phone || !location || !work || !ranking || !description) {
            return res.status(400).json({ 
                success: false, 
                message: 'Missing required fields' 
            });
        }

        // Insert into database
        const [result] = await connection.execute(
            `INSERT INTO appointments 
            (first_name, middle_name, surname, email, whatsapp, phone, location, 
             work_type, ranking, budget, timeline, description, reference, 
             maintenance, hosting, seo, hear_about, status, created_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending', NOW())`,
            [firstName, middleName || null, surname, email, whatsapp, phone, location,
             work, ranking, budget || null, timeline || null, description, reference || null,
             maintenance ? 1 : 0, hosting ? 1 : 0, seo ? 1 : 0, hear || null]
        );

        const appointmentId = result.insertId;

        // Send confirmation email to client
        await sendClientConfirmation(email, {
            firstName,
            surname,
            appointmentId,
            work,
            ranking
        });

        // Send notification email to admin
        await sendAdminNotification({
            appointmentId,
            firstName,
            surname,
            email,
            phone,
            work,
            ranking,
            description
        });

        res.status(201).json({
            success: true,
            message: 'Appointment request submitted successfully',
            appointmentId
        });

    } catch (error) {
        console.error('Error submitting appointment:', error);
        res.status(500).json({
            success: false,
            message: 'Error processing your request'
        });
    } finally {
        connection.release();
    }
});

// Get all appointments (admin endpoint)
app.get('/api/appointments', async (req, res) => {
    try {
        const { status, limit = 50, offset = 0 } = req.query;
        
        let query = 'SELECT * FROM appointments';
        let params = [];

        if (status) {
            query += ' WHERE status = ?';
            params.push(status);
        }

        query += ' ORDER BY created_at DESC LIMIT ? OFFSET ?';
        params.push(parseInt(limit), parseInt(offset));

        const [appointments] = await pool.execute(query, params);

        res.json({
            success: true,
            data: appointments,
            total: appointments.length
        });

    } catch (error) {
        console.error('Error fetching appointments:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching appointments'
        });
    }
});

// Get single appointment
app.get('/api/appointments/:id', async (req, res) => {
    try {
        const { id } = req.params;

        const [appointments] = await pool.execute(
            'SELECT * FROM appointments WHERE id = ?',
            [id]
        );

        if (appointments.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Appointment not found'
            });
        }

        res.json({
            success: true,
            data: appointments[0]
        });

    } catch (error) {
        console.error('Error fetching appointment:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching appointment'
        });
    }
});

// Update appointment status
app.patch('/api/appointments/:id/status', async (req, res) => {
    try {
        const { id } = req.params;
        const { status, notes } = req.body;

        const validStatuses = ['pending', 'reviewed', 'accepted', 'rejected', 'completed'];
        
        if (!validStatuses.includes(status)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid status'
            });
        }

        await pool.execute(
            'UPDATE appointments SET status = ?, admin_notes = ?, updated_at = NOW() WHERE id = ?',
            [status, notes || null, id]
        );

        // Get appointment details for email notification
        const [appointments] = await pool.execute(
            'SELECT * FROM appointments WHERE id = ?',
            [id]
        );

        if (appointments.length > 0) {
            await sendStatusUpdateEmail(appointments[0], status);
        }

        res.json({
            success: true,
            message: 'Appointment status updated successfully'
        });

    } catch (error) {
        console.error('Error updating appointment:', error);
        res.status(500).json({
            success: false,
            message: 'Error updating appointment'
        });
    }
});

// Delete appointment
app.delete('/api/appointments/:id', async (req, res) => {
    try {
        const { id } = req.params;

        await pool.execute('DELETE FROM appointments WHERE id = ?', [id]);

        res.json({
            success: true,
            message: 'Appointment deleted successfully'
        });

    } catch (error) {
        console.error('Error deleting appointment:', error);
        res.status(500).json({
            success: false,
            message: 'Error deleting appointment'
        });
    }
});

// Contact form submission
app.post('/api/contact', async (req, res) => {
    try {
        const { name, email, subject, message } = req.body;

        if (!name || !email || !subject || !message) {
            return res.status(400).json({
                success: false,
                message: 'Missing required fields'
            });
        }

        // Send email to admin
        await transporter.sendMail({
            from: process.env.EMAIL_USER,
            to: 'angelodawkins010@gmail.com',
            subject: `Contact Form: ${subject}`,
            html: `
                <h2>New Contact Form Submission</h2>
                <p><strong>Name:</strong> ${name}</p>
                <p><strong>Email:</strong> ${email}</p>
                <p><strong>Subject:</strong> ${subject}</p>
                <p><strong>Message:</strong></p>
                <p>${message}</p>
            `
        });

        res.json({
            success: true,
            message: 'Message sent successfully'
        });

    } catch (error) {
        console.error('Error sending contact message:', error);
        res.status(500).json({
            success: false,
            message: 'Error sending message'
        });
    }
});

// Newsletter subscription
app.post('/api/newsletter', async (req, res) => {
    const connection = await pool.getConnection();
    
    try {
        const { email } = req.body;

        if (!email) {
            return res.status(400).json({
                success: false,
                message: 'Email is required'
            });
        }

        // Check if already subscribed
        const [existing] = await connection.execute(
            'SELECT id FROM newsletter_subscribers WHERE email = ?',
            [email]
        );

        if (existing.length > 0) {
            return res.status(400).json({
                success: false,
                message: 'Email already subscribed'
            });
        }

        // Insert new subscriber
        await connection.execute(
            'INSERT INTO newsletter_subscribers (email, subscribed_at) VALUES (?, NOW())',
            [email]
        );

        // Send welcome email
        await transporter.sendMail({
            from: process.env.EMAIL_USER,
            to: email,
            subject: 'Welcome to Angelina Newsletter!',
            html: `
                <h2>Thank You for Subscribing!</h2>
                <p>You'll now receive our latest updates and news.</p>
                <p>Stay tuned for amazing content!</p>
            `
        });

        res.json({
            success: true,
            message: 'Successfully subscribed to newsletter'
        });

    } catch (error) {
        console.error('Error subscribing to newsletter:', error);
        res.status(500).json({
            success: false,
            message: 'Error processing subscription'
        });
    } finally {
        connection.release();
    }
});

// ============================================
// EMAIL FUNCTIONS
// ============================================

async function sendClientConfirmation(email, data) {
    try {
        await transporter.sendMail({
            from: process.env.EMAIL_USER,
            to: email,
            subject: 'Appointment Request Received - Angelina',
            html: `
                <!DOCTYPE html>
                <html>
                <head>
                    <style>
                        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
                        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
                        .header { background: linear-gradient(135deg, #00f0ff, #a000ff); padding: 30px; text-align: center; }
                        .header h1 { color: #000; margin: 0; }
                        .content { background: #f9f9f9; padding: 30px; }
                        .info-box { background: white; padding: 20px; margin: 20px 0; border-left: 4px solid #00f0ff; }
                        .footer { text-align: center; padding: 20px; color: #666; font-size: 14px; }
                    </style>
                </head>
                <body>
                    <div class="container">
                        <div class="header">
                            <h1>Angelina</h1>
                        </div>
                        <div class="content">
                            <h2>Hello ${data.firstName} ${data.surname}!</h2>
                            <p>Thank you for your appointment request. We've received your information and will review it shortly.</p>
                            
                            <div class="info-box">
                                <h3>Your Request Details:</h3>
                                <p><strong>Appointment ID:</strong> #${data.appointmentId}</p>
                                <p><strong>Service:</strong> ${data.work}</p>
                                <p><strong>Package:</strong> ${data.ranking}</p>
                            </div>
                            
                            <p>We typically respond within 24 hours. If you have any urgent questions, feel free to contact us directly:</p>
                            <ul>
                                <li>Email: angelodawkins010@gmail.com</li>
                                <li>WhatsApp: +234 912 955 2644</li>
                                <li>Phone: +234 912 955 2644</li>
                            </ul>
                        </div>
                        <div class="footer">
                            <p>&copy; 2026 Angelina | All Rights Reserved</p>
                        </div>
                    </div>
                </body>
                </html>
            `
        });
    } catch (error) {
        console.error('Error sending client confirmation:', error);
    }
}

async function sendAdminNotification(data) {
    try {
        await transporter.sendMail({
            from: process.env.EMAIL_USER,
            to: 'angelodawkins010@gmail.com',
            subject: `New Appointment Request #${data.appointmentId}`,
            html: `
                <h2>New Appointment Request</h2>
                <p><strong>ID:</strong> #${data.appointmentId}</p>
                <p><strong>Client:</strong> ${data.firstName} ${data.surname}</p>
                <p><strong>Email:</strong> ${data.email}</p>
                <p><strong>Phone:</strong> ${data.phone}</p>
                <p><strong>Service:</strong> ${data.work}</p>
                <p><strong>Package:</strong> ${data.ranking}</p>
                <p><strong>Description:</strong></p>
                <p>${data.description}</p>
            `
        });
    } catch (error) {
        console.error('Error sending admin notification:', error);
    }
}

async function sendStatusUpdateEmail(appointment, status) {
    const statusMessages = {
        accepted: 'Your appointment has been accepted! We will contact you soon to discuss the details.',
        rejected: 'We regret to inform you that we cannot proceed with your request at this time.',
        completed: 'Your project has been completed! Thank you for working with us.'
    };

    if (statusMessages[status]) {
        try {
            await transporter.sendMail({
                from: process.env.EMAIL_USER,
                to: appointment.email,
                subject: `Appointment Update - #${appointment.id}`,
                html: `
                    <h2>Appointment Status Update</h2>
                    <p>Hello ${appointment.first_name}!</p>
                    <p>${statusMessages[status]}</p>
                    <p>If you have any questions, please contact us.</p>
                `
            });
        } catch (error) {
            console.error('Error sending status update email:', error);
        }
    }
}

// ============================================
// SERVE STATIC FILES
// ============================================

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// ============================================
// ERROR HANDLING
// ============================================

app.use((req, res) => {
    res.status(404).json({ success: false, message: 'Endpoint not found' });
});

app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({ success: false, message: 'Internal server error' });
});

// ============================================
// START SERVER
// ============================================

app.listen(PORT, () => {
    console.log(`🚀 Server running on http://localhost:${PORT}`);
    console.log(`📧 Email: angelodawkins010@gmail.com`);
    console.log(`📱 WhatsApp: +234 912 955 2644`);
});

// Handle graceful shutdown
process.on('SIGTERM', () => {
    console.log('SIGTERM signal received: closing HTTP server');
    server.close(() => {
        console.log('HTTP server closed');
        pool.end();
    });
});
