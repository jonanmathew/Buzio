const express = require("express");
const bodyParser = require("body-parser");
const mysql = require('mysql2');
const liveServer = require("live-server");

const app = express();

app.use(bodyParser.urlencoded({extended:true}));
app.use(express.static("public"));

const params = {
    port: 3000
};

// app.get("/",function(req,res){
//     res.sendFile(__dirname + "/index.html");
// });

const con = mysql.createConnection({
    host: "localhost",
    user: "root",
    password: "root",
    database : "buzio"
});
  
con.connect(function(err){
    if (err) throw err;
    console.log("Connected!");
});

app.post("/", function(req,res){
    var busNo = Number(req.body.busNo);
    var driverName = req.body.driverName;
    var startLocation = req.body.startLocation;
    var endLocation = req.body.endLocation;
    var startTime = req.body.startTime;
    var endTime = req.body.endTime;
    var travelTime = startTime;
    var startDate = req.body.startDate;
    var endDate = req.body.endDate;
    var seats = Number(req.body.seats);
    var busType = req.body.busType;
    var sleeperType = req.body.sleeperType;
    var foodAvailable = req.body.foodAvailable;
    var insert = "INSERT INTO BusDetails VALUES (?)";
    var values = [busNo, driverName, startLocation, endLocation, startTime, endTime, travelTime, startDate, endDate, seats,busType, sleeperType, foodAvailable];
    console.log(values);
    console.log(startDate, endDate);
    con.query(insert, [values], function(err, result){
        if (err) throw err;
        console.log(result);
    });
    con.end();
});
liveServer.start(params);
// app.listen(3000);

