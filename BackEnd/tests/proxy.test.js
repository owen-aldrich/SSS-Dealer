const { listen } = require("./helpers");
const { test } = require("node:test");
const assert = require("node:assert/strict");
const http = require("node:http");
const express = require("express");
const { createFrontendApp } = require("../../FrontEnd/src/app");
const { createProxy } = require("../../FrontEnd/src/proxy");

function echoApp(name) {
  const app = express();
  app.use(express.raw({ type: () => true, limit: "6mb" }));
  app.use(["/api/auth", "/api/account", "/api/cars", "/api/favorites", "/api/compare", "/api/test-drive", "/api/leads", "/uploads"], (req, res) => {
    res.set("X-Upstream-Service", name).status(202).json({
      service: name,
      method: req.method,
      url: req.originalUrl,
      authorization: req.headers.authorization,
      contentType: req.headers["content-type"],
      body: Buffer.isBuffer(req.body) ? req.body.toString("base64") : "",
    });
  });
  app.use((_req, res) => res.status(404).json({ status: "error" }));
  return app;
}

async function proxyStack(t) {
  const backend = await listen(t, echoApp("backend"));
  return listen(t, createFrontendApp({ backendUrl: backend.url }));
}

test("all seven API prefixes reach the backend with path, query, method, and auth intact", async t => {
  const frontend = await proxyStack(t);
  for (const prefix of ["auth", "account", "cars", "favorites", "compare", "test-drive", "leads"]) {
    const url = `/api/${prefix}/example?ids=1%2C2&search=AMG+GT`;
    const response = await fetch(frontend.url + url, { method: "PATCH", headers: { Authorization: "Bearer unchanged-token" } });
    assert.equal(response.status, 202);
    assert.equal(response.headers.get("x-upstream-service"), "backend");
    const data = await response.json();
    assert.equal(data.service, "backend");
    assert.equal(data.method, "PATCH");
    assert.equal(data.url, url);
    assert.equal(data.authorization, "Bearer unchanged-token");
  }
  const upload = await fetch(frontend.url + "/uploads/car_photos/example.jpg");
  assert.equal(upload.status, 202);
  assert.equal((await upload.json()).url, "/uploads/car_photos/example.jpg");
});

test("JSON, URL-encoded forms, and binary multipart uploads reach the backend byte for byte", async t => {
  const frontend = await proxyStack(t);
  const boundary = "sss-dealer-test-boundary";
  const multipart = Buffer.concat([
    Buffer.from(`--${boundary}\r\nContent-Disposition: form-data; name="image"; filename="car.jpg"\r\nContent-Type: image/jpeg\r\n\r\n`),
    Buffer.from([0xff, 0xd8, 0x00, 0x01, 0xff, 0xd9]),
    Buffer.from(`\r\n--${boundary}--\r\n`),
  ]);
  for (const [contentType, body] of [
    ["application/json", Buffer.from(JSON.stringify({ name: "AMG GT", price: 1898000000 }))],
    ["application/x-www-form-urlencoded", Buffer.from("identifier=owen%40example.com&password=test%2Bpassword")],
    [`multipart/form-data; boundary=${boundary}`, multipart],
  ]) {
    const response = await fetch(frontend.url + "/api/cars/upload-image", {
      method: "POST", headers: { "Content-Type": contentType, Authorization: "Bearer upload-token" }, body,
    });
    assert.equal(response.status, 202);
    const result = await response.json();
    assert.equal(result.body, body.toString("base64"));
    assert.equal(result.contentType, contentType);
    assert.equal(result.authorization, "Bearer upload-token");
  }
});

test("frontend serves existing public and admin pages and keeps API errors out of its page fallback", async t => {
  const frontend = await proxyStack(t);
  for (const url of ["/", "/cars.html", "/car-detail.html", "/compare.html", "/guides.html", "/test-drive.html", "/account.html", "/signin.html", "/signup.html", "/admin/", "/admin/car-form.html", "/admin/test-drive.html", "/admin/leads.html"]) {
    const response = await fetch(frontend.url + url);
    assert.equal(response.status, 200, url);
    assert.match(response.headers.get("content-type"), /text\/html/);
    await response.text();
  }
  for (const url of ["/api/unknown", "/api", "/api/authentic"]) {
    const response = await fetch(frontend.url + url);
    assert.equal(response.status, 404, url);
    assert.equal((await response.json()).status, "error");
  }
  for (const url of ["/missing.css", "/.env", "/package.json", "/BackEnd/database/schema.sql", "/BackEnd/src/server.js"]) {
    const response = await fetch(frontend.url + url);
    assert.equal(response.status, 404, url);
    await response.text();
  }
  const fallback = await fetch(frontend.url + "/unmatched-navigation");
  assert.equal(fallback.status, 200);
  await fallback.text();
});

test("an unavailable backend returns JSON 502 while frontend pages keep responding", async t => {
  const dead = await listen(t, express());
  await new Promise(resolve => dead.server.close(resolve));
  const frontend = await listen(t, createFrontendApp({ backendUrl: dead.url }));
  const failed = await fetch(frontend.url + "/api/auth/signin", { method: "POST" });
  assert.equal(failed.status, 502);
  assert.equal((await failed.json()).status, "error");
  const page = await fetch(frontend.url + "/cars.html");
  assert.equal(page.status, 200);
  assert.match(page.headers.get("content-type"), /text\/html/);
  await page.text();
});

test("an inactive upstream times out with JSON 504", async t => {
  const upstream = await listen(t, http.createServer(() => {}));
  const app = express();
  app.use(createProxy(upstream.url, { timeout: 80 }));
  const proxy = await listen(t, app);
  const response = await fetch(proxy.url + "/api/cars");
  assert.equal(response.status, 504);
  assert.equal((await response.json()).status, "error");
});
