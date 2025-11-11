import axios from "axios";

const FASTAPI_URL =
  process.env.FASTAPI_URL || "https://mukthish-automeet.hf.space/predict"; // change to your endpoint

export interface AttendanceInput {
  company: string;
  role: string;
  meeting_type: string;
  time_of_day: string;
  past_meetings: number;
  past_attended: number;
  attendance_rate: number;
  importance: number;
}

interface FastAPIRequest {
  record: AttendanceInput;
}

interface FastAPIResponse {
  probability: number;
  prediction: number;
}

/**
 * Extract time of day from timestamp
 * @param timestamp - Firestore timestamp or milliseconds
 * @returns 'morning' | 'afternoon' | 'evening'
 */
export const getTimeOfDay = (timestamp: number): string => {
  const date = new Date(timestamp);
  const hour = date.getHours();

  if (hour >= 5 && hour < 12) return "morning";
  if (hour >= 12 && hour < 17) return "afternoon";
  return "evening";
};

/**
 * Calculate attendance rate safely
 */
export const calculateAttendanceRate = (
  past_attended: number,
  past_meetings: number
): number => {
  if (past_meetings === 0) return 0;
  return past_attended / past_meetings;
};

export const getAttendanceProbabilities = async (
  data: AttendanceInput[]
): Promise<FastAPIResponse[]> => {
  try {
    console.log(`🔄 Sending ${data.length} prediction request(s) to FastAPI...`);
    console.log("🌐 FastAPI URL:", FASTAPI_URL);

    // Send requests one by one since API accepts single record at a time
    const predictions: FastAPIResponse[] = [];

    for (let i = 0; i < data.length; i++) {
      const item = data[i];
      const requestPayload: FastAPIRequest = { record: item };

      console.log(`📤 Request ${i + 1}/${data.length}:`, JSON.stringify(requestPayload, null, 2));

      const response = await axios.post<FastAPIResponse>(
        FASTAPI_URL,
        requestPayload
      );

      console.log(`✅ Response ${i + 1}/${data.length}:`, JSON.stringify(response.data, null, 2));

      // Validate response has probability
      if (!response.data || typeof response.data.probability !== 'number') {
        console.error(`⚠️ Invalid response format. Expected { probability: number, prediction: number }, got:`, response.data);
        throw new Error(`Invalid response from ML API. Missing probability field.`);
      }

      predictions.push(response.data);
    }

    console.log(`🎯 Total predictions collected: ${predictions.length}`);
    return predictions;
  } catch (error: any) {
    console.error("❌ Error calling FastAPI:", error.message);
    if (error.response) {
      console.error("📛 Response status:", error.response.status);
      console.error("📛 Response data:", JSON.stringify(error.response.data, null, 2));
    }
    throw new Error("Failed to fetch attendance probability");
  }
};
