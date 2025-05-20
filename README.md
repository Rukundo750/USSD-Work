# SACCO USSD Application

A bilingual USSD application for SACCO (Savings and Credit Cooperative) built with Node.js, Express, and SQLite3.

## Features

- Bilingual support (English and Kinyarwanda)
- USSD interface
- SQLite3 database integration

## Prerequisites

- Node.js (v12 or higher)
- npm (Node Package Manager)

## Installation

1. Clone the repository
2. Install dependencies:
```bash
npm install
```

## Running the Application

To start the application in development mode:
```bash
npm run dev
```

To start the application in production mode:
```bash
npm start
```

The server will start on port 3000.

## Testing the USSD

You can test the USSD endpoint using tools like Postman or any USSD simulator. Send a POST request to:
```
http://localhost:3000/ussd
```

With the following sample body:
```json
{
    "sessionId": "123456",
    "serviceCode": "*123#",
    "phoneNumber": "250788123456",
    "text": ""
}
```

## Language Support

The application supports two languages:
1. English
2. Kinyarwanda

Users can switch between languages using the menu options. 