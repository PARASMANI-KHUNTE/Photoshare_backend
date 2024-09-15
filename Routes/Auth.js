const express = require('express');
const router = express.Router();
const user = require('../Database/Models/User.js');
const bcrypt = require('bcrypt');
const Jwt = require('jsonwebtoken');
const Salt = process.env.SALT;
const SecretKey = process.env.JWT_SECRET;
const sendOTP = require('../Modules/Nodemailer.js')
const verifyToken = require('../Modules/VerifyToken.js')
const userDB = {};




router.get('/',(req,res)=>{
    res.json({
        message : "Not A USer"
    })
})


router.post("/signup",async (req,res)=>{
    const {Fullname , Email , Username , Password} = req.body;

    if(!Fullname || !Email || !Username || !Password){
        return res.status(204).json({
            message : "Missing Information"
        })
    }

    try {
        const existUser = await user.findOne({Username , Email });
        if(existUser){
            return res.status(409).json({
                message : "User Already Exist."
            })
        }

        const hashedPassword = await bcrypt.hash(Password,parseInt(Salt));

        const UserData = new user({
            Fullname : Fullname,
            Email : Email,
            Username : Username,
            Password : hashedPassword
        });

        const userDataSave = await UserData.save();
        
        if(userDataSave){
            const generateOtpp = await sendOTP(Email)
            userDB[Email] = { otp: generateOtpp, timestamp: Date.now() };
            return res.status(200).json({
                success : true ,
                message : "User Data has been saved.",
                Otp : generateOtpp
            })
        }else{
            return res.status(422).json({
                success : false ,
                message : "Failed to Save user data."
            })
        }
    } catch (error) {
        console.log(`${error}`)
        return res.status(400).json({
            message : `${error}`
        })
    }
})


// Verify OTP route
router.post('/verifyOtp', async (req, res) => {
    const { email, otp } = req.body;

    // Ensure both email and otp are provided
    if (!email || !otp) {
        return res.status(400).json({ success: false, message: 'Missing email or OTP' });
    }

    // Check if OTP exists for the email
    const storedData = userDB[email];

    if (!storedData) {
        return res.status(400).json({ success: false, message: 'OTP not generated or expired' });
    }

    // Convert both OTPs to strings (if they aren't already) before comparison
    if (storedData.otp.toString() === otp.toString()) {
        // OTP is correct, proceed with verification
        try {
            const User = await user.findOne({ Email: email });
          
            if (!User) {
              return res.status(404).json({ success: false, message: 'User not found' });
            }
          
            // Efficiently update `isVerified` using conditional assignment
            User.IsVerified = User.IsVerified ? User.IsVerified : true;  // Set to true only if not already true
            await User.save();
          
            // Remove OTP from in-memory store (optional, based on your use case)
            delete userDB[email];
          
            return res.status(200).json({ success: true, message: 'OTP verified successfully' });
          } catch (error) {
            console.error('Error verifying OTP:', error.message);
            return res.status(500).json({ success: false, message: 'Internal server error' });
          }
    } else {
        // OTP is incorrect
        return res.status(400).json({ success: false, message: 'Invalid OTP' });
    }
});

// Login Route
router.post("/login", async (req, res) => {
    const { Username, Password } = req.body;

    if (!Username || !Password) {
        return res.status(400).json({
            message: "Missing Credentials"
        });
    }

    try {
        const existingUser = await user.findOne({ Username });
        if (!existingUser) {
            return res.status(404).json({
                message: "User not found."
            });
        }

        // Check password
        const isPasswordValid = await bcrypt.compare(Password, existingUser.Password);
        if (!isPasswordValid) {
            return res.status(401).json({
                message: "Invalid credentials."
            });
        }

        // Generate JWT
        const token = Jwt.sign({ id: existingUser._id, username: existingUser.Username }, SecretKey, {
            expiresIn: '1h' // Token expires in 1 hour
        });
        
        // return res.status(200).cookie( "token" , token , { expires: new Date(Date.now() + 3600000), httpOnly: true }).cookie( "username" , existingUser.Username , { expires: new Date(Date.now() + 3600000), httpOnly: true }).json({
        //     success : true ,
        //     message: "Login successful",
        //     token,
        //     username: existingUser.Username
        // }); // Set cookie with expiration time (1 hour)
        // Set cookies for token and username
        res.cookie('token', token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'Strict',
            maxAge: 3600000,
          });

        res.cookie('username', existingUser.Username, {
            httpOnly: false,  // Can be accessed from client-side JS
            maxAge: 3600000   // 1 hour
        });

        return res.status(200).json({
            success: true,
            message: 'Login successful',
            token,
            username: existingUser.Username
        });
    } catch (error) {
        console.error(error);
        return res.status(500).json({
            success : false ,
            message: "Internal server error",
            error: error.message
        });
    }
});

// Logout Route (clears token from cookies)
router.post('/logout',verifyToken, (req, res) => {
    // Clear the token cookie
    // res.clearCookie('token', { 
    //     httpOnly: true,   // Ensure the token can't be accessed via JavaScript
    //     sameSite: 'Strict',  // Set to Strict or Lax to protect against CSRF attacks
    //     secure: process.env.NODE_ENV === 'production' // Only send the cookie over HTTPS in production
    // });
    // res.clearCookie('username', { 
    //     httpOnly: true,   // Ensure the token can't be accessed via JavaScript
    //     sameSite: 'Strict',  // Set to Strict or Lax to protect against CSRF attacks
    //     secure: process.env.NODE_ENV === 'production' // Only send the cookie over HTTPS in production
    // });
    res.clearCookie('token');
    res.clearCookie('username');
    return res.status(200).json({
        success: true,
        message: 'Logged out successfully.'
    });
});


router.put('/resetPassword', async (req, res) => {
    const { email, password } = req.body;
  
    if (!email || !password) {
      return res.status(400).json({ success: false, message: 'Email and password are required' });
    }
  
    try {
      // Find the user and update their password
      const User = await user.findOneAndUpdate({ email });
      if (!User) {
        return res.status(404).json({ success: false, message: 'User not found' });
      }
  
      // Hash the new password and save
      User.Password = await bcrypt.hash(password, parseInt(Salt));
      await User.save();
  
      return res.status(200).json({ success: true, message: 'Password updated successfully', username: User.Username });
    } catch (error) {
      console.error('Error updating password:', error);
      return res.status(500).json({ success: false, message: 'An error occurred while updating the password' });
    }
  });


router.post('/sendOtp', async (req, res) => {
    const { email } = req.body;
  
    // Generate OTP and send to the user
    const OTP = await sendOTP(email); // A function to generate OTP
      // Function to send OTP to email
  
    // Store OTP in memory or a database (e.g., Redis, etc.)
    userDB[email] = { otp: OTP, expiresIn: Date.now() + 10 * 60 * 1000 }; // 10 minutes expiry
  
    return res.status(200).json({ success: true, message: 'OTP sent successfully' });
  });
  
module.exports = router;
