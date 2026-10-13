const { describe, it } = require("node:test");
const assert = require("node:assert/strict");
const { spawnSync } = require("node:child_process");
const path = require("node:path");

const index = path.join(__dirname, "../src/index.js");

// Empty values also win over backend/.env, so a local .env cannot fill them in.
const start = (vars) =>
  spawnSync(process.execPath, [index], {
    env: { ...process.env, NODE_ENV: "production", PORT: "0", ...vars },
    encoding: "utf8",
    timeout: 10000,
  });

describe("startup", () => {
  it("exits non-zero and names every missing required variable", () => {
    const result = start({ MONGO_URI: "", JWT_SECRET: "" });

    assert.equal(result.status, 1);
    assert.match(result.stderr, /MONGO_URI/);
    assert.match(result.stderr, /JWT_SECRET/);
  });

  it("names only the variable that is missing", () => {
    const result = start({ MONGO_URI: "mongodb://127.0.0.1:9/unused", JWT_SECRET: "" });

    assert.equal(result.status, 1);
    assert.match(result.stderr, /JWT_SECRET/);
    assert.doesNotMatch(result.stderr, /MONGO_URI/);
  });
});
