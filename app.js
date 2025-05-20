const express = require('express');
const bodyParser = require('body-parser');
const sqlite3 = require('sqlite3').verbose();

const app = express();
const port = 3000;

// Middleware
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Database setup
const db = new sqlite3.Database('./sacco.db', (err) => {
    if (err) {
        console.error('Error opening database:', err);
    } else {
        console.log('Connected to SQLite database');
    }
});

// Welcome messages in both languages
const welcomeMessages = {
    en: "Welcome to SACCO USSD Service\n1. Continue in English\n2. Komeza mu Kinyarwanda",
    rw: "Murakaza neza kuri SACCO USSD Service\n1. Komeza mu Kinyarwanda\n2. Continue in English"
};

// USSD endpoint
app.post('/ussd', (req, res) => {
    const { sessionId, serviceCode, phoneNumber, text } = req.body;
    
    let response = '';
    
    if (text === '') {
        // Initial request - show welcome message in English
        response = welcomeMessages.en;
    } else if (text === '1') {
        // User selected English
        response = "Welcome to SACCO USSD Service\n1. Register\n2. Login\n3. Check Balance\n4. Exit";
    } else if (text === '2') {
        // User selected Kinyarwanda
        response = "Murakaza neza kuri SACCO USSD Service\n1. Iyandikishe\n2. Injira\n3. Reba Amafaranga\n4. Gusohoka";
    }
    
    res.send(response);
});

// Start server
app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
}); 