var mongoose = require("mongoose");


var commentSchemma= new mongoose.Schema({
    text:String,
    author:{
        id:{
            type:mongoose.Schema.Types.ObjectId,
            ref:"User"
        },
        username:String
    }
});
var Comment=mongoose.model("Comment",commentSchemma);





module.exports=Comment;