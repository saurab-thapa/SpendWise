import { createError } from "../utils/errors.js";

export function requireAuth(req, res, next) {
  if (!req.session || !req.session.userId) {
    return next(createError("Please log in to continue", 401));
  }
  return next();
}
