/* eslint-disable max-len */
// const sanitizer = require("./sanitizer");
const functions = require("firebase-functions");
const fetch = require("node-fetch");
const admin = require("firebase-admin");
admin.initializeApp(functions.config().firebase);
// const firestore = require("firebase-firestore");
// Create and Deploy Your First Cloud Functions
// https://firebase.google.com/docs/functions/write-firebase-functions
exports.backupFiles = functions.https.onCall((data) => {
  const query =`{
    files(first: 2) {
      edges {
        node{
          createdAt
           alt
          fileErrors
                {
                  code
                  details
                  message
                }
                fileStatus
                preview
                {
                  image{
                      id
                      url
                      altText
                      height

                  }
                  status
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
    const files = data.data.files.edges;
    const db = admin.firestore();
    const batch=db.batch();
    const todayDate = new Date().toISOString().slice(0, 16);
    console.log("daata date", todayDate);
    files.forEach((doc)=>{
      // console.log("doc ref", doc.created_at);
      const docRef = db.collection("Backup's").collection("Files").doc(todayDate).collection("data").doc();
      batch.set(docRef, doc);
    });
    batch.commit();
  });
});
exports.restoreFiles = functions.https.onCall((data) => {
  // Get all the documents from the Firestore collection called
  admin.firestore().collection("Backup's").collection("Files").doc(data.todayDate).collection("data").limit(1).get().then((docs) => {
    // Get all the data from each documents
    docs.forEach((doc) => {
      const collect = doc.data();
      console.log("collect", collect);
      const metadata =`{
        files (first: 2, query:"preview.image.id:'gid://shopify/ImageSource/22847723372644'" ) {
          edges {
            node {
              alt
              createdAt
              createdAt
                 alt
                fileErrors
                      {
                        code
                        details
                        message
                      }
                      fileStatus
                      preview
                      {
                        image{
                            id
                            url
                            altText
                            height
                        }
                        status
                      }     
                  }
            }
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
        if (data.data) {
          const query= `mutation fileUpdate($files: [FileUpdateInput!]!) {
            fileUpdate(files: $files) {
              files {
                # File fields
              }
              userErrors {
                field
                message
              }
            }
          }`;
          const graphql = JSON.stringify({
            query,
            variables: {"files": [{"alt": collect.node.alt, "id": collect.node.preview.image.id, "previewImageSource": collect.node.preview.image.url}]},
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
          const query=`mutation fileCreate($files: [FileCreateInput!]!) {
            fileCreate(files: $files) {
              files {
                # File fields
              }
              userErrors {
                field
                message
              }
            }
          }`;
          const creategraphql = JSON.stringify({
            query,
            variables: {"files": [{"alt": collect.node.alt, "id": collect.node.preview.image.id, "previewImageSource": collect.node.preview.image.url}]},
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

