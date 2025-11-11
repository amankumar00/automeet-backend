import { Request, Response } from "express";
import admin from "firebase-admin";
import { usersRef } from "../services/firestore.service";
import { AuthRequest } from "../middleware/auth.middleware";

/**
 * Signup endpoint - Creates Firebase Auth user and stores profile in Firestore
 * Frontend should call Firebase Auth createUserWithEmailAndPassword first,
 * then call this endpoint with the token to create the user profile
 */
export const signup = async (req: AuthRequest, res: Response) => {
  try {
    const { name, company, role, past_meetings, past_attended } = req.body;

    // User must be authenticated (token verified by middleware)
    if (!req.user) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const { uid, email } = req.user;

    // Check if user profile already exists
    const existingUserQuery = await usersRef.where("auth_uid", "==", uid).get();
    if (!existingUserQuery.empty) {
      return res.status(400).json({ error: "User profile already exists" });
    }

    // Create user profile in Firestore
    const newUser = {
      auth_uid: uid,
      name,
      company,
      email: email || "",
      role,
      past_meetings: past_meetings ?? 0,
      past_attended: past_attended ?? 0,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    const ref = await usersRef.add(newUser);

    // Update document to include user_id field
    await ref.update({ user_id: ref.id });

    res.status(201).json({
      message: "User profile created successfully",
      user: {
        user_id: ref.id,
        ...newUser,
      },
    });
  } catch (error: any) {
    console.error("Signup error:", error.message);
    res.status(500).json({ error: error.message });
  }
};

/**
 * Login endpoint - Verifies token and returns user profile
 * Frontend should call Firebase Auth signInWithEmailAndPassword first,
 * then call this endpoint with the token to get user profile
 */
export const login = async (req: AuthRequest, res: Response) => {
  try {
    // User must be authenticated (token verified by middleware)
    if (!req.user) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const { uid } = req.user;

    // Find user profile by auth_uid
    const userQuery = await usersRef.where("auth_uid", "==", uid).get();

    if (userQuery.empty) {
      return res.status(404).json({
        error: "User profile not found. Please complete signup.",
      });
    }

    const userDoc = userQuery.docs[0];
    const userData = userDoc.data();

    res.json({
      message: "Login successful",
      user: {
        user_id: userDoc.id,
        ...userData,
      },
    });
  } catch (error: any) {
    console.error("Login error:", error.message);
    res.status(500).json({ error: error.message });
  }
};

/**
 * Get current user profile
 */
export const getCurrentUser = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const { uid } = req.user;

    // Find user profile by auth_uid
    const userQuery = await usersRef.where("auth_uid", "==", uid).get();

    if (userQuery.empty) {
      return res.status(404).json({ error: "User profile not found" });
    }

    const userDoc = userQuery.docs[0];
    const userData = userDoc.data();

    res.json({
      user_id: userDoc.id,
      ...userData,
    });
  } catch (error: any) {
    console.error("Get current user error:", error.message);
    res.status(500).json({ error: error.message });
  }
};
