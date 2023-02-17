
/* eslint-disable max-len */
// const sanitizer = require("./sanitizer");
const functions = require("firebase-functions");
const fetch = require("node-fetch");
const admin = require("firebase-admin");
admin.initializeApp(functions.config().firebase);
// const firestore = require("firebase-firestore");
// Create and Deploy Your First Cloud Functions
// https://firebase.google.com/docs/functions/write-firebase-functions
exports.backupMetafield = functions.https.onCall((data) => {
  const ownerType = data.ownerType;
  console.log("my qwnertype", ownerType);
  const query = `{
  metafieldDefinitions(ownerType:${ownerType},first:10) {
    # MetafieldDefinitionConnection fields
    nodes {
        name
        id
        namespace
        description
        ownerType
        key
    }
  }
}`;
  console.log("query", query);
  fetch("https://ariztar-sandbox.myshopify.com/admin/api/2022-10/graphql.json", {
    method: "POST",
    headers: {
      "Content-Type": "application/graphql",
      // eslint-disable-next-line camelcase, no-undef
      "X-Shopify-Access-Token": "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",
    },
    body: query,
  }).then(function(response) {
    const jsonObject = response.json();
    console.log("response", jsonObject);
    return jsonObject;
  }).then(function(data) {
    // console.log("type", typeof data.products);
    const dataval = data.data.metafieldDefinitions.nodes;
    console.log("fetch datas", dataval);
    const db = admin.firestore();
    const batch=db.batch();
    const todayDate = new Date().toISOString().slice(0, 16);
    console.log("daata date", todayDate);
    dataval.forEach((doc)=>{
      // console.log("doc ref", doc.created_at);
      const docRef = db.collection("Metafield").doc(ownerType).collection(todayDate).doc();
      batch.set(docRef, doc);
    });
    const Backups={
      "Date": todayDate,
      "Entity": ownerType+" "+"metaField",
      "Total Datas": dataval.length,
    };
    const BackupDocref=db.collection("Backups").doc();
    batch.set(BackupDocref, Backups);
    batch.commit();
  });
});
exports.restoreMetafield = functions.https.onCall((data) => {
  // Get all the documents from the Firestore collection called
  console.log("data", data.todayDate);
  const ownerType = data.ownerType;
  admin.firestore().doc("Metafield").collection(ownerType).doc(data.todayDate).collection("data").limit(1).get().then((docs) => {
    // Get all the data from each documents
    docs.forEach((doc) => {
      const collect = doc.data();
      console.log("collect", collect);
      const id = collect.id;
      // console.log("my id", id);
      const metadata =`{
        metafieldDefinition(id:"${id}") {
          # MetafieldDefinition fields
          namespace
          key
          ownerType
        }
      }`;
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
        // const json = JSON.stringify({metafieldDefinition: data});
        // console.log("json", json);
        const definition = {
          "name": collect.name,
          "namespace": collect.namespace,
          "key": collect.namespace,
          "description": collect.description,
          "ownerType": collect.ownerType,
        };
        // const deffield= JSON.stringify({definition});
        console.log("my definition", definition);
        if (data.data.metafieldDefinition) {
          const query = `mutation metafieldDefinitionUpdate($definition: MetafieldDefinitionUpdateInput!) {
              metafieldDefinitionUpdate(definition: $definition) {
                updatedDefinition {
                  id
                  name
                  namespace
                  description
                  key
                }
              userErrors {
                  field
                  message
                  code
                }
              }
            }`;
          const graphql = JSON.stringify({
            query,
            variables: {
              definition,
            },
          });
          console.log("my query", query);
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
            console.log("update a data", JSON.stringify(val, undefined, 2));
          });
        // eslint-disable-next-line no-dupe-else-if
        } else {
          const definition = {
            "name": collect.name,
            "namespace": collect.namespace,
            "key": collect.namespace,
            "description": collect.description,
            "type": "multi_line_text_field",
            "ownerType": collect.ownerType,
          };
          const query=`mutation CreateMetafieldDefinition($definition: MetafieldDefinitionInput!) {
          metafieldDefinitionCreate(definition: $definition) {
            createdDefinition {
              id
              name
            }
            userErrors {
              field
              message
              code
            }
          }
        }`;
          const creategraphql = JSON.stringify({
            query,
            variables: {
              definition,
            },
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

