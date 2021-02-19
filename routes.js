const express=require('express');
const routes=express.Router();
var bodyParser = require("body-parser")
var mongoose = require("mongoose")
const bcrypt= require("bcryptjs");
const user=require('./models.js')
const passport=require('passport');
const session=require('express-session');
const cookieParser=require('cookie-parser');
// const flash=require('connect-flash');
routes.use(bodyParser.json())
routes.use(bodyParser.urlencoded({
    extended:true
}))
// routes.use('/static', express.static('static'))
routes.use(cookieParser('secret'));
routes.use(session({
    secret: 'secret',
    maxAge:3600000,
    resave:true,
    saveUninitialized:true,

}));

routes.use(passport.initialize());
routes.use(passport.session());

/*routes.use(flash());
routes.use(function(res,req,next)
{
   res.locals.success_message=req.flash('success_message');
   res.locals.error_message=req.flash('error-message');
   res.locals.error=req.flash('error');
   next() ;
});*/

mongoose.connect('mongodb://localhost:27017/Contactdb',{
    useNewUrlParser: true,
    useUnifiedTopology: true
});



var db = mongoose.connection;

db.on('error',()=>console.log("Error in Connecting to Database"));
db.once('open',()=>console.log("Connected to Database"));
routes.get('/', (req,res) =>{
    res.status(200).render('index')

}
)
routes.get("/contact",(req, res) =>{ 
    
    res.status(200).render('contact')
}); 
routes.post("/contact",(req,res)=>{
    var name = req.body.name;
    var phone = req.body.phone;

    var email = req.body.email;
    var desc = req.body.desc;

    var data = {
        "name": name,
        "phone" : phone,
        "email": email,
        "desc" : desc
    }

    db.collection('Contact').insertOne(data,(err,collection)=>{
        if(err){
            throw err;
        }
        
        console.log("Record Inserted Successfully");
    });

    return res.render('contactsuccess');

})
routes.get("/register",(req, res) =>{ 
    
    res.status(200).render('register')

});
routes.post("/register",(req, res) =>{ 
    
    var { name, email, password, confirmpassword } = req.body;
    var err;
    // check if the are empty 
    if (!name || !email || !password || !confirmpassword) {
        err="please fill all the details...";
        res.render("register", { 'err': err});
    }
    if (password!=confirmpassword) {
        err="password do not match";
        res.render("register", { 'err': err , 'email':email, 'name':name});
    }
    if(typeof err=='undefined')
    {
        user.findOne({ email : email}, function(err,data)
        {
            if(err)
             throw err;
            if(data)
            {
              console.log('user exist');  
              err="User already exists";
              res.render("register", { 'err': err , 'name':name, 'email':email});
            }  
            else{
                 // generate a salt
                 bcrypt.genSalt(10, (err, salt) => {
                    if (err) throw err;
                    // hash the password
                    bcrypt.hash(password, salt, (err, hash) => {
                        if (err) throw err;
                        password=hash;
                        // save user in db
                        user({
                            name,
                            email,
                            password,
                        }).save((err, data) => {
                            if (err) throw err;
                            // login the user
                            // use req.login
                            // redirect , if you don't want to login
                            res.redirect('/login');
                        });
                    });
                });
            }
        });
    }
});


//start of authentication strategy
var localStrategy=require('passport-local').Strategy;
passport.use(new localStrategy({ usernameField: 'email' }, (email, password, done) => {
    user.findOne({ email: email }, (err, data) => {
        if (err) throw err;
        if (!data) {
            return done(null, false);
        }
        bcrypt.compare(password, data.password, (err, match) => {
            if (err) {
                return done(null, false);
            }
            if (!match) {
                return done(null, false);
            }
            if (match) {
                return done(null, data);
            }
        })
    })
}));

passport.serializeUser(function (user, done) {
    done(null, user.id);
});

passport.deserializeUser(function (id, done) {
    user.findById(id, function (err, user) {
        done(err, user);
    });
});

routes.get("/login",(req, res) =>{ 
    
    res.status(200).render('login')
}); 

routes.post('/login', (req, res, next) => {
    passport.authenticate('local', {
        failureRedirect: '/login',
        successRedirect: '/success',
        //failureMessage:true,
        // failureFlash: true,
    })(req, res, next);
});

routes.get('/success', (req, res) => {
    res.render('success');
});

module.exports=routes;
