const express = require("express");
const app = express();
const jwt = require("jsonwebtoken");
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
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
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
    // Database Collections
    const usersCollections = client.db("Portfolio").collection("users");
    const contactCollections = client.db("Portfolio").collection("contact");
    const blogCollections = client.db("Portfolio").collection("blogs");

    // Token Added
    // JWT Related API (Pass the token in client site)
    app.post("/jwt", async (req, res) => {
      const user = req.body;
      const token = jwt.sign(user, process.env.ACCESS_TOKEN_SECRET);
      res.send({ token });
    });

    // Token Verify
    const verifyToken = (req, res, next) => {
      // req.headers.authorization comes from client site like useAxiosSecure file
      if (!req.headers.authorization) {
        return res.status(401).send({ message: "Unauthorized Access!" });
      }
      const token = req.headers.authorization.split(" ")[1];
      jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (error, decoded) => {
        if (error) {
          return res.status(401).send({ message: "Unauthorized Access!" });
        }
        res.decoded = decoded;
        next();
      });
    };

    app.get("/user/admin/:email", async (req, res) => {
      const email = req.params.email;
      if (!email) {
        return res.send({ admin: false });
      }
      const query = { email: email };
      const user = await usersCollections.findOne(query);
      if (user?.role === "admin") {
        const isAdmin = user?.role === "admin";
        res.send({ admin: isAdmin });
      } else {
        return res.send({ admin: false });
      }
    });

    // USERS
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

    // CONTACT
    app.get("/contact", async (req, res) => {
      const result = await contactCollections.find().toArray();
      res.send(result);
    });

    app.post("/contact", async (req, res) => {
      const data = req.body;
      console.log(data);
      const filter = { email: req.body.email };
      const existingUser = await contactCollections.findOne(filter);
      const options = { upsert: true };
      if (existingUser) {
        const updateDoc = {
          $push: {
            message: { $each: data.message },
          },
        };
        const result = await contactCollections.updateOne(
          filter,
          updateDoc,
          options
        );
        return res.send(result);
      }
      const result = await contactCollections.insertOne(data);
    });

    // Blogs
    app.get("/blogs", async (req, res) => {
      const result = await blogCollections.find().toArray();
      res.send(result);
    });

    // Blog: Fine a single one
    app.get("/blog/:id", verifyToken, async (req, res) => {
      const id = req.params.id;
      const filter = { _id: new ObjectId(id) };
      const result = await blogCollections.findOne(filter);
      res.send(result);
    });

    // Blog: Update
    app.post("/blog/:id", async (req, res) => {
      const id = req.params.id;
      const data = req.body;
      const filter = { _id: new ObjectId(id) };
      const options = { upsert: true };
      const updateDoc = {
        $set: {
          title: data.title,
          description: data.description,
          timeToRead: data.timeToRead,
          category: data.category,
        },
      };
      const result = await blogCollections.updateOne(
        filter,
        updateDoc,
        options
      );
      res.send(result);
    });

    // Blog: Delete
    app.delete("/blog/:id", async (req, res) => {
      const id = req.params.id;
      const filter = { _id: new ObjectId(id) };
      const result = await blogCollections.deleteOne(filter);
      res.send(result);
    });

    // Blog: New Add
    app.post("/blog", async (req, res) => {
      const data = req.body;
      console.log(data);
      const result = await blogCollections.insertOne(data);
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
