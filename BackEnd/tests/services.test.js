const { listen, mockQueries } = require("./helpers");
const { test, after } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs/promises");
const os = require("node:os");
const path = require("node:path");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const db = require("../src/lib/db");
const { carStorage, profileStorage } = require("../src/config/cloudinary");
const { createBackendApp } = require("../src/app");
const { createFrontendApp } = require("../../FrontEnd/src/app");

after(() => db.end());

function auth(role = "user") {
  return { Authorization: `Bearer ${jwt.sign({ id: 7, username: "buyer", role }, process.env.JWT_SECRET, { expiresIn: "1h" })}` };
}

async function fullStack(t) {
  const backend = await listen(t, createBackendApp());
  return listen(t, createFrontendApp({ backendUrl: backend.url }));
}

function jsonRequest(method, body, headers = {}) {
  return { method, headers: { "Content-Type": "application/json", ...headers }, body: JSON.stringify(body) };
}

test("signin issues a token usable by the protected APIs and never returns the password", async t => {
  t.mock.method(console, "log", () => {});
  const stack = await fullStack(t);
  const user = { id: 7, username: "buyer", fullname: "Test Buyer", role: "user", email: "buyer@example.com", password: await bcrypt.hash("secret123", 4) };
  const calls = mockQueries(t, db, [[user], [{ id: 11, name: "911 GT3", price: "3420000000.00" }], []]);
  const login = await fetch(stack.url + "/api/auth/signin", jsonRequest("POST", { identifier: "buyer", password: "secret123" }));
  assert.equal(login.status, 200);
  const session = await login.json();
  assert.equal(session.user.username, "buyer");
  assert.equal(session.user.password, undefined);
  assert.equal(jwt.verify(session.token, process.env.JWT_SECRET).id, 7);

  const headers = { Authorization: `Bearer ${session.token}` };
  const favorites = await fetch(stack.url + "/api/favorites", { headers });
  assert.equal(favorites.status, 200);
  assert.equal((await favorites.json()).data[0].price, 3420000000);
  const bookings = await fetch(stack.url + "/api/test-drive", { headers });
  assert.equal(bookings.status, 403);
  await bookings.json();
  const ownBookings = await fetch(stack.url + "/api/test-drive/me", { headers });
  assert.equal(ownBookings.status, 200);
  assert.deepEqual((await ownBookings.json()).data, []);
  assert.deepEqual(calls[1].params, [7]);
  assert.deepEqual(calls[2].params, [7]);
});

test("protected endpoints reject missing and invalid JWTs without querying the database", async t => {
  const stack = await fullStack(t);
  const calls = mockQueries(t, db, []);
  for (const path of ["/api/auth/me", "/api/account", "/api/favorites", "/api/compare", "/api/test-drive/me", "/api/leads"]) {
    for (const headers of [{}, { Authorization: "Bearer invalid-token" }]) {
      const response = await fetch(stack.url + path, { headers });
      assert.equal(response.status, 401, path);
      assert.equal((await response.json()).status, "error");
    }
  }
  assert.equal(calls.length, 0);
});

test("admin-only writes remain forbidden for regular users", async t => {
  const stack = await fullStack(t);
  const calls = mockQueries(t, db, []);
  for (const [method, path] of [["POST", "/api/cars"], ["PUT", "/api/cars/1"], ["DELETE", "/api/cars/1"], ["POST", "/api/leads"], ["PUT", "/api/leads/1"], ["DELETE", "/api/leads/1"], ["PATCH", "/api/test-drive/1"]]) {
    const response = await fetch(stack.url + path, jsonRequest(method, {}, auth()));
    assert.equal(response.status, 403, `${method} ${path}`);
    await response.json();
  }
  assert.equal(calls.length, 0);
});

test("catalog filtering and price serialization retain the existing response contract", async t => {
  const stack = await fullStack(t);
  const calls = mockQueries(t, db, [[{ id: 1, name: "911 GT3", brand: "Porsche", price: "3420000000.00", status: "available" }]]);
  const response = await fetch(stack.url + "/api/cars?brand=Porsche&search=911&type=Sports%20Car");
  assert.equal(response.status, 200);
  assert.deepEqual((await response.json()).data[0], { id: 1, name: "911 GT3", brand: "Porsche", price: 3420000000, status: "available" });
  assert.match(calls[0].sql, /status IN \('available', 'reserved'\)/);
  assert.deepEqual(calls[0].params, ["Porsche", "Sports Car", "%911%", "%911%"]);
});

test("draft and sold car details remain unavailable to public callers", async t => {
  const stack = await fullStack(t);
  mockQueries(t, db, [[{ id: 1, status: "draft" }], [{ id: 2, status: "sold" }]]);
  for (const id of [1, 2]) {
    const response = await fetch(stack.url + `/api/cars/${id}`);
    assert.equal(response.status, 404);
    assert.equal((await response.json()).status, "error");
  }
});

test("booking preserves user identity, available-car checks, and conflict responses", async t => {
  const stack = await fullStack(t);
  const booking = { car_id: 11, name: "Test Buyer", email: "buyer@example.com", phone: "08123456789", preferred_date: "2027-01-20", preferred_time: "10:00", message: "Morning drive" };
  const calls = mockQueries(t, db, [[{ id: 11, status: "available" }], [], { insertId: 3 }, [{ id: 11, status: "reserved" }], [{ id: 11, status: "available" }], [{ id: 3 }]]);
  const success = await fetch(stack.url + "/api/test-drive", jsonRequest("POST", booking, auth()));
  assert.equal(success.status, 200);
  assert.equal((await success.json()).status, "success");
  assert.deepEqual(calls[2].params, [7, 11, "Test Buyer", "buyer@example.com", "08123456789", "2027-01-20", "10:00", "Morning drive"]);

  const reserved = await fetch(stack.url + "/api/test-drive", jsonRequest("POST", booking, auth()));
  assert.equal(reserved.status, 400);
  await reserved.json();
  const conflict = await fetch(stack.url + "/api/test-drive", jsonRequest("POST", booking, auth()));
  assert.equal(conflict.status, 409);
  assert.equal((await conflict.json()).status, "error");
});

test("favorites toggle and comparison history retain the authenticated user", async t => {
  const stack = await fullStack(t);
  const calls = mockQueries(t, db, [[{ id: 11 }], [], { insertId: 4 }, { insertId: 8 }]);
  const favorite = await fetch(stack.url + "/api/favorites/toggle", jsonRequest("POST", { car_id: 11 }, auth()));
  assert.equal(favorite.status, 200);
  assert.equal((await favorite.json()).favorited, true);
  assert.deepEqual(calls[2].params, [7, 11]);
  const compare = await fetch(stack.url + "/api/compare", jsonRequest("POST", { car_id_1: 11, car_id_2: 12 }, auth()));
  assert.equal(compare.status, 200);
  assert.equal((await compare.json()).saved, true);
  assert.deepEqual(calls[3].params, [7, 11, 12]);
});

test("sales admin lead and booking updates retain their original methods and response fields", async t => {
  const stack = await fullStack(t);
  const lead = { id: 1, name: "Buyer", status: "contacted", car_name: "911 GT3", car_brand: "Porsche" };
  const calls = mockQueries(t, db, [[{ id: 1 }], { affectedRows: 1 }, [lead], [{ id: 2 }], { affectedRows: 1 }, [{ id: 2, status: "approved" }]]);
  const updateLead = await fetch(stack.url + "/api/leads/1", jsonRequest("PUT", { status: "contacted" }, auth("admin")));
  assert.equal(updateLead.status, 200);
  assert.equal((await updateLead.json()).data.car_brand, "Porsche");
  assert.deepEqual(calls[1].params, ["contacted", 1]);
  const updateBooking = await fetch(stack.url + "/api/test-drive/2", jsonRequest("PATCH", { status: "approved" }, auth("admin")));
  assert.equal(updateBooking.status, 200);
  assert.deepEqual((await updateBooking.json()).data, { id: 2, status: "approved" });
  assert.deepEqual(calls[4].params, ["approved", 2]);
});

test("Cloudinary car-image uploads reach Multer with the original binary content", async t => {
  const stack = await fullStack(t);
  const imageBytes = Buffer.from([0xff, 0xd8, 0x00, 0x01, 0xff, 0xd9]);
  let uploaded;
  t.mock.method(carStorage, "_handleFile", (_req, file, callback) => {
    const chunks = [];
    file.stream.on("data", chunk => chunks.push(chunk));
    file.stream.on("end", () => {
      uploaded = { name: file.originalname, type: file.mimetype, bytes: Buffer.concat(chunks) };
      callback(null, { path: "https://res.cloudinary.com/test/car.jpg", filename: "test/car" });
    });
  });
  const body = new FormData();
  body.append("image", new Blob([imageBytes], { type: "image/jpeg" }), "car.jpg");
  const response = await fetch(stack.url + "/api/cars/upload-image", { method: "POST", headers: auth("admin"), body });
  assert.equal(response.status, 200);
  assert.equal((await response.json()).image, "https://res.cloudinary.com/test/car.jpg");
  assert.equal(uploaded.name, "car.jpg");
  assert.equal(uploaded.type, "image/jpeg");
  assert.deepEqual(uploaded.bytes, imageBytes);
});

test("profile photo uploads retain the authenticated user and Cloudinary response contract", async t => {
  const stack = await fullStack(t);
  const calls = mockQueries(t, db, [[{ photo: null }], { affectedRows: 1 }]);
  t.mock.method(profileStorage, "_handleFile", (_req, file, callback) => {
    file.stream.resume();
    file.stream.on("end", () => callback(null, { path: "https://res.cloudinary.com/test/profile.jpg", filename: "test/profile" }));
  });
  const body = new FormData();
  body.append("photo", new Blob([Buffer.from([0xff, 0xd8, 0xff, 0xd9])], { type: "image/jpeg" }), "profile.jpg");
  const response = await fetch(stack.url + "/api/account/photo", { method: "POST", headers: auth(), body });
  assert.equal(response.status, 200);
  assert.equal((await response.json()).photo, "https://res.cloudinary.com/test/profile.jpg");
  assert.deepEqual(calls[1].params, ["https://res.cloudinary.com/test/profile.jpg", 7]);
});

test("invalid upload types are rejected without contacting Cloudinary", async t => {
  const stack = await fullStack(t);
  for (const [path, field, headers] of [["/api/cars/upload-image", "image", auth("admin")], ["/api/account/photo", "photo", auth()]]) {
    const body = new FormData();
    body.append(field, new Blob(["plain text"], { type: "text/plain" }), "invalid.txt");
    const response = await fetch(stack.url + path, { method: "POST", headers, body });
    assert.equal(response.status, 400);
    assert.match((await response.json()).message, /JPG, PNG, atau WEBP/);
  }
});

test("backend liveness stays available while database readiness reports 503", async t => {
  mockQueries(t, db, [new Error("Database offline")]);
  const backend = await listen(t, createBackendApp());
  const health = await fetch(backend.url + "/health");
  assert.equal(health.status, 200);
  assert.equal((await health.json()).service, "backend");
  const ready = await fetch(backend.url + "/ready");
  assert.equal(ready.status, 503);
  assert.equal((await ready.json()).status, "error");
});

test("existing local uploads are served by the backend through the frontend URL", async t => {
  const directory = await fs.mkdtemp(path.join(os.tmpdir(), "sss-dealer-uploads-"));
  const filename = path.join(directory, "legacy.jpg");
  const contents = Buffer.from([0xff, 0xd8, 0x01, 0xff, 0xd9]);
  await fs.writeFile(filename, contents);
  const previousDirectory = process.env.UPLOADS_DIR;
  process.env.UPLOADS_DIR = directory;
  t.after(async () => {
    if (previousDirectory === undefined) delete process.env.UPLOADS_DIR;
    else process.env.UPLOADS_DIR = previousDirectory;
    await fs.unlink(filename);
    await fs.rmdir(directory);
  });
  const stack = await fullStack(t);
  const response = await fetch(stack.url + "/uploads/legacy.jpg");
  assert.equal(response.status, 200);
  assert.equal(response.headers.get("content-type"), "image/jpeg");
  assert.deepEqual(Buffer.from(await response.arrayBuffer()), contents);
});
