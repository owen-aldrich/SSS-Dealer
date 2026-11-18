function startServer(app, { name, port, host = "127.0.0.1", close = [] }) {
  const server = app.listen(port, process.env.HOST || host, () => {
    console.log(`${name} listening at http://localhost:${port}`);
  });
  server.on("error", err => {
    console.error(`${name} failed to start: ${err.message}`);
    process.exit(1);
  });

  let stopping = false;
  function stop() {
    if (stopping) return;
    stopping = true;
    const deadline = setTimeout(() => process.exit(1), 10000);
    deadline.unref();
    server.close(async () => {
      const results = await Promise.allSettled(close.map(callback => callback()));
      clearTimeout(deadline);
      process.exit(results.some(result => result.status === "rejected") ? 1 : 0);
    });
    server.closeIdleConnections();
  }
  process.once("SIGINT", stop);
  process.once("SIGTERM", stop);
  if (process.send) {
    process.on("message", message => { if (message?.type === "shutdown") stop(); });
    process.once("disconnect", stop);
    if (!process.connected) stop();
  }
  return server;
}

module.exports = { startServer };
