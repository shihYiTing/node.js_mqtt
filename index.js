// Ref: https://flaviocopes.com/rest-api-express-mongodb/

// API Ref
// https://googleapis.dev/nodejs/dialogflow/latest/index.html

// Dependencies
// [MQTT]
const mqtt = require('mqtt')
// [Dialogflow]
//const dialogflow = require('@google-cloud/dialogflow');
const uuid = require('uuid');
// [MongoDB]
const mongo = require("mongodb").MongoClient
// [Assert]
const assert = require('assert');

// [Config]
const { cfg } = require('./config') // configurations from config.js


// Constant & Variables
// [MQTT]
const mq_client = mqtt.connect(cfg.MQ_URL, cfg.MQ_OPTION)

let db, collection

// https://stackoverflow.com/a/71395676
mongo.connect(cfg.MONGODB_ConnectionString, { useUnifiedTopology: true }).then((client, err) => {
    assert.equal(err, null);

    db = client.db("test");
    collection = db.collection("test_nodejs")
})



// Callback Functions
// [MQTT]
mq_client.on('connect', () => {
    console.log(`[mq_client] Successfully connected to MQTT`)
    mq_client.subscribe(cfg.MQ_SUB_TOPIC_LIST)

    // mq_client.end()
})


mq_client.on('error', (error) => {
    console.log(`[mq_client] Error: ${error}`)
    process.exit();
})

mq_client.on('message', (topic, payload) => {
    console.log(`[mq_client] Received message: {${topic}: ${payload.toString()}}`)

    collection.insertOne({ name: "123" }, (err, result) => {
        if (err) {
            console.error(err)
            return
        }

        console.log(result)
    })

    if (topic == "dialogflow_input") {
        var dialogflow_response = executeQueries(query = payload.toString())

        console.log('Detected intent');
        var dialogflow_result = dialogflow_response[0].queryResult;
        console.log(`  Query: ${dialogflow_result.queryText}`);
        console.log(`  Response: ${dialogflow_result.fulfillmentText}`);
    }

  

    mq_client.publish("dialogflow_output", dialogflow_result.fulfillmentText)

    if (dialogflow_result.intent) {
        console.log(`  Intent: ${dialogflow_result.intent.displayName}`);
    } else {
        console.log('  No intent matched.');
    }

})

// function sendResult(topic) {
//     return new Promise((resolve, reject) => {
//         if (topic == "dialogflow_input") {
//             resolve()
//             var dialogflow_response = dialogflow_DetectIntent(query_string = payload.toString())
//             console.log('Detected intent');
//             var dialogflow_result = dialogflow_response[0].queryResult;
//             console.log(`  Query: ${dialogflow_result.queryText}`);
//             console.log(`  Response: ${dialogflow_result.fulfillmentText}`);
//         }
//     })
// }



// async function main() {
//     var result = await sendResult(topic)

//     console.log(result)
// }
// main()


// [Dialogflow]
/**
 * @param {string} queries The string
 * @return {} 
 */
// async function dialogflow_DetectIntent(query_string) {
//     process.env.GOOGLE_APPLICATION_CREDENTIALS = "./test2-aaly-6dc1de910ef4.json";
//     // A unique identifier for the given session
//     const sessionId = uuid.v4();

//     // Create a new session
//     const sessionClient = new dialogflow.SessionsClient({ keyFilename: 'test2-aaly-6dc1de910ef4.json' });
//     const sessionPath = sessionClient.projectAgentSessionPath(
//         cfg.DIAGFLOW_PROJECT_ID,
//         sessionId
//     );

//     // The text query request.
//     const request = {
//         session: sessionPath,
//         queryInput: {
//             text: {
//                 // The query to send to the dialogflow agent
//                 text: '你好',
//                 // The language used by the client (en-US)
//                 languageCode: 'zh-TW',
//             },
//         },
//     };

//     // Send request and log result
//     // const responses = await sessionClient.detectIntent(request);

//     return await sessionClient.detectIntent(request);
// }


async function executeQueries(queries) {
    // Keeping the context across queries let's us simulate an ongoing conversation with the bot
    let context;
    let intentResponse;
    const sessionId = uuid.v4();
    process.env.GOOGLE_APPLICATION_CREDENTIALS = "./test2-aaly-6dc1de910ef4.json";


    for (const query of queries) {
        try {
            console.log(`Sending Query: ${query}`);
            intentResponse = await detectIntent(
                cfg.DIAGFLOW_PROJECT_ID,
                sessionId,
                query,
                context,
                'zh-TW'
            );
            console.log('Detected intent');
            console.log(
                `Fulfillment Text: ${intentResponse.queryResult.fulfillmentText}`
            );
            // Use the context from this response for next queries
            context = intentResponse.queryResult.outputContexts;
        } catch (error) {
            console.log(error);
        }
    }
}
