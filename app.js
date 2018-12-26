var express=require("express");
var app=express();
app.use(express.static(__dirname+"/public"));

var connectflash=require("connect-flash");
app.use(connectflash());


var bodyparser=require("body-parser");
app.use(bodyparser.urlencoded({extended:true}));

var mongoose = require("mongoose");
//mongoose.connect("mongodb://localhost:27017/yelpcamp",{useNewUrlParser: true });
mongoose.connect("mongodb://jiaming:15040huhu@ds143604.mlab.com:43604/camp",{ useNewUrlParser: true });


var Camp=require("./modules/campground.js");
var Comment=require("./modules/comment.js");
var seedDB=require("./seedDB.js");
//seedDB();

var methodoverride =require("method-override");
app.use(methodoverride("_method"));


var passport=require("passport");
var localstrategy=require("passport-local");
var passportlocalmongoose=require("passport-local-mongoose");
var expresssession=require("express-session");
var User=require("./modules/user.js");





app.use(expresssession({
    secret:"emmmmmm",
    resave:false,
    saveUninitialized:false
}));
app.use(passport.initialize());
app.use(passport.session());
passport.use(new localstrategy(User.authenticate()));
passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());
app.use(function(req,res,next){
    res.locals.currentUser=req.user;
    res.locals.error=req.flash("error");
    res.locals.success=req.flash("success");
    next();
});






app.get("/",function(req,res){
   res.render("home.ejs"); 
});
app.get("/campground",function(req,res){
    Camp.find({},function(err,camp){
        if(err){
            console.log(err);
        }
        else{
            res.render("campground.ejs",{campground:camp});
        }
    });
});


//campground
app.get("/campground/new",isLoggedIn,function(req,res){
    res.render("add.ejs");
});
app.post("/campground",isLoggedIn,function(req,res){
    var name=req.body.name;
    var price=req.body.price;
    var url=req.body.url;
    var des=req.body.des;
    var author={
        id:req.user._id,
        username:req.user.username
    }
            Camp.create({
            name:name,
            price:price,
            url:url,
            des:des,
            author:author
        },function(err,camp){
            if(err){
                console.log("There is something wrong");
            }else{
                console.log(camp);
            }
        });
    res.redirect("/campground");
});



app.get("/campground/:id",function(req,res){
    Camp.findById(req.params.id).populate("comments").exec(function(err,camp){
        if(err){
            console.log("ehhh");
        }else{
            res.render("show.ejs",{camp:camp});
        }
    });
});


app.get("/campground/:id/edit",owncamp,function(req,res){
    Camp.findById(req.params.id,function(err,camp){
        res.render("editpicture.ejs",{camp,camp});
    });
})
app.put("/campground/:id",owncamp,function(req,res){
    Camp.findByIdAndUpdate(req.params.id,req.body.camp,function(err,camp){
        if(err){
            res.redirect("/campground");
        }else{
            res.redirect("/campground/"+req.params.id);
        }
    })
})

app.delete("/campground/:id",owncamp,function(req,res){
    Camp.findByIdAndRemove(req.params.id,function(err){
        if(err){
            res.redirect("/campground");
        }else{
            req.flash("success","You success delete")
            res.redirect("/campground");
        }
    })
})






//comments
app.get("/campground/:id/comments/new",isLoggedIn,function(req,res){
    Camp.findById(req.params.id,function(err,camp){
        if(err){
            console.log("fail");
        }else{
            res.render("newcomments.ejs",{camp:camp});
        }
    })
});


app.post("/campground/:id/comments",isLoggedIn,function(req,res){
    var author={
        id:req.user._id,
        username:req.user.username
    }
    Camp.findById(req.params.id,function(err,camp){
        if(err){
            console.log("fail");
            res.redirect("/campground");
        }else{
            Comment.create({
                text:req.body.comment,
                author:author
            },function(err,comment){
                if(err){
                    console.log("createcomment fail");
                }else{
                    comment.save;
                    camp.comments.push(comment);
                    camp.save();
                    req.flash("success","Create comment success")
                    res.redirect("/campground/"+req.params.id);
                }
            })
        }
    })
});
app.get("/campground/:id/comments/:commentsid/edit",owncomment,function(req,res){
    Camp.findById(req.params.id,function(err,camp){
        if(err){
            console.log("can not find camp");
        }else{
            Comment.findById(req.params.commentsid,function(err,comment){
                if(err){
                    console.log("can not find comment");
                }else{
                     res.render("editcomment.ejs",{camp:camp,comment:comment});
                }
            })
        }
    })
});
app.put("/campground/:id/comments/:commentsid/",owncomment,function(req,res){
    
    Comment.findByIdAndUpdate(req.params.commentsid,req.body.comment,function(err,comment){
        if(err){
            console.log("wrong");
        }else{
            res.redirect("/campground/"+req.params.id);
        }
    })
});
app.delete("/campground/:id/comments/:commentsid",owncomment,function(req,res){
    Comment.findByIdAndRemove(req.params.commentsid,function(err){
        if(err){
            res.redirect("/campground");
        }else{
            req.flash("success","You success delete")
            res.redirect("/campground/"+req.params.id);
        }
    })
})



//authenticate
app.get("/register",function(req,res){
    res.render("register.ejs");
});
app.post("/register",function(req,res){
    var newuser=new User({username:req.body.username});
    User.register(newuser,req.body.password,function(err,user){
        if(err){
            req.flash("error",err.message);
            return res.redirect("/register");
        }else{
            req.flash("success","Welcome"+user.username+"!!")
            passport.authenticate("local")(req,res,function(){
                res.redirect("/campground");
            })
        }
    })
})
app.get("/login",function(req,res){
    res.render("login.ejs");
})
app.post("/login",passport.authenticate("local",{
    successRedirect:"/campground",
    failureRedirect:"/login"
}),function(req,res){
})
app.get("/logout",function(req,res){
    req.logout();
    req.flash("success","Logged Out!")
    res.redirect("/campground");
})

//middleware
function isLoggedIn(req,res,next){
    if(req.isAuthenticated()){
        return next();
    }
    req.flash("error","You need to login first");
    res.redirect("/login");
}
function owncamp(req,res,next){
    if(req.isAuthenticated()){
        Camp.findById(req.params.id,function(err,camp){
            if(err){
                console.log("wrong");
            }else{
                if(camp.author.id.equals(req.user._id)){
                    next();
                }else{
                    req.flash("error","You do not have permission to do that!")
                    res.redirect("/campground"+req.params.id);
                }
            }
        })
    }else{
        res.redirect("/login");
    }
}
function owncomment(req,res,next){
    if(req.isAuthenticated()){
        Comment.findById(req.params.commentsid,function(err,comment){
            if(err){
                console.log("wrong");
            }else{
                if(comment.author.id.equals(req.user._id)){
                    next();
                }else{
                     req.flash("error","You do not have permission to do that!")
                     res.redirect("/campground"+req.params.id);
                }
            }
        })
    }else{
        res.redirect("/login");
    }
}


//listen
app.listen(process.env.PORT,process.env.IP,function(){
   console.log("The server started"); 
});