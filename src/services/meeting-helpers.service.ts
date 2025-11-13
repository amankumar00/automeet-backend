import { usersRef } from "./firestore.service";

export interface ParticipantWithPrediction {
  user_id: string;
  predicted_attendance_probability: number;
}

export interface PopulatedParticipant {
  user_id: string;
  name: string;
  email: string;
  company: string;
  role: string;
  predicted_attendance_probability: number;
}

/**
 * Populate participant details from users collection
 * @param participants - Array of participants with user_id and predicted probability
 * @returns Array of participants with full user details
 */
export const populateParticipantDetails = async (
  participants: ParticipantWithPrediction[]
): Promise<PopulatedParticipant[]> => {
  try {
    // Filter out invalid participants (missing user_id)
    const validParticipants = participants.filter(p => p && p.user_id);

    if (validParticipants.length === 0) {
      console.warn("No valid participants found");
      return [];
    }

    const populatedParticipants = await Promise.all(
      validParticipants.map(async (participant) => {
        try {
          const userDoc = await usersRef.doc(participant.user_id).get();

          if (!userDoc.exists) {
            console.warn(`User ${participant.user_id} not found`);
            return {
              user_id: participant.user_id,
              name: "Unknown User",
              email: "",
              company: "Unknown",
              role: "Unknown",
              predicted_attendance_probability: participant.predicted_attendance_probability,
            };
          }

          const userData = userDoc.data();
          return {
            user_id: participant.user_id,
            name: userData?.name || "Unknown",
            email: userData?.email || "",
            company: userData?.company || "Unknown",
            role: userData?.role || "Unknown",
            predicted_attendance_probability: participant.predicted_attendance_probability,
          };
        } catch (error) {
          console.error(`Error fetching user ${participant.user_id}:`, error);
          return {
            user_id: participant.user_id,
            name: "Error Loading User",
            email: "",
            company: "Unknown",
            role: "Unknown",
            predicted_attendance_probability: participant.predicted_attendance_probability,
          };
        }
      })
    );

    return populatedParticipants;
  } catch (error) {
    console.error("Error populating participant details:", error);
    throw error;
  }
};
