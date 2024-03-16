const express = require('express');
const cors = require('cors');
const bcrypt = require('bcrypt');
const { MongoClient } = require('mongodb');
require('dotenv').config();
const jwt = require('jsonwebtoken');

const app = express();
const port = process.env.PORT || 5000;

// Middleware
app.use(cors({
    origin: ["http://localhost:5173","https://65f1cdc73e64393f5bb71d4b--marvelous-tanuki-0f9d1d.netlify.app"],
    credentials: true,
  }));
app.use(express.json());

// MongoDB Connection URL
const uri = process.env.MONGODB_URI;
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true });

async function run() {
    try {
        // Connect to MongoDB
        // await client.connect();
        console.log("Connected to MongoDB");

        const db = client.db('assignment');
        const collection = db.collection('users');

        // User Registration
        app.post('/api/v1/register', async (req, res) => {
            const { name, email, password } = req.body;

            // Check if email already exists
            const existingUser = await collection.findOne({ email });
            if (existingUser) {
                return res.status(400).json({
                    success: false,
                    message: 'User already exists'
                });
            }

            // Hash the password
            const hashedPassword = await bcrypt.hash(password, 10);

            // Insert user into the database
            await collection.insertOne({ name, email, password: hashedPassword });

            res.status(201).json({
                success: true,
                message: 'User registered successfully'
            });
        });

        // User Login
        app.post('/api/v1/login', async (req, res) => {
            const { email, password } = req.body;

            // Find user by email
            const user = await collection.findOne({ email });
            if (!user) {
                return res.status(401).json({ message: 'Invalid email or password' });
            }

            // Compare hashed password
            const isPasswordValid = await bcrypt.compare(password, user.password);
            if (!isPasswordValid) {
                return res.status(401).json({ message: 'Invalid email or password' });
            }

            // Generate JWT token
            const token = jwt.sign({ email: user.email }, process.env.JWT_SECRET, { expiresIn: process.env.EXPIRES_IN });

            res.json({
                success: true,
                message: 'Login successful',
                token
            });
        });


        // ==============================================================
        // WRITE YOUR CODE HERE
        // ==============================================================
        const reliefGoodCollection = client
        .db("disasterRelief")
        .collection("reliefGoods");
      const Donor = db.collection("donors");
        
     
        

        app.get('/api/v1/relief-goods', async (req, res) => {
            try {
              // Fetch relief goods from MongoDB
              const reliefGoods = await reliefGoodCollection.find();
              const result = await reliefGoods.toArray();
              console.log(result)
              // Return response with JSON data

              res.json(result);
            } catch (err) {
              res.status(500).json({ message: err.message });
            }
          });

          app.get('/api/v1/relief-goods/:id',async(req,res)=>{
            const id = req.params.id;
            const query = {_id: new ObjectId(id)};
            const result = await reliefGoodCollection.findOne(query);
            res.json(result);
          })
            
     app.post('/api/v1/donors',async(req,res)=>{
        const donor = req.body;
        const result = await Donor.insertOne(donor);
        res.json(result);
     })
     // Update an existing relief good by
     // its ID.

        app.put('/api/v1/relief-goods/:id', async (req, res) => {
            const id = req.params.id;
            const reliefGood = req.body;
            const query = { _id: new ObjectId(id) };
            const options = { upsert: true };
            const updateReliefGood = {
                $set: {
                    name: reliefGood.name,
                    description: reliefGood.description,
                    quantity: reliefGood.quantity
                }
            };
            const result = await reliefGoodCollection.updateOne(
                query,
                updateReliefGood,
                options
            );
            res.json(result);
        });

            // Delete a relief good by its
            // ID.
            app.delete('/api/v1/relief-goods/:id', async (req, res) => {
                const id = req.params.id;
                const query = { _id: new ObjectId(id) };
                const result = await reliefGoodCollection.deleteOne(query);
                res.json(result);
            });
            // =================================
            //          DONATIONS ROUTES
            // =================================
            // Get all the donations in
            // the database
            app.get('/api/v1/donations', async (req, res) => {
                const cursor = collection.find();
                const donations = await cursor.toArray();
                res.send(donations);
            });
            // Add a new donation to
            // the database
            app.post('/api/v1/donations', async (req, res) => {
                const donation = req.body;
                const result = await collection.insertOne(donation);
                res.json(result);
            });
            // Update an existing donation with
            // its ID.
            app.put('/api/v1/donations/:id', async (req, res) => {
                const id = req.params.id;
                const donation = req.body;
                const query = { _id: new ObjectId(id) };
                const options = { upsert: true };
                const updateDonation = {
                    $set: {
                        name: donation.name,
                        email: donation.email,
                        address: donation.address,
                        amount: donation.amount
                    }
                };
                const result = await collection.updateOne(
                    query,
                    updateDonation,
                    options
                );
                res.json(result);
            });
            // Delete a donation with its
            // ID.
            app.delete('/api/v1/donations/:id', async (req, res) => {
                const id = req.params.id;
                const query = { _id: new ObjectId(id) };
                const result = await collection.deleteOne(query);
                res.json(result);
            });
        
    


        // Start the server
        app.listen(port, () => {
            console.log(`Server is running on http://localhost:${port}`);
        });

    } finally {
    }
}

run().catch(console.dir);

// Test route
app.get('/', (req, res) => {
    const serverStatus = {
        message: 'Server is running smoothly',
        timestamp: new Date()
    };
    res.json(serverStatus);
});