# Quick Test Guide - Firebase Authentication

## Setup (5 minutes)

### 1. Enable Firebase Authentication

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your project
3. Click **Authentication** in left sidebar
4. Click **Get Started** (if first time)
5. Go to **Sign-in method** tab
6. Click **Email/Password**
7. Toggle **Enable**
8. Click **Save**

### 2. Get Your Firebase Web API Key

1. In Firebase Console, click the gear icon ⚙️ (Project Settings)
2. Stay on the **General** tab
3. Scroll down to **Your apps** section
4. Copy the **Web API Key** (looks like: `AIzaSyXXXXXXXXXXXXXXXXXX`)

---

## Testing Method 1: Automated Script (Easiest)

### Step 1: Start your backend
```bash
npm start
```

### Step 2: Edit test-auth.js
Open `test-auth.js` and replace this line:
```javascript
const FIREBASE_WEB_API_KEY = 'YOUR_WEB_API_KEY_HERE';
```

With your actual key:
```javascript
const FIREBASE_WEB_API_KEY = 'AIzaSyXXXXXXXXXXXXXXXXXX';
```

### Step 3: Run the test
```bash
node test-auth.js
```

### What it does:
- Creates a Firebase Auth user (test@example.com)
- Calls your `/api/auth/signup` endpoint
- Calls your `/api/auth/login` endpoint
- Calls your `/api/auth/me` endpoint
- Shows you a token you can use for manual testing

---

## Testing Method 2: Postman (Manual)

### Step 1: Create Firebase User

**POST** this URL in Postman:
```
https://identitytoolkit.googleapis.com/v1/accounts:signUp?key=YOUR_WEB_API_KEY
```

**Body (raw JSON):**
```json
{
  "email": "test@example.com",
  "password": "password123",
  "returnSecureToken": true
}
```

**Copy the `idToken` from response!**

### Step 2: Test Signup

**POST** `http://localhost:8080/api/auth/signup`

**Headers:**
```
Content-Type: application/json
Authorization: Bearer PASTE_YOUR_ID_TOKEN_HERE
```

**Body:**
```json
{
  "name": "Test User",
  "company": "TestCorp",
  "role": "Engineer",
  "past_meetings": 0,
  "past_attended": 0
}
```

### Step 3: Test Login

**POST** `http://localhost:8080/api/auth/login`

**Headers:**
```
Content-Type: application/json
Authorization: Bearer PASTE_YOUR_ID_TOKEN_HERE
```

**Body:** (empty)

### Step 4: Test Get Current User

**GET** `http://localhost:8080/api/auth/me`

**Headers:**
```
Authorization: Bearer PASTE_YOUR_ID_TOKEN_HERE
```

---

## Testing Method 3: Frontend (React Example)

See `TESTING_AUTH.md` for a complete HTML test page.

---

## Troubleshooting

### "Please replace YOUR_WEB_API_KEY_HERE"
- You need to get your Web API Key from Firebase Console
- It's in: Project Settings > General > Web API Key

### "Is the backend running?"
- Make sure you ran `npm start` or `npm run dev`
- Backend should be running on http://localhost:8080

### "EMAIL_EXISTS"
- This user already exists in Firebase Auth
- The script will automatically sign in instead
- Or use a different email

### "User profile already exists"
- You already called signup for this user
- Skip to testing login instead

### "Unauthorized: Invalid token"
- Token expired (tokens last 1 hour)
- Get a new token by running the script again
- Or sign in again via Firebase API

---

## What to Check in Firebase Console

After successful test, verify:

1. **Authentication > Users tab:**
   - Should see test@example.com user

2. **Firestore Database > users collection:**
   - Should see a document with:
     - auth_uid (matches Firebase Auth UID)
     - name, email, company, role
     - past_meetings, past_attended

---

## Next Steps

Once testing works:
1. Build your frontend signup/login pages
2. Use Firebase SDK in React/Vue/Angular
3. Store the token in localStorage
4. Send token with every API request

See `TESTING_AUTH.md` for frontend integration code examples.
