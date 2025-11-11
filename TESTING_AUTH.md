# Testing Firebase Authentication

## Prerequisites

1. **Enable Firebase Authentication:**
   - Go to [Firebase Console](https://console.firebase.google.com/)
   - Select your project
   - Navigate to **Authentication** > **Sign-in method**
   - Enable **Email/Password** provider
   - Click **Save**

## Method 1: Manual Testing with Firebase REST API + Postman

### Step 1: Get Firebase Web API Key

1. Go to Firebase Console > Project Settings > General
2. Scroll down to "Your apps" section
3. Copy your **Web API Key** (looks like: `AIzaSyXXXXXXXXXXXXXXXXXXXXXXXXX`)

### Step 2: Create a Test User via Firebase REST API

**POST** `https://identitytoolkit.googleapis.com/v1/accounts:signUp?key=YOUR_WEB_API_KEY`

**Request Body:**
```json
{
  "email": "test@example.com",
  "password": "password123",
  "returnSecureToken": true
}
```

**Response:**
```json
{
  "idToken": "eyJhbGciOiJSUzI1NiIsImtpZCI6IjQ...",  // THIS IS YOUR AUTH TOKEN
  "email": "test@example.com",
  "refreshToken": "...",
  "expiresIn": "3600",
  "localId": "firebase-uid-here"
}
```

**Copy the `idToken`** - you'll use this as your Bearer token!

---

### Step 3: Test Signup Endpoint

**POST** `http://localhost:8080/api/auth/signup`

**Headers:**
```
Content-Type: application/json
Authorization: Bearer YOUR_ID_TOKEN_FROM_STEP_2
```

**Request Body:**
```json
{
  "name": "Test User",
  "company": "TestCorp",
  "role": "Engineer",
  "past_meetings": 5,
  "past_attended": 3
}
```

**Expected Response (201):**
```json
{
  "message": "User profile created successfully",
  "user": {
    "user_id": "auto-generated-firestore-id",
    "auth_uid": "firebase-auth-uid",
    "name": "Test User",
    "company": "TestCorp",
    "email": "test@example.com",
    "role": "Engineer",
    "past_meetings": 5,
    "past_attended": 3,
    "created_at": "2025-01-12T10:30:00.000Z",
    "updated_at": "2025-01-12T10:30:00.000Z"
  }
}
```

---

### Step 4: Test Login Endpoint

**POST** `http://localhost:8080/api/auth/login`

**Headers:**
```
Content-Type: application/json
Authorization: Bearer YOUR_ID_TOKEN
```

**No Request Body Needed**

**Expected Response (200):**
```json
{
  "message": "Login successful",
  "user": {
    "user_id": "user-id",
    "auth_uid": "firebase-auth-uid",
    "name": "Test User",
    "company": "TestCorp",
    "email": "test@example.com",
    "role": "Engineer",
    "past_meetings": 5,
    "past_attended": 3
  }
}
```

---

### Step 5: Test Get Current User

**GET** `http://localhost:8080/api/auth/me`

**Headers:**
```
Authorization: Bearer YOUR_ID_TOKEN
```

**Expected Response (200):**
```json
{
  "user_id": "user-id",
  "auth_uid": "firebase-auth-uid",
  "name": "Test User",
  "email": "test@example.com",
  "company": "TestCorp",
  "role": "Engineer",
  "past_meetings": 5,
  "past_attended": 3
}
```

---

### Step 6: Sign In Again (Get Fresh Token)

After some time, tokens expire. To get a new token:

**POST** `https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=YOUR_WEB_API_KEY`

**Request Body:**
```json
{
  "email": "test@example.com",
  "password": "password123",
  "returnSecureToken": true
}
```

**Response:**
```json
{
  "idToken": "NEW_TOKEN_HERE",
  "email": "test@example.com",
  "refreshToken": "...",
  "expiresIn": "3600"
}
```

---

## Method 2: Testing with a Simple HTML Page

Create this HTML file to test authentication flow:

```html
<!DOCTYPE html>
<html>
<head>
  <title>Auth Test</title>
  <script type="module">
    import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js';
    import { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js';

    // Replace with your Firebase config
    const firebaseConfig = {
      apiKey: "YOUR_API_KEY",
      authDomain: "YOUR_AUTH_DOMAIN",
      projectId: "YOUR_PROJECT_ID",
    };

    const app = initializeApp(firebaseConfig);
    const auth = getAuth(app);

    window.signup = async () => {
      const email = document.getElementById('email').value;
      const password = document.getElementById('password').value;
      const name = document.getElementById('name').value;
      const company = document.getElementById('company').value;
      const role = document.getElementById('role').value;

      try {
        // Create Firebase Auth user
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        const token = await userCredential.user.getIdToken();

        console.log("Firebase Auth Token:", token);

        // Call backend signup
        const response = await fetch('http://localhost:8080/api/auth/signup', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({ name, company, role, past_meetings: 0, past_attended: 0 })
        });

        const data = await response.json();
        console.log("Signup Response:", data);
        document.getElementById('result').innerText = JSON.stringify(data, null, 2);
      } catch (error) {
        console.error("Error:", error);
        document.getElementById('result').innerText = "Error: " + error.message;
      }
    };

    window.login = async () => {
      const email = document.getElementById('email').value;
      const password = document.getElementById('password').value;

      try {
        // Sign in with Firebase Auth
        const userCredential = await signInWithEmailAndPassword(auth, email, password);
        const token = await userCredential.user.getIdToken();

        console.log("Firebase Auth Token:", token);

        // Call backend login
        const response = await fetch('http://localhost:8080/api/auth/login', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          }
        });

        const data = await response.json();
        console.log("Login Response:", data);
        document.getElementById('result').innerText = JSON.stringify(data, null, 2);
      } catch (error) {
        console.error("Error:", error);
        document.getElementById('result').innerText = "Error: " + error.message;
      }
    };
  </script>
</head>
<body>
  <h1>Firebase Auth Test</h1>

  <input id="email" type="email" placeholder="Email" /><br/>
  <input id="password" type="password" placeholder="Password" /><br/>
  <input id="name" type="text" placeholder="Name" /><br/>
  <input id="company" type="text" placeholder="Company" /><br/>
  <input id="role" type="text" placeholder="Role" /><br/>

  <button onclick="signup()">Signup</button>
  <button onclick="login()">Login</button>

  <h2>Result:</h2>
  <pre id="result"></pre>
</body>
</html>
```

---

## Common Errors

### 1. "Unauthorized: No token provided"
- Make sure you're sending the Authorization header
- Format: `Authorization: Bearer YOUR_TOKEN`

### 2. "Unauthorized: Invalid token"
- Token might be expired (tokens last 1 hour)
- Get a new token by signing in again
- Make sure you copied the entire token

### 3. "User profile already exists"
- You're trying to signup twice with the same account
- Use the login endpoint instead

### 4. "User profile not found"
- You logged in but never called signup
- Call signup first to create the user profile

---

## Quick Test Checklist

- [ ] Firebase Authentication is enabled in Firebase Console
- [ ] Email/Password provider is enabled
- [ ] Server is running (`npm start` or `npm run dev`)
- [ ] Created test user via Firebase REST API
- [ ] Copied idToken from response
- [ ] Called /api/auth/signup with token in Authorization header
- [ ] Called /api/auth/login to verify user profile
- [ ] Called /api/auth/me to get current user

---

## Need Your Firebase Web API Key?

Run this command to find it in your serviceAccountKey.json:

```bash
# Your Web API Key is in Firebase Console > Project Settings > General
# It's different from the service account key
```

Or get it from: https://console.firebase.google.com/project/YOUR_PROJECT_ID/settings/general
