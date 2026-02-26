const fs = require("fs");

const src = "./build/";
const dest = "../build/";

console.log(`Cleaning destination folder: ${dest}.`);
fs.rmSync(dest, {recursive: true, force: true});

console.log(`Copying ${src} to ${dest}.`);
fs.cpSync(src, dest, {recursive: true});
fs.writeFileSync(`${dest}.nojekyll`, "");
fs.copyFileSync(`404_demo.html`, `${dest}404.html`);
