const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    const mongoURI = process.env.MONGODB_URI;
    if (!mongoURI || mongoURI.trim() === '') {
      console.warn('⚠️ [MongoDB Warning] MONGODB_URI is not defined in environment variables.');
      console.warn('⚠️ Server will run in offline simulation mode for initial Stage-1 layout verification.');
      return null;
    }

    const conn = await mongoose.connect(mongoURI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });

    console.log(`🌱 MongoDB Atlas Connected: ${conn.connection.host}`);
    return conn;
  } catch (error) {
    console.error(`❌ MongoDB Connection Error: ${error.message}`);
    console.warn('⚠️ Proceeding in local verification mode without database connection.');
    // Do not process.exit(1) during initial local development testing so server stays accessible
    return null;
  }
};

module.exports = connectDB;
