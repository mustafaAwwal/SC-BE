const mongoose = require("mongoose");
const express  = require("express");
var bodyParser = require('body-parser')
var jwt        = require('jsonwebtoken')
const cors     = require('cors')

var corsOptions = {
  origin: 'http://localhost:4200',
}
const app = express();
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(cors(corsOptions))
// mongoose.connect("mongodb+srv://mustafa:lambghini@techshop-namus.mongodb.net/test?retryWrites=true",{ useNewUrlParser: true});
mongoose.connect("mongodb://localhost:27017");
var db = mongoose.connection;
db.on('error', console.error.bind(console, 'connection error:'));
db.once('open', function() {
  console.log("we are connected");
});

const RSA_priivate_key = "616161"



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
var user = mongoose.model('user',userSchema);

userSchema.method.findByEmail = function findByEmail(email) {
  this.model('user').findOne({emailAddress: email},'password accountType',(err,user)=>{
    if(err) {
      return false;
    
    }
    else return user;
  });
};

app.post("/users/create",function(req, res){
  var firstName = req.body.firstName;
  var lastName  = req.body.lastName;
  var emailAddress = req.body.email;
  var phoneNumber  = req.body.number;
  var password = req.body.password;
  var address = req.body.address;
  var type;
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
app.post('/login',(req,res)=>{
  var emailAddress = req.body.email;
  var password = req.body.password;
  user.findOne({emailAddress : emailAddress},'password accountType',(err,user)=>{
    if(err){
      console.log(err);
    }
    else if (user){
      if(password == user.password) {
        const token  = jwt.sign({}, RSA_priivate_key,{
          algorithm: 'HS256',
          expiresIn: 30
        });
        res.status(200).json({
          token: token,
          accountType: user.accountType,
          expiresIn: 120
          
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

// app.get("/user",function(req,res){
  
// });
app.get('*',function(req,res){
  res.send("Cannot find the specified link").json();
});

app.listen("8000", () => console.log('Listening on port'));