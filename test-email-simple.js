/**
 * Simple Email Test Script
 *
 * This script tests your SMTP configuration by sending a test email.
 * Run: node test-email-simple.js
 */

const nodemailer = require('nodemailer');
require('dotenv').config();

async function testEmail() {
  console.log('📧 Testing email configuration...\n');

  // Check if required env variables are set
  if (!process.env.SMTP_USER || !process.env.SMTP_PASS) {
    console.error('❌ Error: SMTP_USER and SMTP_PASS must be set in .env file');
    console.log('\nPlease add to your .env file:');
    console.log('SMTP_HOST=smtp.gmail.com');
    console.log('SMTP_PORT=587');
    console.log('SMTP_SECURE=false');
    console.log('SMTP_USER=your-email@gmail.com');
    console.log('SMTP_PASS=your-app-password');
    process.exit(1);
  }

  console.log('Configuration:');
  console.log('  Host:', process.env.SMTP_HOST || 'smtp.gmail.com');
  console.log('  Port:', process.env.SMTP_PORT || '587');
  console.log('  Secure:', process.env.SMTP_SECURE || 'false');
  console.log('  User:', process.env.SMTP_USER);
  console.log('  Pass:', '***' + process.env.SMTP_PASS.slice(-4));
  console.log();

  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST || 'smtp.gmail.com',
    port: parseInt(process.env.SMTP_PORT || '587'),
    secure: process.env.SMTP_SECURE === 'true',
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });

  try {
    console.log('🔄 Verifying SMTP connection...');
    await transporter.verify();
    console.log('✅ SMTP connection verified!\n');

    console.log('📤 Sending test email...');
    const info = await transporter.sendMail({
      from: `"AutoMeet Test" <${process.env.SMTP_USER}>`,
      to: process.env.SMTP_USER, // Send to yourself
      subject: 'AutoMeet Email Configuration Test ✅',
      html: `
        <h2 style="color: #4CAF50;">Email Configuration Successful!</h2>
        <p>If you're reading this, your AutoMeet email configuration is working correctly.</p>
        <p><strong>Configuration Details:</strong></p>
        <ul>
          <li>SMTP Host: ${process.env.SMTP_HOST || 'smtp.gmail.com'}</li>
          <li>SMTP Port: ${process.env.SMTP_PORT || '587'}</li>
          <li>From Address: ${process.env.SMTP_USER}</li>
        </ul>
        <p>You can now create and reschedule meetings, and participants will receive email notifications.</p>
        <hr>
        <p style="color: #777; font-size: 12px;">This is a test email from AutoMeet backend.</p>
      `,
    });

    console.log('✅ Email sent successfully!');
    console.log('   Message ID:', info.messageId);
    console.log('\n🎉 Email configuration is working!');
    console.log('   Check your inbox:', process.env.SMTP_USER);
  } catch (error) {
    console.error('❌ Error:', error.message);
    console.log('\n💡 Troubleshooting:');
    console.log('  1. For Gmail: Make sure you\'re using an App Password, not your regular password');
    console.log('  2. Check that SMTP_HOST and SMTP_PORT are correct');
    console.log('  3. Verify your email and password are correct');
    console.log('  4. See EMAIL_SETUP.md for detailed instructions');
    process.exit(1);
  }
}

testEmail();
