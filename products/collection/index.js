// const sanitizer = require("./sanitizer");
const functions = require("firebase-functions");
const fetch = require("node-fetch");
const admin = require("firebase-admin");
admin.initializeApp(functions.config().firebase);
// Create and Deploy Your First Cloud Functions
// https://firebase.google.com/docs/functions/write-firebase-functions
exports.backupCollection = functions.https.onCall((data) => {
  fetch("https://ariztar-sandbox.myshopify.com/admin/api/2022-10/collections/276637319268/products.json", {
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
    data.products.forEach((doc)=>{
      // eslint-disable-next-line max-len
      const docRef = db.collection("Collection").doc(todayDate).collection("data").doc();
      batch.set(docRef, doc);
    });
    const Backups={
      "Date": todayDate,
      "Object": "Collection",
      "No Of Records": data.products.length,
    };
    const BackupDocref=db.collection("Backups").doc();
    batch.set(BackupDocref, Backups);
    batch.commit();
  });
});
exports.restoreCollection = functions.https.onCall((data) => {
  // Get all the documents from the Firestore collection called
  console.log("data", data.todayDate);
  // eslint-disable-next-line max-len
  admin.firestore().collection("Collection").doc(data.todayDate).collection("data").limit(1).get().then((docs) => {
    // Get all the data from each documents
    docs.forEach((doc) => {
      const collection = doc.data();
      console.log("collectiions", collection);
      const id = collection.id;
      console.log("my id ", id);
      fetch("https://ariztar-sandbox.myshopify.com/admin/api/2022-10/products/"+id+".json", {
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
        const json = JSON.stringify({product: collection});
        if (data.product) {
          // console.log("type", typeof data.product);
          console.log("data fetching", data.product.id);
          // console.log("json", JSON.stringify(data.product, null, 4));
          fetch("https://ariztar-sandbox.myshopify.com/admin/api/2022-10/products/"+data.product.id+".json", {
            method: "PUT",
            headers: {
              "Content-Type": "application/json",
              // eslint-disable-next-line camelcase, no-undef, max-len
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
          fetch("https://ariztar-sandbox.myshopify.com/admin/api/2022-10/products.json", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              // eslint-disable-next-line camelcase, no-undef, max-len
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
