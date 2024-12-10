const express = require("express");
const app = express();
const cors = require("cors");
const port = process.env.PORT || 5000;
require("dotenv").config();

app.use(express.json());

app.use(
  cors({
    origin: [
      "http://localhost:5173",
      "https://stupendous-faun-dabb78.netlify.app",
    ],
    credentials: true,
  })
);

// MongoDB
const { MongoClient, ServerApiVersion } = require("mongodb");
const uri = `mongodb+srv://${process.env.DB_USER_NAME}:${process.env.DB_USER_PASS}@cluster0.9sxzsr9.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`;

const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});

async function run() {
  try {
    // Connect the client to the server	(optional starting in v4.7)
    // await client.connect();
    // Send a ping to confirm a successful connection
    // await client.db("admin").command({ ping: 1 });

    // Database Collections
    const usersCollections = client.db("Portfolio").collection("users");

    app.get("/users", async (req, res) => {
      const result = await usersCollections.find().toArray();
      res.send(result);
    });

    app.post("/users", async (req, res) => {
      const userInfo = req.body;
      const query = { email: userInfo.email };
      const existingUser = await usersCollections.findOne(query);

      if (existingUser) {
        return res.send({
          message: "User Email Already Exists",
          insertedId: null,
        });
      }
      const result = await usersCollections.insertOne(userInfo);
      res.send(result);
    });
  } finally {
    // Ensures that the client will close when you finish/error
    // await client.close();
  }
}
run().catch(console.dir);

app.get("/", (req, res) => {
  res.send("SFT Portfolio Server");
});
app.listen(port, () => {
  console.log(`My Listening Port: ${port}`);
});
