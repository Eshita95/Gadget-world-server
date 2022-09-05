const express = require('express');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const { MongoClient, ServerApiVersion } = require('mongodb');
require("dotenv").config();


const app = express();
const port = process.env.PORT || 5000;
app.use(cors());
app.use(express.json());




const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster2.vtof8in.mongodb.net/?retryWrites=true&w=majority`;
console.log(uri)
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true, serverApi: ServerApiVersion.v1 });

async function run() {
  try {
    await client.connect()
    const itemsCollection = client.db("gadgetWorld").collection("item");
    const userCollection = client.db("gadgetWorld").collection("user");

    // app.get('/item',async(req,res)=>{
    //   const query= {};
    //   const cursor = dataBase.find(query);
    //   const items = await cursor.toArray();
    //   res.send(items);
    // })

    
    //
    app.get("/item", async (req, res) => {
      const query = {};
      const cursor = await itemsCollection.find(query);
      const result = await cursor.toArray();
      res.send(result);
    });

    //single data load
    app.get("/item/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: ObjectID(id) };
      const result = await itemsCollection.findOne(query);
      res.send(result);
    });

    // one items data update api
    app.put("/stockUpdate/:id", async (req, res) => {
      const id = req.params.id;
      const stock = req.body;
      const filter = { _id: ObjectID(id) };
      const options = { upsert: true };
      const updateDoc = {
        $set: { stock: stock.stock, quantity: stock.quantity },
      };
      const result = await itemsCollection.updateOne(
        filter,
        updateDoc,
        options
      );
      res.send(result);
    });

    // delivery status update
    app.put("/deliveryUpdate/:id", async (req, res) => {
      const id = req.params.id;
      const delivery = req.body;
      const filter = { _id: ObjectID(id) };
      const options = { upsert: true };
      const updateDoc = {
        $set: {
          delivery: delivery.delivery,
          stock: delivery.stock,
        },
      };
      const result = await itemsCollection.updateOne(
        filter,
        updateDoc,
        options
      );
      res.send(result);
    });

    // new items post api
    app.post("/item", verifyJWT, async (req, res) => {
      const items = req.body;
      const result = await itemsCollection.insertOne(items);
      res.send(result);
    });

    // single user items data load
    app.get("/userItems/:userEmail", async (req, res) => {
      const email = req.params.userEmail;
      const query = { UserEmail: email };
      const cursor = await itemsCollection.find(query);
      const result = await cursor.toArray();
      res.send(result);
    });

     // one items delete
     app.delete("/deleteItem/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: ObjectID(id) };
      const result = await itemsCollection.deleteOne(query);
      res.send(result);
    });

    app.post('/login',async(req,res)=>{
      const user= req.body;
      const accessToken = jwt.sign(user,process.env.ACCESS_TOKEN_SECRET,{
        expiresIn:'1d'
      })
      res.send({accessToken});
    })

    const verifyJWT = (req, res, next) => {
      const authHeader = req.headers.authorization;
      if (!authHeader) {
        return res.status(401).send({ message: "unauthorized" });
      }
      const token = authHeader.split(" ")[1];
      jwt.verify(token, tokenSecret, (err, decoded) => {
        if (err) {
          return res.status(403).send({ message: "forbidden" });
        } else {
          req.decoded = decoded;
          next();
        }
      });
    };

    app.put("/login/:email", async (req, res) => {
      const email = req.params.email;
      const user = req.body;
      const filter = { email: email };
      const options = { upsert: true };
      const updateDoc = {
        $set: {
          user: user,
        },
      };

      const token = jwt.sign(
        {
          email: user.email,
        },
        tokenSecret,
        { expiresIn: "1d" }
      );

      const result = await userCollection.updateOne(filter, updateDoc, options);
      res.send({ result, success: true, accessToken: token });
    });

  }
  finally {

  }
}
run().catch(console.dir);

app.listen(port, () => {
  console.log('listening port', port);
})

