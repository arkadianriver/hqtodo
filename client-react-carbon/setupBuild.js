const fs = require("fs");

if (process.env.REACT_APP_DEMO === "true") {
  fs.copyFileSync("public/404_demo.html", "public/404.html");
  fs.copyFileSync("public/index_demo.html", "public/index.html");
} else {
  if (fs.existsSync("public/404.html")) fs.unlinkSync("public/404.html");
  fs.copyFileSync("public/index_prod.html", "public/index.html");
}

const data = fs.readFileSync("package.json", "utf-8");
const packageJs = JSON.parse(data);
if (process.env.REACT_APP_DEMO === "true") {
  packageJs.homepage = "/build";
} else {
  if (packageJs.hasOwnProperty("homepage")) delete packageJs.homepage;
}
const packageJSON = JSON.stringify(packageJs, null, 2);
fs.writeFileSync("package.json.copy", packageJSON, { encoding: "utf-8" });
fs.renameSync("package.json.copy", "package.json");
console.log("package.json re-written");
