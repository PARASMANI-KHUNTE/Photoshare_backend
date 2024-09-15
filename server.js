const express = require('express');
const app = express();
const dotenv = require('dotenv');
dotenv.config();
const port = process.env.PORT || 7000;
const cors = require('cors');
const cookieParser = require('cookie-parser');
app.use(cookieParser());
const Db = require('./Database/MongoDb.js');
Db();
// CORS configuration
const corsOptions = {
  origin: ['http://localhost:5173', 'https://photoshare-ctj3.onrender.com/'], // Add allowed origins
  methods: 'GET,POST,PUT,DELETE',
  credentials: true, // Allow cookies and credentials
};

app.use(cors(corsOptions)); // Apply CORS before routes

app.use(express.json());
const Auth = require('./Routes/Auth.js');
const UploadPost = require('./Routes/UploadPost.js')
app.use("/auth",Auth);
app.use("/UploadPost",UploadPost);



app.listen(port,()=>{
    console.log(`Server is running on http://localhost:${port}`);
})
