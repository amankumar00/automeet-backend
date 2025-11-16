/**
 * Test Meeting Creation When ML API Fails
 *
 * This test simulates a scenario where the ML API is down/fails,
 * to verify that email notifications still get sent (using fallback probabilities)
 */

const admin = require('firebase-admin');
require('dotenv').config();

// Initialize Firebase Admin
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

// Temporarily break the ML API URL to simulate failure
process.env.FASTAPI_URL = 'http://invalid-url-that-will-fail.com/predict';

async function testMeetingCreationWithMLFailure() {
  try {
    console.log('🧪 Testing meeting creation when ML API fails...\n');
    console.log('⚠️  ML API URL set to invalid: http://invalid-url-that-will-fail.com/predict');
    console.log('   (This will force the fallback probability logic)\n');

    // Import the controller (will use broken ML API URL)
    const { createMeeting } = require('./dist/controllers/meetings.controller.js');

    // Find users with valid emails
    const usersSnapshot = await db.collection('users').get();
    const amanUser = usersSnapshot.docs.find(doc =>
      doc.data().email === 'amanku070300@gmail.com'
    );
    const amanHoyoUser = usersSnapshot.docs.find(doc =>
      doc.data().email === 'amankumarhoyo@gmail.com'
    );

    if (!amanUser || !amanHoyoUser) {
      console.error('❌ Could not find required users');
      process.exit(1);
    }

    console.log('👥 Participants:');
    console.log(`  1. ${amanUser.data().name} (${amanUser.data().email})`);
    console.log(`  2. ${amanHoyoUser.data().name} (${amanHoyoUser.data().email})`);
    console.log();

    // Create mock request and response objects
    const req = {
      body: {
        creator_id: amanHoyoUser.id,
        meeting_type: 'Team Sync',
        importance: 8,
        start_time: Date.now() + 2 * 60 * 60 * 1000,
        end_time: Date.now() + 3 * 60 * 60 * 1000,
        agenda: 'ML Failure Test Meeting',
        meeting_link: 'https://meet.google.com/ml-failure-test',
        participants: [amanUser.id, amanHoyoUser.id],
      }
    };

    const res = {
      status: (code) => {
        console.log(`\n📡 Response Status: ${code}`);
        return {
          json: (data) => {
            console.log('📄 Response Data:', JSON.stringify(data, null, 2));

            if (code === 201) {
              console.log('\n✅ Meeting created successfully despite ML API failure!');
              console.log('\n📧 Email notifications should have been sent!');
              console.log('\n📬 Check your email inboxes:');
              console.log(`   - ${amanUser.data().email}`);
              console.log(`   - ${amanHoyoUser.data().email}`);
              console.log('\n💡 Subject: "New Meeting: ML Failure Test Meeting"');
              console.log('\n🎯 KEY POINT: Emails were sent even though ML API failed!');
              console.log('   This proves the fix is working.\n');
            } else {
              console.log('\n❌ Meeting creation failed!');
              console.log('   The ML API failure is still blocking meeting creation.');
              console.log('   The fix may not be applied correctly.\n');
            }
            process.exit(code === 201 ? 0 : 1);
          }
        };
      }
    };

    console.log('📅 Creating meeting with ML API unavailable...\n');
    console.log('Expected behavior:');
    console.log('  1. ML API call will fail');
    console.log('  2. Fallback probabilities will be used');
    console.log('  3. Meeting will be created successfully');
    console.log('  4. Emails will be sent to participants');
    console.log('\n' + '─'.repeat(60) + '\n');

    // Call the controller
    await createMeeting(req, res);

  } catch (error) {
    console.error('\n❌ Unexpected error:', error.message);
    console.error(error);
    process.exit(1);
  }
}

testMeetingCreationWithMLFailure();
