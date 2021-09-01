const fs = require("fs");

fs.readFile("package.json", "utf-8", (err, data) => {
  if (err) throw err;

  if (data.includes('"homepage":')) {
    const packageJs = JSON.parse(data);
    if (packageJs.hasOwnProperty("homepage")) delete packageJs.homepage;

    const packageJSON = JSON.stringify(packageJs, null, 2);

    fs.writeFile(
      "package.json.copy",
      packageJSON,
      { encoding: "utf-8" },
      (err) => {
        if (err) throw err;

        fs.rename("package.json.copy", "package.json", (err) => {
          if (err) throw err;
          console.log("package.json re-written");
        });
      }
    );
  }
});
