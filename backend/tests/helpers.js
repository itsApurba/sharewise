require("./env");
const mongoose = require("mongoose");
const request = require("supertest");
const { MongoMemoryServer } = require("mongodb-memory-server");
const app = require("../src/config/express");

let mongod;

/** Starts an in-memory MongoDB and builds every model's indexes. */
async function startDb() {
  mongod = await MongoMemoryServer.create();
  await mongoose.connect(mongod.getUri());
  await Promise.all(Object.values(mongoose.models).map((model) => model.init()));
}

async function stopDb() {
  await mongoose.disconnect();
  if (mongod) await mongod.stop();
}

const api = () => request(app);

module.exports = { startDb, stopDb, api };
