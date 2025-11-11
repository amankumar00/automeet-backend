import { Router } from "express";
import { signup, login, getCurrentUser } from "../controllers/auth.controller";
import { verifyToken } from "../middleware/auth.middleware";

const router = Router();

// All auth routes require token verification
router.post("/signup", verifyToken, signup);
router.post("/login", verifyToken, login);
router.get("/me", verifyToken, getCurrentUser);

export default router;
