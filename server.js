const mongoose = require("mongoose");
const express  = require("express");
var bodyParser = require('body-parser')
var jwt        = require('jsonwebtoken')
const cors     = require('cors')
var bcrypt = require('bcrypt-nodejs');
var autoIncrement = require('mongoose-auto-increment');


var corsOptions = {
  origin: 'http://localhost:4200',
}
const app = express();
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(cors(corsOptions))
mongoose.connect("mongodb+srv://mustafa:lambghini@techshop-namus.mongodb.net/test?retryWrites=true",{ useNewUrlParser: true});
// mongoose.connect("mongodb://localhost:27017");
var db = mongoose.connection;
autoIncrement.initialize(db);
db.on('error', console.error.bind(console, 'connection error:'));
db.once('open', function() {
  console.log("we are connected");
});

const RSA_priivate_key = "616161"

function middleWare(token) {
  console.log(token);
}

var userSchema = new mongoose.Schema(
  {
    firstName: {type : String,required : true},
    lastName: {type : String,required : true},
    password: {type : String, required : true },
    emailAddress: {type : String, unique: true,required : true },
    phoneNumber: {type : String, required : true },
    address: {type : String , required: true},
    accountType: {type: String, required: true, default: "user"}
  }
);
userSchema.plugin(autoIncrement.plugin, 'user');
var user = mongoose.model('user',userSchema);

let itemSchema = new mongoose.Schema({
  name: {type: String, required: true},
  brand: {type: String, required: true},
  price: {type: Number, required: true},
  amount: {type: Number, required: true},
  category: {type: String, required: true},
  image : {type: String,required: true},
  detail: {type: String, required: true},
  owner: {type: String, required: true, default: "admin"}


})
itemSchema.plugin(autoIncrement.plugin,'item');
item = mongoose.model('item',itemSchema);

//middlware for token verifiction
var verification = function(req,res,next){
  var token = req.get('token');
  
  if(token){
    console.log(token)
    jwt.verify(token,RSA_priivate_key,function(err,decoded){
      if(err){
        console.log('error');
        res.json(
          {
            token: null,
            user : null
          }
        );
      }
      else {
        next();
      }
    })
  }
}

//Post method to create a user
app.post("/users/create",function(req, res){
  var firstName = req.body.firstName;
  var lastName  = req.body.lastName;
  var emailAddress = req.body.email;
  var phoneNumber  = req.body.number;
  var password = req.body.password;
  var address = req.body.address;
  var type;
  var password = bcrypt.hashSync(password);
  console.log(password);
  if (req.body.accountType) {
    type = req.body.accountType;
  }
  console.log(password,address,req.body);
  user.create(
    {
      
      firstName : firstName,
      lastName  : lastName,
      emailAddress : emailAddress,
      phoneNumber : phoneNumber,
      password: password,
      address: address,
      accountType: type
    },
    function(err,command){
      if(err) {
        if (err.name === "MongoError" && err.code === 11000){
          res.json({
            creation: false
          });
        }
      }
      else{console.log(command);
      res.send({
        creation: true
      });
    }}
  ); 

});


//post method to create a item
app.post('/item/create',verification,(req,res)=>{
  var name,brand,price,amount,category,detail,image;
  let token = req.get('token');
  name  = req.body.name;
  brand = req.body.brand;
  price = req.body.price;
  price = parseInt(price);
  amount= req.body.amount;
  amount = parseInt(amount);
  detail= req.body.detail;
  image = req.body.image;
  category = req.body.category;
  let owner;  
  if (req.body.owner) {
    owner = req.body.owner;
  }
  item.create({
    name: name,
    brand: brand,
    price: price,
    amount: amount,
    category: category,
    image : image,
    detail: detail,
    owner: owner
  }
    
  ,(err,item)=>{
    if(err){
      console.log(err);
      res.json({error:'creation error',token: token})
    }
    else {
      res.json({creation: true,token: token})
    }
  });
});

app.get('/item',(req,res)=>{
  item.find({},(err,item)=>{
    if(err){
      res.json({error: 'found nothing'});
    }
    else {
     
      res.json(item);
    }
    
  });
  
})

//Post method to for login
app.post('/login',(req,res)=>{
  var emailAddress = req.body.email;
  var password = req.body.password;
  user.findOne({emailAddress : emailAddress},'password accountType _id',(err,user)=>{
    if(err){
      console.log(err);
    }
    else if (user){
      console.log(user._id);
      if(bcrypt.compareSync(password,user.password)) {
        const token  = jwt.sign({}, RSA_priivate_key,{
          algorithm: 'HS256',
          expiresIn: 1800
        });
        res.status(200).json({
          token: token,
          accountType: user.accountType,
          expiresIn: 120,
          id: user._id
          
        });
      }
      else if(password != user.password) {
        res.status(401).send({token: null});
      }
    }
    else {
      res.status(401).send({token: null});
    }
    
  });
}
);


//post method for getting a specific user
app.get("/user",verification,function(req,res){
  var id = req.get('id');
  var token = req.get('token');
  console.log(id);
  user.findOne({_id: id},'-password -__v',(err,user)=>{
    if(err){
      console.log(err,'something');
    }
    else if(user){
      console.log('sending');
      res.json({
        token: token,
        user: user
      });
    }
    else {
      console.log("found nothing");
      res.json({token: null,user: null});
    }
  });
});
app.get('*',function(req,res){
  res.send("Cannot find the specified link").json();
});

app.listen("8000", () => console.log('Listening on port'));