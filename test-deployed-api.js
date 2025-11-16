/**
 * Test Deployed API Email Functionality
 *
 * This script tests your deployed backend (on Render) to verify
 * that email notifications work when creating meetings via API.
 *
 * Usage: node test-deployed-api.js [your-render-url]
 * Example: node test-deployed-api.js https://automeet-backend.onrender.com
 */

const axios = require('axios');
require('dotenv').config();

const API_URL = process.argv[2] || process.env.DEPLOYED_API_URL || 'http://localhost:3000';

async function testDeployedAPI() {
  try {
    console.log('🌐 Testing deployed API email functionality...\n');
    console.log(`API URL: ${API_URL}\n`);

    // Check if API is reachable
    console.log('🔍 Step 1: Checking API health...');
    try {
      const healthCheck = await axios.get(`${API_URL}/api/meetings`, {
        timeout: 10000,
      });
      console.log(`✅ API is reachable (${healthCheck.status})\n`);
    } catch (error) {
      if (error.code === 'ECONNREFUSED') {
        console.error('❌ Cannot connect to API');
        console.error(`\nIs your server running at: ${API_URL}?`);
        console.error('\nIf testing deployed server, provide the URL:');
        console.error('   node test-deployed-api.js https://your-app.onrender.com\n');
        process.exit(1);
      }
      // Continue even if GET fails (might need auth)
      console.warn(`⚠️  Could not GET /api/meetings: ${error.message}`);
      console.log('   (This is okay, will try creating a meeting anyway)\n');
    }

    // Create test meeting with valid email participants
    console.log('📝 Step 2: Creating test meeting...');
    const meetingData = {
      creator_id: 'yXxPWeqvclMW2TU5ucq9', // Aman Kumar - amankumarhoyo@gmail.com
      meeting_type: 'Email Test',
      importance: 9,
      start_time: Date.now() + 2 * 60 * 60 * 1000, // 2 hours from now
      end_time: Date.now() + 3 * 60 * 60 * 1000, // 3 hours from now
      agenda: 'Deployed API Email Notification Test',
      meeting_link: 'https://meet.google.com/deployed-test',
      participants: [
        'yXxPWeqvclMW2TU5ucq9', // Aman Kumar - amankumarhoyo@gmail.com
        'uGcigsfPYHz9uthWwYf9', // aman kumar - amanku070300@gmail.com
      ],
    };

    console.log('   Agenda:', meetingData.agenda);
    console.log('   Participants: 2 (with valid emails)');
    console.log('   - amankumarhoyo@gmail.com');
    console.log('   - amanku070300@gmail.com\n');

    console.log('📤 Step 3: Sending POST request...');
    const response = await axios.post(`${API_URL}/api/meetings`, meetingData, {
      headers: {
        'Content-Type': 'application/json',
      },
      timeout: 15000,
    });

    console.log('✅ Meeting created successfully!\n');
    console.log('Response:');
    console.log('   Status:', response.status);
    console.log('   Meeting ID:', response.data.meeting_id);
    console.log('   Participants returned:', response.data.participants?.length || 0);

    console.log('\n📧 Step 4: Checking if emails were triggered...');
    console.log('\n💡 To verify emails were sent:');
    console.log('   1. Check Render logs for:');
    console.log('      📧 Sending new meeting emails to 2 participant(s)...');
    console.log('      ✅ Email sent to Aman Kumar (amankumarhoyo@gmail.com)');
    console.log('      ✅ Email sent to aman kumar (amanku070300@gmail.com)');
    console.log('      ✅ New meeting email notifications complete');
    console.log('\n   2. Check email inboxes:');
    console.log('      - amankumarhoyo@gmail.com');
    console.log('      - amanku070300@gmail.com');
    console.log('\n   3. Look for email:');
    console.log('      Subject: "New Meeting: Deployed API Email Notification Test"');
    console.log('      From: AutoMeet <amankumarhoyo@gmail.com>');

    console.log('\n🔍 If you DON\'T see emails:');
    console.log('   ❌ SMTP environment variables might be missing on deployed server');
    console.log('   ❌ Server might need to be redeployed');
    console.log('   ❌ Check server logs for errors');
    console.log('\n   See: FRONTEND_EMAIL_FIX.md for detailed troubleshooting\n');

    console.log('✅ API test completed!');

  } catch (error) {
    console.error('\n❌ Error testing API:');

    if (error.response) {
      console.error('   Status:', error.response.status);
      console.error('   Error:', error.response.data);

      if (error.response.status === 400) {
        console.error('\n💡 The API rejected your request.');
        console.error('   This usually means required fields are missing or invalid.');
      }
    } else if (error.code === 'ECONNREFUSED') {
      console.error('   Cannot connect to:', API_URL);
      console.error('\n💡 Server is not running or URL is incorrect.');
    } else {
      console.error('   ', error.message);
    }

    console.error('\n📝 Usage:');
    console.error('   For local: node test-deployed-api.js http://localhost:3000');
    console.error('   For Render: node test-deployed-api.js https://your-app.onrender.com\n');

    process.exit(1);
  }
}

testDeployedAPI();
