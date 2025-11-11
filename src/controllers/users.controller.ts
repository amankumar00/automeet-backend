import { Request, Response } from "express";
import { usersRef } from "../services/firestore.service";

// CREATE user
export const createUser = async (req: Request, res: Response) => {
  try {
    const { name, company, email, role, past_meetings, past_attended, auth_uid } = req.body;

    // Create user without user_id first
    const newUser = {
      name,
      company,
      email,
      role,
      auth_uid: auth_uid || null, // Optional: Link to Firebase Auth UID
      past_meetings: past_meetings ?? 0, // Default to 0 if not provided
      past_attended: past_attended ?? 0,  // Default to 0 if not provided
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    // Add to Firestore and get the generated ID
    const ref = await usersRef.add(newUser);

    // Update the document to include user_id field
    await ref.update({ user_id: ref.id });

    // Return response with user_id
    res.status(201).json({ user_id: ref.id, ...newUser });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

// READ all users
export const getAllUsers = async (_req: Request, res: Response) => {
  try {
    const snapshot = await usersRef.get();
    const users = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
    res.json(users);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

// READ one user
export const getUserById = async (req: Request, res: Response) => {
  try {
    const doc = await usersRef.doc(req.params.id).get();
    if (!doc.exists) return res.status(404).json({ error: "User not found" });
    res.json({ id: doc.id, ...doc.data() });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

// UPDATE user
export const updateUser = async (req: Request, res: Response) => {
  try {
    // Remove user_id and auth_uid from the update body to prevent modification
    const { user_id, auth_uid, created_at, ...updateData } = req.body;

    await usersRef.doc(req.params.id).update({
      ...updateData,
      updated_at: new Date().toISOString(),
    });
    res.json({ message: "User updated successfully" });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

// DELETE user
export const deleteUser = async (req: Request, res: Response) => {
  try {
    await usersRef.doc(req.params.id).delete();
    res.json({ message: "User deleted successfully" });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};
