/* eslint-disable max-len */
// const sanitizer = require("./sanitizer");
const functions = require("firebase-functions");
const fetch = require("node-fetch");
const admin = require("firebase-admin");
admin.initializeApp(functions.config().firebase);
// const firestore = require("firebase-firestore");
// Create and Deploy Your First Cloud Functions
// https://firebase.google.com/docs/functions/write-firebase-functions
exports.backupGiftCards = functions.https.onCall((data) => {
  const query =`{
      files(first: 2) {
        # FileConnection fields
        edges {
          node{
            createdAt
                  alt
                  ... on GenericFile {
                    id
                    originalFileSize
                    url
                  }
              }
          }
      }
}`;
  const graphql = JSON.stringify({
    query,
  });
  console.log("query", query);
  fetch("https://ariztar-sandbox.myshopify.com/admin/api/2022-10/graphql.json", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      // eslint-disable-next-line camelcase, no-undef
      "X-Shopify-Access-Token": "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",
    },
    body: graphql,
  }).then(function(response) {
    const jsonObject = response.json();
    console.log("response", jsonObject);
    return jsonObject;
  }).then(function(data) {
    // console.log("type", typeof data.products);
    console.log("fetch datas", data);
    const db = admin.firestore();
    const batch=db.batch();
    const todayDate = new Date().toISOString().slice(0, 16);
    console.log("daata date", todayDate);
    data.forEach((doc)=>{
      // console.log("doc ref", doc.created_at);
      const docRef = db.collection("Files").doc(todayDate).collection("data").doc();
      batch.set(docRef, doc);
    });
    batch.commit();
  });
});
exports.restoreFiles = functions.https.onCall((data) => {
  // Get all the documents from the Firestore collection called
  admin.firestore().collection("Files").doc(data.todayDate).collection("data").limit(1).get().then((docs) => {
    // Get all the data from each documents
    docs.forEach((doc) => {
      const collect = doc.data();
      console.log("collect", collect);
      const id = collect.node.id;
      const metadata =`{
          file (id:"${id}") {
            id
            name
            currency
          }
        }`;
      console.log("meta data", metadata);
      fetch("https://ariztar-sandbox.myshopify.com/admin/api/2022-10/graphql.json", {
        method: "POST",
        headers: {
          "Content-Type": "application/graphql",
          // eslint-disable-next-line camelcase, no-undef
          "X-Shopify-Access-Token": "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",
        },
        body: metadata,
      }).then(function(response) {
        const jsonObject = response.json();
        return jsonObject;
      }).then(function(data) {
        console.log("data loading", data);
      });
    });
  });
});

