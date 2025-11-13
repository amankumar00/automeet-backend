import { Router } from "express";
import {
  createMeeting,
  getAllMeetings,
  getMeetingById,
  updateMeeting,
  deleteMeeting,
} from "../controllers/meetings.controller";
import { optionalAuth } from "../middleware/optional-auth.middleware";

const router = Router();

// Apply optional auth to all routes (works with or without token)
router.use(optionalAuth);

router.post("/", createMeeting);
router.get("/", getAllMeetings);
router.get("/:id", getMeetingById);
router.put("/:id", updateMeeting);
router.delete("/:id", deleteMeeting);

export default router;
