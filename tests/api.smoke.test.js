const test = require("node:test");
const assert = require("node:assert/strict");
const http = require("node:http");

process.env.PAYSTACK_SECRET_KEY = "";
process.env.PAYSTACK_WEBHOOK_SECRET = "";

const app = require("../src/app");

let server;
let baseUrl;

test.before(async () => {
  server = http.createServer(app);
  await new Promise((resolve) => {
    server.listen(0, "127.0.0.1", resolve);
  });

  const address = server.address();
  baseUrl = `http://127.0.0.1:${address.port}`;
});

test.after(async () => {
  if (!server) return;
  await new Promise((resolve, reject) => {
    server.close((err) => (err ? reject(err) : resolve()));
  });
});

test("GET /api/health returns success payload", async () => {
  const res = await fetch(baseUrl + "/api/health");
  assert.equal(res.status, 200);

  const data = await res.json();
  assert.equal(data.success, true);
  assert.equal(data.status, "ok");
  assert.ok(typeof data.timestamp === "string");
});

test("POST /api/content/import requires auth", async () => {
  const res = await fetch(baseUrl + "/api/content/import", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ entities: { members: [] } })
  });

  assert.equal(res.status, 401);
});

test("payments endpoints return 503 when gateway is not configured", async () => {
  const initRes = await fetch(baseUrl + "/api/payments/initialize", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      email: "donor@example.com",
      amount: 10000,
      donorName: "Test Donor"
    })
  });
  assert.equal(initRes.status, 503);

  const verifyRes = await fetch(baseUrl + "/api/payments/verify/test-reference");
  assert.equal(verifyRes.status, 503);

  const webhookRes = await fetch(baseUrl + "/api/payments/webhook/paystack", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ event: "charge.success" })
  });
  assert.equal(webhookRes.status, 503);
});
