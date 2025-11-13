import { Request, Response } from "express";
import { meetingsRef } from "../services/firestore.service";
import {
  getAttendanceProbabilities,
  getTimeOfDay,
  calculateAttendanceRate,
  AttendanceInput,
} from "../services/attendance.service";
import { getBatchUserStats } from "../services/user-stats.service";

// CREATE meeting with ML-based attendance prediction
export const createMeeting = async (req: Request, res: Response) => {
  try {
    const {
      creator_id,
      meeting_type,
      importance,
      start_time,
      end_time,
      agenda,
      meeting_link,
      participants, // array of user IDs
    } = req.body;

    // Validate required fields
    if (!participants || !Array.isArray(participants) || participants.length === 0) {
      return res.status(400).json({ error: "Participants array is required and cannot be empty" });
    }

    // Get time of day from start_time
    const timeOfDay = getTimeOfDay(start_time);
    console.log("📅 Time of day:", timeOfDay);

    // Fetch user stats for all participants
    const userStatsArray = await getBatchUserStats(participants);
    console.log("👥 User stats fetched:", JSON.stringify(userStatsArray, null, 2));

    // Build attendance input for ML model
    const attendanceInputs: AttendanceInput[] = userStatsArray.map((userStats) => ({
      company: userStats.company,
      role: userStats.role,
      meeting_type,
      time_of_day: timeOfDay,
      past_meetings: userStats.past_meetings,
      past_attended: userStats.past_attended,
      attendance_rate: calculateAttendanceRate(
        userStats.past_attended,
        userStats.past_meetings
      ),
      importance,
    }));

    console.log("🤖 Sending to ML model:", JSON.stringify(attendanceInputs, null, 2));

    // Get attendance predictions from ML model
    const predictions = await getAttendanceProbabilities(attendanceInputs);
    console.log("✅ ML predictions received:", JSON.stringify(predictions, null, 2));

    // Map predictions back to participants (only store user_id and probability)
    const participantsWithPredictions = participants.map((userId, index) => ({
      user_id: userId,
      predicted_attendance_probability: predictions[index].probability,
    }));

    // Also update each user's record with their predicted attendance probability
    console.log("💾 Updating user records with predicted attendance probabilities...");
    await Promise.all(
      participantsWithPredictions.map(async (participant) => {
        try {
          const { usersRef } = await import("../services/firestore.service");
          await usersRef.doc(participant.user_id).update({
            predicted_attendance_probability: participant.predicted_attendance_probability,
            updated_at: new Date().toISOString(),
          });
          console.log(`✅ Updated user ${participant.user_id} with probability: ${participant.predicted_attendance_probability.toFixed(2)}`);
        } catch (error) {
          console.error(`⚠️ Failed to update user ${participant.user_id}:`, error);
        }
      })
    );

    const newMeeting = {
      creator_id,
      meeting_type,
      importance,
      start_time: new Date(start_time).toISOString(),
      end_time: new Date(end_time).toISOString(),
      agenda,
      meeting_link,
      participants: participantsWithPredictions,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    const ref = await meetingsRef.add(newMeeting);

    // Return populated participant data in response (but don't store it)
    const { populateParticipantDetails } = await import("../services/meeting-helpers.service");
    const populatedParticipants = await populateParticipantDetails(participantsWithPredictions);

    res.status(201).json({
      meeting_id: ref.id,
      ...newMeeting,
      participants: populatedParticipants, // Send full details in response
    });
  } catch (error: any) {
    console.error("Error creating meeting:", error);
    res.status(500).json({ error: error.message });
  }
};

// READ all meetings
export const getAllMeetings = async (_req: Request, res: Response) => {
  try {
    const snapshot = await meetingsRef.get();
    const { populateParticipantDetails } = await import("../services/meeting-helpers.service");

    // Populate participant details for all meetings
    const meetings = await Promise.all(
      snapshot.docs.map(async (doc) => {
        const meetingData = doc.data();

        // Populate participants if they exist
        if (meetingData?.participants && Array.isArray(meetingData.participants)) {
          const populatedParticipants = await populateParticipantDetails(meetingData.participants);
          return {
            id: doc.id,
            ...meetingData,
            participants: populatedParticipants,
          };
        }

        return {
          id: doc.id,
          ...meetingData,
        };
      })
    );

    res.json(meetings);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

// READ one meeting
export const getMeetingById = async (req: Request, res: Response) => {
  try {
    const doc = await meetingsRef.doc(req.params.id).get();
    if (!doc.exists)
      return res.status(404).json({ error: "Meeting not found" });

    const meetingData = doc.data();

    // Populate participant details if participants exist
    if (meetingData?.participants && Array.isArray(meetingData.participants)) {
      const { populateParticipantDetails } = await import("../services/meeting-helpers.service");
      const populatedParticipants = await populateParticipantDetails(meetingData.participants);

      res.json({
        id: doc.id,
        ...meetingData,
        participants: populatedParticipants,
      });
    } else {
      res.json({ id: doc.id, ...meetingData });
    }
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

// UPDATE meeting
export const updateMeeting = async (req: Request, res: Response) => {
  try {
    console.log("📝 Update meeting request body:", JSON.stringify(req.body, null, 2));

    const updateData: any = {
      ...req.body,
      updated_at: new Date().toISOString(),
    };

    // If participants are being updated, ensure they only contain user_id and probability
    if (updateData.participants && Array.isArray(updateData.participants)) {
      console.log("👥 Original participants:", JSON.stringify(updateData.participants, null, 2));

      // Transform participants to only store user_id and predicted_attendance_probability
      updateData.participants = updateData.participants.map((p: any) => {
        console.log("🔍 Processing participant:", JSON.stringify(p));

        // If participant is just a string (user_id), convert to proper format
        if (typeof p === 'string') {
          console.log("✅ Participant is string (user_id):", p);
          return {
            user_id: p,
            predicted_attendance_probability: 0.5, // Default probability
          };
        }
        // If participant is an object, extract only what we need
        const result = {
          user_id: p.user_id || p.id,
          predicted_attendance_probability: p.predicted_attendance_probability || 0.5,
        };
        console.log("✅ Transformed participant:", JSON.stringify(result));
        return result;
      }).filter((p: any) => {
        const isValid = !!p.user_id;
        if (!isValid) {
          console.warn("⚠️ Filtering out invalid participant (no user_id):", JSON.stringify(p));
        }
        return isValid;
      });

      console.log("✅ Final participants to store:", JSON.stringify(updateData.participants, null, 2));

      // Update each user's record with their predicted attendance probability
      console.log("💾 Updating user records with predicted attendance probabilities...");
      await Promise.all(
        updateData.participants.map(async (participant: any) => {
          try {
            const { usersRef } = await import("../services/firestore.service");
            await usersRef.doc(participant.user_id).update({
              predicted_attendance_probability: participant.predicted_attendance_probability,
              updated_at: new Date().toISOString(),
            });
            console.log(`✅ Updated user ${participant.user_id} with probability: ${participant.predicted_attendance_probability.toFixed(2)}`);
          } catch (error) {
            console.error(`⚠️ Failed to update user ${participant.user_id}:`, error);
          }
        })
      );
    }

    await meetingsRef.doc(req.params.id).update(updateData);
    res.json({ message: "Meeting updated successfully" });
  } catch (error: any) {
    console.error("❌ Error updating meeting:", error);
    res.status(500).json({ error: error.message });
  }
};

// DELETE meeting
export const deleteMeeting = async (req: Request, res: Response) => {
  try {
    await meetingsRef.doc(req.params.id).delete();
    res.json({ message: "Meeting deleted successfully" });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};
