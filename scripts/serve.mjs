import { createReadStream, existsSync } from "node:fs";
import { stat } from "node:fs/promises";
import { extname, join, resolve } from "node:path";
import { createServer } from "node:http";

const root = resolve(process.cwd());
const port = Number(process.env.PORT || 4173);

const types = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".webp": "image/webp"
};

createServer(async (request, response) => {
  const url = new URL(request.url || "/", `http://localhost:${port}`);
  const pathname = decodeURIComponent(url.pathname);
  const target = resolve(join(root, pathname === "/" ? "index.html" : pathname));

  if (!target.startsWith(root) || !existsSync(target)) {
    response.writeHead(404);
    response.end("Not found");
    return;
  }

  const info = await stat(target);
  const file = info.isDirectory() ? join(target, "index.html") : target;
  response.writeHead(200, {
    "Content-Type": types[extname(file)] || "application/octet-stream"
  });
  createReadStream(file).pipe(response);
}).listen(port, () => {
  console.log(`MG Intelligence Hub: http://localhost:${port}`);
});
