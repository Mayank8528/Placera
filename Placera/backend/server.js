require('dotenv').config();
const connectDB = require('./config/db');
const app = require('./app');

// Connect to Database
connectDB().catch((err) => {
  console.error('[DB Startup Note] MongoDB connection deferred or failed:', err.message);
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`[Placera Server] Running on http://localhost:${PORT} in ${process.env.NODE_ENV || 'development'} mode`);
});

