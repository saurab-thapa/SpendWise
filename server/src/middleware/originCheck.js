import { createError } from "../utils/errors.js";

// Origin Check
export function isAllowedOrigin(origin) {
  if (!origin) return true;
  if (process.env.NODE_ENV === "production") {
    return origin === (process.env.CLIENT_ORIGIN || "http://localhost:5173");
  }
  try {
    const url = new URL(origin);
    return url.hostname === "localhost" || url.hostname === "127.0.0.1";
  } catch {
    return false;
  }
}

// Reject State Change Origins
export function checkOrigin(req, res, next) {
  if (req.method === "GET" || req.method === "HEAD") return next();
  const origin = req.headers.origin;
  if (!isAllowedOrigin(origin)) {
    return next(createError("Request origin is not allowed", 403));
  }
  if (req.headers["content-type"] && !req.headers["content-type"].includes("application/json")) {
    return next(createError("Content-Type must be application/json", 415));
  }
  return next();
}
