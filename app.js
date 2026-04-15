const express = require("express");
const app = express();
const mongoose = require("mongoose");
const Listing = require("./listing.js");
const path = require("path");
const methodOverride = require("method-override");
const ejsMate = require("ejs-mate");
const wrapAsync = require("./wrapAsync.js");
const ExpressError = require("./ExpressError.js");
const { error } = require("console");
const {listingschema, reviewschema} = require("./schema.js");
const { listenerCount } = require("process");
const Review = require("./review.js");
const { statSync } = require("fs");
const session = require("express-session");
const flash = require("connect-flash");
const passport = require("passport");
const LocalStrategy = require("passport-local");
const User = require("./user.js");











const dbUrl = process.env.ATLASDB_URL || "mongodb://127.0.0.1:27017/wanderlust";

main()
  .then(() => {
    console.log("connected to DB");
  })
  .catch((err) => {
    console.log("DB connection error:", err.message);
  });

async function main() {
  await mongoose.connect(dbUrl);
}

app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));
app.use(express.urlencoded({ extended: true }));
app.use(methodOverride("_method"));
app.engine('ejs', ejsMate);
app.use(express.static(path.join(__dirname, "/public")));

const sessionOptions = {
    secret: process.env.SECRET || "mysupersecretcode",
    resave: false,
    saveUninitialized: true,
    cookie: {
        expires: Date.now() + 7 * 24 * 60 * 60 * 1000,
        maxAge: 7 * 24 * 60 * 60 * 1000,
        httpOnly: true,
    },
};

app.get("/", (req, res) => {
  res.redirect("/listings");
});

app.use(session(sessionOptions));
app.use(flash());

app.use(passport.initialize());
app.use(passport.session());
passport.use(new LocalStrategy(User.authenticate()));

passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

app.use((req, res, next) => {
    res.locals.success = req.flash("success");
    res.locals.error = req.flash("error");
    res.locals.currUser = req.user;
    next();
});
//  Listing_validate
const validateListing = (req, res, next) =>{
  let {error} = listingschema.validate(req.body);
  if (error) {
    let errMsg =error.details.map((el) => el.message).join(",");
    throw new ExpressError(400, errMsg);
  } else {
    next();
  }
};

const isLoggedIn = (req, res, next) => {
    if (!req.isAuthenticated()) {
        req.flash("error", "You must be logged in to perform this action!");
        return res.redirect("/login");
    }
    next();
};




const validateReview = (req, res, next) =>{
  let {error} = reviewschema.validate(req.body);
  if (error) {
    let errMsg =error.details.map((el) => el.message).join(",");
    throw new ExpressError(400, errMsg);
  } else {
    next();
  }
};



//Index Route
// app.get("/listings", (req, res) => {
//   Listing.find({}).then((res) =>{
//     console.log(res);
//   })
// });

app.get("/listings", wrapAsync(async (req, res) => {
  const allListings = await Listing.find({});
  // res.render("listings/index.ejs", {allListings});

  res.render("listings/index.ejs", { allListings });
})
);

//New Route
app.get("/listings/new", isLoggedIn, (req, res) => {
  res.render("listings/new.ejs");
});

//Show Route
app.get("/listings/:id", (async (req, res) => {
  let { id } = req.params;
  const listing = await Listing.findById(id).populate("reviews");
  res.render("listings/show.ejs", { listing });
}));
//c:\\Users\\HP\\Desktop\\project\\NewProject\\views\\listings\\index.ejs


//Create Route
app.post("/listings",
isLoggedIn,
(async (req, res) => {
  const newListing = new Listing(req.body.listing);
  await newListing.save();
  res.redirect("/listings")
  //res.redirect("c:\\Users\\HP\\Desktop\\project\\NewProject\\views\\listings");
})
);


// //create new route
// app.post("\listings", async (req, res) => {
//   let listing = req.body.listing;
//   console.log (listing);
// });


//Edit Route
app.get("/listings/:id/edit", (async (req, res) => {
  let { id } = req.params;
  const listing = await Listing.findById(id);
  res.render("listings/edit.ejs", { listing });
}));

//Update Route
app.put("/listings/:id", (async (req, res) => {
  let { id } = req.params;
  await Listing.findByIdAndUpdate(id, { ...req.body.listing });
  res.redirect(`/listings/${id}`);
}));

//Delete Route
app.delete("/listings/:id", isLoggedIn, (async (req, res) => {
  let { id } = req.params;
  let deletedListing = await Listing.findByIdAndDelete(id);
  console.log(deletedListing);
  res.redirect("/listings");

}));

// review
// post route

app.post("/listings/:id", async(req, res)=>{
  let {id} = req.params;
  let reviewsListing = await Listing.findById(id);
  const newReview = new Review(req.body.review);
  await newReview.save();
  res.redirect("/listings")
  //let newReview = new Review (req.body.review);

  //reviewsListing(newReview);

  //Listing.reviews(newReview);
  //await newReview.save();
  //await listing.save();
  console.log("new feedback save");
  //res.send("new feedback save");

});


// app.get("/testListing", async (req, res)=>{
//   let sampleListings = new Listing({
//     title: String,
//     description: String,
//     image: String,
//     price:Number,
//     location: String,
//     country: String,
// });
//   await sampleListings.save();
//   console.log("sample was saved");
//   res.send("successful");
// });
// app.get("/Listing", async (req, res) => {
//   let sampleListing = new Listing({
//     title: String,
//     description: String,
//     image:{
//       filename: String,
//       URL: String,
//     },
//     price: Number,
//     location: String,
//     country: String,
//   });

//   await sampleListing.save();
//   console.log("sample was saved");
//   res.send("successful");
// });


// app.get("/listings", async (req, res) => {
//    let sampleListings = new Listing({
//       title: "My New Villa",
//       description: "By the beach",
//       image: {
//         type: String,
//         default:
//           "https://images.unsplash.com/photo-1625505826533-5c80aca7d157?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxzZWFyY2h8MTJ8fGdvYXxlbnwwfHwwfHx8MA%3D%3D&auto=format&fit=crop&w=800&q=60",
//         set: (v) =>
//           v === ""
//             ? "https://images.unsplash.com/photo-1625505826533-5c80aca7d157?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxzZWFyY2h8MTJ8fGdvYXxlbnwwfHwwfHx8MA%3D%3D&auto=format&fit=crop&w=800&q=60"
//             : v,
//       },
//       price: 1200,
//       location: "Calangute, Goa",
//       country: "India",
//     });
  
//     await sampleListings.save();
//     console.log("sample was saved");
//     res.send("successful testing");
//   });



// error handeling
// ------------------------------------
// app.all("*",(req, res, next)=>{
//   next(new ExpressError(404, "page not found"));
// });


// app.use((req,res,next) => {
//   let{statusCode = 500, message= "This is wrong" } = err;
//     res.render("error.ejs" ,{message});  
//  // res.send("something is wrong");
// });


// -------------------------------

const port = process.env.PORT || 8080;
app.listen(port, () => {
  console.log(`server is listening to port ${port}`);
});

module.exports = app;

// Authentication Routes
// Signup
app.get("/signup", (req, res) => {
    res.render("users/signup.ejs");
});

app.post("/signup", wrapAsync(async (req, res) => {
    try {
        let { username, email, password } = req.body;
        const newUser = new User({ email, username });
        const registeredUser = await User.register(newUser, password);
        req.login(registeredUser, (err) => {
            if (err) return next(err);
            req.flash("success", "Welcome to Wanderlust!");
            res.redirect("/listings");
        });
    } catch (e) {
        req.flash("error", e.message);
        res.redirect("/signup");
    }
}));

// Login
app.get("/login", (req, res) => {
    res.render("users/login.ejs");
});

app.post("/login", passport.authenticate("local", {
    failureRedirect: "/login",
    failureFlash: true,
}), async (req, res) => {
    req.flash("success", "Welcome back to Wanderlust!");
    res.redirect("/listings");
});

// Logout
app.get("/logout", (req, res, next) => {
    req.logout((err) => {
        if (err) return next(err);
        req.flash("success", "You are logged out!");
        res.redirect("/listings");
    });
});