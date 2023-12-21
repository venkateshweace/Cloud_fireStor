/* eslint-disable max-len */
// const sanitizer = require("./sanitizer");
const functions = require("firebase-functions");
// eslint-disable-next-line no-unused-vars
// const fetch = require("node-fetch");
const admin = require("firebase-admin");
admin.initializeApp(functions.config().firebase);
// const firestore = require("firebase-firestore");
// Create and Deploy Your First Cloud Functions
// https://firebase.google.com/docs/functions/write-firebase-functions
exports.createuserid = functions.https.onCall((data) => {
  console.log("data1", data);
  const db = admin.firestore();
  // console.log("db", db);
  const batch=db.batch();
  const todayDate = new Date().toISOString().slice(0, 16);
  console.log("date", todayDate);
  const users={
    // "ShopifyId": "ariztar-sandbox",
    // "TenantId": "1",
    // "ShopifyToken": "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",
    "UserId": data.UserId,
    "TenantId": data.TenantId,
  };
  // console.log("doc ref", doc.created_at);
  const docRef = db.collection("users").doc();
  batch.set(docRef, users);
  batch.commit();
});
