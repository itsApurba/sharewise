// Tests run against an in-memory MongoDB (see helpers.js) and never use the URI from .env.
// Pointing MONGO_URI at a closed local port keeps the shared database unreachable even if
// something connects through src/config/mongoose.js by mistake.
process.env.NODE_ENV = "test";
process.env.MONGO_URI = "mongodb://127.0.0.1:9/sharewise-tests-must-not-use-this";
process.env.JWT_SECRET = "test-secret";
