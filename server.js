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

//Item schema 
let itemSchema = new mongoose.Schema({
  name: {type: String, required: true},
  brand: {type: String, required: true},
  price: {type: Number, required: true},
  amount: {type: Number, required: true},
  category: {type: String, required: true},
  image : {type: String,required: true},
  detail: {type: String, required: true},
  owner_id: {type: Number, required: true}


})
itemSchema.plugin(autoIncrement.plugin,'item');
var item = mongoose.model('item',itemSchema);


//orderSchema

let orderSchema = new mongoose.Schema({
  owner_id        : {type: Number, required: true},
  productId       : {type: Number, required: true},
  productName     : {type: String, required: true},
  productPrice    : {type: Number, required: true},
  orderStatus     : {type: String, required: true, default: 'Pending'},
  user_id         : {type: Number, required: true},
  username        : {type: String, required: true},
  user_address    : {type: String, required: true},
  user_phoneNumber: {type: String, required: true}
})
orderSchema.plugin(autoIncrement.plugin,'order');
var order = mongoose.model('order',orderSchema);


// Shop Schema 

let shopSchema = new mongoose.Schema({
  owner_id: {type: Number, required: true},
  shopPrivilages: {type: Boolean, required: true, default: false},
  shopRequest   : {type: Boolean, required: true, default: true},
  shopOwner     : {type: String,required: true},
  shopAddress   : {type: String,required: true},
  shopNumber    : {type: String, required: true}
});
shopSchema.plugin(autoIncrement.plugin,'shop');
var shop = mongoose.model('shop',shopSchema);


//middlware for token verifiction
var verification = function(req,res,next){
  var token = req.get('token');
  var id    = req.get('id');
  
  if(token){
    console.log(token)
    console.log(jwt.decode(token));
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
        if(id == decoded.id){
          next();
        }
        else {
          res.json(
            {
              token: null,
              user : null
            })
        }
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
  let owner_id    = req.get('id');
  console.log('item create request is: ',owner_id)
  
  name  = req.body.name;
  brand = req.body.brand;
  price = req.body.price;
  price = parseInt(price);
  amount= req.body.amount;
  amount = parseInt(amount);
  detail= req.body.detail;
  image = req.body.image;
  category = req.body.category;
  
  item.create({
    name: name,
    brand: brand,
    price: price,
    amount: amount,
    category: category,
    image : image,
    detail: detail,
    owner_id: owner_id
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

// returns item list
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

//Items upgrade level 

app.post('/order/update',verification,(req,res)=>{
  console.log('in update item');
  var order_id = req.body.order_id;
  var token = req.get('token');
  var newStatus  = req.body.orderStatus;
  
    order.findOneAndUpdate({_id: order_id},{orderStatus: newStatus},(err,updated)=>{
      if(err){
        console.log('err');
        res.json({token:token,result:false});
      }
      else {
        console.log('asiudashdkasudasuhdasuhdiuewhhiwuheqwiueh');
        res.json({token:token,result:true});
      }
    })
  }
);

app.post('/order/delete',verification,(req,res)=>{
  console.log('in delete item');
  var order_id = req.body.order_id;
  var item_id  = req.body.item_id;
  var token = req.get('token');
    order.findOneAndDelete({_id: order_id},(err,updated)=>{
      if(err){
        console.log('err');
        res.json({token:token,result:false});
      }
      else {
        console.log('asiudashdkasudasuhdasuhdiuewhhiwuheqwiueh');
        item.findById(item_id,'amount',(err,Item)=>{
          Item.amount = Item.amount + 1;
          Item.save();
        })
        res.json({token:token,result:true});
      }
    })
})

//SIngle item get
app.get('/shopItems',verification,(req,res)=>{
  var token = req.get('token');
  var id    = req.get('id');
  console.log(token,id);
  item.find({owner_id:id},(err,item)=>{
    if(err){
      res.json({token: token,shopItems: null});
    }
    else{
      res.json({token: token, shopItems: item});
    }
    
  })
  console.log(id);
});

//creating a order 
app.post('/order/create', verification,(req,res)=>{
  
  let productId = req.body.item_id;
  let userId = req.get('id');
  var token = req.get('token');
  var username = "";
  var user_address = "";
  var user_phoneNumber = "";
  let orderStatus;
  var owner_id = req.body.owner_id;
  if(req.body.status){
    orderStatus = req.body.status;
  }
  user.findById(userId,'firstName lastName address phoneNumber',(err,user)=>{
    username = user.firstName + user.lastName;
    user_address = user.address;
    user_phoneNumber = user.phoneNumber;
  });
 
  item.findById(productId, 'amount name price', (err,Item)=>{
    
    if(err){
      console.log(err)
    }
    else {
      if(Item.amount > 0){
        Item.amount -= 1;
        Item.save((err,updItem)=>{
          if(err){

          }
          else {
            console.log(productId,Item.name,Item.price,orderStatus,username,userId,user_address,user_phoneNumber);
            order.create({
              owner_id        : owner_id,
              productId       : productId,
              productName     : Item.name,
              productPrice    : Item.price,
              orderStatus     : orderStatus,
              user_id         : userId,
              username        : username,
              user_address    : user_address,
              user_phoneNumber: user_phoneNumber
            },(err,order)=>{
              if(err){
                res.json({token: token,message: false});
              }
              else {
                res.json({token: token,message: true});
              }

            })
          }
        });
      }
      else {
        res.json(
          {token: token,
          massage: false
        });
      }
    }

  });
});


//Getting orders by id
app.get('/order/:id',verification,(req,res)=>{
  var token = req.get('token');
  var id = req.params.id;
  order.find({owner_id: id},(err,orders)=>{
    if(err){
      res.json(null);
    }
    else if(orders){
      
      res.json({token: token,orders: orders});
    }
  })



});

//Geting user orders 

app.get('/order/user/:id',verification,(req,res)=>{
  var token = req.get('token');
  var id = req.params.id;
  order.find({user_id: id},(err,orders)=>{
    if(err){
      console.log(err);
      res.json(null);
    }
    else if(orders){
      res.json({token: token,orders});
    }
  })



});


// Shop creation and notifications area 

// Shop Request making area

app.post('/shop/request',verification,(req,res)=>{
   var id = req.get('id');
   var token = req.get('token');
   console.log(req.body);
   var owner   = req.body.shopOwner;
   var address = req.body.shopAddress;
   var number  = req.body.shopNumber;
   shop.create({
    owner_id: id,
    shopOwner: owner,
    shopAddress: address,
    shopNumber : number
   },(err,shopRequest)=>{
     if(err){
       res.json({token: token,result: false});
     }
     else if(shopRequest){
       res.json({token: token, result: true})
     }
   })
});

app.get('/shopRequests',verification,(req,res)=>{
  var token = req.get('token');
  shop.find({},"-__v",(err,shopRequests)=>{
    if(err){
      console.log(err);
      res.json({token: token,shopRequests: null});
    }
    else {
      res.json({token: token,shopRequests: shopRequests});
    }
  })
})

app.post('/shop/upgrade/:owner_id',verification,(req,res)=>{
  var token = req.get('token');
  var owner_id = req.params.owner_id;
  console.log(owner_id);
  shop.findOneAndUpdate({owner_id:owner_id},{shopPrivilages:true},(err,doc)=>{
    if(err){
      res.json({token:token,result:false})
    }
    else {
      res.json({token:token,result:true});
    }
  })
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
        const token  = jwt.sign({id: user._id, accountType: user.accountType}, RSA_priivate_key,{
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