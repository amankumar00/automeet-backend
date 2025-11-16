/**
 * Test Meeting Creation via API (simulating frontend call)
 *
 * This script makes an HTTP request to the API endpoint, just like the frontend does,
 * to verify that email notifications work when called via API.
 */

const axios = require('axios');
require('dotenv').config();

const API_URL = process.env.API_URL || 'http://localhost:3000';

async function testFrontendAPICall() {
  try {
    console.log('🌐 Testing meeting creation via API endpoint...\n');
    console.log(`API URL: ${API_URL}/api/meetings\n`);

    // These are the user IDs we know have valid emails
    const participants = [
      'uGcigsfPYHz9uthWwYf9', // aman kumar - amanku070300@gmail.com
      'yXxPWeqvclMW2TU5ucq9', // Aman Kumar - amankumarhoyo@gmail.com
    ];

    const meetingData = {
      creator_id: 'yXxPWeqvclMW2TU5ucq9',
      meeting_type: 'Team Sync',
      importance: 8,
      start_time: Date.now() + 2 * 60 * 60 * 1000, // 2 hours from now
      end_time: Date.now() + 3 * 60 * 60 * 1000, // 3 hours from now
      agenda: 'Frontend API Test Meeting',
      meeting_link: 'https://meet.google.com/frontend-test',
      participants: participants,
    };

    console.log('📅 Meeting Data:');
    console.log(JSON.stringify(meetingData, null, 2));
    console.log();

    console.log('📤 Sending POST request to API...');
    const response = await axios.post(`${API_URL}/api/meetings`, meetingData, {
      headers: {
        'Content-Type': 'application/json',
      },
      timeout: 10000,
    });

    console.log('✅ Response received!\n');
    console.log('Status:', response.status);
    console.log('Meeting ID:', response.data.meeting_id);
    console.log('\nFull Response:');
    console.log(JSON.stringify(response.data, null, 2));

    console.log('\n📧 Email notifications should have been triggered!');
    console.log('\n📬 Check your email inboxes:');
    console.log('   - amanku070300@gmail.com');
    console.log('   - amankumarhoyo@gmail.com');
    console.log('\n💡 Look for email:');
    console.log('   Subject: "New Meeting: Frontend API Test Meeting"');
    console.log('   From: AutoMeet <amankumarhoyo@gmail.com>');

  } catch (error) {
    if (error.code === 'ECONNREFUSED') {
      console.error('\n❌ Error: Could not connect to API server');
      console.error(`\nIs your backend server running on ${API_URL}?`);
      console.error('\nTo start the server, run:');
      console.error('   npm run dev');
      console.error('\nThen run this test again.');
    } else if (error.response) {
      console.error('\n❌ API Error Response:');
      console.error('Status:', error.response.status);
      console.error('Data:', error.response.data);
    } else {
      console.error('\n❌ Error:', error.message);
      console.error(error);
    }
    process.exit(1);
  }
}

testFrontendAPICall();
