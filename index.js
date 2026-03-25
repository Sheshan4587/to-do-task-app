//create a simple express server that listens on port 3000 and responds with "Hello World!" when the root URL is accessed.
const express = require('express');
const app = express();

const dotenv = require('dotenv'); // Load environment variables from .env file

const mongoose = require('mongoose'); // Import Mongoose for MongoDB connection

dotenv.config();  // Load environment variables from .env file

app.use(express.urlencoded({ extended: true })); //middleware to parse the body of POST requests

app.use("/static", express.static("public"));  //middleware to serve static files from the "public" directory when the URL starts with "/static". For example, if you have a file called "style.css" in the "public" directory, you can access it at "http://localhost:3000/static/style.css".

// Connect to MongoDB using Mongoose
mongoose.connect(process.env.DB_CONNECT).then(() => {
    console.log("Connected to MongoDB!");  //log a message to the console when the connection to MongoDB is successful
    app.listen(3000, () => {
        console.log('Example app listening on port 3000!');   //log a message to the console when the server starts listening on port 3000
    });
}).catch((error) => {
    console.error("Error connecting to MongoDB:", error);
});  

app.set("view engine", "ejs"); //set the view engine to ejs, which allows us to render ejs templates in our routes

app.get('/', (req, res) => {
    res.render('todo.ejs');  //send "Hello World!" as the response when the root URL is accessed
});

app.post('/', (req, res) => {
    console.log(req.body);  //log the body of the POST request to the console
});

app.listen(3000, () => {
    console.log('Example app listening on port 3000!');   //log a message to the console when the server starts listening on port 3000
});


