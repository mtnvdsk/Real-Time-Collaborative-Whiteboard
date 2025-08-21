const mongoose = require('mongoose');
require('dotenv').config();

const connectToDatabase = async () => {
    try {
        const mongoURI = process.env.MONGODB_URI;
        
        if (!mongoURI) {
            
            return;
        }
        
        await mongoose.connect(mongoURI);
        
    } catch (err) {
        console.error(`Error connecting to the database: ${err}`);
        
    }
};

module.exports = connectToDatabase;
