/**
 * Check User Email Addresses
 *
 * This script checks if users in your database have valid email addresses
 * that will pass the email validation.
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
    /^[0-9]+@/,
    /^abc@/,
    /^xyz@/,
    /^test\d*@/,
  ];

  for (const pattern of dummyPatterns) {
    if (pattern.test(email)) {
      return false;
    }
  }

  const invalidStarts = ['n/a@', 'na@', 'none@', 'null@', 'undefined@'];
  for (const invalid of invalidStarts) {
    if (email.startsWith(invalid)) {
      return false;
    }
  }

  if (email.startsWith('@') || email.length < 5 || email.length > 254) {
    return false;
  }

  return true;
};

async function checkUserEmails() {
  try {
    console.log('📋 Checking user email addresses...\n');

    const usersSnapshot = await db.collection('users').get();

    if (usersSnapshot.empty) {
      console.log('❌ No users found in the database!');
      console.log('\nYou need to create users before they can receive meeting invitations.');
      return;
    }

    console.log(`Found ${usersSnapshot.size} user(s)\n`);
    console.log('─'.repeat(80));

    let validCount = 0;
    let invalidCount = 0;
    let missingCount = 0;

    usersSnapshot.forEach((doc) => {
      const user = doc.data();
      const userId = doc.id;
      const email = user.email;
      const name = user.name || 'Unknown';

      console.log(`\nUser ID: ${userId}`);
      console.log(`Name: ${name}`);

      if (!email) {
        console.log(`Email: ❌ MISSING`);
        console.log(`Status: ⚠️ Will NOT receive emails (no email address)`);
        missingCount++;
      } else if (!isValidEmail(email)) {
        console.log(`Email: ${email}`);
        console.log(`Status: ❌ INVALID - Will be skipped (dummy/test email)`);
        invalidCount++;
      } else {
        console.log(`Email: ${email}`);
        console.log(`Status: ✅ VALID - Will receive emails`);
        validCount++;
      }
    });

    console.log('\n' + '─'.repeat(80));
    console.log('\n📊 Summary:');
    console.log(`   Total users: ${usersSnapshot.size}`);
    console.log(`   ✅ Valid emails: ${validCount}`);
    console.log(`   ❌ Invalid/dummy emails: ${invalidCount}`);
    console.log(`   ⚠️  Missing emails: ${missingCount}`);

    if (validCount === 0) {
      console.log('\n⚠️  WARNING: No users have valid email addresses!');
      console.log('\n💡 To fix this:');
      console.log('   1. Update your users with real email addresses');
      console.log('   2. Make sure emails are not dummy/test addresses');
      console.log('   3. Use format: user@domain.com');
      console.log('\n   Example:');
      console.log('   POST /api/users/:id');
      console.log('   { "email": "yourname@gmail.com" }');
    }

    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

checkUserEmails();
