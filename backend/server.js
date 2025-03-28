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
    const result = await pool.query(`
      SELECT 
        room.*, 
        hotel."hotelid", 
        hotel."chainName" AS chainname, 
        hotel."hotel_city" AS hotel_city, 
        hotel."hotel_country" AS hotel_country, 
        hotel."hotel_streetname" AS hotel_streetname, 
        hotel."hotel_streetnumber" AS hotel_streetnumber, 
        hotel."category" AS category
      FROM room
      JOIN hotel ON room.hotelid = hotel.hotelid;
    `);
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching room data:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});
// API Route to fetch all hotels
app.get('/hotel', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT 
        hotelid, 
        "chainName" AS chainname, 
        "hotel_city" AS hotel_city, 
        "hotel_country" AS hotel_country, 
        "hotel_streetname" AS hotel_streetname, 
        "hotel_streetnumber" AS hotel_streetnumber, 
        "category" AS category
      FROM hotel;
    `);
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching hotels:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});
app.get('/booking', async (req, res) => {
  try {
    const result = await pool.query(`SELECT * FROM booking`);
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching bookings:', error);
    res.status(500).json({ error: 'Could not fetch bookings.' });
  }
});




// route to fetch aggregated capacity per hotel
app.get('/hotel-capacity', async (req, res) => {
  try {
      const result = await pool.query('SELECT * FROM aggregated_capacity_per_hotel;');
      res.json(result.rows);
  } catch (err) {
      console.error(err);
      res.status(500).send("Server error");
  }
});

// route to fetch available rooms per area, filtered by city
app.get('/available-rooms', async (req, res) => {
  try {
      const { city } = req.query; 

      let query = 'SELECT * FROM available_rooms_per_area';
      let values = [];

      if (city) {
          query += ' WHERE hotel_city = $1';
          values.push(city);
      }

      const result = await pool.query(query, values);
      res.json(result.rows);
  } catch (err) {
      console.error('Error fetching rooms:', err);
      res.status(500).send("Server error");
  }
});

// Fetch Customers
app.get("/customers", async (req, res) => {
  try {
    const search = req.query.search?.trim(); // Trim any whitespace
    let sql = "SELECT * FROM customer";
    let values = [];
    
    if (search) {
      // Use parameterized query with multiple conditions
      sql += ` WHERE 
        "customer_firstName" ILIKE $1 OR 
        "customer_lastName" ILIKE $1 OR 
        "customerID"::TEXT ILIKE $1`;
      values.push(`%${search}%`);
    }
    
    const result = await pool.query(sql, values);
    res.json(result.rows);
  } catch (err) {
    console.error("Error retrieving customers:", err);
    res.status(500).json({ 
      message: "Error retrieving customers", 
      error: err.message 
    });
  }
});

// 🆕 Add a Customer
app.post("/customers", async (req, res) => {
  try {
    const {
      customer_firstName,
      customer_middlename,
      customer_lastname,
      customer_streetnumber,
      customer_streetname,
      customer_city,
      customer_zipcode,
      customer_country
    } = req.body;

    const sql = `
      INSERT INTO customer
      ("customer_firstName", "customer_middleName", "customer_lastName",
      "customer_streetNumber", "customer_streetName", "customer_city",
      "customer_zipcode", "customer_country")
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      RETURNING "customerID"
    `;

    const values = [
      customer_firstName,
      customer_middlename,
      customer_lastname,
      customer_streetnumber,
      customer_streetname,
      customer_city,
      customer_zipcode,
      customer_country
    ];

    const result = await pool.query(sql, values);
    res.status(201).json({ customerID: result.rows[0].customerID });
  } catch (err) {
    console.error("Detailed Error adding customer:", err);
    res.status(500).json({ 
      message: "Error adding customer", 
      error: err.message 
    });
  }
});

// 🔄 Update a Customer
app.put("/customers/:id", async (req, res) => {
  try {
    const customerID = req.params.id;
    const {
      customer_firstName,
      customer_middlename,
      customer_lastname,
      customer_streetnumber,
      customer_streetname,
      customer_city,
      customer_zipcode,
      customer_country
    } = req.body;

    const sql = `
      UPDATE customer
      SET "customer_firstName" = $1,
          "customer_middleName" = $2,
          "customer_lastName" = $3,
          "customer_streetNumber" = $4,
          "customer_streetName" = $5,
          "customer_city" = $6,
          "customer_zipcode" = $7,
          "customer_country" = $8
      WHERE "customerID" = $9
    `;

    const values = [
      customer_firstName,
      customer_middlename,
      customer_lastname,
      customer_streetnumber,
      customer_streetname,
      customer_city,
      customer_zipcode,
      customer_country,
      customerID
    ];

    const result = await pool.query(sql, values);
    
    // Check if any rows were actually updated
    if (result.rowCount === 0) {
      return res.status(404).json({ message: "Customer not found" });
    }

    res.status(200).json({ message: "Customer updated successfully" });
  } catch (err) {
    console.error("Detailed Error updating customer:", err);
    res.status(500).json({ 
      message: "Error updating customer", 
      error: err.message 
    });
  }
});

// ❌ Delete a Customer
app.delete("/customers/:id", async (req, res) => {
  try {
    const customerID = req.params.id;
    const sql = 'DELETE FROM customer WHERE "customerID" = $1 RETURNING *';
    const result = await pool.query(sql, [customerID]);

    if (result.rowCount === 0) {
      return res.status(404).json({ message: "Customer not found" });
    }

    res.status(200).json({ 
      message: "Customer deleted successfully", 
      deletedCustomer: result.rows[0] 
    });
  } catch (err) {
    console.error("Detailed Error deleting customer:", err);
    res.status(500).json({ 
      message: "Error deleting customer", 
      error: err.message 
    });
  }
});

// 🔎 Fetch All Employees
app.get("/employees", async (req, res) => {
  try {
    const search = req.query.search;
    let sql = "SELECT * FROM employee";
    let values = [];
    if (search) {
      sql += ` WHERE employee_firstname ILIKE $1 OR employee_lastname ILIKE $1 OR employeeid::TEXT ILIKE $1`;
      values.push(`%${search}%`);
    }
    const result = await pool.query(sql, values);
    res.json(result.rows);
  } catch (err) {
    console.error("Error retrieving employees:", err);
    res.status(500).json({ message: "Error retrieving employees" });
  }
});

// Add Employee
app.post("/employees", async (req, res) => {
  const { 
    ssn_sin, 
    employee_firstname, 
    employee_middlename, 
    employee_lastname, 
    employee_streetnumber, 
    employee_streetname, 
    employee_city, 
    employee_zipcode, 
    employee_country, 
    role 
  } = req.body;
  
  try {
    const result = await pool.query(
      "INSERT INTO employee (ssn_sin, employee_firstname, employee_middlename, employee_lastname, employee_streetnumber, employee_streetname, employee_city, employee_zipcode, employee_country) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING employeeid",
      [ssn_sin, employee_firstname, employee_middlename, employee_lastname, employee_streetnumber, employee_streetname, employee_city, employee_zipcode, employee_country]
    );    
    
    const employeeId = result.rows[0].employeeid;
    
    if (role) {
      await pool.query(
        "INSERT INTO employee_role (employeeid, role) VALUES ($1, $2)",
        [employeeId, role]
      );
    }
    
    res.status(201).json({ message: "Employee added successfully", employeeId });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get Employee by ID or Name
app.get("/employees/search", async (req, res) => {
  const { employeeid, employee_firstname, employee_lastname } = req.query;
  try {
    let query = "SELECT e.*, er.role FROM employee e LEFT JOIN employee_role er ON e.employeeid = er.employeeid WHERE 1=1";
    const values = [];
    let paramCount = 1;

    if (employeeid) {
      query += ` AND e.employeeid = $${paramCount}`;
      values.push(employeeid);
      paramCount++;
    } 
    
    if (employee_firstname) {
      query += ` AND e.employee_firstname = $${paramCount}`;
      values.push(employee_firstname);
      paramCount++;
    }
    
    if (employee_lastname) {
      query += ` AND e.employee_lastname = $${paramCount}`;
      values.push(employee_lastname);
    }

    const result = await pool.query(query, values);
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Update Employee
app.put("/employees/:id", async (req, res) => {
  const { id } = req.params;
  const { 
    ssn_sin,
    employee_firstname, 
    employee_middlename, 
    employee_lastname, 
    employee_streetnumber, 
    employee_streetname, 
    employee_city, 
    employee_zipcode, 
    employee_country, 
    role 
  } = req.body;
  
  try {
    await pool.query(
      "UPDATE employee SET ssn_sin=$1, employee_firstname=$2, employee_middlename=$3, employee_lastname=$4, employee_streetnumber=$5, employee_streetname=$6, employee_city=$7, employee_zipcode=$8, employee_country=$9 WHERE employeeid=$10",
      [ssn_sin, employee_firstname, employee_middlename, employee_lastname, employee_streetnumber, employee_streetname, employee_city, employee_zipcode, employee_country, id]
    );

    if (role) {
      // Check if an employee_role already exists
      const existingRole = await pool.query(
        "SELECT * FROM employee_role WHERE employeeid=$1",
        [id]
      );

      if (existingRole.rows.length > 0) {
        // Update existing role
        await pool.query(
          "UPDATE employee_role SET role=$1 WHERE employeeid=$2",
          [role, id]
        );
      } else {
        // Insert new role
        await pool.query(
          "INSERT INTO employee_role (employeeid, role) VALUES ($1, $2)",
          [id, role]
        );
      }
    }

    res.json({ message: "Employee updated successfully" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Delete Employee
app.delete("/employees/:id", async (req, res) => {
  const { id } = req.params;
  try {
    // First, delete the role association
    await pool.query("DELETE FROM employee_role WHERE employeeid=$1", [id]);
    
    // Then, delete the employee
    await pool.query("DELETE FROM employee WHERE employeeid=$1", [id]);
    
    res.json({ message: "Employee deleted successfully" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});


// Start the server
const PORT = process.env.PORT || 5001;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));

