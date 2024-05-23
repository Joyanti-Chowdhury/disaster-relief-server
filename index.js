const express = require("express");
const cors = require("cors");
const bcrypt = require("bcrypt");
const { MongoClient, ObjectId } = require("mongodb");
require("dotenv").config();
const jwt = require("jsonwebtoken");
const randomGenerator = require("./randomGenerator");

const app = express();
const port = process.env.PORT || 5000;

// Middleware
// app.use(cors({
//     origin: ["http://localhost:5173",
//     "https://65f1cdc73e64393f5bb71d4b--marvelous-tanuki-0f9d1d.netlify.app"],

//     credentials: true,
//   }));
app.use(express.json());
app.use(
  cors({
    origin: [
      "http://localhost:5173",
      "https://iridescent-lily-be83f9.netlify.app",
    ],
    credentials: true,
  })
);
// MongoDB Connection URL
const uri = process.env.MONGODB_URI;
const client = new MongoClient(uri, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

async function run() {
  try {
    // Connect to MongoDB
    // await client.connect();
    console.log("Connected to MongoDB");

    const db = client.db("assignment");
    const collection = db.collection("users");

    // ==============================================================
    // WRITE YOUR CODE HERE
    // ==============================================================
    const reliefGoodCollection = client
      .db("disasterRelief")
      .collection("reliefGoods");
    const Donor = db.collection("donors");

    // const db = client.db("assignment");
    // const userCollection = db.collection("users");
    const supplies = db.collection("supply");
    // const reliefGoodCollection = db.collection("reliefGoods");
    // const disasterRelief = db.collection("disasterRelief");

    // replace with your database name
    // const supplies = disasterRelief.collection('supplies');

    // User Registration
    app.post("/api/v1/register", async (req, res) => {
      const { name, email, password } = req.body;

      // Check if email already exists
      const existingUser = await collection.findOne({ email });
      if (existingUser) {
        return res.status(400).json({
          success: false,
          message: "User already exists",
        });
      }

      // Hash the password
      const hashedPassword = await bcrypt.hash(password, 10);

      // Insert user into the database
      await collection.insertOne({ name, email, password: hashedPassword });

      res.status(201).json({
        success: true,
        message: "User registered successfully",
      });
    });

    // User Login
    app.post("/api/v1/login", async (req, res) => {
      const { email, password } = req.body;

      // Find user by email
      const user = await collection.findOne({ email });
      if (!user) {
        return res.status(401).json({ message: "Invalid email or password" });
      }

      // Compare hashed password
      const isPasswordValid = await bcrypt.compare(password, user.password);
      if (!isPasswordValid) {
        return res.status(401).json({ message: "Invalid email or password" });
      }

      // Generate JWT token
      const token = jwt.sign({ email: user.email }, process.env.JWT_SECRET, {
        expiresIn: process.env.EXPIRES_IN,
      });

      res.json({
        success: true,
        message: "Login successful",
        token,
      });
    });

    app.get("/api/v1/relief-goods", async (req, res) => {
      try {
        // Fetch relief goods from MongoDB
        const reliefGoods = await reliefGoodCollection.find();
        const result = await reliefGoods.toArray();
        console.log(result);
        // Return response with JSON data

        res.json(result);
      } catch (err) {
        res.status(500).json({ message: err.message });
      }
    });

    app.get("/api/v1/relief-goods/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const result = await reliefGoodCollection.findOne(query);
      res.json(result);
    });

    app.get("/api/v1/relief-goods/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const result = await reliefGoodCollection.findOne(query);
      res.send(result);
    });

    app.put("/api/v1/relief-goods/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const result = await reliefGoodCollection.insertOne(query);
      res.send(result);
    });

    app.post("/api/v1/donors", async (req, res) => {
      const donor = req.body;
      const result = await Donor.insertOne(donor);
      res.json(result);
    });
    // Update an existing relief good by
    // its ID.

    app.put("/api/v1/relief-goods/:id", async (req, res) => {
      const id = req.params.id;
      const reliefGood = req.body;
      const query = { _id: new ObjectId(id) };
      const options = { upsert: true };
      const updateReliefGood = {
        $set: {
          name: reliefGood.name,
          description: reliefGood.description,
          quantity: reliefGood.quantity,
        },
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
    app.delete("/api/v1/relief-goods/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const result = await reliefGoodCollection.deleteOne(query);
      res.json(result);
    });

    app.post("/api/v1/supply/create-supply", async (req, res) => {
      try {
        const payload = req.body;
        const { title, category, quantity, description, image } = payload;
        console.log({ payload });
        const id = randomGenerator(11);

        const supplyData = {
          id,
          title,
          image,
          category,
          quantity,
          description,
        };

        const result = await supplies.insertOne(supplyData);

        if (result.acknowledged) {
          res.status(200).json({
            status: 200,
            success: true,
            message: "supply created successfully",
            data: result,
          });
        } else {
          res.status(500).json({
            status: 500,
            success: false,
            message: "supply creation failed",
            data: null,
          });
        }
      } catch (error) {
        console.error(error);
        res.status(500).json({
          status: 500,
          success: false,
          message: "supply creation failed",
          data: null,
        });
      }
    });

    app.get("/api/v1/supply", async (req, res) => {
      try {
        const allSupply = await supplies.find().toArray();
        console.log(allSupply);

        res.status(200).json({
          success: true,
          status: 200,
          message: "All supply retrieved successfully",
          data: allSupply,
        });
      } catch (error) {
        res.status(200).json({
          success: false,
          status: 500,
          message: "Supply retrieval failed",
          data: null,
        });
      }
    });

    // delete
    app.delete("/api/v1/supply/:id", async (req, res) => {
      const id = req.params.id;
      console.log(id);
      try {
        // await supplies.deleteMany()
        const result = await supplies.deleteOne({ id });
        // console.log(await supplies.find({}))
        console.log(result);
        res.status(200).json({
          success: true,
          status: 200,
          message: "supply deleted successfully",
          data: result,
        });
      } catch (error) {
        console.log(error);
        res.status(200).json({
          success: true,
          status: 200,
          message: "supply deleted failed",
          data: null,
        });
      }
    });
    // update
    app.patch("/api/v1/supply/:id", async (req, res) => {
      const id = req.params.id;
      console.log({ id });
      const payload = req.body;
      console.log({ payload });
      try {
        const updateDoc = { $set: { ...payload } };
        const filter = { id: id };
        console.log({ updateDoc });
        const result = await supplies.updateOne(filter, updateDoc);
        console.log({ result });
        if (result.modifiedCount) {
          res.status(200).json({
            success: true,
            status: 200,
            message: "supply updated successfully",
            data: result,
          });
        } else {
          res.status(500).json({
            success: true,
            status: 200,
            message: "supply updated failed",
            data: null,
          });
        }
      } catch (error) {
        res.status(200).json({
          success: true,
          status: 200,
          message: "supply update failed failed",
          data: null,
        });
      }
    });

    // Function to generate random IDs
    function randomGenerator(length) {
      const chars =
        "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
      let result = "";
      for (let i = 0; i < length; i++) {
        result += chars.charAt(Math.floor(Math.random() * chars.length));
      }
      return result;
    }

    // =================================
    //          DONATIONS ROUTES
    // =================================
    // Get all the donations in
    // the database
    app.get("/api/v1/donations", async (req, res) => {
      const cursor = collection.find();
      const donations = await cursor.toArray();
      res.send(donations);
    });
    // Add a new donation to
    // the database
    app.post("/api/v1/donations", async (req, res) => {
      const donation = req.body;
      const result = await collection.insertOne(donation);
      res.json(result);
    });
    // Update an existing donation with
    // its ID.
    app.put("/api/v1/donations/:id", async (req, res) => {
      const id = req.params.id;
      const donation = req.body;
      const query = { _id: new ObjectId(id) };
      const options = { upsert: true };
      const updateDonation = {
        $set: {
          name: donation.name,
          email: donation.email,
          address: donation.address,
          amount: donation.amount,
        },
      };
      const result = await collection.updateOne(query, updateDonation, options);
      res.json(result);
    });
    // Delete a donation with its
    // ID.
    app.delete("/api/v1/donations/:id", async (req, res) => {
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
app.get("/", (req, res) => {
  const serverStatus = {
    message: "Server is running smoothly",
    timestamp: new Date(),
  };
  res.json(serverStatus);
});
