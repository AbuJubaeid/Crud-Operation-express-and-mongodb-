const express = require('express');
const cors = require('cors');
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const app = express();
const port = process.env.PORT || 3000;

// middleware
app.use(cors());
app.use(express.json())

const uri = "mongodb+srv://smartDealsdb:Uk4kXpxZdD34R9Nq@cluster0.ke2w89y.mongodb.net/?appName=Cluster0";

const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  }
});

async function run() {
  try {
    await client.connect();
    console.log("✅ Connected to MongoDB");

    const db = client.db('smart_db');
    const productsCollection = db.collection('products');

    // add a product
    app.post('/products', async (req, res) => {
      const newProduct = req.body;
      const result = await productsCollection.insertOne(newProduct);
      res.send(result);
    });

    // get all products
    app.get('/products', async(req, res)=>{
        const cursor = productsCollection.find()
        const result = await cursor.toArray()
        res.send(result)
    })

    // get a single product
    app.get('/products/:id', async(req, res)=>{
        const id = req.params.id
        const query = {_id : new ObjectId(id)}
        const result = await productsCollection.findOne(query)
        res.send(result)
    })

    // delete a product
    app.delete('/products/:id', async(req, res)=>{
        const id = req.params.id
        const query = {_id : new ObjectId(id)}
        const result = await productsCollection.deleteOne(query);
        res.send(result);
    })

    // update a product
    app.patch('/products/:id', async(req, res)=>{
        const updateProduct = req.body;
        const id = req.params.id
        const query = {_id : new ObjectId(id)}
        const update = {
        $set: {
            name : updateProduct.name,
            price : updateProduct.price
        },
        };
        const result = await productsCollection.updateOne(query, update);
        res.send(result);
    })

    app.get('/products', async (req, res) => {
      const result = await productsCollection.find().toArray();
      res.send(result);
    });

    console.log("✅ Routes are ready");
    
  } catch (error) {
    console.error(error);
  }
}
run()

app.get('/', (req, res) => {
  res.send("smart server is running");
});

app.listen(port, () => {
  console.log(`✅ Server is running on port: ${port}`);
});
