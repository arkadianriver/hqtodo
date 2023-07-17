/**
 * See README.md for usage.
 */
const fs = require('fs');

const origdata = {};


if (typeof(origdata) === 'object') {
	const strung = JSON.stringify(origdata, null, 2);
	const indentedStrung = strung.split(/\n/).map((line) => line.replace(/^(\s*)/, "                  $1"));
	fs.writeFileSync("strung.json", indentedStrung.join("\n"), { encoding: "utf-8" });
}
if (typeof(origdata) === 'string') {
	const indentedStrung = origdata.split(/\n/).map((line) => line.replace(/^(\s*)/, "                  $1"));
	fs.writeFileSync("strung.json", indentedStrung.join("\n"), { encoding: "utf-8" });
}
