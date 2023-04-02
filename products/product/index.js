/* eslint-disable max-len */
// const sanitizer = require("./sanitizer");
const functions = require("firebase-functions");
const fetch = require("node-fetch");
const admin = require("firebase-admin");
admin.initializeApp(functions.config().firebase);
// const firestore = require("firebase-firestore");
// Create and Deploy Your First Cloud Functions
// https://firebase.google.com/docs/functions/write-firebase-functions
exports.backupProducts = functions.https.onCall((data) => {
  fetch("https://ariztar-sandbox.myshopify.com/admin/api/2022-10/products.json", {
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
      // console.log("doc ref", doc.created_at);
      const docRef = db.collection("Products").doc(todayDate).collection("data").doc();
      batch.set(docRef, doc);
    });
    const Backups={
      "Date": todayDate,
      "Object": "Products",
      "No Of Records": data.products.length,
    };
    const BackupDocref=db.collection("Backups").doc();
    batch.set(BackupDocref, Backups);
    batch.commit();
  });
});
exports.restoreProducts = functions.https.onCall((data) => {
  // Get all the documents from the Firestore collection called
  console.log("data", data.todayDate);
  const todayDate = new Date().toISOString().slice(0, 2);
  console.log("daata date", todayDate);
  admin.firestore().collection("Backup's").doc("Product").collection("Products").doc("Date:"+data.todayDate+"Total :"+data.length).collection("data").limit(1).get().then((docs) => {
    // Get all the data from each documents
    docs.forEach((doc) => {
      const product = doc.data();
      const id = product.id;
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
        // console.log("data loading", data);
        const json = JSON.stringify({product: product});
        // console.log("json", json);
        if (data.product) {
          // console.log("type", typeof data.product);
          // console.log("data fetching", data.product.id);
          // console.log("json", JSON.stringify(data.product, null, 4));
          fetch("https://ariztar-sandbox.myshopify.com/admin/api/2022-10/products/"+data.product.id+".json", {
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
          fetch("https://ariztar-sandbox.myshopify.com/admin/api/2022-10/products.json", {
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
