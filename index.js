const express = require("express");
const cors = require("cors");
const admin = require("firebase-admin");
require('dotenv').config()
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
const app = express();
const port = process.env.PORT || 3000;



const serviceAccount = require("./smart-deals-firebase-adminsdk.json");

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

// middleware
app.use(cors());
app.use(express.json());

const logger = (req, res, next) =>{
  console.log("logging information")
  next()
}

const verifyFirebaseToken = async(req, res, next) =>{
  console.log("in the token area", req.headers.authorization)
  if(!req.headers.authorization){
    return res.status(401).send({message: "unauthorized access"})
  }
  const token = req.headers.authorization.split(' ')[1]
  if(!token){
    return res.status(401).send({message: "unauthorized access"})
  }

  // 1. access token sara information dibo na
  // 2. ekta user sudhu nijer info pabe==> "get my bids" ekhane ei validation hoise if er moddhe

  // verify id token
  try{
    const userInfo = await admin.auth().verifyIdToken(token)
    req.token_email = userInfo.email;
    console.log("after user validation", userInfo)
    next()
  }
  catch{
     return res.status(401).send({message: "unauthorized access"})
  }
  
}


const uri =
  `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.ke2w89y.mongodb.net/?appName=Cluster0`;

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
    // app.get("/bids", async (req, res) => {
    //   const email = req.query.email;
    //   const query = {};
    //   if (email) {
    //     query.buyer_email = email;
    //   }
    //   const cursor = bidsCollection.find(query);
    //   const result = await cursor.toArray();
    //   res.send(result);
    // });

    // add a bid
    app.post("/bids", async (req, res) => {
      const newBid = req.body;
      const result = await bidsCollection.insertOne(newBid);
      res.send(result);
    });

    // get bids for the same product
    app.get('/products/bids/:productId', verifyFirebaseToken, async(req, res)=>{
      const productId = req.params.productId
      const query = {product: productId}
      const cursor = bidsCollection.find(query).sort({bid_price: -1}) 
      const result = await cursor.toArray()
      res.send(result)
    })

    // get my bids only
    app.get('/bids', logger, verifyFirebaseToken, async(req, res)=>{
      // console.log('headers', req.headers)
      const query = {}
      if(query.email){
        query.buyer_email = email
      }
      // verify user have access to see this data
      // unauthorized user data fetch kora link e sorasori email diye check kore amar document pete pare....seti bondho korar jonno ei condition
            if (email !== req.token_email) {
                return res.status(403).send({ message: 'forbidden access' })
            }
      const cursor = bidsCollection.find(query)
      const result = await cursor.toArray()
      res.send(result)
    })

    // delete a bid from mybids
    app.delete("/bids/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const result = await bidsCollection.deleteOne(query);
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
