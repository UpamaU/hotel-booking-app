require("dotenv").config();
const express = require("express");
const cors = require("cors");
const { Pool } = require("pg");

const app = express();
app.use(cors());
app.use(express.json());


const pool = new Pool({
  user: 'postgres',
  host: 'databasepd2.cjgm0wycccwh.us-east-2.rds.amazonaws.com',
  database: 'databasepd2',
  password: 'Database2132',
  port: 5432,
  ssl: {
    rejectUnauthorized: false, // Allow self-signed SSL certificates
  },
});

pool.connect()
  .then(() => console.log('Connected to PostgreSQL successfully'))
  .catch(err => console.error('Database connection error:', err));
// Database connection

//  API Route to Fetch Rooms
app.get('/room', async (req, res) => {
    try {
      const result = await pool.query('SELECT * FROM room;'); // Fetch all rooms
      res.json(result.rows);
    } catch (error) {
      console.error('Error fetching rooms:', error);
      res.status(500).json({ error: 'Internal Server Error' });
    }  
});

// Start the server
const PORT = process.env.PORT || 5001;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));

