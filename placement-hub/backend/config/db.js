const mongoose = require('mongoose');

/**
 * Connect to MongoDB using the connection string from environment variables.
 * In Mongoose 8+, options like useNewUrlParser and useUnifiedTopology are default.
 */
const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGODB_URI);
    console.log(`[MongoDB] Connected successfully to host: ${conn.connection.host}`);
  } catch (error) {
    console.error(`[MongoDB] Connection error: ${error.message}`);
    // In production or when DB is mandatory, we might exit.
    // For initial startup or if local Mongo isn't running yet, we log clearly.
    throw error;
  }
};

module.exports = connectDB;
