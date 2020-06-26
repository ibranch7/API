# How to start :

run in terminal, theses commands :
1) cd SpotUpgradeAPI
2) npm install
3) node app.js

# API Endpoints :

POST /api/restock
JSON :
{
    "accounts": [
        {
            "user": "user1@email.com",
            "pass": "passw0rd1"
        },
        {
            "user": "user2@email.com",
            "pass": "passw0rd2"
        }
    ]
}

POST /api/upgrade
JSON :
{
    "account": {
        "user": "user@email.com",
        "pass": "passw0rd",
        "key": "SPOT-XXXX-XXXX-XXXX-XXXX"
    }
}

POST /api/replacement
JSON :
{
    "account": {
        "user": "user@email.com",
        "pass": "passw0rd" <-(optional)
    }
}

POST /api/keys
JSON :
{
    "amount": 10
}

# API Responses and errors :

FAMILY_INVALID_ADDRESS: {type: "FAMILY_INVALID_ADDRESS", message: "Address is invalid"},
FAMILY_NO_SLOTS: {type: "FAMILY_NO_SLOTS", message: "No slots available"},
FAMILY_HOME_NOT_FOUND: {type: "FAMILY_HOME_NOT_FOUND", message: "Home not found"},
LOGIN_INVALID_CSRF: {type: "LOGIN_INVALID_CSRF", message: "The cookie 'csrf_token' was not found"},
LOGIN_INVALID_SPDC: {type: "LOGIN_INVALID_SPDC", message: "The cookie 'spdc' was not found"},
LOGIN_INVALID_CREDENTIALS: {type: "LOGIN_INVALID_CREDENTIALS", message: "Invalid credentials"},
INVALID_PLAN: {type: "INVALID_PLAN", message: "Account is not premium family"},
DATABASE_EXISTS: {type: "DATABASE_EXISTS", message: "Database already contains this account"},
EXISTS_ACCOUNT: {type: 'EXISTS_ACCOUNT', message: "You must use replacement"},
INVALID_KEY: {type: 'INVALID_KEY', message: "Key is invalid"},
NOT_EXISTS_ACCOUNT: {type: 'NOT_EXISTS_ACCOUNT', message: "You must use upgrade"},
ACCOUNT_REPLACEMENT: {type: "ACCOUNT_REPLACEMENT", message: "You must use replacement"},
ACCOUNT_UPDATED: {type: "ACCOUNT_UPDATED", message: "Account updated"},
NO_FAMILY_IN_STOCK: {type: "NO_FAMILY_IN_STOCK", message: "No family in stock"},
DATABASE_NOT_CONNECTED: {type: "DATABASE_NOT_CONNECTED", message: "Not connected to database"},
REPLACEMENT_PASS_REQUIRED: {type: "REPLACEMENT_PASS_REQUIRED", message: "Invalid credentials, you must update your password"},
INVALID_BODY: {type: "INVALID_BODY", message: "Invalid body"}