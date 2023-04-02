/* eslint-disable max-len */
// const sanitizer = require("./sanitizer");
const functions = require("firebase-functions");
const fetch = require("node-fetch");
const admin = require("firebase-admin");
admin.initializeApp(functions.config().firebase);
// const firestore = require("firebase-firestore");
// Create and Deploy Your First Cloud Functions
// https://firebase.google.com/docs/functions/write-firebase-functions
exports.backupSmartCollection = functions.https.onCall((data) => {
  fetch("https://ariztar-sandbox.myshopify.com/admin/api/2022-10/smart_collections.json", {
    headers: {
      "Content-Type": "application/json",
      // eslint-disable-next-line camelcase, no-undef
      "X-Shopify-Access-Token": "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",
    },
  }).then(function(response) {
    const jsonObject = response.json();
    console.log("response", jsonObject);
    return jsonObject;
  }).then(function(data) {
    // console.log("type", typeof data.products);
    console.log("fetch datas", data);
    const db = admin.firestore();
    // console.log("db", db);
    const batch=db.batch();
    const todayDate = new Date().toISOString().slice(0, 16);
    console.log("daata date", todayDate);
    data.smart_collections.forEach((doc)=>{
      // console.log("doc ref", doc.created_at);
      const docRef = db.collection("SmartCollections").doc(todayDate).collection("data").doc();
      batch.set(docRef, doc);
    });
    const Backups={
      "Date": todayDate,
      "Object": "SmartCollections",
      "No Of Records": data.smart_collections.length,
    };
    const BackupDocref=db.collection("Backups").doc();
    batch.set(BackupDocref, Backups);
    batch.commit();
  });
});
exports.restoreSmartCollection = functions.https.onCall((data) => {
  // Get all the documents from the Firestore collection called
  console.log("data", data.todayDate);
  admin.firestore().collection("SmartCollections").doc(data.todayDate).collection("data").limit(1).get().then((docs) => {
    // Get all the data from each documents
    docs.forEach((doc) => {
      const SmartCollection = doc.data();
      console.log("SmartCollection", SmartCollection);
      const id = SmartCollection.id;
      console.log(id, "id");
      console.log("doc id", doc.id );
      fetch("https://ariztar-sandbox.myshopify.com/admin/api/2022-10/smart_collections/"+id+".json", {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          // eslint-disable-next-line camelcase, no-undef
          "X-Shopify-Access-Token": "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",
        },
      }).then(function(response) {
        const jsonObject = response.json();
        return jsonObject;
      }).then(function(data) {
        console.log("data loading", data);
        const json = JSON.stringify({smart_collection: SmartCollection});
        console.log("json", json);
        if (data.smart_collection) {
          console.log("type", typeof data.smart_collection);
          console.log("data fetching", data.smart_collection.id);
          const productId = data.smart_collection.id;
          // console.log("json", JSON.stringify(data.product, null, 4));
          fetch("https://ariztar-sandbox.myshopify.com/admin/api/2022-10/smart_collections/"+productId+".json", {
            method: "PUT",
            headers: {
              "Content-Type": "application/json",
              // eslint-disable-next-line camelcase, no-undef
              "X-Shopify-Access-Token": "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",
            },
            body: json,
          }).then(function(response) {
            const jsonObject = response.json();
            return jsonObject;
          }).then(function(val) {
            console.log("Updated a Datas", val);
          });
        } else {
          fetch("https://ariztar-sandbox.myshopify.com/admin/api/2022-10/smart_collections.json", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              // eslint-disable-next-line camelcase, no-undef
              "X-Shopify-Access-Token": "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",
            },
            body: json,
          }).then(function(response) {
            const jsonObject = response.json();
            return jsonObject;
          }).then(function(val) {
            // console.log("Created a Datas", val);
          });
        }
      });
    });
  });
});
