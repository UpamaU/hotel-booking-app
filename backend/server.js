require("dotenv").config();

const express = require("express");
const cors = require("cors");
const { Pool } = require("pg");
const bodyParser = require('body-parser');

const app = express();

//middleware
app.use(cors());
app.use(express.json());
app.use(bodyParser.urlencoded({ extended: true }));



const pool = new Pool({
  user: 'postgres',
  host: 'databasepd2.cjgm0wycccwh.us-east-2.rds.amazonaws.com',
  database: 'databasepd2',
  password: 'Database2132',
  port: 5432,
  ssl: {
    rejectUnauthorized: false, // Allow SSL connections
  }, // Allow self-signed SSL certificates
});

pool.connect()
  .then(() => console.log('Connected to PostgreSQL successfully'))
  .catch(err => console.error('Database connection error:', err));
// Database connection

// Room Routes 

// Fetch all rooms with hotel information
app.get('/room', async (req, res) => {
  try {
    const search = req.query.search?.trim();
    let sql = `
      SELECT room.*, 
        hotel."hotelid", 
        hotel."chainName" AS chainname, 
        hotel."hotel_city" AS hotel_city, 
        hotel."hotel_country" AS hotel_country, 
        hotel."hotel_streetname" AS hotel_streetname, 
        hotel."hotel_streetnumber" AS hotel_streetnumber, 
        hotel."category" AS category 
      FROM room 
      JOIN hotel ON room.hotelid = hotel.hotelid
    `;
    let values = [];
    
    if (search) {
      sql += ` WHERE 
        room.roomid::TEXT ILIKE $1 OR 
        room."roomNumber"::TEXT ILIKE $1 OR 
        hotel."chainName" ILIKE $1 OR 
        hotel."hotel_city" ILIKE $1
      `;
      values.push(`%${search}%`);
    }
    
    sql += ` ORDER BY room.roomid`;
    
    const result = await pool.query(sql, values);
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching rooms:', error);
    res.status(500).json({ 
      message: 'Error fetching rooms', 
      error: error.message 
    });
  }
});

// Add a new Room
app.post('/room', async (req, res) => {
  try {
    const {
      roomnumber,
      price,
      capacity,
      viewtype,
      extendable,
      amenities,
      probstatus,
      hotelid,
      seaview,
      mountainview,
      damages,
      is_booked
    } = req.body;

    const sql = `
      INSERT INTO room
      ("roomNumber", price, capacity, "viewType", extendable, amenities, "probStatus", hotelid, seaview, mountainview, damages, is_booked)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
      RETURNING roomid
    `;

    const values = [
      roomnumber,
      price,
      capacity,
      viewtype,
      extendable,
      amenities,
      probstatus,
      hotelid,
      seaview,
      mountainview,
      damages,
      is_booked
    ];

    const result = await pool.query(sql, values);
    res.status(201).json({ roomid: result.rows[0].roomid });
  } catch (err) {
    console.error('Error adding room:', err);
    res.status(500).json({ 
      message: 'Error adding room', 
      error: err.message 
    });
  }
});

// Update an existing Room
app.put('/room/:id', async (req, res) => {
  try {
    const roomid = req.params.id;
    const {
      roomnumber,
      price,
      capacity,
      viewtype,
      extendable,
      amenities,
      probstatus,
      hotelid,
      seaview,
      mountainview,
      damages,
      is_booked
    } = req.body;

    const sql = `
      UPDATE room
      SET "roomNumber" = $1,
          price = $2,
          capacity = $3,
          "viewType" = $4,
          extendable = $5,
          amenities = $6,
          "probStatus" = $7,
          hotelid = $8,
          seaview = $9,
          mountainview = $10,
          damages = $11,
          is_booked = $12
      WHERE roomid = $13
    `;

    const values = [
      roomnumber,
      price,
      capacity,
      viewtype,
      extendable,
      amenities,
      probstatus,
      hotelid,
      seaview,
      mountainview,
      damages,
      is_booked,
      roomid
    ];

    const result = await pool.query(sql, values);
    
    if (result.rowCount === 0) {
      return res.status(404).json({ message: 'Room not found' });
    }

    res.status(200).json({ message: 'Room updated successfully' });
  } catch (err) {
    console.error('Error updating room:', err);
    res.status(500).json({ 
      message: 'Error updating room', 
      error: err.message 
    });
  }
});

// Delete a Room
app.delete('/room/:id', async (req, res) => {
  try {
    const roomid = req.params.id;
    const sql = 'DELETE FROM room WHERE roomid = $1 RETURNING *';
    const result = await pool.query(sql, [roomid]);

    if (result.rowCount === 0) {
      return res.status(404).json({ message: 'Room not found' });
    }

    res.status(200).json({ 
      message: 'Room deleted successfully', 
      deletedRoom: result.rows[0] 
    });
  } catch (err) {
    console.error('Error deleting room:', err);
    res.status(500).json({ 
      message: 'Error deleting room', 
      error: err.message 
    });
  }
});

// Hotel Routes 

// Fetch Hotels with search capability
app.get('/hotel', async (req, res) => {
  try {
    const search = req.query.search?.trim(); // Trim any whitespace
    let sql = `
      SELECT
        hotelid,
        "chainName" AS chain_name,
        numberofrooms AS number_of_rooms,
        hotel_streetnumber AS hotel_street_number,
        hotel_streetname AS hotel_street_name,
        hotel_city AS hotel_city,
        hotel_zipcode AS hotel_zipcode,
        hotel_country AS hotel_country,
        managerid AS manager_id,
        category AS category,
        hotel_phone AS hotel_phone,
        "hotel_emailAddress" AS hotel_email
      FROM hotel
    `;
    let values = [];
    
    if (search) {
      // Use parameterized query with multiple conditions
      sql += ` WHERE 
        "chainName" ILIKE $1 OR 
        "hotel_city" ILIKE $1 OR 
        "hotel_country" ILIKE $1 OR
        "hotelid"::TEXT ILIKE $1`;
      values.push(`%${search}%`);
    }
    
    sql += ` ORDER BY hotelid`;
    
    const result = await pool.query(sql, values);
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching hotels:', error);
    res.status(500).json({ 
      message: 'Error fetching hotels', 
      error: error.message 
    });
  }
});

// Add a new Hotel
app.post('/hotel', async (req, res) => {
  try {
    const {
      chain_name,
      number_of_rooms,
      hotel_street_number,
      hotel_street_name,
      hotel_city,
      hotel_zipcode,
      hotel_country,
      manager_id,
      category,
      hotel_phone,
      hotel_email
    } = req.body;

    const sql = `
      INSERT INTO hotel
      ("chainName", numberofrooms,
      hotel_streetnumber, hotel_streetname, hotel_city,
      hotel_zipcode, hotel_country, managerid,
      category, hotel_phone, "hotel_emailAddress")
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
      RETURNING hotelid
    `;

    const values = [
      chain_name,
      number_of_rooms,
      hotel_street_number,
      hotel_street_name,
      hotel_city,
      hotel_zipcode,
      hotel_country,
      manager_id,
      category,
      hotel_phone,
      hotel_email
    ];

    const result = await pool.query(sql, values);
    res.status(201).json({ hotelid: result.rows[0].hotelid });
  } catch (err) {
    console.error('Error adding hotel:', err);
    res.status(500).json({ 
      message: 'Error adding hotel', 
      error: err.message 
    });
  }
});

// Update an existing Hotel
app.put('/hotel/:id', async (req, res) => {
  try {
    const hotelid = req.params.id;
    const {
      chain_name,
      number_of_rooms,
      hotel_street_number,
      hotel_street_name,
      hotel_city,
      hotel_zipcode,
      hotel_country,
      manager_id,
      category,
      hotel_phone,
      hotel_email
    } = req.body;

    const sql = `
      UPDATE hotel
      SET "chainName" = $1,
          numberofrooms = $2,
          hotel_streetnumber = $3,
          hotel_streetname = $4,
          hotel_city = $5,
          hotel_zipcode = $6,
          hotel_country = $7,
          managerid = $8,
          category = $9,
          hotel_phone = $10,
          "hotel_emailAddress" = $11
      WHERE hotelid = $12
    `;

    const values = [
      chain_name,
      number_of_rooms,
      hotel_street_number,
      hotel_street_name,
      hotel_city,
      hotel_zipcode,
      hotel_country,
      manager_id,
      category,
      hotel_phone,
      hotel_email,
      hotelid
    ];

    const result = await pool.query(sql, values);
    
    // Check if any rows were actually updated
    if (result.rowCount === 0) {
      return res.status(404).json({ message: 'Hotel not found' });
    }

    res.status(200).json({ message: 'Hotel updated successfully' });
  } catch (err) {
    console.error('Error updating hotel:', err);
    res.status(500).json({ 
      message: 'Error updating hotel', 
      error: err.message 
    });
  }
});

// Delete a Hotel
app.delete('/hotel/:id', async (req, res) => {
  try {
    const hotelid = req.params.id;
    const sql = 'DELETE FROM hotel WHERE hotelid = $1 RETURNING *';
    const result = await pool.query(sql, [hotelid]);

    if (result.rowCount === 0) {
      return res.status(404).json({ message: 'Hotel not found' });
    }

    res.status(200).json({ 
      message: 'Hotel deleted successfully', 
      deletedHotel: result.rows[0] 
    });
  } catch (err) {
    console.error('Error deleting hotel:', err);
    res.status(500).json({ 
      message: 'Error deleting hotel', 
      error: err.message 
    });
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

// adding a customer
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

// updating a customer
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

//deleting a customer
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

// Fetch All Employees
app.get("/employees", async (req, res) => {
  try {
    const search = req.query.search;
    let sql = `
      SELECT e.*, er.role 
      FROM employee e
      LEFT JOIN employee_role er ON e.employeeid = er.employeeid
    `;
    let values = [];
    
    if (search) {
      sql += ` WHERE e.employee_firstname ILIKE $1 OR e.employee_lastname ILIKE $1 OR e.employeeid::TEXT ILIKE $1`;
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
    employee_role 
  } = req.body;
  
  try {
    await pool.query('BEGIN');
    
    const result = await pool.query(
      "INSERT INTO employee (ssn_sin, employee_firstname, employee_middlename, employee_lastname, employee_streetnumber, employee_streetname, employee_city, employee_zipcode, employee_country) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING employeeid",
      [ssn_sin, employee_firstname, employee_middlename, employee_lastname, employee_streetnumber, employee_streetname, employee_city, employee_zipcode, employee_country]
    );    
    
    const employeeId = result.rows[0].employeeid;
    
    if (employee_role) {  
      await pool.query(
        "INSERT INTO employee_role (employeeid, role) VALUES ($1, $2)",
        [employeeId, employee_role]  
      );
    }
    

    await pool.query('COMMIT');
    
    // getting the complete employee with role data
    const completeEmployee = await pool.query(
      `SELECT e.*, er.role 
       FROM employee e 
       LEFT JOIN employee_role er ON e.employeeid = er.employeeid 
       WHERE e.employeeid = $1`,
      [employeeId]
    );
    
    res.status(201).json({ 
      message: "Employee added successfully", 
      employeeId: employeeId, // we want to see the employeeId
      employee: completeEmployee.rows[0] 
    });
  } catch (error) {
    await pool.query('ROLLBACK');
    console.error("Error adding employee:", error);
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
    employee_role  
  } = req.body;
  
  try {
    await pool.query('BEGIN');
    
    await pool.query(
      "UPDATE employee SET ssn_sin=$1, employee_firstname=$2, employee_middlename=$3, employee_lastname=$4, employee_streetnumber=$5, employee_streetname=$6, employee_city=$7, employee_zipcode=$8, employee_country=$9 WHERE employeeid=$10",
      [ssn_sin, employee_firstname, employee_middlename, employee_lastname, employee_streetnumber, employee_streetname, employee_city, employee_zipcode, employee_country, id]
    );

    if (employee_role !== undefined) {  
      // checks if an employee_role already exists
      const existingRole = await pool.query(
        "SELECT * FROM employee_role WHERE employeeid=$1",
        [id]
      );

      if (existingRole.rows.length > 0) {
        // update existing role
        await pool.query(
          "UPDATE employee_role SET role=$1 WHERE employeeid=$2",
          [employee_role, id] 
        );
      } else {
        // insert new role
        await pool.query(
          "INSERT INTO employee_role (employeeid, role) VALUES ($1, $2)",
          [id, employee_role]  
        );
      }
    }
    
    await pool.query('COMMIT');
    
    // get  updated employee with role
    const updatedEmployee = await pool.query(
      `SELECT e.*, er.role 
       FROM employee e 
       LEFT JOIN employee_role er ON e.employeeid = er.employeeid 
       WHERE e.employeeid = $1`,
      [id]
    );
    
    res.json({ 
      message: "Employee updated successfully", 
      employee: updatedEmployee.rows[0] 
    });
  } catch (error) {
    await pool.query('ROLLBACK');
    console.error("Error updating employee:", error);
    res.status(500).json({ error: error.message });
  }
});

// Delete Employee
app.delete("/employees/:id", async (req, res) => {
  const { id } = req.params;
  try {
    await pool.query('BEGIN');
    
    //  delete the role association
    await pool.query("DELETE FROM employee_role WHERE employeeid=$1", [id]);
    
    // then delete the employee
    await pool.query("DELETE FROM employee WHERE employeeid=$1", [id]);
    
    await pool.query('COMMIT');
    
    res.json({ message: "Employee deleted successfully" });
  } catch (error) {
    await pool.query('ROLLBACK');
    console.error("Error deleting employee:", error);
    res.status(500).json({ error: error.message });
  }
});

// gettign employee by ID
app.get("/employees/:id", async (req, res) => {
  const { id } = req.params;
  try {
    const result = await pool.query(
      `SELECT e.*, er.role 
       FROM employee e 
       LEFT JOIN employee_role er ON e.employeeid = er.employeeid 
       WHERE e.employeeid = $1`,
      [id]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ message: "Employee not found" });
    }
    
    res.json(result.rows[0]);
  } catch (error) {
    console.error("Error fetching employee:", error);
    res.status(500).json({ error: error.message });
  }
});

// Mock Login Credentials for employee
const validUsername = '123';
const validPassword = '123';

//-------------------- Employee Login - username and password are hardcoded --------------------//
app.post("/login", (req, res) => {
  const { username, password } = req.body;

  if (username === "123" && password === "123") {
    res.status(200).json({ message: "Login successful!" });
  } else {
    res.status(401).json({ error: "Invalid username or password" });
  }
});

// Mock Login Credentials for customer
const validCustomerUsername = '321';
const validCustomerPassword = '321';

//-------------------- Customer Login --------------------//
app.post("/customer-login", (req, res) => {
  const { username1, password1 } = req.body;

  if (username1 === validCustomerUsername && password1 === validCustomerPassword) {
    res.status(200).json({ message: "Customer login successful!" });
  } else {
    res.status(401).json({ error: "Invalid customer username or password" });
  }
});

//-------------------booking--------------------//
app.post("/book-room", async (req, res) => {
  try {
    // Log the raw request body first
    console.log("Raw booking request received:", JSON.stringify(req.body));
    
    const { customerID, roomID, roomNumber, startdate, enddate, bookingstatus } = req.body;
    
    // Log all received values explicitly
    console.log("Received values:", {
      customerID: customerID,
      roomID: roomID,
      roomNumber: roomNumber,
      startdate: startdate,
      enddate: enddate,
      bookingstatus: bookingstatus
    });

    const startDateStr = startdate; // e.g., "2025-03-30"
    const endDateStr = enddate;     // e.g., "2025-03-31"
    
    
    // Validate fields - strict check for roomNumber
    if (!customerID || !roomID || roomNumber === undefined || roomNumber === null || !startdate || !enddate) {
      console.log("Missing required fields:", { customerID, roomID, roomNumber, startdate, enddate });
      return res.status(400).json({ error: "Missing required fields", details: { customerID, roomID, roomNumber, startdate, enddate } });
    }
    
    // Ensure numeric fields are parsed as numbers
    const parsedCustomerID = parseInt(customerID, 10);
    const parsedRoomID = parseInt(roomID, 10);
    const parsedRoomNumber = parseInt(roomNumber, 10);
    
    // Double-check the parsed values
    console.log("Parsed values:", {
      parsedCustomerID,
      parsedRoomID,
      parsedRoomNumber
    });
    
    // Validate parsed values
    if (isNaN(parsedCustomerID) || isNaN(parsedRoomID) || isNaN(parsedRoomNumber)) {
      return res.status(400).json({ 
        error: "Invalid numeric values", 
        details: {
          customerID: `${customerID} (${isNaN(parsedCustomerID) ? "Invalid" : "Valid"})`,
          roomID: `${roomID} (${isNaN(parsedRoomID) ? "Invalid" : "Valid"})`,
          roomNumber: `${roomNumber} (${isNaN(parsedRoomNumber) ? "Invalid" : "Valid"})`
        }
      });
    }

    // Log the data types
    console.log("Data types:", {
      customerID: typeof customerID, 
      roomID: typeof roomID,
      roomNumber: typeof roomNumber,
      startdate: typeof startdate,
      enddate: typeof enddate,
      bookingstatus: typeof bookingstatus
    });
    
    // Check if the dates are valid
    const startDate = new Date(startdate);
    const endDate = new Date(enddate);
    if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
      return res.status(400).json({ error: "Invalid date format" });
    }
    
    // Ensure status is valid
    const status = bookingstatus || "Confirmed";
    if (status !== "Confirmed" && status !== "Cancelled") {
      return res.status(400).json({ error: "Invalid booking status" });
    }

        // Check if room exists first
        const roomCheckResult = await pool.query(
          `SELECT roomid, "roomNumber" FROM room WHERE roomid = $1 AND "roomNumber" = $2`,
          [parsedRoomID, parsedRoomNumber]
        );
        
        console.log("Room check result:", roomCheckResult.rows);
        
        if (roomCheckResult.rows.length === 0) {
          return res.status(400).json({ 
            error: "Room does not exist with the provided ID and room number",
            details: { roomID: parsedRoomID, roomNumber: parsedRoomNumber }
          });
        }
        
    
      // Check if room is available for the selected dates
      const availabilityResult = await pool.query(
        `SELECT bookingid FROM booking
        WHERE "roomID" = $1 AND "roomNumber" = $2
        AND bookingstatus = 'Confirmed'
        AND NOT (enddate < $3 OR startdate > $4)`,
        [parsedRoomID, parsedRoomNumber, startdate, enddate]
      );
      
      if (availabilityResult.rows.length > 0) {
        return res.status(400).json({ error: "Room is not available for the selected dates" });
      }
  
    
    // Try to insert the booking
    console.log("Inserting booking with values:", {
      parsedCustomerID,
      parsedRoomID,
      parsedRoomNumber,
      startdate,
      enddate,
      status
    });
    
    const result = await pool.query(
      `INSERT INTO booking ("customerID", "roomID", "roomNumber", startdate, enddate, bookingstatus)
       VALUES ($1, $2, $3, $4, $5, $6) RETURNING bookingid`,
      [parsedCustomerID, parsedRoomID, parsedRoomNumber, startdate, enddate, status]
    );
    
    
    console.log("Booking successful:", result.rows[0]);
    
    // Update the room's is_booked status
    await pool.query(
      `UPDATE room SET is_booked = true WHERE roomid = $1 AND "roomNumber" = $2`,
      [parsedRoomID, parsedRoomNumber]
    );
    
    res.json({ bookingID: result.rows[0].bookingid, message: "Booking successful" })
  
  } catch (error) {
    console.error("Booking error details:", error);

if (error.code === '23503') {
      res.status(400).json({ 
        error: "Foreign key violation: Customer, room, or hotel doesn't exist",
        details: error.detail || "No additional details available"
      });
    } else if (error.code === '23514') {
      res.status(400).json({ error: "Check constraint violation: Either end date must be after start date or status is invalid" });
    } else if (error.code === '23502') {  // Not-null constraint violation
      res.status(400).json({ 
        error: "Not-null constraint violation", 
        details: error.detail || "A required field is missing",
        column: error.column
      });
    } else {
      res.status(500).json({ 
        error: `Database error: ${error.message}`, 
        code: error.code,
        detail: error.detail || "No additional details available"
      });
    }
  }
});

//------------------renting----------------------//

// Add this to your server.js file
app.get("/bookings", async (req, res) => {
  try {
    const search = req.query.search || '';
    
    // Updated query using lowercase column names for the booking table
    let query = `
      SELECT b.bookingid, b."customerID", b."roomID", b."roomNumber", b.startdate, b.enddate, b.bookingstatus,
             c."customer_firstName", c."customer_lastName"
      FROM booking b
      LEFT JOIN customer c ON b."customerID" = c."customerID"
      LEFT JOIN renting r ON b.bookingid = r."bookingID"
      WHERE r."bookingID" IS NULL AND b.bookingstatus = 'Confirmed'
    `;
    
    const params = [];
    
    // Add search conditions if provided
    if (search) {
      query += ` AND (
        b.bookingid::text LIKE $1
        OR c."customer_firstName" ILIKE $1
        OR c."customer_lastName" ILIKE $1
        OR b."roomNumber"::text LIKE $1
      )`;
      params.push(`%${search}%`);
    }
    
    query += ' ORDER BY b.startdate DESC';
    
    const result = await pool.query(query, params);
    res.json(result.rows);
  } catch (error) {
    console.error("Error fetching bookings:", error);
    res.status(500).json({ error: "Server error" });
  }
});



// Convert booking to renting
// Convert booking to renting
app.post("/convert-to-renting", async (req, res) => {
  try {
    // Log the raw request body
    console.log("Convert to renting request:", JSON.stringify(req.body));
    
    const { bookingid, employeeid, startdate, enddate, daysextended, paymentstatus, rentalperiod } = req.body;
    
    // Validate required fields
    if (!bookingid || !employeeid) {
      return res.status(400).json({ error: "Please select a booking and enter your Employee ID", details: { bookingid, employeeid } });
    }

    // Check if booking exists and has 'Confirmed' status
    const bookingCheck = await pool.query(
      `SELECT bookingid, "roomID", "roomNumber", startdate, enddate FROM booking 
       WHERE bookingid = $1 AND bookingstatus = 'Confirmed'`,
      [bookingid]
    );
    
    if (bookingCheck.rows.length === 0) {
      return res.status(400).json({ error: "Booking not found or not in 'Confirmed' status" });
    }

    // Use the original booking dates if not provided
    const booking = bookingCheck.rows[0];
    const rentStartDate = startdate || booking.startdate;
    const rentEndDate = enddate || booking.enddate;
    
    // Calculate rental period if not provided
    const calculatedRentalPeriod = rentalperiod || Math.ceil(
      (new Date(rentEndDate) - new Date(rentStartDate)) / (1000 * 60 * 60 * 24)
    );

    // Insert into renting table
    const result = await pool.query(
      `INSERT INTO renting ("bookingID", "startDate", "endDate", "daysExtended", "paymentStatus", "rentalPeriod", "employeeID")
       VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING "bookingID", "rentID"`,
      [
        bookingid, 
        rentStartDate, 
        rentEndDate, 
        daysextended || 0, 
        paymentstatus || false, 
        calculatedRentalPeriod,
        employeeid
      ]
    );
    
    // Success response
    res.json({ 
      message: "Booking successfully converted to renting", 
      rentingID: result.rows[0].bookingID,
      rentID: result.rows[0].rentID
    });
    
  } catch (error) {
    console.error("Error converting booking to renting:", error);
    
    if (error.code === '23505') {  // Unique violation 
      res.status(400).json({ error: "This booking has already been converted to a renting" });
    } else if (error.code === '23503') {  // Foreign key violation
      res.status(400).json({ error: "Invalid booking ID or employee ID" });
    } else {
      res.status(500).json({ error: `Database error: ${error.message}` });
    }
  }
});

app.get("/bookings", async (req, res) => {
  try {
    const search = req.query.search || '';
    
    let query = `
      SELECT b.bookingid, b."customerID", b."roomID", b."roomNumber", b.startdate, b.enddate, b.bookingstatus,
             c."customer_firstName", c."customer_lastName"
      FROM booking b
      LEFT JOIN customer c ON b."customerID" = c."customerID"
      LEFT JOIN renting r ON b.bookingid = r."bookingID"
      WHERE r."bookingID" IS NULL AND b.bookingstatus = 'Confirmed'
    `;
    
    const params = [];
    
    // Add search conditions if provided
    if (search) {
      query += ` AND (
        b.bookingid::text LIKE $1
        OR c."customer_firstName" ILIKE $1
        OR c."customer_lastName" ILIKE $1
        OR b."roomNumber"::text LIKE $1
      )`;
      params.push(`%${search}%`);
    }
    
    query += ' ORDER BY b.startdate DESC';
    
    const result = await pool.query(query, params);
    res.json(result.rows);
  } catch (error) {
    console.error("Error fetching bookings:", error);
    res.status(500).json({ error: "Server error" });
  }
});

app.post("/convert-to-renting", async (req, res) => {
  try {
    console.log("Convert to renting request:", JSON.stringify(req.body));
    
    const { bookingid, employeeid, startdate, enddate, daysextended, paymentstatus, rentalperiod } = req.body;
    
    // Validate required fields
    if (!bookingid || !employeeid) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    // Get the booking details INCLUDING customerID
    const bookingCheck = await pool.query(
      `SELECT bookingid, "roomID", "roomNumber", "customerID", startdate, enddate 
       FROM booking WHERE bookingid = $1 AND bookingstatus = 'Confirmed'`,
      [bookingid]
    );
    
    if (bookingCheck.rows.length === 0) {
      return res.status(400).json({ error: "Booking not found or not in 'Confirmed' status" });
    }

    const booking = bookingCheck.rows[0];
    const rentStartDate = startdate || booking.startdate;
    const rentEndDate = enddate || booking.enddate;
    
    const calculatedRentalPeriod = rentalperiod || Math.ceil(
      (new Date(rentEndDate) - new Date(rentStartDate)) / (1000 * 60 * 60 * 24)
    );

    // Add customerID to the renting record
    const result = await pool.query(
      `INSERT INTO renting (
        "bookingID", "startDate", "endDate", "daysExtended", 
        "paymentStatus", "rentalPeriod", "employeeID"
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7) 
      RETURNING "bookingID", "rentID"`,
      [
        bookingid, 
        rentStartDate, 
        rentEndDate, 
        daysextended || 0, 
        paymentstatus || false, 
        calculatedRentalPeriod,
        employeeid,
      ]
    );
    
    res.json({ 
      message: "Booking successfully converted to renting", 
      rentingID: result.rows[0].bookingID,
      rentID: result.rows[0].rentID
    });
    
  } catch (error) {
    console.error("Error converting booking to renting:", error);
    // Error handling...
    res.status(500).json({ error: `Database error: ${error.message}` });
  }
});

// Start the server
const PORT = process.env.PORT || 5001;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));

