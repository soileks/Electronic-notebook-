var db = require("mysql");
var connection = db.createConnection({ // определение нового подключения к субд
    host:"localhost",
    user:"root",
    password:"root123",
    database:"world"
});
connection.connect(function(err){ // само подключение 
    if(err){
        console.log(err);
        return;
    }
    console.log("connection established");
})

module.exports = connection;