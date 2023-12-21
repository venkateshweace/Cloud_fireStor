/* eslint-disable max-len */
// const sanitizer = require("./sanitizer");
const functions = require("firebase-functions");
const fetch = require("node-fetch");
const admin = require("firebase-admin");
admin.initializeApp(functions.config().firebase);
// Create and Deploy Your First Cloud Functions
// https://firebase.google.com/docs/functions/write-firebase-functions
exports.backupBackupAll = functions.https.onCall((data) => {
  console.log("for", data);
  const baseUrl = "https://us-central1-test-project-8986d.cloudfunctions.net/";
  // eslint-disable-next-line max-len
  console.log("baseUrl", baseUrl);
  // eslint-disable-next-line max-len
  const urls = ["backupCustomCollection", "backupSmartCollection", "backupProducts", "backupCustomers", "backupMarkets", "backupCollect", "backupPricelist"];
  const todayDate = new Date().toISOString().slice(0, 16);
  // eslint-disable-next-line no-undef
  // const ShopifyId = "ariztar-sandbox";
  const ShopifyToken = data.tenant;
  console.log("ShopifyToken", ShopifyToken);
  console.log("baseurl", baseUrl);
  console.log("daata date", todayDate);
  const datas = JSON.stringify({
    data: {todayDate, tenant: ShopifyToken},
  });
  console.log("data", datas);
  urls.forEach( (url)=>{
    // eslint-disable-next-line no-unused-vars
    const response = fetch(baseUrl + url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        // eslint-disable-next-line camelcase, no-undef
      },
      body: datas,
    }).then(function(response) {
      const jsonObject = response.json();
      console.log("response", jsonObject);
      return jsonObject;
    }).then(function(data) {
    // console.log("type", typeof data.products);
      console.log("fetch datas", data);
      // const db = admin.firestore();
      // console.log("db", db);

    // const Backups={
    //   "Date": todayDate,
    //   "Object": "Collection",
    //   "No Of Records": data.products.length,
    // };
    // const BackupDocref=db.collection("Backups").doc();
    // batch.set(BackupDocref, Backups);
    });
  });
  // eslint-disable-next-line max-len
  const ownerTypes = ["PRODUCT", "PRODUCTVARIANT", "COLLECTION", "PAGE", "BLOG", "PRODUCTIMAGE"];
  // console.log("ShopifyToken", ShopifyToken);
  console.log("ownertypes", ownerTypes);
  ownerTypes.forEach( (ownerType)=>{
    const datas = JSON.stringify({
      data: {todayDate, ownerType, tenant: ShopifyToken},
    });
    console.log("datass", datas);
    // eslint-disable-next-line no-unused-vars
    const response = fetch(baseUrl + "backupMetafield", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        // eslint-disable-next-line camelcase, no-undef
        // "X-Shopify-Access-Token": "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",
      },
      body: datas,
    }).then(function(response) {
      const jsonObject = response.json();
      console.log("response", jsonObject);
      return jsonObject;
    }).then(function(data) {
      // console.log("type", typeof data.products);
      console.log("fetch", data);
    });
  });
});

exports.backupForAllTenants = functions.https.onCall((data) => {
  console.log("this", data);
  // Get all the documents from the Firestore collection called
  // eslint-disable-next-line max-len
  admin.firestore().collection("tenants").limit(4).get().then((docs) => {
    const baseUrl = "https://us-central1-test-project-8986d.cloudfunctions.net/";
    const urls = "backupBackupAll";
    const todayDate = new Date().toISOString().slice(0, 16);
    // Get all the data from each documents
    docs.forEach((doc) => {
      const tenant = doc.data();
      console.log("tenants", tenant);
      const datas = JSON.stringify({
        data: {todayDate, tenant},
      });
      console.log("datajjj", datas);
      // eslint-disable-next-line no-unused-vars
      const response = fetch(baseUrl + urls, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          // eslint-disable-next-line camelcase, no-undef, max-len
          "X-Shopify-Access-Token": "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",
        },
        body: datas,
      }).then(function(response) {
        const jsonObject = response.json();
        console.log("response", jsonObject);
        return jsonObject;
      }).then(function(data) {
        // console.log("type", typeof data.products);
        console.log("fetch", data);
      });
    });
  });
});

