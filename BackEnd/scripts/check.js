const fs = require("node:fs");
const path = require("node:path");
const { spawnSync } = require("node:child_process");

const root = path.resolve(__dirname, "../..");
function javascriptFiles(directory) {
  return fs.readdirSync(directory, { withFileTypes: true }).flatMap(entry => {
    const filename = path.join(directory, entry.name);
    if (entry.name === "node_modules") return [];
    if (entry.isDirectory()) return javascriptFiles(filename);
    return entry.name.endsWith(".js") ? [filename] : [];
  });
}

const files = ["FrontEnd", "BackEnd"].flatMap(name => javascriptFiles(path.join(root, name)));
for (const file of files) {
  const result = spawnSync(process.execPath, ["--check", file], { encoding: "utf8", windowsHide: true });
  if (result.error || result.status !== 0) {
    console.error(result.error || result.stderr);
    process.exit(1);
  }
}
console.log(`Syntax checked ${files.length} JavaScript files.`);
