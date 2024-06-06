require('dotenv').config()
const mongoose = require('mongoose');

const connect = mongoose.connect(process.env.MONGO_CONNECTION_URL, { useNewUrlParser: true, useUnifiedTopology: true });
// Check database connected or not
connect.then(() => {
        console.log("Database Connected Successfully");
    })
    .catch(() => {
        console.log("Database Not Connected");
    })
    //user db model
const userSchema = new mongoose.Schema({
    name: String,
    email: String,
    password: String,
    resetToken: String,
    resetTokenExpiry: Date,
    isVerified: Boolean,
});

// Create the User model
const User = mongoose.model('User', userSchema);

//video db  model
const videoSchema = new mongoose.Schema({
    videoName: String,
    videoDescription: String,
    filename: String,
    uploadDate: { type: Date, default: Date.now }
});

const Video = mongoose.model('Video', videoSchema);


//contact db model
const contactSchema = new mongoose.Schema({
    cname: String,
    email: String,
    message: String

})
const Contact = mongoose.model('Contact', contactSchema);


//staff db model
const staffSchema = new mongoose.Schema({
    sname: String,
    semail: String,
    spassword: String,
    resetToken: String,
    resetTokenExpiry: Date,
    isVerified: Boolean,
});

// Create the User model
const Staff = mongoose.model('Staff', staffSchema);


//exporting all  model
module.exports = { User, Video, Contact, Staff };