const mongoose = require('mongoose'); // Import Mongoose to define the schema and model for the user

const userSchema = new mongoose.Schema({
    username: {
        type: String,
        required: true,
        unique: true // Ensure that each username is unique in the database
    },
    password: {
        type: String,
        required: true
    }
});

module.exports = mongoose.model('User', userSchema); // Export the model based on the schema, which allows us to interact with the "User" collection in MongoDB using this model