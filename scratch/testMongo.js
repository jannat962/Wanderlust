const mongoose = require("mongoose");
const dbUrl = "mongodb+srv://jannatulkhanam962_db_user:7gq6tTK7oi8hsvp2@wanderlust.novdlpk.mongodb.net/wanderlust?retryWrites=true&w=majority&appName=Wanderlust";

async function testConnection() {
    try {
        console.log("Testing connection...");
        await mongoose.connect(dbUrl);
        console.log("SUCCESS: Connected to MongoDB Atlas!");
        await mongoose.disconnect();
    } catch (err) {
        console.error("FAILURE: Could not connect to Atlas.");
        console.error("Error Message:", err.message);
    }
}

testConnection();
