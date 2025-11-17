import nodemailer from "nodemailer";
import sgMail from "@sendgrid/mail";

// Email provider configuration
const USE_SENDGRID = !!process.env.SENDGRID_API_KEY;

// Initialize SendGrid if API key is available
if (USE_SENDGRID) {
  sgMail.setApiKey(process.env.SENDGRID_API_KEY!);
  console.log("📧 Email service: Using SendGrid");
} else {
  console.log("📧 Email service: Using nodemailer (SMTP)");
}

interface EmailConfig {
  host: string;
  port: number;
  secure: boolean;
  auth: {
    user: string;
    pass: string;
  };
}

// Create reusable transporter (for nodemailer fallback)
const createTransporter = () => {
  const config: EmailConfig = {
    host: process.env.SMTP_HOST || "smtp.gmail.com",
    port: parseInt(process.env.SMTP_PORT || "587"),
    secure: process.env.SMTP_SECURE === "true", // true for 465, false for other ports
    auth: {
      user: process.env.SMTP_USER || "",
      pass: process.env.SMTP_PASS || "",
    },
  };

  return nodemailer.createTransport(config);
};

interface MeetingEmailData {
  meeting_id: string;
  meeting_type: string;
  importance: number;
  start_time: string;
  end_time: string;
  agenda: string;
  meeting_link?: string;
  creator_name?: string;
}

interface Participant {
  name: string;
  email: string;
  predicted_attendance_probability: number;
}

/**
 * Validate email address format
 * Checks for:
 * - Basic email format (contains @ and .)
 * - Not a dummy/placeholder email (test@test.com, dummy@example.com, etc.)
 * - Not obviously invalid (noemail, N/A, etc.)
 */
const isValidEmail = (email: string): boolean => {
  if (!email || typeof email !== 'string') {
    return false;
  }

  // Trim whitespace
  email = email.trim().toLowerCase();

  // Basic email format regex
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return false;
  }

  // List of dummy/invalid email patterns
  const dummyPatterns = [
    /^test@test\./,
    /^dummy@/,
    /^fake@/,
    /^noemail@/,
    /^no-email@/,
    /^example@example\./,
    /^user@example\./,
    /^admin@example\./,
    /@example\.com$/,
    /@example\.org$/,
    /@test\.com$/,
    /@dummy\.com$/,
    /@fake\.com$/,
    /^[0-9]+@/,     // Emails starting with only numbers (e.g., 123@domain.com)
    /^abc@/,        // Exactly abc@
    /^xyz@/,        // Exactly xyz@
    /^test\d*@/,    // test@, test1@, test123@, etc.
  ];

  // Check if email matches any dummy pattern
  for (const pattern of dummyPatterns) {
    if (pattern.test(email)) {
      return false;
    }
  }

  // Check for obviously invalid values (must start with these)
  const invalidStarts = [
    'n/a@',
    'na@',
    'none@',
    'null@',
    'undefined@',
  ];

  for (const invalid of invalidStarts) {
    if (email.startsWith(invalid)) {
      return false;
    }
  }

  // Check for missing username (email starts with @)
  if (email.startsWith('@')) {
    return false;
  }

  // Check for reasonable email length
  if (email.length < 5 || email.length > 254) {
    return false;
  }

  return true;
};

/**
 * Format date to readable string
 */
const formatDate = (isoDate: string): string => {
  const date = new Date(isoDate);
  return date.toLocaleString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    timeZoneName: "short",
  });
};

/**
 * Generate HTML email template for new meeting
 */
const generateNewMeetingEmail = (
  participantName: string,
  meetingData: MeetingEmailData
): string => {
  return `
<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background-color: #4CAF50; color: white; padding: 20px; text-align: center; }
    .content { background-color: #f9f9f9; padding: 20px; border: 1px solid #ddd; }
    .meeting-details { background-color: white; padding: 15px; margin: 15px 0; border-left: 4px solid #4CAF50; }
    .detail-row { margin: 10px 0; }
    .label { font-weight: bold; color: #555; }
    .button { display: inline-block; padding: 12px 24px; margin: 20px 0; background-color: #4CAF50; color: white; text-decoration: none; border-radius: 4px; }
    .footer { text-align: center; margin-top: 20px; font-size: 12px; color: #777; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>New Meeting Scheduled</h1>
    </div>
    <div class="content">
      <p>Hello ${participantName},</p>
      <p>You have been invited to a new meeting.</p>

      <div class="meeting-details">
        <div class="detail-row">
          <span class="label">Meeting Type:</span> ${meetingData.meeting_type}
        </div>
        <div class="detail-row">
          <span class="label">Agenda:</span> ${meetingData.agenda}
        </div>
        <div class="detail-row">
          <span class="label">Start Time:</span> ${formatDate(meetingData.start_time)}
        </div>
        <div class="detail-row">
          <span class="label">End Time:</span> ${formatDate(meetingData.end_time)}
        </div>
        <div class="detail-row">
          <span class="label">Importance:</span> ${meetingData.importance}/10
        </div>
        ${meetingData.creator_name ? `<div class="detail-row"><span class="label">Organized by:</span> ${meetingData.creator_name}</div>` : ""}
      </div>

      ${
        meetingData.meeting_link
          ? `<a href="${meetingData.meeting_link}" class="button">Join Meeting</a>`
          : ""
      }

      <p>Please make sure to mark your calendar.</p>
    </div>
    <div class="footer">
      <p>This is an automated message from AutoMeet. Please do not reply to this email.</p>
    </div>
  </div>
</body>
</html>
  `;
};

/**
 * Generate HTML email template for rescheduled meeting
 */
const generateRescheduledMeetingEmail = (
  participantName: string,
  meetingData: MeetingEmailData
): string => {
  return `
<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background-color: #FF9800; color: white; padding: 20px; text-align: center; }
    .content { background-color: #f9f9f9; padding: 20px; border: 1px solid #ddd; }
    .meeting-details { background-color: white; padding: 15px; margin: 15px 0; border-left: 4px solid #FF9800; }
    .detail-row { margin: 10px 0; }
    .label { font-weight: bold; color: #555; }
    .button { display: inline-block; padding: 12px 24px; margin: 20px 0; background-color: #FF9800; color: white; text-decoration: none; border-radius: 4px; }
    .footer { text-align: center; margin-top: 20px; font-size: 12px; color: #777; }
    .warning { background-color: #fff3cd; padding: 10px; border-left: 4px solid #FF9800; margin: 15px 0; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>Meeting Rescheduled</h1>
    </div>
    <div class="content">
      <p>Hello ${participantName},</p>

      <div class="warning">
        <strong>Important:</strong> A meeting you're invited to has been rescheduled.
      </div>

      <div class="meeting-details">
        <div class="detail-row">
          <span class="label">Meeting Type:</span> ${meetingData.meeting_type}
        </div>
        <div class="detail-row">
          <span class="label">Agenda:</span> ${meetingData.agenda}
        </div>
        <div class="detail-row">
          <span class="label">New Start Time:</span> ${formatDate(meetingData.start_time)}
        </div>
        <div class="detail-row">
          <span class="label">New End Time:</span> ${formatDate(meetingData.end_time)}
        </div>
        <div class="detail-row">
          <span class="label">Importance:</span> ${meetingData.importance}/10
        </div>
        ${meetingData.creator_name ? `<div class="detail-row"><span class="label">Organized by:</span> ${meetingData.creator_name}</div>` : ""}
      </div>

      ${
        meetingData.meeting_link
          ? `<a href="${meetingData.meeting_link}" class="button">Join Meeting</a>`
          : ""
      }

      <p>Please update your calendar accordingly.</p>
    </div>
    <div class="footer">
      <p>This is an automated message from AutoMeet. Please do not reply to this email.</p>
    </div>
  </div>
</body>
</html>
  `;
};

/**
 * Send email notification to a participant about a new meeting
 */
export const sendNewMeetingEmail = async (
  participant: Participant,
  meetingData: MeetingEmailData
): Promise<void> => {
  try {
    if (!participant.email) {
      console.warn(`⚠️ Participant ${participant.name} has no email address - skipping email`);
      return;
    }

    // Validate email address
    if (!isValidEmail(participant.email)) {
      console.warn(`⚠️ Participant ${participant.name} has invalid/dummy email (${participant.email}) - skipping email`);
      return;
    }

    const htmlContent = generateNewMeetingEmail(participant.name, meetingData);
    const fromEmail = process.env.SMTP_USER || "noreply@automeet.app";

    if (USE_SENDGRID) {
      // Use SendGrid API
      const msg = {
        to: participant.email,
        from: fromEmail,
        subject: `New Meeting: ${meetingData.agenda}`,
        html: htmlContent,
      };

      await sgMail.send(msg);
      console.log(`✅ [SendGrid] Email sent to ${participant.name} (${participant.email})`);
    } else {
      // Use nodemailer (SMTP)
      const transporter = createTransporter();

      const mailOptions = {
        from: `"AutoMeet" <${fromEmail}>`,
        to: participant.email,
        subject: `New Meeting: ${meetingData.agenda}`,
        html: htmlContent,
      };

      await transporter.sendMail(mailOptions);
      console.log(`✅ [SMTP] Email sent to ${participant.name} (${participant.email})`);
    }
  } catch (error: any) {
    console.error(`❌ Failed to send email to ${participant.email}:`, error.message);
    // Don't throw error - we don't want email failures to break meeting creation
  }
};

/**
 * Send email notification to a participant about a rescheduled meeting
 */
export const sendRescheduledMeetingEmail = async (
  participant: Participant,
  meetingData: MeetingEmailData
): Promise<void> => {
  try {
    if (!participant.email) {
      console.warn(`⚠️ Participant ${participant.name} has no email address - skipping email`);
      return;
    }

    // Validate email address
    if (!isValidEmail(participant.email)) {
      console.warn(`⚠️ Participant ${participant.name} has invalid/dummy email (${participant.email}) - skipping email`);
      return;
    }

    const htmlContent = generateRescheduledMeetingEmail(participant.name, meetingData);
    const fromEmail = process.env.SMTP_USER || "noreply@automeet.app";

    if (USE_SENDGRID) {
      // Use SendGrid API
      const msg = {
        to: participant.email,
        from: fromEmail,
        subject: `Meeting Rescheduled: ${meetingData.agenda}`,
        html: htmlContent,
      };

      await sgMail.send(msg);
      console.log(`✅ [SendGrid] Reschedule email sent to ${participant.name} (${participant.email})`);
    } else {
      // Use nodemailer (SMTP)
      const transporter = createTransporter();

      const mailOptions = {
        from: `"AutoMeet" <${fromEmail}>`,
        to: participant.email,
        subject: `Meeting Rescheduled: ${meetingData.agenda}`,
        html: htmlContent,
      };

      await transporter.sendMail(mailOptions);
      console.log(`✅ [SMTP] Reschedule email sent to ${participant.name} (${participant.email})`);
    }
  } catch (error: any) {
    console.error(`❌ Failed to send email to ${participant.email}:`, error.message);
    // Don't throw error - we don't want email failures to break meeting updates
  }
};

/**
 * Send emails to all participants about a new meeting
 */
export const notifyParticipantsNewMeeting = async (
  participants: Participant[],
  meetingData: MeetingEmailData
): Promise<void> => {
  const totalParticipants = participants.length;
  const validEmails = participants.filter(p => p.email && isValidEmail(p.email)).length;
  const invalidEmails = totalParticipants - validEmails;

  console.log(`📧 Sending new meeting emails to ${totalParticipants} participant(s)...`);
  if (invalidEmails > 0) {
    console.warn(`⚠️ ${invalidEmails} participant(s) have invalid/missing emails and will be skipped`);
  }
  console.log(`✉️ Attempting to send ${validEmails} email(s)`);

  await Promise.all(
    participants.map((participant) =>
      sendNewMeetingEmail(participant, meetingData)
    )
  );

  console.log(`✅ New meeting email notifications complete (${validEmails} valid, ${invalidEmails} skipped)`);
};

/**
 * Send emails to all participants about a rescheduled meeting
 */
export const notifyParticipantsRescheduled = async (
  participants: Participant[],
  meetingData: MeetingEmailData
): Promise<void> => {
  const totalParticipants = participants.length;
  const validEmails = participants.filter(p => p.email && isValidEmail(p.email)).length;
  const invalidEmails = totalParticipants - validEmails;

  console.log(`📧 Sending reschedule emails to ${totalParticipants} participant(s)...`);
  if (invalidEmails > 0) {
    console.warn(`⚠️ ${invalidEmails} participant(s) have invalid/missing emails and will be skipped`);
  }
  console.log(`✉️ Attempting to send ${validEmails} email(s)`);

  await Promise.all(
    participants.map((participant) =>
      sendRescheduledMeetingEmail(participant, meetingData)
    )
  );

  console.log(`✅ Reschedule email notifications complete (${validEmails} valid, ${invalidEmails} skipped)`);
};