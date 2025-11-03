const express = require("express");
const cors = require("cors");
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
const app = express();
const port = process.env.PORT || 3000;

// middleware
app.use(cors());
app.use(express.json());

const uri =
  "mongodb+srv://smartDealsdb:Uk4kXpxZdD34R9Nq@cluster0.ke2w89y.mongodb.net/?appName=Cluster0";

const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});

async function run() {
  try {
    await client.connect();
    console.log("✅ Connected to MongoDB");

    const db = client.db("smart_db");
    const productsCollection = db.collection("products");
    const bidsCollection = db.collection("bids");
    const usersCollection = db.collection("users");

    // client side started

    // add a user
    app.post("/users", async (req, res) => {
      const newUsers = req.body;
      const email = req.body.email;
      const query = { email: email };
      const existingUser = await usersCollection.findOne(query);
      if (existingUser) {
        res.send({ message: "user already exixst, no need to add again" });
      } else {
        const result = await usersCollection.insertOne(newUsers);
        res.send(result);
      }
    });

    // get post from database
    app.get('/recent-products', async(req, res)=>{
        const cursor = productsCollection.find().sort({created_at: -1}).limit(6)
        const result = await cursor.toArray()
        res.send(result)
    })
    // client side finished



    // add a product
    app.post("/products", async (req, res) => {
      const newProduct = req.body;
      const result = await productsCollection.insertOne(newProduct);
      res.send(result);
    });

    // get all products
    app.get("/products", async (req, res) => {
      const cursor = productsCollection.find();
      const result = await cursor.toArray();
      res.send(result);
    });

    // get a single product
    app.get("/products/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const result = await productsCollection.findOne(query);
      res.send(result);
    });

    // delete a product
    app.delete("/products/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const result = await productsCollection.deleteOne(query);
      res.send(result);
    });

    // update a product
    app.patch("/products/:id", async (req, res) => {
      const updateProduct = req.body;
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const update = {
        $set: {
          name: updateProduct.name,
          price: updateProduct.price,
        },
      };
      const result = await productsCollection.updateOne(query, update);
      res.send(result);
    });

    app.get("/products", async (req, res) => {
      const result = await productsCollection.find().toArray();
      res.send(result);
    });

    // bids api are here

    // get all  bids
    // sobgulo bid theke ami j j bid gula koresi sei bidgulo amar email diye search kore ber korte chai(query parameter bole etake)
    app.get("/bids", async (req, res) => {
      const email = req.query.email;
      const query = {};
      if (email) {
        query.buyer_email = email;
      }
      const cursor = bidsCollection.find(query);
      const result = await cursor.toArray();
      res.send(result);
    });

    // add a bid
    app.post("/bids", async (req, res) => {
      const newBid = req.body;
      const result = await bidsCollection.insertOne(newBid);
      res.send(result);
    });

    console.log("✅ Routes are ready");
  } catch (error) {
    console.error(error);
  }
}
run();

app.get("/", (req, res) => {
  res.send("smart server is running");
});

app.listen(port, () => {
  console.log(`✅ Server is running on port: ${port}`);
});
