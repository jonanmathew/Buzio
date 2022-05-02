const express = require("express");
const bodyParser = require("body-parser");
const mysql = require('mysql2');
var qs = require('query-string');

const app = express();

let validCredentials = true;
let userIds = [];
let busIdTemp, personsTemp, priceTemp, passwordTemp;

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
    let date = getCurrentDate();
    res.render("index",{date: date});
});

app.get("/main.html", function(req,res){
    let from = req.query.from;
    let to = req.query.to;
    let persons = req.query.persons;
    let date = req.query.date;
    let values = [from, to, Number(persons), date];
    let sql = "SELECT * FROM BusDetails WHERE StartLocation = ? AND EndLocation = ? AND SeatsAvailable >= ? AND StartDate = ?";
    con.query(sql, values, function(err, result) {
        if (err) throw err;
        res.render("main",{from: from, to: to, persons: persons, date: date, result: result});
    });
});

app.get("/auth.html", function(req,res){
    res.render("auth",{validCredentials: validCredentials});
});

app.get("/admin.html", function(req,res){
    let busId = req.query.busId;
    let from = req.query.from;
    let to = req.query.to;
    let persons = req.query.persons;
    let date = req.query.date;
    if (date == null){
        date = getCurrentDate();
    }
    let time = getCurrentTime();
    console.log(time);
    let stops = "";
    let values = [from, to, Number(persons), date];
    let sql;
    if(busId != null){
        sql = "SELECT * FROM BusDetails WHERE BusId = ?"
        con.query(sql, busId, function(err, result) {
            if (err) throw err;
            let startDate = dateFormat(result[0].StartDate);
            let endDate = dateFormat(result[0].EndDate);
            result[0].StartDate = startDate;
            result[0].EndDate = endDate;
            let stopSql = "SELECT BusStop FROM StopDetails WHERE BusId = ?";
            con.query(stopSql, busId, function(stopErr,stopResult){
                if (stopErr) throw stopErr;
                for (let i=0;i<stopResult.length;i++){
                    stops += stopResult[i].BusStop;
                    if(i+1 != stopResult.length){
                        stops += ", ";
                    }
                }
                res.render("admin",{from: from, to: to, persons: persons, date: date, time: time, result: result[0], stops: stops});
            });
        });
    }
    else if(from == null){
        sql = "SELECT * FROM BusDetails";
        con.query(sql, values, function(err, result) {
            if (err) throw err;
            res.render("admin",{from: from, to: to, persons: persons, date: date, time: time, result: result, stops: stops});
        });
    } else{
        sql = "SELECT * FROM BusDetails WHERE StartLocation = ? AND EndLocation = ? AND Seats >= ? AND StartDate = ?";
        con.query(sql, values, function(err, result) {
            if (err) throw err;
            res.render("admin",{from: from, to: to, persons: persons, date: date, time: time, result: result, stops: stops});
        });
    }

});

app.get("/booking.html", function(req,res){
    let userSql = "SELECT UserId FROM UserDetails";
    con.query(userSql, function(userErr, userResult) {
        if (userErr) throw userErr;
        for (let i = 0; i < userResult.length; i++) {
            userIds.push(userResult[i].UserId);
            console.log(userIds);
        }
        let busId = req.query.busId;
        let persons = req.query.persons;
        busIdTemp = busId;
        personsTemp = persons;
        priceTemp = req.query.price;
        let userId = "JVA" + String(Number(userIds.at(-1).substring(3)) + 10);
        userIds.push(userId);
        let password = generatePassword();
        passwordTemp = password;
        let busSql = "SELECT * FROM BusDetails WHERE BusId = ?";
        con.query(busSql, busId, function(busErr, busResult) {
            if (busErr) throw busErr;
            let stopSql = "SELECT BusStop FROM StopDetails WHERE BusId = ?";
            con.query(stopSql, busId, function(stopErr,stopResult){
                if (stopErr) throw stopErr;
                res.render("booking",{result: busResult[0], persons: persons, userId: userId, password: password, stopResult: stopResult});
            });
        });
    });
});

app.get("/user.html", function(req,res){
    let userId = req.query.userId;
    console.log(userId);
    let userSql = "SELECT * FROM UserDetails WHERE UserId = ?";
    con.query(userSql, userId, function(userErr,userResult){
        if (userErr) throw userErr;
        let busId = userResult[0].BusId;
        let busSql = "SELECT * FROM BusDetails WHERE BusId = ?";
        con.query(busSql, busId, function(busErr,busResult){
            if (busErr) throw busErr;
            let stopSql = "SELECT BusStop FROM StopDetails WHERE BusId = ?";
            con.query(stopSql, busId, function(stopErr,stopResult){
                if (stopErr) throw stopErr;
                let personSql = "SELECT * FROM PersonDetails WHERE UserId = ?";
                con.query(personSql, userId, function(personErr, personResult){
                    if (personErr) throw personErr;
                    res.render("user",{busResult: busResult[0],stopResult: stopResult, userResult: userResult[0], personResult: personResult});
                    console.log(busResult,userResult,personResult);
                });
            });
        });
    });
});

app.post("/auth.html", function(req,res){
    let user,pass;
    let userValue = req.body.username;
    let passValue = req.body.password; 
    let sql = "SELECT * FROM AuthDetails";
    con.query(sql, function(err, result){
        if (err) throw err;
        for(let i=0;i<result.length;i++){
            if(result[i].UserId === userValue){
                user = result[i].UserId;
                pass = result[i].Password;
            }
        }      
        if(userValue === user && passValue === pass){
            validCredentials = true;
            if(userValue === "user"){
                res.redirect("/admin.html");
            } else{
                let string = encodeURIComponent(userValue);
                res.redirect('/user.html?userId=' + string);
            }
        } else{
            validCredentials = false;
            res.redirect("/auth.html");
        }
    });  
});

app.post("/admin.html", function(req,res){
    let isDelete = req.body.isDelete;
    let busId = req.body.busId;
    let busName = req.body.busName;
    let driverName = req.body.driverName;
    let startLocation = req.body.startLocation;
    let endLocation = req.body.endLocation;
    let startTime = req.body.startTime;
    let endTime = req.body.endTime;
    let startDate = req.body.startDate;
    let endDate = req.body.endDate;
    let seats = Number(req.body.seats);
    let seatsAvailable = seats;
    let busType = req.body.busType;
    let sleeperType = req.body.sleeperType;
    let foodAvailable = req.body.foodAvailable;
    let price = Number(req.body.price);
    let rating = Number(req.body.rating);
    let values;
    let sql = "SELECT BusId FROM BusDetails WHERE BusId = ?";
    con.query(sql, busId, function(err, result){
        if (err) throw err;
        if (isDelete == "true"){
            let delStopSql = "DELETE FROM StopDetails WHERE BusId = ?";
            con.query(delStopSql, busId, function(delStopErr,selStopResult){
                if (delStopErr) throw delStopErr;
                let delBusSql = "DELETE FROM BusDetails WHERE BusId = ?";
                con.query(delBusSql, busId, function(delBusErr, delBusResult){
                    if (delBusErr) throw delBusErr;
                    console.log(delBusResult);
                });
            });
        } else if (result.length == 0){
            let stops = req.body.stops.split(", ");
            let travelTime = travelTimeDifference(startTime,endTime);
            let busSql = "INSERT INTO BusDetails VALUES (?)";
            values = [busId, busName, driverName, startLocation, endLocation, startTime, endTime, travelTime, startDate, endDate, seats, seatsAvailable, busType, sleeperType, foodAvailable, price, rating];
            con.query(busSql, [values], function(busErr, busResult){
                if (busErr) throw busErr;
                stopSql = "INSERT INTO StopDetails VALUES (?)";
                for(let i=0;i<stops.length;i++){
                    values = [busId,stops[i]];
                    con.query(stopSql, [values], function(stopErr,stopResult){
                        if (stopErr) throw stopErr;
                    });
                }
            });

        } else{
            let stops = req.body.stops.split(", ");
            let travelTime = travelTimeDifference(startTime,endTime);
            let busSql = "UPDATE BusDetails Set BusName = ?, DriverName = ?, StartTime = ?, EndTime = ?, TravelTime = ?, StartDate = ?, EndDate = ?, Seats = ?, SeatsAvailable = ?, BusType = ?, SleeperType = ?, FoodAvailable = ?, Price = ?, Rating = ? WHERE BusId = ?";
            values = [busName, driverName, startTime, endTime, travelTime, startDate, endDate, seats, seatsAvailable, busType, sleeperType, foodAvailable, price, rating, busId];
            con.query(busSql, values, function(busErr, busResult){
                if (busErr) throw busErr;
            });
            stopSql = "DELETE FROM StopDetails WHERE BusId = ?";
            con.query(stopSql, busId, function(stopErr,stopResult){
                if (stopErr) throw stopErr;
                stopSql = "INSERT INTO StopDetails VALUES (?)";
                for(let i=0;i<stops.length;i++){
                    values = [busId,stops[i]];
                    con.query(stopSql, [values], function(stopErr,stopResult){
                        if (stopErr) throw stopErr;
                    });
                }
            });
        }
    });
    res.redirect("/admin.html");
});

app.post("/booking.html", function(req,res){
    let userId = userIds.at(-1); 
    let password = passwordTemp;
    let busId = busIdTemp;
    let persons = personsTemp;
    let phoneNo = req.body.phoneNo;
    let email = req.body.email;
    let rating = req.body.rating;
    let cost = Number(persons) * Number(priceTemp); 
    let userSql = "INSERT INTO UserDetails VALUES (?)";
    let userValues = [userId, busId, phoneNo, email, persons, cost, rating];
    con.query(userSql, [userValues], function(err, result){
        if (err) throw err;
        console.log(result);
    });
    for (let i = 0; i < persons; i++) {
        let name = eval("req.body.name"+i);
        let age = eval("req.body.age"+i);
        let gender = eval("req.body.gender"+i);
        let seatPreference = eval("req.body.seatPreference"+i);
        let personSql = "INSERT INTO PersonDetails VALUES (?)";
        let personValues = [userId, name, age, gender, seatPreference];
        con.query(personSql, [personValues], function(err, result){
            if (err) throw err;
            console.log(result);
        });
    }
    let busSql = "SELECT SeatsAvailable FROM BusDetails WHERE BusId = ?";
    con.query(busSql, busId, function(err, result){
        if (err) throw err;
        let seatsAvailable = Number(result[0].SeatsAvailable) - persons;
        busSql = "UPDATE BusDetails SET SeatsAvailable = ? WHERE BusId = ?";
        let busValues = [seatsAvailable, busId];
        con.query(busSql, busValues, function(err, result){
            if (err) throw err;
            console.log(result);
        });
    });
    let authSql = "INSERT INTO AuthDetails VALUES (?)";
    let authValues = [userId, password];
    con.query(authSql, [authValues], function(err, result){
        if (err) throw err;
        console.log(result);
    });
    res.redirect("/"); 
});

function travelTimeDifference(start, end) {
    start = start.split(":");
    end = end.split(":");
    let startDate = new Date(0, 0, 0, start[0], start[1], 0);
    let endDate = new Date(0, 0, 0, end[0], end[1], 0);
    let diff = endDate.getTime() - startDate.getTime();
    let hours = Math.floor(diff / 1000 / 60 / 60);
    diff -= hours * 1000 * 60 * 60;
    let minutes = Math.floor(diff / 1000 / 60);

    if (hours < 0)
       hours = hours + 24;

    return (hours <= 9 ? "0" : "") + hours + ":" + (minutes <= 9 ? "0" : "") + minutes;
}

function generatePassword() {
    let length = 10,
        charset = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789",
        password = "";
    for (let i = 0, n = charset.length; i < length; ++i) {
        password += charset.charAt(Math.random() * n);
    }
    return password;
}

function dateFormat(dateISO){
    date = new Date(dateISO);
    year = date.getFullYear();
    month = date.getMonth()+1;
    dt = date.getDate();
    if (dt < 10) {
    dt = '0' + dt;
    }
    if (month < 10) {
    month = '0' + month;
    }
    
    return year+'-' + month + '-'+dt;
}

function getCurrentDate(){
    let date = new Date();
    return dateFormat(date.toISOString());
}

function getCurrentTime(){
    let time = new Date();
    if (time.getMinutes() < 10){
        return time.getHours() + ":0" + time.getMinutes();
    } else if (time.getHours() < 10){
        return "0" + time.getHours() + ":" + time.getMinutes();
    } else{
        return time.getHours() + ":" + time.getMinutes();
    }
    
}

app.listen(3000);

