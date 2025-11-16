/**
 * Debug Recent Meetings
 *
 * This script checks recent meetings to see:
 * 1. What participants were included
 * 2. Whether those participants have valid emails
 * 3. Why emails might not have been sent
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

// Email validation function (same as in email.service.ts)
const isValidEmail = (email) => {
  if (!email || typeof email !== 'string') {
    return false;
  }

  email = email.trim().toLowerCase();
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return false;
  }

  const dummyPatterns = [
    /^test@test\./, /^dummy@/, /^fake@/, /^noemail@/, /^no-email@/,
    /^example@example\./, /^user@example\./, /^admin@example\./,
    /@example\.com$/, /@example\.org$/, /@test\.com$/,
    /@dummy\.com$/, /@fake\.com$/, /^[0-9]+@/, /^abc@/, /^xyz@/, /^test\d*@/,
  ];

  for (const pattern of dummyPatterns) {
    if (pattern.test(email)) return false;
  }

  const invalidStarts = ['n/a@', 'na@', 'none@', 'null@', 'undefined@'];
  for (const invalid of invalidStarts) {
    if (email.startsWith(invalid)) return false;
  }

  if (email.startsWith('@') || email.length < 5 || email.length > 254) {
    return false;
  }

  return true;
};

async function debugRecentMeetings() {
  try {
    console.log('🔍 Checking recent meetings for email issues...\n');

    // Get all meetings, sorted by creation date (most recent first)
    const meetingsSnapshot = await db.collection('meetings')
      .orderBy('created_at', 'desc')
      .limit(5)
      .get();

    if (meetingsSnapshot.empty) {
      console.log('❌ No meetings found in the database!');
      return;
    }

    console.log(`Found ${meetingsSnapshot.size} recent meeting(s)\n`);
    console.log('═'.repeat(80));

    for (const meetingDoc of meetingsSnapshot.docs) {
      const meeting = meetingDoc.data();
      const meetingId = meetingDoc.id;

      console.log(`\n📅 Meeting ID: ${meetingId}`);
      console.log(`   Agenda: ${meeting.agenda || 'N/A'}`);
      console.log(`   Created: ${meeting.created_at}`);
      console.log(`   Type: ${meeting.meeting_type || 'N/A'}`);

      if (!meeting.participants || !Array.isArray(meeting.participants)) {
        console.log('   ⚠️  NO PARTICIPANTS - Emails would not be sent!');
        continue;
      }

      console.log(`   Participants (${meeting.participants.length}):`);

      let validEmailCount = 0;
      let invalidEmailCount = 0;
      let missingEmailCount = 0;

      for (const participant of meeting.participants) {
        const userId = participant.user_id || participant.id || participant;

        if (typeof userId !== 'string') {
          console.log(`      ⚠️  Invalid participant format:`, participant);
          continue;
        }

        try {
          const userDoc = await db.collection('users').doc(userId).get();

          if (!userDoc.exists) {
            console.log(`      ❌ User ${userId} - NOT FOUND in database`);
            missingEmailCount++;
            continue;
          }

          const userData = userDoc.data();
          const userName = userData.name || 'Unknown';
          const userEmail = userData.email;

          if (!userEmail) {
            console.log(`      ⚠️  ${userName} (${userId}) - NO EMAIL ADDRESS`);
            missingEmailCount++;
          } else if (!isValidEmail(userEmail)) {
            console.log(`      ❌ ${userName} (${userId}) - INVALID EMAIL: ${userEmail}`);
            console.log(`         └─ Reason: Dummy/test email pattern detected`);
            invalidEmailCount++;
          } else {
            console.log(`      ✅ ${userName} (${userId}) - VALID: ${userEmail}`);
            validEmailCount++;
          }
        } catch (error) {
          console.log(`      ❌ Error fetching user ${userId}:`, error.message);
        }
      }

      console.log(`\n   📊 Email Summary for this meeting:`);
      console.log(`      ✅ Would receive email: ${validEmailCount}`);
      console.log(`      ❌ Invalid/dummy email: ${invalidEmailCount}`);
      console.log(`      ⚠️  Missing email: ${missingEmailCount}`);

      if (validEmailCount === 0) {
        console.log(`\n   🚨 PROBLEM: No participants with valid emails!`);
        console.log(`      This is why you didn't receive any emails for this meeting.`);
      }

      console.log('\n' + '─'.repeat(80));
    }

    console.log('\n💡 Common Issues:');
    console.log('   1. Participants have dummy emails (test@example.com, etc.)');
    console.log('   2. Participants missing email addresses');
    console.log('   3. Participants using invalid user IDs\n');
    console.log('📝 Solution:');
    console.log('   - Use participants with valid emails (check: node check-user-emails.js)');
    console.log('   - Update test users with real email addresses\n');

  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error(error);
  }
}

debugRecentMeetings();
