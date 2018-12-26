var mongoose= require("mongoose");
var passportlocalmongoose=require("passport-local-mongoose");

var userSchema=new mongoose.Schema({
    username:String,
    password:String
});

userSchema.plugin(passportlocalmongoose);

var User=mongoose.model("User",userSchema);
module.exports=User;