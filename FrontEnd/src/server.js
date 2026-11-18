const { createFrontendApp } = require("./app");
const { getPort } = require("./config");
const { startServer } = require("./runtime");

startServer(createFrontendApp(), { name: "frontend", port: getPort("FRONTEND", 3000), host: "0.0.0.0" });
