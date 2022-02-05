const express = require("express");
const bodyParser = require("body-parser");
const mysql = require('mysql2');

const app = express();

let validCredentials = true;
let firstTime = true;
let userIds = [];

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

app.get("/auth.html", function(req,res){
    let user = "admin";
    let pass = "root";
    let username = req.query.username;
    let password = req.query.password;
    if(firstTime){
        firstTime = false;
        res.render("auth",{validCredentials: validCredentials});
    }else if(username === user && password === pass){
        validCredentials = true;
        firstTime = true;
        res.redirect("/admin.html");
    } else{
        validCredentials = false;
        firstTime = false;
        res.render("auth",{validCredentials: validCredentials});
    }
    
    
});

app.get("/admin.html", function(req,res){
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
        res.render("admin",{from: from, to: to, persons: persons, date: date, result: result});
    });
});

app.get("/user.html", function(req,res){
    let from = req.query.from;
    let to = req.query.to;
    let persons = req.query.persons;
    let date = req.query.date;
    let values = [from, to, Number(persons), date];
    let sql = "SELECT * FROM BusDetails WHERE StartLocation = ? AND EndLocation = ? AND SeatsAvailable >= ? AND StartDate = ?";
    con.query(sql, values, function(err, result) {
        if (err) throw err;
        res.render("user",{from: from, to: to, persons: persons, date: date, result: result});
    });
});

app.get("/booking.html", function(req,res){
    let busId = req.query.id;
    let persons = req.query.personsNo;
    console.log(persons);
    let value = busId;
    let userId = "JVA5963810";
    let sql = "SELECT * FROM BusDetails WHERE BusId = ?";
    con.query(sql, value, function(err, result) {
        if (err) throw err;
        console.log(result);
        res.render("booking",{result: result[0], persons: persons, userId: userId});
    });
});

app.post("/admin.html", function(req,res){
    let busId = req.body.busId;
    let busName = req.body.busName;
    let driverName = req.body.driverName;
    let startLocation = req.body.startLocation;
    let endLocation = req.body.endLocation;
    let startTime = req.body.startTime;
    let endTime = req.body.endTime;
    let travelTime = diff(startTime,endTime);
    let startDate = req.body.startDate;
    let endDate = req.body.endDate;
    let seats = Number(req.body.seats);
    let seatsAvailable = seats;
    let busType = req.body.busType;
    let sleeperType = req.body.sleeperType;
    let foodAvailable = req.body.foodAvailable;
    let price = Number(req.body.price);
    let rating = Number(req.body.rating);
    let sql = "INSERT INTO BusDetails VALUES (?)";
    let values = [busId,busName, driverName, startLocation, endLocation, startTime, endTime, travelTime, startDate, endDate, seats, seatsAvailable, busType, sleeperType, foodAvailable, price, rating];
    console.log(values);
    con.query(sql, [values], function(err, result){
        if (err) throw err;
    });
    res.redirect("/admin.html");
});

app.post("/booking.html", function(req,res){
    let userId = req.body.userId;
    let busId = req.query.id;
    let persons = req.query.personsNo;
    let phoneNo = req.body.phoneNo;
    let email = req.body.email;
    

});

function diff(start, end) {
    start = start.split(":");
    end = end.split(":");
    var startDate = new Date(0, 0, 0, start[0], start[1], 0);
    var endDate = new Date(0, 0, 0, end[0], end[1], 0);
    var diff = endDate.getTime() - startDate.getTime();
    var hours = Math.floor(diff / 1000 / 60 / 60);
    diff -= hours * 1000 * 60 * 60;
    var minutes = Math.floor(diff / 1000 / 60);

    if (hours < 0)
       hours = hours + 24;

    return (hours <= 9 ? "0" : "") + hours + ":" + (minutes <= 9 ? "0" : "") + minutes;
}

app.listen(3000);

