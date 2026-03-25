//create a simple express server that listens on port 3000 and responds with "Hello World!" when the root URL is accessed.
const express = require('express');
const app = express();

const dotenv = require('dotenv'); // Load environment variables from .env file

const mongoose = require('mongoose'); // Import Mongoose for MongoDB connection

const TodoTask = require('./models/TodoTask'); // Import the TodoTask model to interact with the "TodoTask" collection in MongoDB

dotenv.config();  // Load environment variables from .env file

app.use(express.urlencoded({ extended: true })); //middleware to parse the body of POST requests

app.use("/static", express.static("public"));  //middleware to serve static files from the "public" directory when the URL starts with "/static". For example, if you have a file called "style.css" in the "public" directory, you can access it at "http://localhost:3000/static/style.css".

// Connect to MongoDB using Mongoose
mongoose.connect(process.env.DB_CONNECT).then(() => {
    console.log("Connected to MongoDB!");  //log a message to the console when the connection to MongoDB is successful
    app.listen(3000, () => {
        console.log('App listening on port 3000!');   //log a message to the console when the server starts listening on port 3000
    });
}).catch((error) => {
    console.error("Error connecting to MongoDB:", error);
});  

app.set("view engine", "ejs"); //set the view engine to ejs, which allows us to render ejs templates in our routes

app.get('/', async (req, res) => {
    try {
        const tasks = await TodoTask.find({});  //fetch all to-do tasks from the database using the TodoTask model
        res.render('todo.ejs', { todoTasks: tasks });  //render the "todo.ejs" template and pass the fetched tasks as a variable called "todoTasks"
    } catch (error) {
        console.error("Error fetching todo tasks:", error);
        res.status(500).send("Error fetching todo tasks");
    }
});

app.post('/', async (req, res) => {
    const todoTask = new TodoTask({
        content: req.body.content  //create a new instance of the TodoTask model with the content from the request body
    });
    try {
        await todoTask.save();  //save the new to-do task to the database
        res.redirect('/');  //redirect the user back to the root URL after saving the task
    }catch (err) {
        res.status(500).send(err);  //send an error response if there is an issue saving the task to the database
    }
});

/*app.listen(3000, () => {
    console.log('Example app listening on port 3000!');   //log a message to the console when the server starts listening on port 3000
});*/

app.route('/remove/:id').get(async( req, res) => {
    try {
        const id = req.params.id;  //get the id of the to-do task to be removed from the URL parameters
        const deletedTask = await TodoTask.findByIdAndDelete(id);  //remove the to-do task with the specified id from the database using the TodoTask model
        if (!deletedTask) {
            return res.status(404).send("Task not found");
        }
        res.redirect('/');  //redirect the user back to the root URL after removing the task
    } catch (error) {
        console.error("Error removing todo task:", error);  //log an error message to the console if there is an issue removing the task from the database
        res.status(500).send("Error removing todo task");  //send an error response if there is an issue removing the task from the database
    }
});

