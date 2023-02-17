/* eslint-disable max-len */
// const sanitizer = require("./sanitizer");
const functions = require("firebase-functions");
const fetch = require("node-fetch");
const admin = require("firebase-admin");
admin.initializeApp(functions.config().firebase);
// const firestore = require("firebase-firestore");
// Create and Deploy Your First Cloud Functions
// https://firebase.google.com/docs/functions/write-firebase-functions
exports.backupDellivery = functions.https.onCall((data) => {
  const query =`{
    deliveryProfiles(first:2) {
     edges{
         node{
             id
             name
             activeMethodDefinitionsCount
             default
             legacyMode
             locationsWithoutRatesCount
             originLocationCount
             productVariantsCountV2{
                 capped
                 count
             }
             profileLocationGroups{
                 countriesInAnyZone{
                     country{
                         code{
                             countryCode
                             restOfWorld
                         }
                         id
                         name
                         provinces{
                             id
                             code
                             name
                             translatedName
                         }
                         translatedName     
                     }
                     zone
                 }
                 locationGroup{
                     id
                 }
             }
             unassignedLocations{
                 activatable
                 address{
                     address1
                     address2
                     city
                     country
                     countryCode
                     formatted
                     latitude
                     longitude
                     phone
                     province
                     provinceCode
                     zip
                 }
                 addressVerified
                 deactivatable
                 deactivatedAt
                 deletable
                 fulfillmentService{
                     id
                     callbackUrl
                     fulfillmentOrdersOptIn
                     handle
                     inventoryManagement
                     permitsSkuSharing
                     productBased
                     serviceName
                     type
                 }
                 fulfillsOnlineOrders
                 hasActiveInventory
                 hasUnfulfilledOrders
                 id
                 isActive
                 legacyResourceId
                 name
                 shipsInventory
             }
             zoneCountryCount
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
    const delivery = data.data.deliveryProfiles.edges;
    console.log("delivery", delivery);
    const db = admin.firestore();
    const batch=db.batch();
    const todayDate = new Date().toISOString().slice(0, 16);
    console.log("daata date", todayDate);
    delivery.forEach((doc)=>{
      // console.log("doc ref", doc.created_at);
      const docRef = db.collection("Backup's").collection("dellivery").doc(todayDate).collection("data").doc();
      batch.set(docRef, doc);
    });
    batch.commit();
  });
});
exports.restoreDelivery = functions.https.onCall((data) => {
  // Get all the documents from the Firestore collection called
  admin.firestore().collection("Backup's").collection("dellivery").doc(data.todayDate).collection("data").limit(1).get().then((docs) => {
    // Get all the data from each documents
    docs.forEach((doc) => {
      const collect = doc.data();
      console.log("collect", JSON.stringify(collect.node));
      const id = collect.node.id;
      const metadata =`{
        deliveryProfile (id:"${id}") {
            id
            name
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
        if (data.data) {
          const query= `mutation deliveryProfileUpdate($id: ID!, $profile: DeliveryProfileInput!) {
            deliveryProfileUpdate(id: $id, profile: $profile) {
              profile {
               
              }
              userErrors {
                field
                message
              }
            }
          }`;
          const graphql = JSON.stringify({
            query,
            variables: {},
          });
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
            return jsonObject;
          }).then(function(val) {
            console.log("update a data", val);
          });
        } else {
          const query="";
          const creategraphql = JSON.stringify({
            query,
            variables: "",
          });
          fetch("https://ariztar-sandbox.myshopify.com/admin/api/2022-10/graphql.json", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              // eslint-disable-next-line camelcase, no-undef
              "X-Shopify-Access-Token": "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",
            },
            body: creategraphql,
          }).then(function(response) {
            const jsonObject = response.json();
            return jsonObject;
          }).then(function(val) {
            console.log("Created a Datas", JSON.stringify(val, undefined, 2));
          });
        }
      });
    });
  });
});
