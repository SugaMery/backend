
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
const Docxtemplater = require('docxtemplater');
const JSZip = require('jszip');
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
    database: 'database_myallo',
});

// Registration

app.post('/users', async (req, res) => {
    const { last_name, first_name, telephone, email, role, password } = req.body;

    try {
        // Hash the password
        const hashedPassword = await bcrypt.hash(password, 10);

        // SQL query with the new table and column names
        const sql = 'INSERT INTO users (last_name, first_name, telephone, email, role, password) VALUES (?, ?, ?, ?, ?, ?)';

        db.query(sql, [last_name, first_name, telephone, email, role, hashedPassword], (err, result) => {
            if (err) {
                console.error(err);
                res.status(500).json({ message: 'Internal Server Error' });
                return;
            }

            res.json({ message: 'User created successfully', id: result.insertId });
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Internal Server Error' });
    }
});

// ... (rest of your code)
// Login
app.post('/login', (req, res) => {
    const { email, password } = req.body;

    // SQL query with the new table and column names
    const sql = 'SELECT * FROM users WHERE email = ?';

    db.query(sql, [email], async (err, results) => {
        if (err) {
            console.error(err);
            res.status(500).json({ message: 'Internal Server Error' });
            return;
        }

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

// Update endpoint for creating addresses
app.post('/addresses', (req, res) => {
    const { address_line1, address_line2, location_id, customer_id } = req.body;

    // SQL query with the new table and column names
    const sql = 'INSERT INTO addresses (address_line1, address_line2, location_id, customer_id) VALUES (?, ?, ?, ?)';

    db.query(sql, [address_line1, address_line2, location_id, customer_id], (err, result) => {
        if (err) {
            console.error(err);
            res.status(500).json({ message: 'Internal Server Error' });
            return;
        }

        res.json({ message: 'Address inserted successfully', id: result.insertId });
    });
});

// Update endpoint for creating customers
app.post('/customers', (req, res) => {
    const { civility, firstname, lastname, email, phone, birthdate, company } = req.body;

    // SQL query with the new table and column names
    const sql = 'INSERT INTO customers (civility, firstname, lastname, email, phone, birthdate, company) VALUES (?, ?, ?, ?, ?, ?, ?)';

    db.query(sql, [civility, firstname, lastname, email, phone, birthdate, company], (err, result) => {
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

    // SQL query with the new table and column names
    const sql = 'INSERT INTO financialinformations (customer_id, iban, bic, payment_day) VALUES (?, ?, ?, ?)';

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

    // SQL query with the new table and column names
    const sql = 'INSERT INTO locations (zipcode, city, country) VALUES (?, ?, ?)';

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
    const { client_id, agent_id, contract_forfait, status } = req.body;

    // SQL query with the new table and column names
    const sql = 'INSERT INTO options (client_id, agent_id, contract_forfait, status) VALUES (?, ?, ?, ?)';

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

    // SQL query with the new table and column names
    const sql = 'UPDATE options SET status = ? WHERE id = ?';

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

    // SQL query with the new table and column names
    const sql = `
        SELECT
            options.*,
            customers.firstname AS customer_nom,
            customers.lastname AS customer_prenom,
            addresses.address_line1,
            addresses.address_line2,
            locations.zipcode,
            locations.city,
            locations.country
        FROM
            options
        INNER JOIN customers ON options.client_id = customers.id
        INNER JOIN addresses ON customers.id = addresses.customer_id
        INNER JOIN locations ON addresses.location_id = locations.id
        WHERE
            options.agent_id = ?
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






app.set('view engine', 'word'); // Change the view engine to 'word'
const moment = require('moment');



app.post('/generate-contract/:optionId', async (req, res) => {
    const optionId = req.params.optionId;

    // Log the received optionId for debugging
    console.log('Received optionId:', optionId);

    // Fetch data needed for the contract
    const sql = `
        SELECT
            Options.*,
            Customers.firstname AS firstname,
            Customers.lastname AS lastname,
            Customers.email AS email,
            Customers.birthdate AS birthdate,
            Customers.phone AS phone,
            Users.first_name AS agent_firstname,
            Users.last_name AS agent_lastname,
            Locations.city AS city,
            Locations.zipcode AS zipcode,
            Addresses.address_line1 AS address_line1,
            Addresses.address_line2 AS address_line2,
            FinancialInformations.payment_day AS payment_day 
        FROM
            Options
                INNER JOIN Customers ON Options.client_id = Customers.id
                INNER JOIN Users ON Options.agent_id = Users.id
                INNER JOIN Addresses ON customers.id = Addresses.customer_id
                INNER JOIN Locations ON Addresses.location_id = Locations.id
                INNER JOIN FinancialInformations ON Customers.id = FinancialInformations.customer_id
        WHERE
            Options.id = ?;
    
`;

    // Log the SQL query and its parameters for debugging
    console.log('SQL Query:', sql);
    console.log('SQL Parameters:', [optionId]);

    db.query(sql, [optionId], async (err, results) => {
        if (err) {
            console.error(err);
            res.status(500).json({ message: 'Internal Server Error' });
            return;
        }

        // Log the results for debugging
        console.log('Query Results:', results);

        if (results.length === 0) {
            res.status(404).json({ message: 'Option not found' });
            return;
        }

        const option = results[0];

        // Read the Word template file
        const templatePath = path.join(__dirname, 'views', 'contart_1.docx');
        const templateContent = fs.readFileSync(templatePath, 'binary');

        // Create a docxtemplater instance
        const zip = new JSZip(templateContent);
        const doc = new Docxtemplater();
        doc.loadZip(zip);

        // Set data for the template
        // Log the contents of the option object for debugging
        console.log('Option:', option);
        option.birthdate = moment(option.birthdate).format('MM/DD/YYYY');
// Set data for the template
        //doc.setData({ option });
        // Set data for the template
        doc.setData({
            agent_lastname: option.agent_lastname,
            agent_firstname: option.agent_firstname,
            lastname: option.lastname,
            email : option.email,
            firstname: option.firstname,
            birthdate : option.birthdate,
            phone : option.phone,
            city : option.city,
            zipcode : option.zipcode,
            address_line1 : option.address_line1,
            ddress_line2 : option.ddress_line2,
            contract_forfait : option.contract_forfait,
            payment_day : option.payment_day
        });



        try {
            // Render the template
            doc.render();
        } catch (error) {
            console.error(error);
            res.status(500).json({ message: 'Error rendering template', error: error.message });
            return;
        }

        // Save the generated Word document
        const wordPath = path.join(__dirname, `contract_${optionId}.docx`);
        fs.writeFileSync(wordPath, doc.getZip().generate({ type: 'nodebuffer' }));

        // Respond to the client with the path to the saved Word document
        res.json({ message: 'Contract generated', wordPath });
    });
});

app.listen(port, () => {

    console.log(`Server is running on port ${port}`);
});
