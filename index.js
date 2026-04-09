//create a simple to-do list application using Node.js, Express, and MongoDB. The application allows users to create, read, update, and delete to-do tasks. The tasks are stored in a MongoDB database, and the application uses EJS as the templating engine to render the views.
const express = require('express');  //Import the Express framework to create the server and handle routing

const app = express();  //Create an instance of the Express application to set up the server and define routes

const dotenv = require('dotenv'); // Load environment variables from .env file

const mongoose = require('mongoose'); // Import Mongoose for MongoDB connection

const TodoTask = require('./models/TodoTask'); // Import the TodoTask model to interact with the "TodoTask" collection in MongoDB

dotenv.config();  // Load environment variables from .env file

app.use(express.urlencoded({ extended: true })); //middleware to parse the body of POST requests

app.use("/static", express.static("public"));  //middleware to serve static files from the "public" directory when the URL starts with "/static". For example, if you have a file called "style.css" in the "public" directory, you can access it at "http://localhost:3000/static/style.css".

// Connect to MongoDB using Mongoose
mongoose.connect(process.env.DB_CONNECT).then(() => {  //connect to the MongoDB database using the connection string stored in the environment variable "DB_CONNECT".
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
        const sort = req.query.sort === 'oldest' ? { date: 1 } : { date: -1 };  //get the sort query parameter from the URL to determine the sorting order of the tasks 1 means ascending order (oldest first) and -1 means descending order (newest first)
        let filter = {};  //initialize an empty filter object to store the filtering criteria for fetching tasks from the database
        if(req.query.filter === 'Active') {
            filter.completed = false;  //if the filter query parameter is set to "Active", add a condition to the filter object to only fetch tasks that are not completed
        }if(req.query.filter === 'Completed') {
            filter.completed = true;  //if the filter query parameter is set to "Completed", add a condition to the filter object to only fetch tasks that are completed
        }
        const tasks = await TodoTask.find(filter).sort(sort);  //fetch all to-do tasks from the database using the TodoTask model
        const remaining = await TodoTask.countDocuments({ completed: false });  //calculate the number of remaining tasks by counting documents where completed is false
        res.render('todo', { todoTasks: tasks, remaining: remaining , sortOrder: sort, activeFilter: req.query.filter || 'All' });  //render the "todo.ejs" template and pass the fetched tasks and the count of remaining tasks as variables
    } catch (error) {
        console.error("Error fetching todo tasks:", error);
        res.status(500).send("Error fetching todo tasks");
    }
});

app.post('/', async (req, res) => {
    const todoTask = new TodoTask({
        content: req.body.content,  //create a new instance of the TodoTask model with the content from the request body
        category: req.body.category,  //set the category of the task from the request body
        dueDate: req.body.dueDate  //set the due date of the task from the request body
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

app.route('/edit/:id').get(async (req, res) => {
    try {
        const id = req.params.id;  //get the id of the to-do task to be edited from the URL parameters
        const tasks = await TodoTask.find({});  //fetch all tasks from the database to show alongside the one being edited
        res.render('todoEdit.ejs', { taskedit: tasks, idTask: id });  //render the template with all tasks and the id of the task being edited
    } catch (error) {
        console.error("Error fetching todo task for editing:", error);  //log an error message to the console if there is an issue fetching the task from the database
        res.status(500).send("Error fetching todo task for editing");  //send an error response if there is an issue fetching the task from the database
    }
}).post(async (req, res) => {
    try {
        const id = req.params.id;  //get the id of the to-do task to be edited from the URL parameters
        const updatedTask = await TodoTask.findByIdAndUpdate(id, { content: req.body.content, category: req.body.category, dueDate: req.body.dueDate });  //update the content, category, and due date of the to-do task with the specified id in the database using the TodoTask model
        if (!updatedTask) {
            return res.status(404).send("Task not found");
        }
        res.redirect('/');  //redirect the user back to the root URL after updating the task
    } catch (error) {
        console.error("Error updating todo task:", error);  //log an error message to the console if there is an issue updating the task in the database
        res.status(500).send("Error updating todo task");  //send an error response if there is an issue updating the task in the database
    }
});

app.route('/complete/:id').post(async (req, res) => {
    try {
        const id = req.params.id;  //get the id of the to-do task to be marked as completed from the URL parameters
        const task = await TodoTask.findById(id);  //find the to-do task with the specified id in the database using the TodoTask model
        if (!task) {
            return res.status(404).send("Task not found");
        }
        task.completed = !task.completed;  //toggle the completed status of the task
        await task.save();  //save the updated task back to the database
        res.redirect('/');  //redirect the user back to the root URL after updating the task
    } catch (error) {
        console.error("Error toggling completion status of todo task:", error);  //log an error message to the console if there is an issue updating the task in the database
        res.status(500).send("Error toggling completion status of todo task");  //send an error response if there is an issue updating the task in the database
    }
});