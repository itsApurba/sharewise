const express = require("express");
const cors = require("cors");
const morgan = require("morgan");
const { logs } = require("./vars");
const bodyParser = require("body-parser");
const compress = require("compression");
const routes = require('../api/routes')

const app = express()

app.use(morgan(logs));

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

app.use(compress());
app.use(cors());


app.use('/api', routes)


module.exports = app;