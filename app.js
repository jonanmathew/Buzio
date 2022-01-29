const express = require("express");
const bodyParser = require("body-parser");
const mysql = require('mysql2');

const app = express();

app.set("view engine","ejs");
app.use(bodyParser.urlencoded({extended:true}));
app.use(express.static("public"));

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

app.get("/",function(req,res){
    res.render("index",{});
});

app.get("/auth.html",function(req,res){
    res.render("auth",{});
});

app.get("/admin.html",function(req,res){
    res.render("admin",{});
});

app.get("/user.html",function(req,res){
    let from = req.query.from;
    let to = req.query.to;
    let persons = req.query.persons;
    let date = req.query.date;
    let values = [from, to, Number(persons), date];
    console.log(values);
    let sql = "SELECT * FROM BusDetails WHERE StartLocation = ? AND EndLocation = ? AND Seats >= ? AND StartDate = ?";
    con.query(sql, values, function(err, result) {
        if (err) throw err;
        res.render("user",{from: from, to: to, persons: persons, date: date, result: result});
    });
});

app.post("/user.html", function(req,res){
    
});

app.post("/admin.html", function(req,res){
    let busNo = Number(req.body.busNo);
    let driverName = req.body.driverName;
    let startLocation = req.body.startLocation;
    let endLocation = req.body.endLocation;
    let startTime = req.body.startTime;
    let endTime = req.body.endTime;
    let travelTime = startTime;
    let startDate = req.body.startDate;
    let endDate = req.body.endDate;
    let seats = Number(req.body.seats);
    let busType = req.body.busType;
    let sleeperType = req.body.sleeperType;
    let foodAvailable = req.body.foodAvailable;
    let sql = "INSERT INTO BusDetails VALUES (?)";
    let values = [busNo, driverName, startLocation, endLocation, startTime, endTime, travelTime, startDate, endDate, seats,busType, sleeperType, foodAvailable];
    console.log(values);
    console.log(startDate, endDate);
    con.query(sql, [values], function(err, result){
        if (err) throw err;
        console.log(result);
    });
    res.redirect("/admin.html");
});

app.listen(3000);

