import admin from "firebase-admin";

const db = admin.firestore();

export const usersRef = db.collection("users");
export const meetingsRef = db.collection("meetings");
