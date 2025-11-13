import { Response, NextFunction } from "express";
import admin from "firebase-admin";
import { AuthRequest } from "./auth.middleware";

/**
 * Optional authentication middleware
 * Attempts to verify token if provided, but doesn't fail if missing
 * Useful for endpoints that work both with and without authentication
 */
export const optionalAuth = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    // Get token from Authorization header (format: "Bearer <token>")
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      // No token provided - continue without user context
      req.user = undefined;
      return next();
    }

    const token = authHeader.split("Bearer ")[1];

    try {
      // Try to verify the token
      const decodedToken = await admin.auth().verifyIdToken(token);

      // Attach user info to request
      req.user = {
        uid: decodedToken.uid,
        email: decodedToken.email,
      };
    } catch (error: any) {
      // Token is invalid - continue without user context
      console.warn("Optional auth: Invalid token provided", error.message);
      req.user = undefined;
    }

    next();
  } catch (error: any) {
    console.error("Optional auth error:", error.message);
    req.user = undefined;
    next();
  }
};
