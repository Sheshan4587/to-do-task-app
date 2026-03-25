const mongoose = require('mongoose'); // Import Mongoose to define the schema and model for the to-do tasks

// Define the schema for a to-do task, which includes a "task" field of type String
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