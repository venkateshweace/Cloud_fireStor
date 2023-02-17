/* eslint-disable max-len */
// const sanitizer = require("./sanitizer");
const functions = require("firebase-functions");
const fetch = require("node-fetch");
const admin = require("firebase-admin");
admin.initializeApp(functions.config().firebase);
// const firestore = require("firebase-firestore");
// Create and Deploy Your First Cloud Functions
// https://firebase.google.com/docs/functions/write-firebase-functions
exports.backupLocations = functions.https.onCall((data) => {
  const query =`{
    locations (first:2){
     edges
     {
         node
         {
             id
             name
             activatable
             address
             {
                address1
                address2
                city
                company
                coordinatesValidated
                country
                countryCodeV2
                firstName
                formatted
                formattedArea
                id
                lastName
                latitude
                longitude
                name
                phone
                province
                provinceCode
                zip
             }
            addressVerified
            deactivatable
            deactivatedAt
            deletable
            fulfillmentService
            hasActiveInventory
            hasUnfulfilledOrders
            inventoryLevel 
            {
              id
              available
              canDeactivate
              createdAt
              deactivationAlert
              deactivationAlertHtml
              incoming
            }
            isActive
            legacyResourceId
            shipsInventory
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
    const location = data.data;
    const db = admin.firestore();
    const batch=db.batch();
    const todayDate = new Date().toISOString().slice(0, 16);
    console.log("daata date", todayDate);
    location.forEach((doc)=>{
      // console.log("doc ref", doc.created_at);
      const docRef = db.collection("Location").doc(todayDate).collection("data").doc();
      batch.set(docRef, doc);
    });
    const Backups={
      "Date": todayDate,
      "Entity": "Location",
      "Total Datas": location.length,
    };
    const BackupDocref=db.collection("Backups").doc();
    batch.set(BackupDocref, Backups);
    batch.commit();
  });
});

