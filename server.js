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


//User schema 
var usrSchema = new mongoose.Schema(
  {
    username: {type : String,required : true},
    password: {type : String, required : true },
    emailAddress: {type : String,required : true },
    accountType: {type: String, required: true, default: "student"}
  }
);
usrSchema.plugin(autoIncrement.plugin, 'usr');
var usr = mongoose.model('usr',usrSchema);

//Item schema 
let videoSchema = new mongoose.Schema({
  teacherName: {type: String, required: true},
  teacherId: {type: Number , required: true},
  topic: {type: String, required: true},
  videoUrl: {type: String, required: true}


})
videoSchema.plugin(autoIncrement.plugin,'video');
var video = mongoose.model('video',videoSchema);


//creating a user
app.post("/users/create",function(req, res){
  var username = req.body.username;
  var emailAddress = req.body.emailAddress;
  var password = req.body.password;
  var type;
  var password = bcrypt.hashSync(password);
  console.log(password);
  if (req.body.accountType) {
    type = req.body.accountType;
  }
  console.log(password,req.body);
  usr.create(
    {
      
      username : username,
      emailAddress : emailAddress,
      password: password,
      accountType: type
    },
    function(err,command){
      if(err) {
        console.log("error is there");
        console.log(err)
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


//uploading a video on database
app.post('/video/create',(req,res)=>{
  let topic,teacherName,videoUrl,teacherId;
  
  teacherId = req.body.teacherId
  console.log('item create request is: ',teacherId)

  teacherId = parseInt(teacherId)
  topic  = req.body.topic;
  teacherName = req.body.teacherName;
  videoUrl = req.body.videoUrl;
  
  video.create({
    teacherName: teacherName,
    topic: topic,
    videoUrl:videoUrl,
    teacherId: teacherId
  }
    
  ,(err,video)=>{
    if(err){
      console.log(err);
      res.json({error:'creation error'})
    }
    else {
      res.json({creation: true})
    }
  });
});

// getting all videos
app.get('/video',(req,res)=>{
  video.find({},(err,video)=>{
    if(err){
      res.json({error: 'found nothing'});
    }
    else {
     
      res.json(video);
    }
    
  });
  
})

//Getting videos of a specific teahcer 

app.get('/video/user/:id',(req,res)=>{
  var id = req.params.id;
  video.find({teacherId: id},(err,video)=>{
    if(err){
      console.log(err);
      res.json(null);
    }
    else if(video){
      res.json({video});
    }
  })



});




//Post method to for login
app.post('/login',(req,res)=>{
  let emailAddress = req.body.emailAddress;
  let password = req.body.password;
  console.log(req.body);
  usr.findOne({emailAddress : emailAddress},'password accountType _id',(err,usr)=>{
    if(err){
      console.log(err);
    }
    else if (usr){
      console.log(usr._id);
      if(bcrypt.compareSync(password,usr.password)) {
       
        res.json({
          accountType: usr.accountType,
          id: usr._id
          
        });
      }
      else if(password != usr.password) {
        res.json({accountType: "wrong"});
      }
    }
    else {
      res.json({accountType: "completely wrong"});
    }
    
  });
}
);


//post method for getting a specific user
app.get("/user/:id",function(req,res){
  var id = req.params.id;
  usr.findOne({_id: id},(err,usr)=>{
    if(err){
      console.log(err,'something');
    }
    else if(usr){
      console.log('sending');
      res.json({
        user: usr
      });
    }
    else {
      console.log("found nothing");
      res.json({user: null});
    }
  });
});
app.get('*',function(req,res){
  res.send("Cannot find the specified link").json();
});

app.listen("8000", () => console.log('Listening on port'));