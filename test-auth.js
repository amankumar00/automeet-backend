/**
 * Simple test script for Firebase Authentication
 *
 * Before running:
 * 1. Enable Email/Password auth in Firebase Console
 * 2. Replace YOUR_WEB_API_KEY with your actual Firebase Web API Key
 * 3. Make sure your backend is running (npm start)
 *
 * Run: node test-auth.js
 */

const axios = require("axios");

// REPLACE THIS with your Firebase Web API Key from Firebase Console
const FIREBASE_WEB_API_KEY = "AIzaSyAR_E5LrkNfzD8S6VhfDPAPBnichLvCx_4";
const BACKEND_URL = "http://localhost:8080";

// Test user credentials
const testUser = {
  email: "test@example.com",
  password: "password123",
  name: "Test User",
  company: "TestCorp",
  role: "Engineer",
};

async function createFirebaseUser(email, password) {
  console.log("\n📝 Step 1: Creating Firebase Auth user...");

  try {
    const response = await axios.post(
      `https://identitytoolkit.googleapis.com/v1/accounts:signUp?key=${FIREBASE_WEB_API_KEY}`,
      {
        email,
        password,
        returnSecureToken: true,
      }
    );

    console.log("✅ Firebase user created successfully!");
    console.log("   Email:", response.data.email);
    console.log("   UID:", response.data.localId);
    console.log("   Token expires in:", response.data.expiresIn, "seconds");

    return response.data.idToken;
  } catch (error) {
    if (error.response?.data?.error?.message === "EMAIL_EXISTS") {
      console.log("ℹ️  User already exists, signing in instead...");
      return await signInFirebaseUser(email, password);
    }
    throw error;
  }
}

async function signInFirebaseUser(email, password) {
  console.log("\n🔐 Signing in to Firebase Auth...");

  const response = await axios.post(
    `https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=${FIREBASE_WEB_API_KEY}`,
    {
      email,
      password,
      returnSecureToken: true,
    }
  );

  console.log("✅ Signed in successfully!");
  console.log("   Token expires in:", response.data.expiresIn, "seconds");

  return response.data.idToken;
}

async function testSignup(token, userData) {
  console.log("\n📝 Step 2: Creating user profile in backend...");

  try {
    const response = await axios.post(
      `${BACKEND_URL}/api/auth/signup`,
      {
        name: userData.name,
        company: userData.company,
        role: userData.role,
        past_meetings: 0,
        past_attended: 0,
      },
      {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      }
    );

    console.log("✅ User profile created successfully!");
    console.log("   User ID:", response.data.user.user_id);
    console.log("   Name:", response.data.user.name);
    console.log("   Company:", response.data.user.company);
    console.log("   Role:", response.data.user.role);

    return response.data;
  } catch (error) {
    if (
      error.response?.status === 400 &&
      error.response?.data?.error?.includes("already exists")
    ) {
      console.log("ℹ️  User profile already exists, skipping...");
      return null;
    }
    throw error;
  }
}

async function testLogin(token) {
  console.log("\n🔐 Step 3: Testing login endpoint...");

  const response = await axios.post(
    `${BACKEND_URL}/api/auth/login`,
    {},
    {
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    }
  );

  console.log("✅ Login successful!");
  console.log("   User ID:", response.data.user.user_id);
  console.log("   Name:", response.data.user.name);
  console.log("   Email:", response.data.user.email);
  console.log("   Company:", response.data.user.company);
  console.log("   Past meetings:", response.data.user.past_meetings);
  console.log("   Past attended:", response.data.user.past_attended);

  return response.data;
}

async function testGetCurrentUser(token) {
  console.log("\n👤 Step 4: Testing get current user endpoint...");

  const response = await axios.get(`${BACKEND_URL}/api/auth/me`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  console.log("✅ Current user retrieved successfully!");
  console.log("   User ID:", response.data.user_id);
  console.log("   Name:", response.data.name);
  console.log("   Email:", response.data.email);

  return response.data;
}

async function runTests() {
  console.log("🚀 Starting Firebase Authentication Tests");
  console.log("==========================================");

  if (FIREBASE_WEB_API_KEY === "YOUR_WEB_API_KEY_HERE") {
    console.error(
      "\n❌ ERROR: Please replace YOUR_WEB_API_KEY_HERE with your actual Firebase Web API Key!"
    );
    console.log(
      "\nGet it from: https://console.firebase.google.com/project/_/settings/general"
    );
    process.exit(1);
  }

  try {
    // Step 1: Create/Sign in Firebase user
    const token = await createFirebaseUser(testUser.email, testUser.password);

    // Step 2: Test signup
    await testSignup(token, testUser);

    // Step 3: Test login
    await testLogin(token);

    // Step 4: Test get current user
    await testGetCurrentUser(token);

    console.log("\n✅ All tests passed successfully! 🎉");
    console.log("\n💡 Your auth token for manual testing:");
    console.log("   " + token.substring(0, 50) + "...");
    console.log("\n   Use this in Postman Authorization header:");
    console.log("   Authorization: Bearer " + token);
  } catch (error) {
    console.error("\n❌ Test failed!");

    if (error.response) {
      console.error("   Status:", error.response.status);
      console.error("   Error:", JSON.stringify(error.response.data, null, 2));
    } else if (error.request) {
      console.error("   No response received. Is the backend running?");
      console.error("   Make sure to run: npm start");
    } else {
      console.error("   Error:", error.message);
    }

    process.exit(1);
  }
}

// Run the tests
runTests();
