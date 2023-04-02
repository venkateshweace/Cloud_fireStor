/* eslint-disable max-len */
// const sanitizer = require("./sanitizer");
const functions = require("firebase-functions");
const fetch = require("node-fetch");
const admin = require("firebase-admin");
admin.initializeApp(functions.config().firebase);
// const firestore = require("firebase-firestore");
// Create and Deploy Your First Cloud Functions
// https://firebase.google.com/docs/functions/write-firebase-functions
exports.backupCollect = functions.https.onCall((data) => {
  fetch("https://ariztar-sandbox.myshopify.com/admin/api/2022-10/collects.json", {
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
    const batch = db.batch();
    const todayDate = new Date().toISOString().slice(0, 16);
    console.log("daata date", todayDate);
    data.collects.forEach((doc)=>{
      const docRef = db.collection("collect").doc(todayDate).collection("data").doc();
      batch.set(docRef, doc);
    });
    const Backups={
      "Date": todayDate,
      "Object": "Product Collect",
      "No Of Records": data.collects.length,
    };
    const BackupDocref=db.collection("Backups").doc();
    batch.set(BackupDocref, Backups);
    batch.commit();
  });
});
exports.restoreCollect = functions.https.onCall((data) => {
  // Get all the documents from the Firestore collection called
  // console.log("data", data.todayDate);
  const todayDate = new Date().toISOString().slice(0, 2);
  console.log("daata date", todayDate);
  admin.firestore().collection("collect").doc(data.todayDate).collection("data").limit(1).get().then((docs) => {
    // Get all the data from each documents restore
    // console.log("data docs", JSON.stringify(docs.data().collect));
    // const collectdata = JSON.stringify(docs.data());
    docs.forEach((doc) => {
      const collect = doc.data();
      console.log("collect", collect);
      const id = collect.id;
      console.log(id, "id");
      console.log("doc id", doc.id );
      fetch("https://ariztar-sandbox.myshopify.com/admin/api/2022-10/collects/"+id+".json", {
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
        const json = JSON.stringify({collects: collect});
        // console.log("json", json);
        fetch("https://ariztar-sandbox.myshopify.com/admin/api/2022-10/collects.json", {
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
      });
    });
  });
});
