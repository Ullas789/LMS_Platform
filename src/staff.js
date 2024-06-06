require('dotenv').config()
const express = require("express");
const path = require("path");
const { User, Video, Contact, Staff } = require("./mongodb");
const multer = require('multer');
const nodemailer = require('nodemailer');
const crypto = require('crypto');
const bcrypt = require('bcrypt');
const session = require('express-session');
const app = express();
const bodyParser = require('body-parser');
const jwt = require('jsonwebtoken');
const uuid = require('uuid');
const flash = require('express-flash');
const transporter = require("./middleware")

const staffController = {

    async staffsignup(req, res) {
        try {
            const { sname, semail, spassword } = req.body;
            if (sname === '' || semail === '' || spassword === '') {
                req.flash('error', 'Data Field is empty');
                return res.redirect('/stafflogin'); // Replace with the appropriate form page
            }
            const existingStaff = await Staff.findOne({ semail });
            const emailRegex = /^[^\s@]+@vvce\.ac\.in$/; //example@lms.ac.in
            if (!emailRegex.test(semail)) {
                res.send('<script>alert("You are not authorized."); window.location.href="/stafflogin";</script>');
            }


            if (existingStaff) {
                res.send('<script>alert("User is already registered."); window.location.href="/stafflogin";</script>');
            }
            const hashedPassword = await bcrypt.hash(spassword, 10);

            const staff = new Staff({
                sname,
                semail,
                spassword: hashedPassword,
                isVerified: false,
            });

            await staff.save();

            // Send verification email
            const verificationToken = uuid.v4();
            staff.resetToken = verificationToken;
            staff.resetTokenExpiry = Date.now() + 3600000; // Token expires in 1 hour
            await staff.save();

            const mailOptions = {

                from: process.env.ADMIN_EMAIL,
                to: process.env.INSTRUCTOR_EMAIL,
                subject: 'Verify Your Email',
                text: `Click the following link to verify your email: http://localhost:3000/staffverify/${verificationToken}`,
            };

            transporter.sendMail(mailOptions, (error, info) => {
                if (error) {
                    console.error(error);
                    res.render('error');
                } else {
                    console.log('Email sent: ' + info.response);

                    res.send('<script>alert("Staff registered successfully. Verification email sent."); window.location.href="/stafflogin";</script>');

                }
            });
        } catch (error) {
            console.error(error);
            res.render("error");
        }
    },

    async stafflogin(req, res) {
        try {
            const { semail, spassword } = req.body;

            const staff = await Staff.findOne({ semail });
            if (semail === '' || spassword === '') {
                req.flash('error', 'All fields are required');
                return res.redirect('/stafflogin');

            }

            if (!staff) {
                req.flash('error', 'User not found');
                return res.redirect('/stafflogin');
            }

            const isPasswordValid = await bcrypt.compare(spassword, staff.spassword);

            if (!isPasswordValid) {
                req.flash('error', 'Invalid password');
                return res.redirect('/stafflogin');
            }

            if (!staff.isVerified) {
                res.send('<script>alert("User registered successfully. Wait for the Verification."); window.location.href="/stafflogin";</script>');
            }
            if (staff) {
                req.session.Staff = staff;
                res.render("staffupload");
            }

        } catch (error) {
            console.error(error);
            res.render("error");
        }
    },

    // Handle forgot password
    async staffforgotpassword(req, res) {
        try {
            const { semail } = req.body;

            const staff = await Staff.findOne({ semail });

            if (!staff) {
                req.flash('error', 'User not found');
                return res.redirect('/stafflogin');
            }

            const resetToken = uuid.v4();
            staff.resetToken = resetToken;
            staff.resetTokenExpiry = Date.now() + 3600000; // Token expires in 1 hour
            await staff.save();

            const mailOptions = {
                from: process.env.ADMIN_EMAIL,
                to: process.env.INSTRUCTOR_EMAIL,
                subject: 'Password Reset',
                text: `Click the following link to reset your password: http://localhost:3000/staffresetpassword/${resetToken}`,
            };

            transporter.sendMail(mailOptions, (error, info) => {
                if (error) {
                    console.error(error);
                    res.render("error");
                } else {
                    console.log('Email sent: ' + info.response);
                    res.send('<script>alert("Reset Password link sent to your instructor."); window.location.href="/stafflogin";</script>');


                }
            });
        } catch (error) {
            console.error(error);
            res.render("error");
        }
    },

    async staffresetpassword(req, res) {
        try {
            const { snewPassword, resetToken } = req.body;

            const staff = await Staff.findOne({
                resetToken,
                resetTokenExpiry: { $gt: Date.now() }, // Check if the reset token is still valid
            });

            if (!staff) {
                req.flash('error', 'User not found');
                return res.redirect('/stafflogin');
            }

            const hashedPassword = await bcrypt.hash(snewPassword, 10);
            staff.spassword = hashedPassword;
            staff.resetToken = undefined;
            staff.resetTokenExpiry = undefined;

            await staff.save();
            res.render("stafflogin");
        } catch (error) {
            console.error(error);
            res.render("error");
        }
    },
    async staffresettoken(req, res) {
        try {
            const { token } = req.params;

            // TODO: Check if the token is valid and not expired in the database
            const staff = await Staff.findOne({
                resetToken: token,
                resetTokenExpiry: { $gt: Date.now() },
            });

            if (!staff) {
                return res.send('<script>alert("Token expired"); window.location.href="/stafflogin";</script>');
            }

            // Token is valid, render the password reset page with the token
            res.render('staffresetpassword', { token });
            // Adjust the above code based on your templating engine and application structure
        } catch (error) {
            console.error(error);
            res.render("error");
        }
    },

    async staffverifytoken(req, res) {
        try {
            const { token } = req.params;

            const staff = await Staff.findOne({
                resetToken: token,
                resetTokenExpiry: { $gt: Date.now() }, // Check if the verification token is still valid
            });

            if (!staff) {
                return res.send('<script>alert("Token expired"); window.location.href="/stafflogin";</script>');
            }

            staff.isVerified = true;
            staff.resetToken = undefined;
            staff.resetTokenExpiry = undefined;

            await staff.save();
            res.send('<script>alert("Email verification successful");  window.location.href="/stafflogin"</script>');

        } catch (error) {
            console.error(error);
            res.render("error");
        }
    }

}
module.exports = staffController