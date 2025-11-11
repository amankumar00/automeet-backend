import { usersRef, meetingsRef } from "./firestore.service";

export interface UserStats {
  user_id: string;
  company: string;
  role: string;
  past_meetings: number;
  past_attended: number;
}

/**
 * Fetch user data and calculate their meeting statistics
 * @param userId - User document ID
 * @returns User stats including company, role, and attendance history
 */
export const getUserStats = async (userId: string): Promise<UserStats> => {
  try {
    // Fetch user data
    const userDoc = await usersRef.doc(userId).get();
    if (!userDoc.exists) {
      throw new Error(`User with ID ${userId} not found`);
    }

    const userData = userDoc.data();
    if (!userData) {
      throw new Error(`User data is empty for ID ${userId}`);
    }

    let past_meetings = 0;
    let past_attended = 0;

    // Check if user has stored past_meetings and past_attended values
    if (typeof userData.past_meetings === "number" && typeof userData.past_attended === "number") {
      // Use stored values
      past_meetings = userData.past_meetings;
      past_attended = userData.past_attended;
    } else {
      // Calculate from historical meetings
      const now = new Date().toISOString();
      const meetingsSnapshot = await meetingsRef.where("end_time", "<", now).get();

      meetingsSnapshot.docs.forEach((doc) => {
        const meetingData = doc.data();

        // Check if user is in participants array
        const isParticipant = meetingData.participants?.some(
          (p: any) => p.user_id === userId
        );

        if (isParticipant) {
          past_meetings++;

          // Check if user attended (if attendance_records exists)
          if (meetingData.attendance_records) {
            const participantRecord = meetingData.attendance_records.find(
              (record: any) => record.user_id === userId
            );
            if (participantRecord && participantRecord.attended) {
              past_attended++;
            }
          }
        }
      });
    }

    return {
      user_id: userId,
      company: userData.company || "Unknown",
      role: userData.role || "Unknown",
      past_meetings,
      past_attended,
    };
  } catch (error: any) {
    console.error(`Error fetching user stats for ${userId}:`, error.message);
    throw error;
  }
};

/**
 * Fetch stats for multiple users in parallel
 */
export const getBatchUserStats = async (
  userIds: string[]
): Promise<UserStats[]> => {
  const promises = userIds.map((userId) => getUserStats(userId));
  return Promise.all(promises);
};
