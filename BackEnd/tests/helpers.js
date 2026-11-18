const path = require("node:path");
const { once } = require("node:events");

// Keep automated checks independent of local credentials and external services.
process.env.ENV_FILE = path.join(__dirname, "unused-test-environment.env");
process.env.JWT_SECRET = "sss-dealer-test-secret-for-http-contracts";
process.env.NODE_ENV = "test";
process.env.HOST = "127.0.0.1";
process.env.CORS_ORIGINS = "";

async function listen(t, app) {
  const server = app.listen(0, "127.0.0.1");
  await once(server, "listening");
  t.after(() => new Promise(resolve => {
    server.closeAllConnections();
    server.close(resolve);
  }));
  return { server, url: `http://127.0.0.1:${server.address().port}` };
}

function mockQueries(t, db, responses) {
  const calls = [];
  t.mock.method(db, "query", async (sql, params) => {
    calls.push({ sql, params });
    if (!responses.length) throw new Error("Unexpected database query in HTTP contract test.");
    const response = responses.shift();
    if (response instanceof Error) throw response;
    return [response];
  });
  return calls;
}

module.exports = { listen, mockQueries };
