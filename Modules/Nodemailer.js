const nodemailer = require('nodemailer');
require('dotenv').config()
// const userEmail = process.env.Email;
// const userPass = process.env.EmailPass;
const sendOTP = async (email) => {
  // Generate a random 6-digit OTP
  const OTP = Math.floor(Math.random() * 900000) + 100000;
  
  // Configure Nodemailer transporter with your email provider's credentials
  const transporter = nodemailer.createTransport({
    service: 'gmail', // Replace with your email provider's service
    host : 'smtp.gmail.com',
    auth: {
      user: "parasmanikhunte89@gmail.com",
      pass: "angy jffs bjiu qbjf",
    },
  });

  // Email options
  const mailOptions = {
    from: {name : 'PHOTOSHARE' , address : process.env.Email },
    to: email,
    subject: 'OTP Verification',
    text: `Your OTP is: ${OTP}`,
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    console.log('Message sent: %s', info.messageId);
    return OTP; // Return the generated OTP for further use
  } catch (error) {
    console.error('Error sending email:', error);
    throw error;
  }
};





module.exports = sendOTP ;
