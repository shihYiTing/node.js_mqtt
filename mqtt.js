const express = require('express');
const app = express();
const http = require('http');
const server = http.createServer(app);
const { Server } = require('socket.io');
const io = new Server(server);
var mqtt = require('mqtt');
var opt = {port:1883,};
const client  = mqtt.connect('mqtt://120.126.18.132',opt);
const dialogflow = require("@google-cloud/dialogflow");
const uuid = require("uuid");

var username 
var useremail
var str



/**
 * Send a query to the dialogflow agent, and return the query result.
 * @param {string} projectId The project to be used
 */
async function runSample(projectId = "test1-basn") {
  // A unique identifier for the given session
  const sessionId = uuid.v4();
  process.env.GOOGLE_APPLICATION_CREDENTIALS = "./test1-basn-c8b36638469a.json";
  // Create a new session
  const sessionClient = new dialogflow.SessionsClient({
    keyFilename: 'test1-basn-c8b36638469a.json'
  });
  const sessionPath = sessionClient.projectAgentSessionPath(
    projectId,
    sessionId
  );

  // The text query request.
  const request = {
    session: sessionPath,
    queryInput: {
      text: {
        // The query to send to the dialogflow agent
        text: "你好",
        // The language used by the client (en-US)
        languageCode: "zh-TW"
      }
    }
  };

  // Send request and log result
  const responses = await sessionClient.detectIntent(request);

  client.on('connect', function () {
    console.log('已連接至MQTT伺服器');
    client.subscribe("dialogflow");
    //client.publish("web_info");
    
  });
  client.on('message', function (_, msg) { 
    console.log("Detected intent");
    const result = responses[0].queryResult;
    console.log(`  Query: ${result.queryText}`);
    console.log(`  Response: ${result.fulfillmentText}`);
    if (result.intent) {
      console.log(`  Intent: ${result.intent.displayName}`);
    } else {
      console.log("  No intent matched.");
    }
    // console.log( getDatetime() +"mqtt"+ " >> "+ msg.toString());
    // store msg to redis database
    
  });
 
}
runSample();




// Functions
function getDatetime(){
  let date_ob = new Date();

  // adjust 0 before single digit date
  let date = ("0" + date_ob.getDate()).slice(-2);

  // current month
  let month = ("0" + (date_ob.getMonth() + 1)).slice(-2);

  // current year
  let year = date_ob.getFullYear();

  // current hours
  let hours = date_ob.getHours();

  // current minutes
  let minutes = date_ob.getMinutes();

  // current seconds
  let seconds = date_ob.getSeconds();

  // prints date in YYYY-MM-DD format
  //console.log(year + "-" + month + "-" + date);

  // prints date & time in YYYY-MM-DD HH:MM:SS format
  // console.log(year + "-" + month + "-" + date + " " + hours + ":" + minutes + ":" + seconds);
  let result = year + "-" + month + "-" + date + " " + hours + ":" + minutes + ":" + seconds
  
  // prints time in HH:MM format
  //console.log(hours + ":" + minutes);

  return result
}

client.on('connect', function () {
  console.log('已連接至MQTT伺服器');
  client.subscribe("web_info");
  //client.publish("web_info");
  
});


client.on('message', function (_, msg) { 
  console.log( getDatetime() +"mqtt"+ " >> "+ msg.toString());
  // store msg to redis database
  io.sockets.emit('mqtt', msg.toString()); // to all socket clients 
  console.log(msg.toString);
});

io.on('user',function(data){
  console.log('user:'+data.text);
});
app.get('/', (req, res) => {
  res.sendFile(__dirname + '/index.html');
  console.log('client已連接');
});

// Parse URL-encoded bodies (as sent by HTML forms)
app.use(express.urlencoded({
  extended: true
}));

// Parse JSON bodies (as sent by API clients)
app.use(express.json());

// Access the parse results as request.body
app.post('/', function(request, response){


     username =request.body.username;
     useremail =request.body.useremail;
     str ={'name':username,'email':useremail}
    var strToObj=JSON.stringify({'name':username,'email':useremail});
    console.log("web_info >>"+strToObj);
    client.publish('web_info',"'"+strToObj+"'");
});

  


      
    
//var testInput = document.getElementById("testInput");
//var submitBtn = document.querySelector(".submitBtn");
//function FsubmitBtn(value) {
//  var str = "";
//  var submitValue = testInput.value;
//  str = submitValue;
//  alert(str);
//  console.log(str);
//}
//submitBtn.addEventListener("click", FsubmitBtn);


//app.post('/test3', function(req, res) {
//  console.log('app success')
  
//  console.log(req.params.name);
//});

//io.on('connection', (socket) => {
// console.log('front-end connected');
//  socket.emit('mqtt',  msg.toString() );
  
//});
//io.on('web_data', function(data) {
//    console.log("web_msg")
//    process.stdout.write(data.letter);
//  });

server.listen(3000, () => {
  console.log('listening on *:3000');
});
