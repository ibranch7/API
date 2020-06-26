const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const https = require("https");
const fs = require('fs');

const options = {
    key: fs.readFileSync(" /etc/letsencrypt/live/sppssp.xyz/privkey.pem"),
    cert: fs.readFileSync("/etc/letsencrypt/live/sppssp.xyz/fullchain.pem")
  };

const app = express();
app.use(cors());
app.use(function (req, res, next) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, PATCH, DELETE');
    res.setHeader('Access-Control-Allow-Headers', 'X-Requested-With,content-type');
    res.setHeader('Access-Control-Allow-Credentials', true);
    next();
});

app.use(bodyParser.urlencoded({extended: true, limit: '50mb', parameterLimit: Number.MAX_SAFE_INTEGER}));
app.use(bodyParser.json());

app.use((err, req, res, next) => {
    if (err instanceof SyntaxError) {
        console.log(err);
        res.status(400).send({type: "Error", message: "Invalid request"});
    } else {
        next();
    }
});

const PORT = process.env.PORT || 3000;

const API = require('./routes/api');
app.use("/api", API);

https.createServer(options, app).listen(PORT, function () {
    console.log(`Server started in ${PORT}`);
});
