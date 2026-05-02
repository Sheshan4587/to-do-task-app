//create a simple to-do list application using Node.js, Express, and MongoDB. The application allows users to create, read, update, and delete to-do tasks. The tasks are stored in a MongoDB database, and the application uses EJS as the templating engine to render the views.
const express = require('express');  //Import the Express framework to create the server and handle routing

const app = express();  //Create an instance of the Express application to set up the server and define routes

const dotenv = require('dotenv'); // Load environment variables from .env file

const mongoose = require('mongoose'); // Import Mongoose for MongoDB connection

const TodoTask = require('./models/TodoTask'); // Import the TodoTask model to interact with the "TodoTask" collection in MongoDB

dotenv.config();  // Load environment variables from .env file

const session = require('express-session'); // Import express-session to manage user sessions

const User = require('./models/user'); // Import the User model to interact with the "User" collection in MongoDB

const bcrypt = require('bcryptjs'); // Import bcrypt to hash user passwords for secure storage

const {MongoStore} = require('connect-mongo'); // Import connect-mongo to store session data in MongoDB

app.use(express.urlencoded({ extended: true })); //middleware to parse the body of POST requests

app.use(session({
    secret: process.env.SESSION_SECRET, // Secret key for signing the session ID cookie, stored in an environment variable for security
    resave: false, // Prevents the session from being saved back to the session store if it wasn't modified during the request
    saveUninitialized: false, // Prevents uninitialized sessions from being saved to the session store
    store: MongoStore.create({
        mongoUrl: process.env.DB_CONNECT,
        dbName:'test'
    }) // Store session data in MongoDB using connect-mongo, with the connection string stored in an environment variable
}));

function requireLogin(req, res, next) {
    if (!req.session.userId) { // Check if the user is not logged in by checking if the session does not have a userId
        return res.redirect('/login'); // If the user is not logged in, redirect them to the login page
    }
    next(); // If the user is logged in, proceed to the next middleware or route handler
}

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

app.get('/login', (req, res) => {
    res.render('login', { error: null }); // Render the login.ejs template when the user accesses the /login route
});

app.get('/signup', (req, res) => {
    res.render('signup', { error: null }); // Render the signup.ejs template when the user accesses the /signup route
});

app.post('/signup', async (req, res) => {
    try {
        const existing = await User.findOne({ username: req.body.username }); // Check if a user with the provided username already exists in the database
        if (existing) {
            return res.render('signup', { error: 'Username already exists' }); // If the username is already taken, re-render the signup page with an error message
        }
        const hashed = await bcrypt.hash(req.body.password, 10); // Hash the user's password using bcrypt with a salt rounds of 10 for secure storage
        const user = new User({ username: req.body.username, password: hashed }); // Create a new user instance with the provided username and the hashed password
        await user.save();
        req.session.userId = user._id; // Store the user's ID in the session to keep them logged in
        res.redirect('/'); // Redirect the user to the home page after successful signup
    } catch (error) {
        console.error("Error during signup:", error); // Log any errors that occur during the signup process
        res.status(500).send("Error during signup"); // Send an error response if there is an issue during signup
    }
});

app.post('/login', async (req, res) => {
    try {
        const user = await User.findOne({ username: req.body.username }); // Find a user in the database with the provided username
        if (!user) {
            return res.render('login', { error: 'Invalid username or password' }); // If no user is found, re-render the login page with an error message
        }
        const match = await bcrypt.compare(req.body.password, user.password);
        if (!match) {
            return res.render('login', { error: 'Invalid username or password' }); // If the provided password does not match the hashed password in the database, re-render the login page with an error message
        }
        req.session.userId = user._id; // Store the user's ID in the session to keep them logged in
        res.redirect('/'); // Redirect the user to the home page after successful login
    } catch (error) {
        console.error("Error during login:", error); // Log any errors that occur during the login process
        res.status(500).send("Error during login"); // Send an error response if there is an issue during login
    }
});

app.get('/logout', (req, res) => {
    req.session.destroy(); // Destroy the user's session to log them out
    res.redirect('/login'); // Redirect the user to the login page after logging out
});



app.get('/', requireLogin, async (req, res) => {
    try {
        const sort = req.query.sort === 'oldest' ? { date: 1 } : { date: -1 };  //get the sort query parameter from the URL to determine the sorting order of the tasks 1 means ascending order (oldest first) and -1 means descending order (newest first)
        let filter = {userId: req.session.userId};  //initialize an empty filter object to store the filtering criteria for fetching tasks from the database
        if(req.query.filter === 'Active') {
            filter.completed = false;  //if the filter query parameter is set to "Active", add a condition to the filter object to only fetch tasks that are not completed
        }if(req.query.filter === 'Completed') {
            filter.completed = true;  //if the filter query parameter is set to "Completed", add a condition to the filter object to only fetch tasks that are completed
        }
        const tasks = await TodoTask.find(filter).sort(sort);  //fetch all to-do tasks from the database using the TodoTask model

        const remaining = await TodoTask.countDocuments({ userId: req.session.userId, completed: false });  //calculate the number of remaining tasks by counting documents where completed is false and userId matches the current user's ID

        res.render('todo', { todoTasks: tasks, remaining: remaining , sortOrder: sort, activeFilter: req.query.filter || 'All' });  //render the "todo.ejs" template and pass the fetched tasks and the count of remaining tasks as variables
    } catch (error) {
        console.error("Error fetching todo tasks:", error);
        res.status(500).send("Error fetching todo tasks");
    }
});

app.post('/', requireLogin, async (req, res) => {
    const todoTask = new TodoTask({
        content: req.body.content,  //create a new instance of the TodoTask model with the content from the request body
        category: req.body.category,  //set the category of the task from the request body
        dueDate: req.body.dueDate,  //set the due date of the task from the request body
        userId: req.session.userId  //set the user ID of the task to the current user's ID
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