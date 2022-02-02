const express = require("express");
const bodyParser = require("body-parser");
const mysql = require('mysql2');

const app = express();

let validCredentials = true;
let firstTime = true;

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
    let user = "admin";
    let pass = "root";
    let username = req.query.username;
    let password = req.query.password;
    if(firstTime){
        console.log("1");
        firstTime = false;
        res.render("auth",{validCredentials: validCredentials});
    }else if(username === user && password === pass){
        console.log("2");
        validCredentials = true;
        firstTime = true;
        res.redirect("/admin.html");
    } else{
        console.log("3");
        validCredentials = false;
        firstTime = false;
        res.render("auth",{validCredentials: validCredentials});
    }
    
    
});

app.get("/admin.html",function(req,res){
    let from = req.query.from;
    let to = req.query.to;
    let persons = req.query.persons;
    let date = req.query.date;
    let values = [from, to, Number(persons), date];
    let sql;
    if(from == null){
        sql = "SELECT * FROM BusDetails";
    } else{
        sql = "SELECT * FROM BusDetails WHERE StartLocation = ? AND EndLocation = ? AND Seats >= ? AND StartDate = ?";
    }
    con.query(sql, values, function(err, result) {
        if (err) throw err;
        console.log(result);
        res.render("admin",{from: from, to: to, persons: persons, date: date, result: result});
    });
});

app.get("/user.html",function(req,res){
    let from = req.query.from;
    let to = req.query.to;
    let persons = req.query.persons;
    let date = req.query.date;
    let values = [from, to, Number(persons), date];
    let sql = "SELECT * FROM BusDetails WHERE StartLocation = ? AND EndLocation = ? AND Seats >= ? AND StartDate = ?";
    con.query(sql, values, function(err, result) {
        if (err) throw err;
        console.log(result);
        res.render("user",{from: from, to: to, persons: persons, date: date, result: result});
    });
});

app.post("/admin.html", function(req,res){
    let busNo = req.body.busNo;
    let busName = req.body.busName;
    let driverName = req.body.driverName;
    let startLocation = req.body.startLocation;
    let endLocation = req.body.endLocation;
    let startTime = req.body.startTime;
    let endTime = req.body.endTime;
    let travelTime = "10:08";
    let startDate = req.body.startDate;
    let endDate = req.body.endDate;
    let seats = Number(req.body.seats);
    let busType = req.body.busType;
    let sleeperType = req.body.sleeperType;
    let foodAvailable = req.body.foodAvailable;
    let price = Number(req.body.price);
    let rating = Number(req.body.rating);
    let sql = "INSERT INTO BusDetails VALUES (?)";
    let values = [busNo,busName, driverName, startLocation, endLocation, startTime, endTime, travelTime, startDate, endDate, seats,busType, sleeperType, foodAvailable, price, rating];
    console.log(values);
    console.log(startDate, endDate);
    con.query(sql, [values], function(err, result){
        if (err) throw err;
        console.log(result);
    });
    res.redirect("/admin.html");
});

app.listen(3000);

