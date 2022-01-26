const express = require("express");
const bodyParser = require("body-parser");
const mysql = require('mysql2');

const app = express();

app.use(bodyParser.urlencoded({extended:true}));
app.use(express.static("public"));

app.get("/",function(req,res){
    res.sendFile(__dirname + "/admin.html");
});

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

var insert = "INSERT INTO BusDetails VALUES ?";
var values = [1,'John', 'Trivandrum', 'Kollam', '11:00', '12:00', '01:00', '25/01/2022', '25/01/2022', 5, 'AC', 'Sleeper', 'Yes'];
    
con.query(insert, values, function(err, result){
    if (err) throw err;
    console.log(result);
});



// app.post("/", function(req,res){
//     var busNo = Number(req.body.busNo);
//     var driverName = req.body.driverName;
//     var startLocation = req.body.startLocation;
//     var endLocation = req.body.endLocation;
//     var startTime = req.body.startTime;
//     var endTime = req.body.endTime;
//     var travelTime = startTime;
//     var startDate = req.body.startDate;
//     var endDate = req.body.endDate;
//     var seats = Number(req.body.seats);
//     var busType = req.body.busType;
//     var sleeperType = req.body.sleeperType;
//     var foodAvailable = req.body.foodAvailable;
//     var insert = "INSERT INTO BusDetails VALUES ?";
//     var values = [busNo, driverName, startLocation, endLocation, startTime, endTime, travelTime, startDate, endDate, seats,busType, sleeperType, foodAvailable];
//     // console.log(values);
//     con.query(insert, values, function(err, result){
//         if (err) throw err;
//         console.log(result);
//     });
// });

app.listen(3000);

con.end();