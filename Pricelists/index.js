/* eslint-disable max-len */
// const sanitizer = require("./sanitizer");
const functions = require("firebase-functions");
const fetch = require("node-fetch");
const admin = require("firebase-admin");
admin.initializeApp(functions.config().firebase);
// const firestore = require("firebase-firestore");
// Create and Deploy Your First Cloud Functions
// https://firebase.google.com/docs/functions/write-firebase-functions
exports.backupPricelist = functions.https.onCall((data) => {
  const query =`{
    priceLists(first:2){
      nodes{
          id
          name
          currency
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
    console.log("fetch datas", data.data.priceLists.nodes);
    const datalist =data.data.priceLists.nodes;
    console.log("data list", datalist);
    const db = admin.firestore();
    const batch=db.batch();
    const todayDate = new Date().toISOString().slice(0, 16);
    console.log("daata date", todayDate);
    datalist.forEach((doc)=>{
      // console.log("doc ref", doc.created_at);
      const docRef = db.collection("Pricelists").doc(todayDate).collection("data").doc();
      batch.set(docRef, doc);
    });
    const Backups={
      "Date": todayDate,
      "Entity": "Pricelists",
      "Total Datas": datalist.length,
    };
    const BackupDocref=db.collection("Backups").doc();
    batch.set(BackupDocref, Backups);
    batch.commit();
  });
});
exports.restorePricelist = functions.https.onCall((data) => {
  // Get all the documents from the Firestore collection called
  admin.firestore().collection("Pricelists").doc(data.todayDate).collection("data").limit(1).get().then((docs) => {
    // Get all the data from each documents
    docs.forEach((doc) => {
      const collect = doc.data();
      console.log("collect", collect);
      const id = collect.id;
      const metadata =`{
          priceList(id:"${id}") {
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
        if (data.data.priceList != null) {
          const query=`mutation priceListUpdate($id: ID!, $input: PriceListUpdateInput!) {
            priceListUpdate(id: $id, input: $input) {
              priceList {
               id
               name
               currency
              }
              userErrors {
                field
                message
              }
            }
          }`;
          const graphql = JSON.stringify({
            query,
            variables: {"id": collect.id, "input": {"currency": collect.currency, "name": collect.name}},
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
          const query=`mutation PriceListCreate($input: PriceListCreateInput!) {
            priceListCreate(input: $input) {
              userErrors {
                field
                message
              }
              priceList {
                id
                name
                currency
                contextRule {
                  market {
                    id
                  }
                }
                parent {
                  adjustment {
                    type
                    value
                  }
                }
              }
            }
          }`;
          const creategraphql = JSON.stringify({
            query,
            variables: {"input": {"name": collect.name, "currency": collect.currency, "parent": {"adjustment": {"type": "PERCENTAGE_INCREASE", "value": 10}}}},
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
