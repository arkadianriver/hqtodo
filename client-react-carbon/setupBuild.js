const fs = require("fs");

if (process.env.VITE_DEMO === "true") {
  // fs.copyFileSync("404_demo.html", "404.html");
  fs.copyFileSync("index_demo.html", "index.html");
} else {
  if (fs.existsSync("404.html")) fs.unlinkSync("404.html");
  fs.copyFileSync("index_prod.html", "index.html");
}

const data = fs.readFileSync("package.json", "utf-8");
const packageJs = JSON.parse(data);
if (process.env.VITE_DEMO === "true") {
  packageJs.homepage = "/hqtodo";
} else {
  if (packageJs.hasOwnProperty("homepage")) delete packageJs.homepage;
}
const packageJSON = JSON.stringify(packageJs, null, 2);
fs.writeFileSync("package.json.copy", packageJSON, { encoding: "utf-8" });
fs.renameSync("package.json.copy", "package.json");
console.log("package.json re-written");
