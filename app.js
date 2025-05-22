const express = require('express');
const bodyParser = require('body-parser');
const { Pool } = require('pg');

const app = express();
const port = 3000;

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Database setup
const pool = new Pool({
    connectionString: process.env.DATABASE_URL || 'postgres://postgres:123@localhost:5432/ussd'
});

// Initialize database tables
async function initializeDatabase() {
    try {
        const client = await pool.connect();
        
        // Create Sessions table
        await client.query(`
            CREATE TABLE IF NOT EXISTS Sessions (
                sessionId TEXT PRIMARY KEY,
                phoneNumber TEXT,
                userInput TEXT,
                language TEXT
            )
        `);

        // Create Transactions table
        await client.query(`
            CREATE TABLE IF NOT EXISTS Transactions (
                id SERIAL PRIMARY KEY,
                phoneNumber TEXT,
                type TEXT,
                amount DECIMAL,
                date TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `);

        client.release();
        console.log('Connected to PostgreSQL database');
    } catch (err) {
        console.error('Error initializing database:', err);
    }
}

initializeDatabase();

// Welcome messages
const welcomeMessages = {
    en: "Welcome to SACCO USSD Service\n1. Register\n2. Login\n3. Check Balance\n4. Exit",
    rw: "Murakaza neza kuri SACCO USSD Service\n1. Iyandikishe\n2. Injira\n3. Reba Amafaranga\n4. Gusohoka"
};

// Helper to store or update session
async function saveSession(sessionId, phoneNumber, text, language = null) {
    try {
        const result = await pool.query(
            'SELECT * FROM Sessions WHERE sessionId = $1',
            [sessionId]
        );

        if (result.rows.length > 0) {
            await pool.query(
                'UPDATE Sessions SET userInput = $1, language = $2 WHERE sessionId = $3',
                [text, language || result.rows[0].language, sessionId]
            );
        } else {
            await pool.query(
                'INSERT INTO Sessions (sessionId, phoneNumber, userInput, language) VALUES ($1, $2, $3, $4)',
                [sessionId, phoneNumber, text, language]
            );
        }
    } catch (err) {
        console.error('Error saving session:', err);
    }
}

// USSD endpoint
app.post('/ussd', (req, res) => {
    const { sessionId, serviceCode, phoneNumber, text } = req.body;
    const textValue = text.trim();
    const inputs = textValue.split('*');
    const level = inputs.length;

    let response = '';

    // Level 1: Language selection
    if (textValue === '') {
        response = 'CON Welcome to SACCO USSD Service\n1. English\n2. Kinyarwanda';
        saveSession(sessionId, phoneNumber, '', null);
    } 
    else if (level === 1) {
        let lang = inputs[0] === '1' ? 'en' : 'rw';
        response = 'CON ' + welcomeMessages[lang];
        saveSession(sessionId, phoneNumber, inputs[0], lang);
    }
    else if (level === 2) {
        const lang = inputs[0] === '1' ? 'en' : 'rw';
        const choice = inputs[1];

        if (choice === '1') {
            response = lang === 'en' ? 'CON Enter your full name to register:' : 'CON Andika amazina yawe yose:';
        } else if (choice === '2') {
            response = lang === 'en' ? "CON Enter your Member ID to login:" : "CON Andika nimero y'indangamuntu yawe:";
        } else if (choice === '3') {
            // Dummy balance response
            response = lang === 'en' ? 'END Your balance is: RWF 20,000' : 'END Amafaranga ufite: RWF 20,000';
        } else if (choice === '4') {
            response = lang === 'en' ? 'END Thank you for using SACCO Service.' : 'END Murakoze gukoresha SACCO.';
        } else {
            response = 'END Invalid option.';
        }

        saveSession(sessionId, phoneNumber, textValue);
    }
    else if (level === 3) {
        const lang = inputs[0] === '1' ? 'en' : 'rw';
        const action = inputs[1];
        const userInput = inputs[2];

        if (action === '1') {
            // Register the user (for demo, not saving yet)
            response = lang === 'en'
                ? `END ${userInput}, you are successfully registered!`
                : `END ${userInput}, mwiyandikishije neza!`;
        } else if (action === '2') {
            // Login (mock)
            response = lang === 'en'
                ? `END Welcome back, Member ID: ${userInput}`
                : `END Murakaza neza, nimero yanyu: ${userInput}`;
        }

        
        saveSession(sessionId, phoneNumber, textValue);
    } 
    else {
        response = 'END Invalid input.';
    }

    res.set('Content-Type: text/plain');
    res.send(response);
});

// Start server
app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
});
