const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    // ⚠️ REPLACE <db_password> with your actual MongoDB Atlas password
    const conn = await mongoose.connect(
      'mongodb+srv://gurpreetdastirmind_db_user:<db_password>@restrurent.f8jxigx.mongodb.net/civil_hospital?retryWrites=true&w=majority&appName=Restrurent'
    );
    console.log(`✅ MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    console.error(`❌ MongoDB Connection Error: ${error.message}`);
    process.exit(1);
  }
};

module.exports = connectDB;