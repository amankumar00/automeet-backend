# Render Email Connection Timeout Fix

## 🔴 Problem Identified

From Render logs:
```
❌ Failed to send email to amankumarhoyo@gmail.com: Connection timeout
❌ Failed to send email to amanku070300@gmail.com: Connection timeout
```

**Root Cause:** Render blocks/restricts outbound SMTP connections on port 587 to prevent spam abuse.

## ✅ Solution Options

### Option 1: Try Port 465 (SSL) - QUICK FIX

Gmail also supports port 465 with SSL. Update your Render environment variables:

**In Render Dashboard → Environment:**
```
SMTP_HOST=smtp.gmail.com
SMTP_PORT=465
SMTP_SECURE=true
SMTP_USER=amankumarhoyo@gmail.com
SMTP_PASS=your-app-password
```

**Changed:**
- `SMTP_PORT`: `587` → `465`
- `SMTP_SECURE`: `false` → `true`

Then redeploy and test.

### Option 2: Use SendGrid (RECOMMENDED for Production)

SendGrid is designed for sending emails from cloud platforms and has a free tier (100 emails/day).

#### Setup Steps:

1. **Sign up:** https://signup.sendgrid.com/
2. **Get API Key:** Dashboard → Settings → API Keys → Create API Key
3. **Install SendGrid:**
   ```bash
   npm install @sendgrid/mail
   ```
4. **Update email service to use SendGrid API**
5. **Add to Render Environment:**
   ```
   SENDGRID_API_KEY=your-api-key-here
   ```

#### Code Changes Needed:

Replace nodemailer with SendGrid in `src/services/email.service.ts`:

```typescript
import sgMail from '@sendgrid/mail';

sgMail.setApiKey(process.env.SENDGRID_API_KEY || '');

export const sendNewMeetingEmail = async (
  participant: Participant,
  meetingData: MeetingEmailData
): Promise<void> => {
  try {
    if (!isValidEmail(participant.email)) {
      console.warn(`⚠️ Invalid email: ${participant.email}`);
      return;
    }

    const msg = {
      to: participant.email,
      from: process.env.SMTP_USER || 'noreply@yourdomain.com',
      subject: `New Meeting: ${meetingData.agenda}`,
      html: generateNewMeetingEmail(participant.name, meetingData),
    };

    await sgMail.send(msg);
    console.log(`✅ Email sent to ${participant.name} (${participant.email})`);
  } catch (error: any) {
    console.error(`❌ Failed to send email: ${error.message}`);
  }
};
```

### Option 3: Use Mailgun

Mailgun also has a free tier and works well with Render.

1. **Sign up:** https://www.mailgun.com/
2. **Get API Key and Domain**
3. **Install:** `npm install mailgun.js form-data`
4. **Similar integration to SendGrid**

### Option 4: Upgrade Render Plan (Expensive)

Some Render paid plans may allow SMTP on port 587, but this is not guaranteed.

## 🚀 Quick Test (Option 1)

Try port 465 first as it's the quickest:

1. **Update Render Environment Variables:**
   - `SMTP_PORT` = `465`
   - `SMTP_SECURE` = `true`

2. **Trigger redeploy** (or click "Manual Deploy")

3. **Create meeting from frontend**

4. **Check Render logs** for:
   - ✅ `Email sent to [name]` (success!)
   - OR ❌ `Connection timeout` (still blocked, need Option 2)

## 📊 Comparison

| Solution | Setup Time | Free Tier | Reliability | Best For |
|----------|-----------|-----------|-------------|----------|
| Port 465 | 2 min | N/A | May not work | Quick test |
| SendGrid | 15 min | 100/day | Excellent | Production |
| Mailgun | 15 min | 5000/month | Excellent | Production |
| OAuth2 | 30+ min | N/A | Good | Gmail-only |

## 🎯 Recommended Path

1. **Try Option 1** (port 465) - takes 2 minutes
2. **If that fails, use Option 2** (SendGrid) - professional solution

## 📝 Why This Happened

- ✅ Your code is correct
- ✅ SMTP credentials are correct
- ✅ Email service works locally
- ❌ Render blocks outbound SMTP port 587 for security

This is a **platform limitation**, not a code issue.

## 🔧 Next Steps

1. Try updating to port 465 in Render
2. Test by creating a meeting
3. If still timeout → implement SendGrid
4. Report back results!

Would you like me to help you implement SendGrid?
