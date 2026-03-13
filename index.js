//create a simple express server that listens on port 3000 and responds with "Hello World!" when the root URL is accessed.
const express = require('express');
const app = express();

app.use("/static", express.static("public"));  

app.set("view engine", "ejs"); //set the view engine to ejs, which allows us to render ejs templates in our routes

app.get('/', (req, res) => {
    res.render('todo.ejs');  //send "Hello World!" as the response when the root URL is accessed
});

app.listen(3000, () => {
    console.log('Example app listening on port 3000!');   //log a message to the console when the server starts listening on port 3000
});
