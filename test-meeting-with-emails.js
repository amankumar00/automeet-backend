/**
 * Test Meeting Creation with Valid Email Participants
 *
 * This script creates a test meeting with participants who have valid email addresses
 * to verify that email notifications are being sent correctly.
 */

const admin = require('firebase-admin');
require('dotenv').config();

// Initialize Firebase Admin if not already initialized
if (!admin.apps.length) {
  if (process.env.GOOGLE_APPLICATION_CREDENTIALS) {
    admin.initializeApp({
      credential: admin.credential.applicationDefault(),
    });
  } else {
    const serviceAccount = require('./serviceAccountKey.json');
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
    });
  }
}

const db = admin.firestore();

async function createTestMeeting() {
  try {
    console.log('🧪 Creating test meeting with valid email participants...\n');

    // Find users with the specified emails
    const usersSnapshot = await db.collection('users').get();

    const amanUser = usersSnapshot.docs.find(doc =>
      doc.data().email === 'amanku070300@gmail.com'
    );
    const amanHoyoUser = usersSnapshot.docs.find(doc =>
      doc.data().email === 'amankumarhoyo@gmail.com'
    );

    if (!amanUser || !amanHoyoUser) {
      console.error('❌ Error: Could not find users with specified emails');
      console.log('\nFound users:');
      usersSnapshot.docs.forEach(doc => {
        console.log(`  - ${doc.data().name}: ${doc.data().email}`);
      });
      process.exit(1);
    }

    const participants = [
      {
        user_id: amanUser.id,
        predicted_attendance_probability: 0.85
      },
      {
        user_id: amanHoyoUser.id,
        predicted_attendance_probability: 0.90
      }
    ];

    console.log('👥 Participants:');
    console.log(`  1. ${amanUser.data().name} (${amanUser.data().email}) - ID: ${amanUser.id}`);
    console.log(`  2. ${amanHoyoUser.data().name} (${amanHoyoUser.data().email}) - ID: ${amanHoyoUser.id}`);
    console.log();

    // Create meeting
    const meetingData = {
      creator_id: amanHoyoUser.id,
      meeting_type: 'Team Sync',
      importance: 8,
      start_time: new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString(), // 2 hours from now
      end_time: new Date(Date.now() + 3 * 60 * 60 * 1000).toISOString(), // 3 hours from now
      agenda: 'Email Notification Test Meeting',
      meeting_link: 'https://meet.google.com/test-email-meeting',
      participants: participants,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    console.log('📅 Meeting Details:');
    console.log(`  Type: ${meetingData.meeting_type}`);
    console.log(`  Agenda: ${meetingData.agenda}`);
    console.log(`  Start: ${new Date(meetingData.start_time).toLocaleString()}`);
    console.log(`  End: ${new Date(meetingData.end_time).toLocaleString()}`);
    console.log(`  Importance: ${meetingData.importance}/10`);
    console.log(`  Link: ${meetingData.meeting_link}`);
    console.log();

    console.log('💾 Saving meeting to database...');
    const meetingRef = await db.collection('meetings').add(meetingData);
    console.log(`✅ Meeting created with ID: ${meetingRef.id}\n`);

    console.log('📧 Now triggering email notifications...');
    console.log('   (This will use the email service from your backend)\n');

    // Import and use the email service
    const emailService = require('./dist/services/email.service.js');

    // Populate participant details
    const populatedParticipants = [
      {
        user_id: amanUser.id,
        name: amanUser.data().name,
        email: amanUser.data().email,
        company: amanUser.data().company || 'Unknown',
        role: amanUser.data().role || 'Unknown',
        predicted_attendance_probability: 0.85
      },
      {
        user_id: amanHoyoUser.id,
        name: amanHoyoUser.data().name,
        email: amanHoyoUser.data().email,
        company: amanHoyoUser.data().company || 'Unknown',
        role: amanHoyoUser.data().role || 'Unknown',
        predicted_attendance_probability: 0.90
      }
    ];

    const emailData = {
      meeting_id: meetingRef.id,
      meeting_type: meetingData.meeting_type,
      importance: meetingData.importance,
      start_time: meetingData.start_time,
      end_time: meetingData.end_time,
      agenda: meetingData.agenda,
      meeting_link: meetingData.meeting_link,
      creator_name: amanHoyoUser.data().name,
    };

    await emailService.notifyParticipantsNewMeeting(populatedParticipants, emailData);

    console.log('\n✅ Test completed!');
    console.log('\n📬 Check your email inboxes:');
    console.log(`   - ${amanUser.data().email}`);
    console.log(`   - ${amanHoyoUser.data().email}`);
    console.log('\n💡 If you don\'t see the email:');
    console.log('   1. Check your spam/junk folder');
    console.log('   2. Look for email from:', process.env.SMTP_USER);
    console.log('   3. Subject: "New Meeting: Email Notification Test Meeting"');

    process.exit(0);
  } catch (error) {
    console.error('\n❌ Error:', error.message);
    console.error(error);
    process.exit(1);
  }
}

createTestMeeting();
