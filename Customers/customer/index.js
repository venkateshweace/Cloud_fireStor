/* eslint-disable max-len */
// const sanitizer = require("./sanitizer");
const functions = require("firebase-functions");
const fetch = require("node-fetch");
const admin = require("firebase-admin");
admin.initializeApp(functions.config().firebase);
// const firestore = require("firebase-firestore");
// Create and Deploy Your First Cloud Functions
// https://firebase.google.com/docs/functions/write-firebase-functions
exports.backupCustomers = functions.https.onCall((data) => {
  console.log("data9", data);
  const ShopifyId = data.tenant.ShopifyId;
  console.log("shopify8", ShopifyId);
  const ShopifyToken = data.tenant.ShopifyToken;
  const url = `https://${ShopifyId}.myshopify.com/admin/api/2022-10/customers.json`;
  console.log("urls", url);
  console.log("token", ShopifyToken);
  fetch(url, {
    headers: {
      "Content-Type": "application/json",
      // eslint-disable-next-line camelcase, no-undef
      "X-Shopify-Access-Token": ShopifyToken,
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
    data.customers.forEach((doc)=>{
      // console.log("doc ref", doc.created_at);
      const docRef = db.collection(ShopifyId).doc("data").collection("Customer").doc(todayDate).collection("data").doc();
      batch.set(docRef, doc);
    });
    const Backups={
      "Date": todayDate,
      "Object": "Customer",
      "No Of Records": data.customers.length,
    };
    const BackupDocref=db.collection(ShopifyId).doc("data").collection("Backups").doc();
    batch.set(BackupDocref, Backups);
    batch.commit();
  });
});
exports.restoreCustomers = functions.https.onCall((data) => {
  // Get all the documents from the Firestore collection called
  console.log("data9", data);
  console.log("data", data.todayDate);
  const ShopifyId = data.tenant.ShopifyId;
  console.log("shopify8", ShopifyId);
  const ShopifyToken = data.tenant.ShopifyToken;
  const todayDate = new Date().toISOString().slice(0, 2);
  console.log("daata date", todayDate);
  admin.firestore().collection(ShopifyId).doc("data").collection("Customer").doc(data.todayDate).collection("data").get().then((docs) => {
    // Get all the data from each documents
    docs.forEach((doc) => {
      const customers = doc.data();
      const id = customers.id;
      console.log("my id ", id);
      fetch(`https://${ShopifyId}.myshopify.com/admin/api/2022-10/customers/`+id+".json", {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          // eslint-disable-next-line camelcase, no-undef
          "X-Shopify-Access-Token": ShopifyToken,
        },
      }).then(function(response) {
        const jsonObject = response.json();
        return jsonObject;
      }).then(function(data) {
        console.log("data loading", data);
        const json = JSON.stringify({customer: customers});
        // console.log("json", json);
        if (data.customer) {
          // console.log("type", typeof data.product);
          console.log("data fetching", data.customer.id);
          // console.log("json", JSON.stringify(data.product, null, 4));
          fetch(`https://${ShopifyId}.myshopify.com/admin/api/2022-10/customers/`+data.customer.id+".json", {
            method: "PUT",
            headers: {
              "Content-Type": "application/json",
              // eslint-disable-next-line camelcase, no-undef
              "X-Shopify-Access-Token": ShopifyToken,
            },
            body: json,
          }).then(function(response) {
            const jsonObject = response.json();
            return jsonObject;
          }).then(function(val) {
            console.log("Updated a Datas", val);
          });
        } else {
          fetch(`https://${ShopifyId}.myshopify.com/admin/api/2022-10/customers.json`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              // eslint-disable-next-line camelcase, no-undef
              "X-Shopify-Access-Token": ShopifyToken,
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
