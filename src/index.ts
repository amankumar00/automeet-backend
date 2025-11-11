import admin from "firebase-admin";
import express from "express";
import cors from "cors";
import dotenv from "dotenv";

dotenv.config();

// Initialize Firebase Admin
const serviceAccount = process.env.GOOGLE_APPLICATION_CREDENTIALS_JSON
  ? JSON.parse(process.env.GOOGLE_APPLICATION_CREDENTIALS_JSON)
  : require("../serviceAccountKey.json");

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

import userRoutes from "./routes/users.routes";
import meetingRoutes from "./routes/meetings.routes";

const app = express();
app.use(cors());
app.use(express.json());

// Test route
app.get("/", (req, res) => {
  res.send("AutoMeet backend is running 🚀");
});

// API Routes
app.use("/api/users", userRoutes);
app.use("/api/meetings", meetingRoutes);

const PORT = process.env.PORT || 8080;
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
