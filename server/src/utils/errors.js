export function createError(message, statusCode = 400, fields = {}) {
  const error = new Error(message);
  error.statusCode = statusCode;
  error.fields = fields;
  return error;
}
