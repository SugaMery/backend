
const express = require('express');
const bodyParser = require('body-parser');
const mysql = require('mysql');
const bcrypt = require('bcrypt');
const cors = require('cors');
const PDFDocument = require('pdfkit');
const nodemailer = require('nodemailer');
// Enable CORS for all routes
const path = require('path');
const ejs = require('ejs');
const pdf = require('html-pdf');
const fs = require('fs');
const app = express();
app.use(cors());
const port = 3000;

// Middleware
app.use(bodyParser.json());

// MySQL Connection
const db = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: '123456789',
    database: 'myallo',
});

// Registration
app.post('/users', async (req, res) => {
    const { nom, prenom, telephone, email, role, password } = req.body;

    // Hash the password
    const hashedPassword = await bcrypt.hash(password, 10);

    const sql = 'INSERT INTO users (nom, prenom, telephone, email, role, password) VALUES (?, ?, ?, ?, ?, ?)';
    db.query(sql, [nom, prenom, telephone, email, role, hashedPassword], (err, result) => {
        if (err) {
            console.error(err);
            res.status(500).json({ message: 'Internal Server Error' });
            return;
        }

        res.json({ message: 'User created successfully', id: result.insertId });
    });
});

// ... (rest of your code)
// Login
app.post('/login', (req, res) => {
    const { email, password } = req.body;

    const sql = 'SELECT * FROM users WHERE email = ?';
    db.query(sql, [email], async (err, results) => {
        if (err) throw err;

        if (results.length > 0) {
            const user = results[0];

            // Compare hashed password
            const passwordMatch = await bcrypt.compare(password, user.password);

            if (passwordMatch) {
                // Remove sensitive information (like password) before sending the user object
                const { password, ...userWithoutPassword } = user;
                res.json({ message: 'Login successful', user: userWithoutPassword });
            } else {
                res.status(401).json({ message: 'Invalid credentials' });
            }
        } else {
            res.status(401).json({ message: 'Invalid credentials' });
        }
    });
});


app.post('/addresses', (req, res) => {
    const { address_line1, address_line2, location_id } = req.body;

    const sql = 'INSERT INTO Address (address_line1, address_line2, location_id) VALUES (?, ?, ?)';
    db.query(sql, [address_line1, address_line2, location_id], (err, result) => {
        if (err) {
            console.error(err);
            res.status(500).json({ message: 'Internal Server Error' });
            return;
        }

        res.json({ message: 'Address inserted successfully', id: result.insertId });
    });
});

// Similar endpoints can be added for Customer, FinancialInformation, etc.
app.post('/customers', (req, res) => {
    const { address_id, civility, firstname, lastname, email, phone, birthdate, company } = req.body;

    const sql = 'INSERT INTO Customer (address_id, civility, firstname, lastname, email, phone, birthdate, company) VALUES (?, ?, ?, ?, ?, ?, ?, ?)';
    db.query(sql, [address_id, civility, firstname, lastname, email, phone, birthdate, company], (err, result) => {
        if (err) {
            console.error(err);
            res.status(500).json({ message: 'Internal Server Error' });
            return;
        }

        res.json({ message: 'Customer inserted successfully', id: result.insertId });
    });
});

app.post('/financialinformation', (req, res) => {
    const { customer_id, iban, bic, payment_day } = req.body;

    const sql = 'INSERT INTO FinancialInformation (customer_id, iban, bic, payment_day) VALUES (?, ?, ?, ?)';
    db.query(sql, [customer_id, iban, bic, payment_day], (err, result) => {
        if (err) {
            console.error(err);
            res.status(500).json({ message: 'Internal Server Error' });
            return;
        }

        res.json({ message: 'FinancialInformation inserted successfully', id: result.insertId });
    });
});

app.post('/locations', (req, res) => {
    const { zipcode, city, country } = req.body;

    const sql = 'INSERT INTO Location (zipcode, city, country) VALUES (?, ?, ?)';
    db.query(sql, [zipcode, city, country], (err, result) => {
        if (err) {
            console.error(err);
            res.status(500).json({ message: 'Internal Server Error' });
            return;
        }

        res.json({ message: 'Location inserted successfully', id: result.insertId });
    });
});

app.post('/options', (req, res) => {
    const { client_id, agent_id, start_date, end_date, contract_forfait,status } = req.body;

    const sql = 'INSERT INTO Options (client_id, agent_id, contract_forfait,status) VALUES (?,?,?,?)';
    db.query(sql, [client_id, agent_id, contract_forfait, status], (err, result) => {
        if (err) {
            console.error(err);
            res.status(500).json({ message: 'Internal Server Error' });
            return;
        }

        res.json({ message: 'Options inserted successfully', id: result.insertId });
    });
});


// ... (your existing code)

// Update Option Status
app.put('/options/:optionId/status', (req, res) => {
    const optionId = req.params.optionId;
    const { status } = req.body;

    const sql = 'UPDATE Options SET status = ? WHERE id = ?';
    db.query(sql, [status, optionId], (err, result) => {
        if (err) {
            console.error(err);
            res.status(500).json({ message: 'Internal Server Error' });
            return;
        }

        res.json({ message: 'Option status updated successfully', id: optionId });
    });
});

// ... (rest of your code)
// ... (your existing code)

// ... (your existing code)

// Get Options for a specific agent along with customer information
app.get('/options/:agentId', (req, res) => {
    const agentId = req.params.agentId;

    const sql = `
        SELECT
            Options.*,
            Customer.firstname AS customer_nom,
            Customer.lastname AS customer_prenom,
            Address.address_line1,
            Address.address_line2,
            Location.zipcode,
            Location.city,
            Location.country
        FROM
            Options
        INNER JOIN Customer ON Options.client_id = Customer.id
        INNER JOIN Address ON Customer.address_id = Address.id
        INNER JOIN Location ON Address.location_id = Location.id
        WHERE
            Options.agent_id = ?
    `;

    db.query(sql, [agentId], (err, results) => {
        if (err) {
            console.error(err);
            res.status(500).json({ message: 'Internal Server Error' });
            return;
        }

        res.json({ options: results });
    });
});




// ... (your existing code)

// Use EJS template engine
app.set('view engine', 'ejs');

// Endpoint to generate contract
// Endpoint to generate contract
app.post('/generate-contract/:optionId', async (req, res) => {
    const optionId = req.params.optionId;

    // Fetch data needed for the contract
    const sql = `
    SELECT
         Options.*,
            Customer.firstname AS firstname,
            Customer.lastname As lastname,
            Customer.email AS customer_email,
            Users.nom AS agent_firstname,
            Users.prenom AS agent_lastname
        -- Add other necessary fields for the contract
        FROM
            Options
                INNER JOIN Customer ON Options.client_id = Customer.id
                INNER JOIN Users ON Options.agent_id = Users.id
        WHERE
            Options.id = ?
    `;

    db.query(sql, [optionId], async (err, results) => {
        if (err) {
            console.error(err);
            res.status(500).json({ message: 'Internal Server Error' });
            return;
        }

        if (results.length === 0) {
            res.status(404).json({ message: 'Option not found' });
            return;
        }

        const option = results[0];

        // Render EJS template
        ejs.renderFile('views/contract.ejs', { option }, (err, html) => {
            if (err) {
                console.error(err);
                res.status(500).json({ message: 'Internal Server Error' });
                return;
            }

            // Options for PDF
            const pdfOptions = { format: 'Letter' };

            // Generate PDF from HTML
            const pdfPath = path.join(__dirname, `contract_${optionId}.pdf`);
            pdf.create(html, pdfOptions).toFile(pdfPath, (err) => {
                if (err) {
                    console.error(err);
                    res.status(500).json({ message: 'Internal Server Error' });
                    return;
                }

                // Respond to the client with the path to the saved PDF
                res.json({ message: 'Contract generated', pdfPath });
            });
        });
    });
});

// Start server
app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
});
