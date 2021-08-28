export const slugify = (str) =>
  typeof str === "string" ? str.replace(/[^0-9A-Z_a-z]/g, "-") : "";
