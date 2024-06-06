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

const userController = {
    async signup(req, res) {
        try {
            const { name, email, password } = req.body;

            if (!name || !email || !password) {
                req.flash('error', 'Data field is empty');
                return res.redirect('/signup'); // Replace with the appropriate form page
            }

            const existingUser = await User.findOne({ email });

            if (existingUser) {
                req.flash('error', 'User already registered.');
                return res.redirect('/login');
            }

            const hashedPassword = await bcrypt.hash(password, 10);

            const user = new User({
                name,
                email,
                password: hashedPassword,
                isVerified: false,
            });

            await user.save();

            // Send verification email
            const verificationToken = uuid.v4();
            user.resetToken = verificationToken;
            user.resetTokenExpiry = Date.now() + 3600000; // Token expires in 1 hour
            await user.save();

            const mailOptions = {
                from: process.env.ADMIN_EMAIL,
                to: process.env.INSTRUCTOR_EMAIL,
                subject: 'Verify this Email',
                text: `Accept the email by clicking this link: http://localhost:3000/verify/${verificationToken}`,
            };

            transporter.sendMail(mailOptions, (error, info) => {
                if (error) {
                    console.error(error);
                    req.flash('error', 'Error sending verification email');
                    return res.redirect('/error');
                } else {
                    console.log('Email sent: ' + info.response);
                    req.flash('success', 'User registered successfully. Wait for the verification.');
                    return res.redirect('/login');
                }
            });
        } catch (error) {
            console.error(error);
            req.flash('error', 'An error occurred');
            return res.redirect('/error');
        }
    },
    async login(req, res) {
        try {
            const { email, password } = req.body;

            if (!email || !password) {
                req.flash('error', 'Data field is empty');
                return res.redirect('/login');
            }

            const user = await User.findOne({ email });

            if (!user) {
                req.flash('error', 'User not found.');
                return res.redirect('/login');
            }

            const isPasswordValid = await bcrypt.compare(password, user.password);

            if (!isPasswordValid) {
                req.flash('error', 'Invalid password');
                return res.redirect('/login');
            }

            if (!user.isVerified) {
                req.flash('error', 'Email not verified. Contact your instructor.');
                return res.redirect('/login');
            }

            req.session.User = user;
            return res.render('student');
        } catch (error) {
            console.error(error);
            req.flash('error', 'An error occurred');
            return res.redirect('/error');
        }
    },

    async forgotpassword(req, res) {
        try {
            const { email } = req.body;

            const user = await User.findOne({ email });

            if (!user) {
                req.flash('error', 'User not found.');
                return res.redirect('/login');
            }

            const resetToken = uuid.v4();
            user.resetToken = resetToken;
            user.resetTokenExpiry = Date.now() + 3600000; // Token expires in 1 hour
            await user.save();

            const mailOptions = {

                from: process.env.ADMIN_EMAIL,
                to: process.env.INSTRUCTOR_EMAIL,
                subject: 'Password Reset',
                text: `Click the following link to reset your password: http://localhost:3000/resetpassword/${resetToken}`,
            };

            transporter.sendMail(mailOptions, (error, info) => {
                if (error) {
                    console.error(error);
                    req.flash('error', 'Error sending reset password email');
                    return res.redirect('/error');
                } else {
                    console.log('Email sent: ' + info.response);
                    req.flash('success', 'Reset Password link sent to your email.');
                    return res.redirect('/login');
                }
            });
        } catch (error) {
            console.error(error);
            req.flash('error', 'An error occurred');
            return res.redirect('/error');
        }
    },

    async resetpassword(req, res) {
        try {
            const { newPassword, resetToken } = req.body;

            const user = await User.findOne({
                resetToken,
                resetTokenExpiry: { $gt: Date.now() },
            });

            if (!user) {
                req.flash('error', 'User not found.');
                return res.redirect('/login');
            }

            const hashedPassword = await bcrypt.hash(newPassword, 10);
            user.password = hashedPassword;
            user.resetToken = undefined;
            user.resetTokenExpiry = undefined;

            await user.save();
            return res.render('login');
        } catch (error) {
            console.error(error);
            req.flash('error', 'An error occurred');
            return res.redirect('/error');
        }
    },

    async resettoken(req, res) {
        try {
            const { token } = req.params;

            const user = await User.findOne({
                resetToken: token,
                resetTokenExpiry: { $gt: Date.now() },
            });

            if (!user) {
                req.flash('error', 'User not found.');
                return res.redirect('/login');
            }

            return res.render('resetpassword', { token });
        } catch (error) {
            console.error(error);
            req.flash('error', 'An error occurred');
            return res.redirect('/error');
        }
    },

    async verifytoken(req, res) {
        try {
            const { token } = req.params;

            const user = await User.findOne({
                resetToken: token,
                resetTokenExpiry: { $gt: Date.now() },
            });

            if (!user) {
                req.flash('error', 'User not found.');
                return res.redirect('/login');
            }

            user.isVerified = true;
            user.resetToken = undefined;
            user.resetTokenExpiry = undefined;

            await user.save();
            req.flash('success', 'Email verification successful');
            return res.redirect('/login');
        } catch (error) {
            console.error(error);
            req.flash('error', 'An error occurred');
            return res.redirect('/error');
        }
    },
};


module.exports = userController