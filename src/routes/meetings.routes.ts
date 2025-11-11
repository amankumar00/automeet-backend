import { Router } from "express";
import {
  createMeeting,
  getAllMeetings,
  getMeetingById,
  updateMeeting,
  deleteMeeting,
} from "../controllers/meetings.controller";

const router = Router();

router.post("/", createMeeting);
router.get("/", getAllMeetings);
router.get("/:id", getMeetingById);
router.put("/:id", updateMeeting);
router.delete("/:id", deleteMeeting);

export default router;
