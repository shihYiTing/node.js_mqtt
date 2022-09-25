// Ref: https://flaviocopes.com/rest-api-express-mongodb/

// API Ref
// https://googleapis.dev/nodejs/dialogflow/latest/index.html

// Dependencies
// [MQTT]
const mqtt = require('mqtt')
// [Dialogflow]
const dialogflow = require('@google-cloud/dialogflow');
const uuid = require('uuid');
// [MongoDB]
const mongo = require("mongodb").MongoClient
// [Assert]
const assert = require('assert');


// Constant & Variables
// [MQTT]
const MQ_URL = 'mqtt://120.126.18.132'
const MQ_OPTION = { port: 1883 };
const mq_client = mqtt.connect(MQ_URL, MQ_OPTION)
// [Dialogflow]
const PROJECT_ID = "test1-basn"
// [MongoDB]
const MONGODB_ConnectionString = "mongodb://120.126.18.131:27027"

let db, collection

// https://stackoverflow.com/a/71395676
mongo.connect(MONGODB_ConnectionString, { useUnifiedTopology: true }).then((client, err) => {
    assert.equal(err, null);

    db = client.db("test");
    collection = db.collection("test_nodejs")
})



// Callback Functions
// [MQTT]
mq_client.on('connect', () => {
    console.log(`[mq_client] Successfully connected to MQTT`)
    mq_client.subscribe(["TopicA", "TopicB","dialogflow_input"])


    if (mq_client.connected) {
        mq_client.publish("TopicA", "test message published from TopicA")
        console.log(`[mq_client] publish from TopicA`)

        mq_client.publish("TopicB", "test message published from TopicB")
        console.log(`[mq_client] publish from TopicB`)
    }

    // mq_client.end()
})


mq_client.on('error', (error) => {
    console.log(`[mq_client] Error: ${error}`)
    process.exit();
})

mq_client.on('message', (topic, payload) => {
    console.log(`[mq_client] Received message: {${topic}: ${payload.toString()}}`)

    collection.insertOne({name: "123"}, (err, result) => {
        if(err) {
            console.error(err)
            return
        }

        console.log(result)
    })
    function sendResult(topic){
        return new Promise((resolve,reject)=> {
            if (topic == "dialogflow_input") {
                resolve()
                var dialogflow_response = dialogflow_DetectIntent(query_string = payload.toString())
                console.log('Detected intent');
                var dialogflow_result = dialogflow_response[0].queryResult;
                console.log(`  Query: ${dialogflow_result.queryText}`);
                console.log(`  Response: ${dialogflow_result.fulfillmentText}`);
            }
        })
    }
        mq_client.publish("dialogflow_output", dialogflow_result.fulfillmentText)

        if (dialogflow_result.intent) {
            console.log(`  Intent: ${dialogflow_result.intent.displayName}`);
        } else {
            console.log('  No intent matched.');
        }
    
})
async function main() {
    var result = await sendResult(topic)

    console.log(result)
}
main()


// [Dialogflow]
/**
 * @param {string} query_string The string
 * @return {} 
 */


async function dialogflow_DetectIntent(query_string) {
    process.env.GOOGLE_APPLICATION_CREDENTIALS = "./test2-aaly-6dc1de910ef4.json";
    // A unique identifier for the given session
    const sessionId = uuid.v4();

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
                languageCode: 'zh-TW',
            },
        },
    };

    // Send request and log result
    // const responses = await sessionClient.detectIntent(request);
    
    return await sessionClient.detectIntent(request);

    

}
