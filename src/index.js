require('dotenv').config()
const express = require("express");
const path = require("path");
const { User, Video, Contact, Staff } = require("./mongodb");
const multer = require('multer');
// const nodemailer = require('nodemailer');
const crypto = require('crypto');
const bcrypt = require('bcrypt');
const session = require('express-session');
const app = express();
const bodyParser = require('body-parser');
const jwt = require('jsonwebtoken');
const uuid = require('uuid');
const flash = require('express-flash');

const port = 3000;
app.listen(port, () => {
    console.log(`Server listening on port ${ port }`)
});


app.use(session({
    secret: process.env.COOKIE_SECRET,
    resave: false,
    saveUninitialized: true,

}));



app.use(flash());
const isAuthenticated = (req, res, next) => {
    if (req.session && req.session.User) {
        return next();
    } else {
        res.redirect('/login');


    }
};
const isAuthenticatedstaff = (req, res, next) => {
    if (req.session && req.session.Staff) {
        return next();
    } else {
        res.redirect('/stafflogin');
    }
};

const isAuthenticatedupload = (req, res, next) => {
    if (req.session && req.session.Staff || req.session.User) {
        return next();
    } else {
        res.redirect('/index');
    }
};




// Static file
app.use(express.static("js"));
app.use(express.static("views"));
app.use('/css', express.static(path.join(__dirname, "./views/css")));
app.use(express.urlencoded({ extended: false }));

app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
//use EJS as the view engine
app.set("view engine", "ejs");

app.get("/", (req, res) => {
    res.render("index");
});
app.get("/index", (req, res) => {
    res.render("index");
});
app.get("/upload", isAuthenticatedupload, (req, res) => {
    res.render("upload");
});

app.get("/about", (req, res) => {
    res.render("about");
});
app.get("/courses", (req, res) => {
    res.render("courses");
});
app.get("/select", (req, res) => {
    res.render("select");
});

app.get("/student", isAuthenticated, (req, res) => {
    res.render("student");
});

app.get("/login", (req, res) => {
    res.render("login");
});
app.get("/signup", (req, res) => {
    res.render("signup");
});

app.get("/resetpassword", (req, res) => {
    res.render("resetpassword");
});

app.get("/contact", (req, res) => {
    res.render("contact");
});
//staff
app.get("/stafflogin", (req, res) => {
    res.render("stafflogin");
});
app.get("/staffsignup", (req, res) => {
    res.render("staffsignup");
});
app.get("/staffforgotpassword", (req, res) => {
    res.render("staffforgotpassword");
});
app.get("/staffresetpassword", (req, res) => {
    res.render("staffresetpassword");
});
app.get("/error", (req, res) => {
    res.render("error");
});
app.get('/staffupload', isAuthenticatedstaff, (req, res) => {
    res.render('staffupload');
});

require('./route')(app)



const storage = multer.diskStorage({
    destination: 'uploads/',
    filename: function(req, file, cb) {
        cb(null, file.fieldname + '-' + Date.now() + path.extname(file.originalname));
    }
});

const upload = multer({ storage: storage });

app.use('/uploads', express.static('uploads', { headers: { 'Content-Type': 'video/mp4' } }));

// Handle video upload

app.post('/upload', upload.single('video'), (req, res) => {
    try {
        // Check if file is uploaded
        if (!req.file) {
            req.flash('error', 'No file uploaded');
            return res.redirect('/staffupload');
        }

        const { videoName, videoDescription } = req.body;
        const filename = req.file.filename;

        // Check for empty fields
        if (!filename || !videoName || !videoDescription) {
            req.flash('error', 'Required all fields');
            return res.redirect('/staffupload');
        }

        const newVideo = new Video({
            videoName,
            videoDescription,
            filename
        });

        newVideo.save()
            .then(video => {
                res.json(video);
            })
            .catch(error => {
                console.error('Error saving video to database:', error);
                res.render("error");
            });
    } catch (error) {
        console.error('Error processing upload:', error);
        res.render("error");
    }
});
app.get('/videos', (req, res) => {
    Video.find({})
        .exec()
        .then(videos => {
            res.render("videos");
        })
        .catch(error => {
            console.error('Error retrieving videos from database:', error);
            res.render("error");
        });
});

// API endpoint to get video data as JSON
app.get('/api/videos', (req, res) => {
    Video.find({})
        .exec()
        .then(videos => {
            res.json(videos);
        })
        .catch(error => {
            console.error('Error retrieving videos from database:', error);
            res.render("error");
        });
});