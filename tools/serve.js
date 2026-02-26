const http = require("http");
const fs = require("fs");
const path = require("path");

const mimeTypes = {
  ".html": "text/html; charset=utf-8",
  ".js": "application/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".txt": "text/plain; charset=utf-8",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".gif": "image/gif",
  ".svg": "image/svg+xml",
  ".mp3": "audio/mpeg",
  ".wav": "audio/wav",
  ".ico": "image/x-icon"
};

const root = path.resolve(__dirname, "..");
const requestedPort = Number(process.argv[2]) || 8080;

function sendFile(filePath, res) {
  fs.stat(filePath, (statErr, stats) => {
    if (statErr || !stats.isFile()) {
      res.writeHead(404, { "Content-Type": "text/plain; charset=utf-8" });
      res.end("Not found");
      return;
    }

    const ext = path.extname(filePath).toLowerCase();
    const contentType = mimeTypes[ext] || "application/octet-stream";
    res.writeHead(200, { "Content-Type": contentType });
    fs.createReadStream(filePath).pipe(res);
  });
}

const server = http.createServer((req, res) => {
  const requestPath = decodeURIComponent((req.url || "/").split("?")[0]);
  const normalized = path.normalize(requestPath).replace(/^(\.\.[/\\])+/, "");
  const resolvedPath = path.join(root, normalized === "/" ? "index.html" : normalized);

  if (!resolvedPath.startsWith(root)) {
    res.writeHead(403, { "Content-Type": "text/plain; charset=utf-8" });
    res.end("Forbidden");
    return;
  }

  fs.stat(resolvedPath, (err, stats) => {
    if (!err && stats.isDirectory()) {
      sendFile(path.join(resolvedPath, "index.html"), res);
      return;
    }
    sendFile(resolvedPath, res);
  });
});

function listen(port) {
  server.listen(port, () => {
    console.log(`PIOSI local server running at http://localhost:${port}/`);
    console.log("Press Ctrl+C to stop.");
  });
}

server.on("error", (err) => {
  if (err.code === "EADDRINUSE") {
    console.error(`Port ${requestedPort} is in use. Try a different port, e.g. "node tools/serve.js 8081".`);
    process.exit(1);
  }
  console.error(err);
  process.exit(1);
});

listen(requestedPort);
