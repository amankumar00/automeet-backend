# Email Notification Setup

This guide will help you configure email notifications for meeting invitations and reschedules.

## Features

- **New Meeting Notifications**: Automatically sends emails to all participants when a meeting is created
- **Reschedule Notifications**: Sends update emails when meeting time or participants are changed
- **Beautiful HTML Templates**: Professional email templates with meeting details
- **Non-blocking**: Email sending happens in the background and won't block API responses

## Configuration

### 1. Environment Variables

Add the following environment variables to your `.env` file:

```env
# Email Configuration (SMTP)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
```

### 2. Gmail Setup (Recommended)

If you're using Gmail:

1. **Enable 2-Factor Authentication** on your Google Account
2. **Generate an App Password**:
   - Go to [Google Account Security](https://myaccount.google.com/security)
   - Click on "2-Step Verification"
   - Scroll down to "App passwords"
   - Select "Mail" and your device
   - Copy the generated 16-character password
3. **Update your `.env` file**:
   ```env
   SMTP_HOST=smtp.gmail.com
   SMTP_PORT=587
   SMTP_SECURE=false
   SMTP_USER=your-email@gmail.com
   SMTP_PASS=your-16-char-app-password
   ```

### 3. Other Email Providers

#### Outlook/Hotmail
```env
SMTP_HOST=smtp-mail.outlook.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your-email@outlook.com
SMTP_PASS=your-password
```

#### Yahoo Mail
```env
SMTP_HOST=smtp.mail.yahoo.com
SMTP_PORT=465
SMTP_SECURE=true
SMTP_USER=your-email@yahoo.com
SMTP_PASS=your-app-password
```

#### Custom SMTP Server
```env
SMTP_HOST=your-smtp-server.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your-username
SMTP_PASS=your-password
```

## Email Templates

### New Meeting Email
- **Subject**: `New Meeting: [Agenda]`
- **Color**: Green header
- **Includes**: Meeting type, agenda, start/end time, importance, join link, organizer name

### Rescheduled Meeting Email
- **Subject**: `Meeting Rescheduled: [Agenda]`
- **Color**: Orange header
- **Includes**: Warning banner, updated meeting details

## How It Works

### When Creating a Meeting

```javascript
POST /api/meetings
{
  "creator_id": "user123",
  "meeting_type": "Team Sync",
  "importance": 8,
  "start_time": 1700000000000,
  "end_time": 1700003600000,
  "agenda": "Q4 Planning",
  "meeting_link": "https://meet.google.com/abc-def-ghi",
  "participants": ["user1", "user2", "user3"]
}
```

**Backend automatically**:
1. Creates the meeting in Firestore
2. Fetches participant details (name, email)
3. Sends email to each participant
4. Returns response immediately (emails sent in background)

### When Updating a Meeting

```javascript
PUT /api/meetings/:id
{
  "start_time": 1700010000000,  // Changed time
  "end_time": 1700013600000
}
```

**Backend automatically**:
1. Detects time change
2. Updates meeting in Firestore
3. Sends reschedule email to all participants
4. Returns response immediately

## Error Handling

- Email failures **do not** block meeting creation/updates
- Errors are logged to console with `⚠️` prefix
- Missing participant emails are skipped with warnings

## Testing

### Test Email Configuration

Create a simple test script `test-email.js`:

```javascript
const nodemailer = require('nodemailer');
require('dotenv').config();

const transporter = nodemailer.createTransporter({
  host: process.env.SMTP_HOST,
  port: parseInt(process.env.SMTP_PORT),
  secure: process.env.SMTP_SECURE === 'true',
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

transporter.sendMail({
  from: process.env.SMTP_USER,
  to: 'your-test-email@example.com',
  subject: 'AutoMeet Email Test',
  text: 'If you receive this, your email configuration is working!',
})
  .then(() => console.log('✅ Email sent successfully!'))
  .catch((err) => console.error('❌ Email failed:', err));
```

Run: `node test-email.js`

## Troubleshooting

### "Invalid login" or "Authentication failed"
- Gmail: Make sure you're using an App Password, not your regular password
- Enable "Less secure app access" if using a custom app (not recommended)

### Emails not being received
- Check spam/junk folder
- Verify `SMTP_USER` is correct
- Confirm participants have valid email addresses in their user profiles

### "Connection timeout"
- Check firewall settings
- Verify `SMTP_HOST` and `SMTP_PORT` are correct
- Try setting `SMTP_SECURE=true` with port 465

### Emails delayed
- Normal behavior - emails are sent asynchronously
- Check server logs for email sending status

## Production Deployment (Render)

Add environment variables in Render dashboard:

1. Go to your service → Environment
2. Add each SMTP variable:
   - `SMTP_HOST`
   - `SMTP_PORT`
   - `SMTP_SECURE`
   - `SMTP_USER`
   - `SMTP_PASS`
3. Redeploy your service

## Customization

To customize email templates, edit [src/services/email.service.ts](src/services/email.service.ts):

- `generateNewMeetingEmail()` - New meeting template
- `generateRescheduledMeetingEmail()` - Reschedule template

You can modify:
- Colors and styling
- Email content and wording
- Date/time formatting
- Additional meeting details
