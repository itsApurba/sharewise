const express = require("express");
const cors = require("cors");
const morgan = require("morgan");
const { logs } = require("./vars");
const compress = require("compression");
const routes = require('../api/routes')

const app = express()

app.use(morgan(logs));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(compress());
app.use(cors());


app.use('/api', routes)


module.exports = app;