const express = require("express");
let bodyParser = require("body-parser")

const app = express();
let router  = require('./routes/repo');

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended : true}));

app.use('/api/v1',router);

app.listen(4000,()=>{
    console.log("Server Running");
})