// API Ref
// https://googleapis.dev/nodejs/dialogflow/latest/index.html

// Dependencies
// [MQTT]
const mqtt = require('mqtt')
// [Dialogflow]
const dialogflow = require('@google-cloud/dialogflow');
const uuid = require('uuid');
// [MongoDB]
const { MongoClient } = require("mongodb").MongoClient;
const dbo = require('./mongoconn');



// Constant & Variables
// [MQTT]
const MQ_URL = 'mqtt://120.126.18.132'
const MQ_OPTION = { port: 1883 };
const mq_client = mqtt.connect(MQ_URL, MQ_OPTION)
// [Dialogflow]
const PROJECT_ID = "test2-aaly"
// [MongoDB]


// const connectionString = process.env.ATLAS_URI;


// Callback Functions
// [MQTT]
mq_client.on('connect', () => {
    console.log(`[mq_client] Connected: ${mq_client.connected}`)
    mq_client.subscribe(["TopicA", "TopicB","dialogflow_input"])


    if (mq_client.connected) {
        mq_client.publish("TopicA", "test message published from TopicA")
        console.log(`[mq_client] publish from TopicA`)

        mq_client.publish("TopicB", "test message published from TopicB")
        console.log(`[mq_client] publish from TopicB`)

        // Connect to DB
        dbo.connectToServer(function (err) {
            if (err) {
                console.error(err);
                process.exit();
            }
        });
    }

//    mq_client.end()
})


mq_client.on('error', (error) => {
    console.log(`[mq_client] Error: ${error}`)
    process.exit();
})

mq_client.on('message', (topic, payload) => {
    console.log(`[mq_client] Received message: {${topic}: ${payload.toString()}}`)

    // get db object -> check db connection
    const dbConnect = dbo.getDb()

    if (topic == "dialogflow_input") {
        var dialogflow_response = dialogflow_DetectIntent(query_string = payload.toString())

        console.log('Detected intent');
        var dialogflow_result = dialogflow_response[0].queryResult;
        console.log(`  Query: ${dialogflow_result.queryText}`);
        console.log(`  Response: ${dialogflow_result.fulfillmentText}`);

        // save data into db
        // add your own data
        // dbConnect.collection('COLLETION').insertOne()

        mq_client.publish("dialogflow_output", dialogflow_result.fulfillmentText)

        if (dialogflow_result.intent) {
            console.log(`  Intent: ${dialogflow_result.intent.displayName}`);
        } else {
            console.log('  No intent matched.');
        }
    }
})


// [Dialogflow]
/**
 * @param {string} PROJECT_ID The string
 * @return {} 
 */
async function dialogflow_DetectIntent(PROJECT_ID="test2-aaly") {
    // A unique identifier for the given session
    const sessionId = uuid.v4();
    process.env.GOOGLE_APPLICATION_CREDENTIALS = "./test2-aaly-6dc1de910ef4.json";

    // Create a new session
    const sessionClient = new dialogflow.SessionsClient({ keyFilename: 'test2-aaly-6dc1de910ef4.json'});
    const sessionPath = sessionClient.projectAgentSessionPath(
        PROJECT_ID,
        sessionId
    );

    // The text query request.
    const request = {
        session: sessionPath,
        queryInput: {
            text: {
                // The query to send to the dialogflow agent
                text: '你好',
                // The language used by the client (en-US)
                languageCode: 'zh-tw',
            },
        },
    };

    // Send request and log result
    // const responses = await sessionClient.detectIntent(request);
    return await sessionClient.detectIntent(request);

}
