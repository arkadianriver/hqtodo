# Creating the swagger doc

Some utilities in this directory are for manual use to create the Swagger doc.
The `serverApi.yml` file is the source of truth for the Swagger doc.

To create examples to be added to `serverApi.yml`:

1. Query the server API and copy the raw JSON (or HTML for `/ejs` endpoints) data.
2. Paste that data as the value for `origdata` in the `stringify.js` file.
3. Run `node stringify.js` to product the `strung.json file`.
4. Edit `strung.json` content as needed and copy'n'paste the results into `serverApi.yml`
   where needed.

When finished editing `serverApi.yml`, to prepare the content for inclusion into the app,
run `python3 y2j.py`, which turns the YML into JSON and rewrites the `swaggerData.js` file,
That file is used in the `SwaggerUIComp.js` component.
