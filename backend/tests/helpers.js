require("./env");
const mongoose = require("mongoose");
const request = require("supertest");
const { MongoMemoryServer } = require("mongodb-memory-server");
const app = require("../src/config/express");
const clock = require("../src/lib/clock");

let mongod;

/** Starts an in-memory MongoDB and builds every model's indexes. */
async function startDb() {
  mongod = await MongoMemoryServer.create();
  await mongoose.connect(mongod.getUri());
  await Promise.all(Object.values(mongoose.models).map((model) => model.init()));
}

async function stopDb() {
  clock.reset();
  await mongoose.disconnect();
  if (mongod) await mongod.stop();
}

/** Empties every collection and unpins the clock, for a fresh start per test. */
async function resetDb() {
  clock.reset();
  await Promise.all(Object.values(mongoose.connection.collections).map((c) => c.deleteMany({})));
}

const api = () => request(app);

/** Signs up `handle` (email `<handle>@example.com`, password "password123") and returns { token, user, auth }. */
async function signup(handle, extra = {}) {
  const res = await api()
    .post("/api/auth/signup")
    .send({ name: handle[0].toUpperCase() + handle.slice(1), handle, email: `${handle}@example.com`, password: "password123", ...extra });
  if (res.status !== 201) throw new Error(`signup ${handle}: ${res.status} ${JSON.stringify(res.body)}`);
  return { ...res.body, auth: ["Authorization", `Bearer ${res.body.token}`] };
}

/** Creates a lesson as `who` and returns it. */
async function createLesson(who, fields = {}) {
  const res = await api()
    .post("/api/lessons")
    .set(...who.auth)
    .send({ title: "A useful lesson", body: "Something worth remembering.", ...fields });
  if (res.status !== 201) throw new Error(`createLesson: ${res.status} ${JSON.stringify(res.body)}`);
  return res.body.lesson;
}

module.exports = { startDb, stopDb, resetDb, api, signup, createLesson, clock };
