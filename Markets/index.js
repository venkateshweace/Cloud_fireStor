

/* eslint-disable max-len */
// const sanitizer = require("./sanitizer");
const functions = require("firebase-functions");
const fetch = require("node-fetch");
const admin = require("firebase-admin");
admin.initializeApp(functions.config().firebase);
// const firestore = require("firebase-firestore");
// Create and Deploy Your First Cloud Functions
// https://firebase.google.com/docs/functions/write-firebase-functions
exports.backupMarkets = functions.https.onCall((data) => {
  console.log("data7", data);
  const ShopifyId = data.tenant.ShopifyId;
  console.log("shopify6", ShopifyId);
  const ShopifyToken = data.tenant.ShopifyToken;
  const query = `{
      markets (first: 2) {
        edges {
            node {
                id
                name
            }
        }
      }
}`;
  console.log("query", query);
  const url = `https://${ShopifyId}.myshopify.com/admin/api/2022-10/graphql.json`;
  console.log("urls", url);
  console.log("token", ShopifyToken);
  fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/graphql",
      // eslint-disable-next-line camelcase, no-undef
      "X-Shopify-Access-Token": ShopifyToken,
    },
    body: query,
  }).then((response) => {
    const jsonObject = response.json();
    console.log("response", jsonObject);
    return jsonObject;
  }).then((data) => {
    // console.log("type", typeof data.products);
    console.log("region ", data);
    const datasLoad = data.data.markets;
    console.log("data fetching", datasLoad.edges);
    const loadData = JSON.stringify(datasLoad.edges);
    const dataparse = JSON.parse(loadData);
    console.log("json stringify", loadData);
    const db = admin.firestore();
    // console.log("db", db);
    const batch=db.batch();
    const todayDate = new Date().toISOString().slice(0, 16);
    console.log("daata date", todayDate);
    dataparse.forEach((doc)=>{
      // console.log("doc ref", doc.created_at);
      // const docRef = db.collection("Markets").doc(todayDate).collection("data").doc();
      const docRef = db.collection(ShopifyId).doc("data").collection("Markets").doc(todayDate).collection("data").doc();
      batch.set(docRef, doc);
    });
    const Backups={
      "Date": todayDate,
      "Object": "Markets",
      "No Of Records": dataparse.length,
    };
    const BackupDocref=db.collection(ShopifyId).doc("data").collection("Backups").doc();
    batch.set(BackupDocref, Backups);
    batch.commit();
  });
});
exports.restoreMarkets = functions.https.onCall((data) => {
  console.log("data7", data);
  const ShopifyId = data.tenant.ShopifyId;
  console.log("shopify6", ShopifyId);
  const ShopifyToken = data.tenant.ShopifyToken;
  // Get all the documents from the Firestore collection called
  admin.firestore().collection(ShopifyId).doc("data").collection("Markets").doc(data.todayDate).collection("data").limit(2).get().then((docs) => {
    // Get all the data from each documents
    docs.forEach((doc) => {
      const collect = doc.data();
      console.log("collect", collect);
      const id = collect.node.id;
      // const name = collect.node.name;
      // console.log("my id", id, name);
      const metadata =`{
        market (id:"${id}"){
           id
           name
        }
     }`;
      fetch(`https://${ShopifyId}.myshopify.com/admin/api/2022-10/graphql.json`, {
        method: "POST",
        headers: {
          "Content-Type": "application/graphql",
          // eslint-disable-next-line camelcase, no-undef
          "X-Shopify-Access-Token": ShopifyToken,
        },
        body: metadata,
      }).then((response) => {
        const jsonObject = response.json();
        return jsonObject;
      }).then((data) => {
        console.log("data loading", data);
        if (data.data.market) {
          console.log("collect id name", collect.node.id, collect.node.name);
          const query = "mutation marketUpdate($id: ID!, $input: MarketUpdateInput!) {\r\n            marketUpdate(id: $id, input: $input) {\r\n              market {\r\n                id\r\n                name\r\n              }\r\n              userErrors {\r\n                field\r\n                message\r\n              }\r\n            }\r\n          }";
          const graphql = JSON.stringify({
            query,
            variables: {"id": collect.node.id, "input": {"enabled": true, "name": collect.node.name}},
          });
          fetch(`https://${ShopifyId}.myshopify.com/admin/api/2022-10/graphql.json`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              // eslint-disable-next-line camelcase, no-undef
              "X-Shopify-Access-Token": ShopifyToken,
            },
            body: graphql,
          }).then((response) => {
            const jsonObject = response.json();
            return jsonObject;
          }).then((val) => {
            console.log("update a data", val);
          });
        } else {
          const definition ={
            "input": {
              "enabled": true,
              "name": "Afghanistan",
              "regions": [
                {
                  "countryCode": "AF",
                },
              ],
            },
          };
          const createquery=`mutation marketCreate($input: MarketCreateInput!) {
            marketCreate(input: $input) {
              market {
               id
              }
              userErrors {
                field
                message
              }
            }
          }`;
          const creategraphql = JSON.stringify({
            createquery,
            variables: {
              definition,
            },
          });
          fetch(`https://${ShopifyId}.myshopify.com/admin/api/2022-10/graphql.json`, {
            method: "POST",
            headers: {
              "Content-Type": "application/graphql",
              // eslint-disable-next-line camelcase, no-undef
              "X-Shopify-Access-Token": ShopifyToken,
            },
            body: creategraphql,
          }).then((response) => {
            const jsonObject = response.json();
            return jsonObject;
          }).then((val) => {
            console.log("Created a Datas", JSON.stringify(val, undefined, 2));
          });
        }
      });
    });
  });
});
