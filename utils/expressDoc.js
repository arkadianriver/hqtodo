/**
 * Custom doc module.
 * 
 * Purpose is to DRY-ly specify documentation, particularly in routes.
 * Does this buy me anything really? Yeah, I learned new things at least.
 * JSDoc and Swagger don't work for me because at this point I only want
 * the client to consume and render simple doc with descriptions.
 */
class expressDoc {
  constructor(title) {
    this._docProps = {
      title: title || "Express server doc",
      routes: [],
    };
  }

  // The Route "decorator" to document the Express route while creating it
  // TODO: router separate from [fn]? there's gotta be a better way.
  //   Discovered express-document on npm. Maybe try that approach but
  //   without swagger.
  setRoute(router, fn, path, description, ...fns) {
    router[fn](path, ...fns);
    const method = fn.name;
    this._docProps.routes.push({ method, path, description });
  }

  get contents() {
    return this._docProps;
  }

  set title(value) {
    this._docProps.title = value;
  }
}

module.exports = expressDoc;
