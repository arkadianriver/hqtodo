const fs = require("fs");

const src = "./build/";
const dest = "../build/";

console.log(`Copying ${src} to ${dest}...`);
fs.cpSync(src, dest, {recursive: true});
fs.writeFileSync(`${dest}.nojekyll`, "");

