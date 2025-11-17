# SendGrid Setup Guide for AutoMeet

## ✅ Code Updated!

Your email service now supports **both SendGrid and nodemailer**:
- If `SENDGRID_API_KEY` is set → Uses SendGrid (recommended for production)
- If not set → Falls back to nodemailer SMTP (for local development)

## 🚀 Quick Setup (5 minutes)

### Step 1: Create SendGrid Account

1. Go to **https://signup.sendgrid.com/**
2. Sign up (it's free - 100 emails/day forever)
3. Verify your email address
4. Complete the "Tell us about yourself" form

### Step 2: Create API Key

1. **Log in** to SendGrid Dashboard
2. Go to **Settings** → **API Keys** (left sidebar)
3. Click **"Create API Key"**
4. Fill in:
   - **API Key Name:** `AutoMeet Production`
   - **API Key Permissions:** Select **"Full Access"** (or "Mail Send" for minimal)
5. Click **"Create & View"**
6. **Copy the API key** (starts with `SG.`)
   - ⚠️ **IMPORTANT:** Copy it now - you won't see it again!

### Step 3: Verify Sender Email

SendGrid requires you to verify the email address you'll send FROM:

1. Go to **Settings** → **Sender Authentication**
2. Click **"Verify a Single Sender"**
3. Fill in the form:
   - **From Name:** `AutoMeet`
   - **From Email Address:** `amankumarhoyo@gmail.com`
   - **Reply To:** `amankumarhoyo@gmail.com`
   - **Company Address:** (your address)
   - **Nickname:** `AutoMeet Sender`
4. Click **"Create"**
5. Check your email (`amankumarhoyo@gmail.com`) and click the verification link

**Wait for verification to complete before proceeding!**

### Step 4: Add to Local Environment

Add to your `.env` file:

```env
# SendGrid Configuration (add this)
SENDGRID_API_KEY=SG.your-api-key-here

# Keep these for local testing fallback
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=amankumarhoyo@gmail.com
SMTP_PASS=your-gmail-app-password
```

### Step 5: Add to Render Environment

1. Go to **Render Dashboard** → Your Service → **Environment**
2. Click **"Add Environment Variable"**
3. Add:
   - **Key:** `SENDGRID_API_KEY`
   - **Value:** `SG.your-api-key-here` (the key you copied in Step 2)
4. Click **"Save Changes"**
5. Render will automatically redeploy

### Step 6: Deploy Your Code

```bash
# Commit the changes
git add .
git commit -m "feat: add SendGrid email integration for production"
git push origin master
```

Render will automatically build and deploy.

### Step 7: Test!

1. **Create a meeting** from your frontend
2. **Check Render logs** for:
   ```
   📧 Email service: Using SendGrid
   📧 Sending new meeting emails to 2 participant(s)...
   ✅ [SendGrid] Email sent to Aman Kumar (amankumarhoyo@gmail.com)
   ✅ [SendGrid] Email sent to aman kumar (amanku070300@gmail.com)
   ```
3. **Check your email inbox** for the meeting notification!

## 📊 SendGrid Dashboard

After sending emails, you can monitor them:

1. Go to **Activity** in SendGrid Dashboard
2. See all sent emails, delivery status, opens, clicks, etc.
3. Useful for debugging if emails don't arrive

## 🧪 Test Locally (Optional)

If you want to test SendGrid locally before deploying:

```bash
# Make sure SENDGRID_API_KEY is in your .env
npm run dev

# In another terminal, create a test meeting
node test-meeting-with-emails.js
```

You should see:
```
📧 Email service: Using SendGrid
✅ [SendGrid] Email sent to ...
```

## ⚡ How It Works

The email service automatically detects which provider to use:

```typescript
// If SENDGRID_API_KEY is set in environment
if (process.env.SENDGRID_API_KEY) {
  // Uses SendGrid API (no SMTP port blocking!)
  sgMail.send({ to, from, subject, html })
} else {
  // Falls back to nodemailer SMTP (for local dev)
  transporter.sendMail({ from, to, subject, html })
}
```

**On Render:**
- Has `SENDGRID_API_KEY` → Uses SendGrid ✅
- No SMTP port 587 blocking issues ✅

**Locally:**
- Can use SendGrid (if key is set) OR
- Use Gmail SMTP (works fine locally)

## 🎯 Benefits of SendGrid

✅ **No port blocking** - Uses HTTPS API, not SMTP ports
✅ **Better deliverability** - Emails less likely to go to spam
✅ **Analytics** - Track delivery, opens, bounces
✅ **Scalable** - Free tier: 100/day, Paid: unlimited
✅ **Reliable** - 99.9% uptime SLA

## ⚠️ Common Issues

### "Sender email not verified"
**Solution:** Complete Step 3 above and click the verification link in your email

### "API key invalid"
**Solution:** Make sure you copied the full key starting with `SG.`

### "Forbidden"
**Solution:** Your SendGrid account might need to warm up for 24-48 hours after signup

### Emails still not arriving
**Solution:**
1. Check spam folder
2. Check SendGrid Activity dashboard for delivery status
3. Make sure sender email is verified

## 📝 Summary

**What changed:**
- ✅ Installed `@sendgrid/mail` package
- ✅ Updated `email.service.ts` to support SendGrid
- ✅ Auto-detects SendGrid vs SMTP based on env vars

**What you need to do:**
1. Sign up for SendGrid (free)
2. Get API key
3. Verify sender email
4. Add `SENDGRID_API_KEY` to Render environment
5. Deploy and test!

**Total time:** ~5-10 minutes

---

## 🆘 Need Help?

If you get stuck:
1. Check SendGrid Activity dashboard for error messages
2. Check Render logs for email sending attempts
3. Make sure sender email (`amankumarhoyo@gmail.com`) is verified in SendGrid

Let me know when you've completed the setup and we'll test it! 🚀
