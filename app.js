const express = require("express");
const mysql = require('mysql2');

const app = express();

app.use(express.static("public"));

const con = mysql.createConnection({
    host: "localhost",
    user: "root",
    password: "root"
});
  
con.connect(function(err) {
if (err) throw err;
console.log("Connected!");
});

con.end();