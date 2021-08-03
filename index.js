const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const { MongoClient } = require('mongodb');
const ObjectId = require('mongodb').ObjectId;

var admin = require("firebase-admin");
require('dotenv').config();

var serviceAccount = require("./configs/food-to-fly-347a7-firebase-adminsdk-o0eo4-e885f92a5e.json");

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const app = express()
app.use(cors());
app.use(bodyParser.json());

const port = process.env.PORT||5000

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.y0jnn.mongodb.net/${process.env.DB_NAME}?retryWrites=true&w=majority`;

const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true });
client.connect(err => {
  const productCollection = client.db(`${process.env.DB_NAME}`).collection("products");
  const ordersCollection = client.db(`${process.env.DB_NAME}`).collection("orders");
  

  app.post('/addProduct',(req,res)=>{
      const product= req.body;
      productCollection.insertOne(product)
      .then(result=>{
          //console.log(result);
          res.send(result.insertedCount>0);
      })

      // console.log(product);
  })
  app.post('/addOrder',(req,res)=>{
    const orders= req.body;
    ordersCollection.insertOne(orders)
    .then(result=>{
      // console.log(result);
      res.send({count: result.insertedCount});
    })
  })
  app.get('/products',(req,res)=>{
      productCollection.find({})
      .toArray((err,documents)=>{
          res.send(documents);
      })
  })

  app.get('/product/:id', (req, res)=>{
    const id = req.params.id;
    //console.log(id);
    productCollection.find({_id: ObjectId(id)})
    .toArray((err, documents)=>
    {
        res.send(documents[0])
    })
  })
  app.get('/order', (req,res)=>{
    const bearer = req.headers.authorization;
    // console.log(bearer);
    if (bearer && bearer.startsWith('Bearer ')) {
      const idToken = bearer.split(' ')[1];
      // console.log({ idToken });
      admin
        .auth()
        .verifyIdToken(idToken)
        .then((decodedToken) => {
          const userEmail = decodedToken.email;
          // console.log(userEmail,req.query.email)
          if (userEmail == req.query.email) {
            ordersCollection.find({ email: req.query.email })
              .toArray((err, documents) => {
                //console.log(documents);
                res.send(documents);
              })
          }
        })
        .catch((error) => {
          // Handle error
        });
    }
  })

app.delete('/deleteProduct/:id',(req,res)=>{
  const id = req.params.id;
        productCollection.deleteOne({_id: ObjectId(id)}, (err, result)=>{
            if(!err){
                res.send({count: 1})
            }
        })
})

});


app.get('/', (req, res) => {
  res.send('Welcome')
})

app.listen(port)