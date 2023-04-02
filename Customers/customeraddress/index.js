/* eslint-disable max-len */
// const sanitizer = require("./sanitizer");
const functions = require("firebase-functions");
const fetch = require("node-fetch");
const admin = require("firebase-admin");
admin.initializeApp(functions.config().firebase);
// const firestore = require("firebase-firestore");
// Create and Deploy Your First Cloud Functions
// https://firebase.google.com/docs/functions/write-firebase-functions
exports.backupCustomerAddress = functions.https.onCall((data) => {
  fetch("https://ariztar-sandbox.myshopify.com/admin/api/2022-10/customers/5722232127588/addresses/7024508469348.json", {
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
    console.log("date", todayDate);
    const docRef = db.collection("CustomerAddress").doc(todayDate).collection("data").doc();
    batch.set(docRef, data.customer_address);
    data.customer_address.forEach((doc)=>{
      // console.log("doc ref", doc.created_at);
      const docRef = db.collection("CustomerAddress").doc(todayDate).collection("data").doc();
      batch.set(docRef, doc);
    });
    const Backups={
      "Date": todayDate,
      "Object": "CustomerAddress",
      "No Of Records": data.customer_address.length,
    };
    const BackupDocref=db.collection("Backups").doc();
    batch.set(BackupDocref, Backups);
    batch.commit();
  });
});
exports.restoreCustomerAddress= functions.https.onCall((data) => {
  // Get all the documents from the Firestore collection called
  console.log("data", data.todayDate);
  admin.firestore().collection("customeraddress").doc(data.todayDate).collection("data").limit(1).get().then((docs) => {
    // Get all the data from each documents
    docs.forEach((doc) => {
      const customeraddress = doc.data();
      const id = customeraddress.id;
      const customerid = customeraddress.customer_id;
      console.log("my id ", id);
      fetch("https://ariztar-sandbox.myshopify.com/admin/api/2022-10/customers/"+customerid+"/addresses/"+id+".json", {
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
        const json = JSON.stringify({customer_address: customeraddress});
        // console.log("json", json);
        if (data.customer_address) {
          // console.log("type", typeof data.product);
          console.log("data fetching", data.customer_address.id);
          // console.log("json", JSON.stringify(data.product, null, 4));
          fetch("https://ariztar-sandbox.myshopify.com/admin/api/2022-10/customers/"+data.customer_address.customer_id+"/addresses/"+data.customer_address.id+".json", {
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
          fetch("https://ariztar-sandbox.myshopify.com/admin/api/2022-10/customers.json", {
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
