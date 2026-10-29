export function validate(schema, source = "body") {
  return function validationMiddleware(req, res, next) {
    const result = schema.safeParse(req[source]);
    if (result.success) {
      if (source === "query") {
        return next();
      }
      req[source] = result.data;
      return next();
    }
    const fields = {};
    for (const issue of result.error.issues) {
      const key = issue.path.join(".") || "form";
      fields[key] = issue.message;
    }
    return res.status(400).json({ success: false, error: { message: "Please correct the highlighted fields", fields } });
  };
}
