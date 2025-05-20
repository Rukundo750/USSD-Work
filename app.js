const express = require('express');
const bodyParser = require('body-parser');
const sqlite3 = require('sqlite3').verbose();

const app = express();
const port = 3000;

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Database setup
const db = new sqlite3.Database('./sacco.db', (err) => {
    if (err) {
        console.error('Error opening database:', err);
    } else {
        console.log('Connected to SQLite database');
        db.run(`CREATE TABLE IF NOT EXISTS Sessions (
            sessionId TEXT PRIMARY KEY,
            phoneNumber TEXT,
            userInput TEXT,
            language TEXT
        )`);

        db.run(`CREATE TABLE IF NOT EXISTS Transactions (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            phoneNumber TEXT,
            type TEXT,
            amount REAL,
            date TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )`);
    }
});

// Welcome messages
const welcomeMessages = {
    en: "Welcome to SACCO USSD Service\n1. Register\n2. Login\n3. Check Balance\n4. Exit",
    rw: "Murakaza neza kuri SACCO USSD Service\n1. Iyandikishe\n2. Injira\n3. Reba Amafaranga\n4. Gusohoka"
};

// Helper to store or update session
function saveSession(sessionId, phoneNumber, text, language = null) {
    db.get("SELECT * FROM Sessions WHERE sessionId = ?", [sessionId], (err, row) => {
        if (row) {
            db.run("UPDATE Sessions SET userInput = ?, language = ? WHERE sessionId = ?", [text, language || row.language, sessionId]);
        } else {
            db.run("INSERT INTO Sessions (sessionId, phoneNumber, userInput, language) VALUES (?, ?, ?, ?)", [sessionId, phoneNumber, text, language]);
        }
    });
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
            response = lang === 'en' ? 'CON Enter your Member ID to login:' : 'CON Andika nimero y’indangamuntu yawe:';
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
