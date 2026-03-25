const mongoose = require('mongoose'); // Import Mongoose to define the schema and model for the to-do tasks

// Define the schema for a to-do task, which includes a "task" field of type String
// The "task" field is required, meaning that it cannot be empty when creating a new to-do task
// The schema also includes a "date" field of type Date, which defaults to the current date and time when a new to-do task is created
// This schema will be used to create a Mongoose model, which allows us to interact with the "TodoTask" collection in MongoDB using this model
const todoTaskSchema = new mongoose.Schema({
    content: {
        type: String,
        required: true
    },
    date: {
        type: Date,
        default: Date.now
    }
});

// Export the model based on the schema, which allows us to interact with the "TodoTask" collection in MongoDB using this model
module.exports = mongoose.model('TodoTask', todoTaskSchema);