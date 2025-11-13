/**
 * Cleanup script to fix corrupted meeting participants
 *
 * This script will:
 * 1. Find all meetings with corrupted participants (missing user_id)
 * 2. Delete meetings that cannot be fixed
 * 3. Report on what was cleaned up
 *
 * Run: node cleanup-meetings.js
 */

const admin = require('firebase-admin');
const dotenv = require('dotenv');

dotenv.config();

// Initialize Firebase Admin
const serviceAccount = process.env.GOOGLE_APPLICATION_CREDENTIALS_JSON
  ? JSON.parse(process.env.GOOGLE_APPLICATION_CREDENTIALS_JSON)
  : require('./serviceAccountKey.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

const db = admin.firestore();
const meetingsRef = db.collection('meetings');
const usersRef = db.collection('users');

async function cleanupMeetings() {
  console.log('🧹 Starting meeting cleanup...\n');

  try {
    // Get all meetings
    const meetingsSnapshot = await meetingsRef.get();

    if (meetingsSnapshot.empty) {
      console.log('✅ No meetings found in database.');
      return;
    }

    console.log(`📊 Found ${meetingsSnapshot.size} meeting(s) to check.\n`);

    let fixedCount = 0;
    let deletedCount = 0;
    let alreadyGoodCount = 0;

    for (const meetingDoc of meetingsSnapshot.docs) {
      const meetingId = meetingDoc.id;
      const meetingData = meetingDoc.data();

      console.log(`\n🔍 Checking meeting: ${meetingId}`);
      console.log(`   Agenda: ${meetingData.agenda || 'N/A'}`);
      console.log(`   Created: ${meetingData.created_at || 'N/A'}`);

      // Check if participants exist
      if (!meetingData.participants || !Array.isArray(meetingData.participants)) {
        console.log('   ❌ No participants array found - DELETING');
        await meetingsRef.doc(meetingId).delete();
        deletedCount++;
        continue;
      }

      // Check if participants are corrupted (strings or missing user_id)
      const hasCorruptedParticipants = meetingData.participants.some(p => {
        return typeof p === 'string' || !p || typeof p !== 'object' || !p.user_id;
      });

      if (!hasCorruptedParticipants) {
        console.log('   ✅ Participants are valid - no changes needed');
        alreadyGoodCount++;
        continue;
      }

      console.log('   ⚠️  Found corrupted participants');
      console.log('   Participants:', JSON.stringify(meetingData.participants, null, 2));

      // Try to fix participants that are strings (just user IDs)
      const canFix = meetingData.participants.every(p => typeof p === 'string' || (p && p.user_id));

      if (canFix) {
        console.log('   🔄 Fixing participants structure...');

        const fixedParticipants = await Promise.all(
          meetingData.participants.map(async (p) => {
            const userId = typeof p === 'string' ? p : p.user_id;

            // Verify user exists
            const userDoc = await usersRef.doc(userId).get();

            if (!userDoc.exists) {
              console.log(`   ⚠️  User ${userId} not found - skipping`);
              return null;
            }

            return {
              user_id: userId,
              predicted_attendance_probability: p.predicted_attendance_probability || 0.5,
            };
          })
        );

        // Filter out nulls (users that don't exist)
        const validParticipants = fixedParticipants.filter(p => p !== null);

        if (validParticipants.length === 0) {
          console.log('   ❌ No valid participants - DELETING meeting');
          await meetingsRef.doc(meetingId).delete();
          deletedCount++;
          continue;
        }

        await meetingsRef.doc(meetingId).update({
          participants: validParticipants,
          updated_at: new Date().toISOString(),
        });

        console.log(`   ✅ FIXED - Set ${validParticipants.length} valid participant(s)`);
        fixedCount++;
        continue;
      }

      // Try to get creator_id as a fallback participant
      if (meetingData.creator_id) {
        console.log(`   🔄 Attempting to fix using creator_id: ${meetingData.creator_id}`);

        // Verify creator exists
        const creatorDoc = await usersRef.doc(meetingData.creator_id).get();

        if (creatorDoc.exists) {
          // Replace corrupted participants with just the creator
          const fixedParticipants = [{
            user_id: meetingData.creator_id,
            predicted_attendance_probability: 0.5,
          }];

          await meetingsRef.doc(meetingId).update({
            participants: fixedParticipants,
            updated_at: new Date().toISOString(),
          });

          console.log('   ✅ FIXED - Set participants to [creator only]');
          fixedCount++;
        } else {
          console.log('   ❌ Creator not found - DELETING meeting');
          await meetingsRef.doc(meetingId).delete();
          deletedCount++;
        }
      } else {
        console.log('   ❌ No creator_id - DELETING meeting');
        await meetingsRef.doc(meetingId).delete();
        deletedCount++;
      }
    }

    console.log('\n' + '='.repeat(50));
    console.log('📊 Cleanup Summary:');
    console.log('='.repeat(50));
    console.log(`✅ Already valid: ${alreadyGoodCount}`);
    console.log(`🔧 Fixed: ${fixedCount}`);
    console.log(`🗑️  Deleted: ${deletedCount}`);
    console.log(`📝 Total processed: ${meetingsSnapshot.size}`);
    console.log('='.repeat(50));

    if (fixedCount > 0) {
      console.log('\n⚠️  Note: Fixed meetings now only contain the creator as a participant.');
      console.log('   You should edit these meetings to add the correct participants.');
    }

    console.log('\n✅ Cleanup complete!');

  } catch (error) {
    console.error('\n❌ Error during cleanup:', error);
    process.exit(1);
  }

  process.exit(0);
}

// Run the cleanup
cleanupMeetings();
