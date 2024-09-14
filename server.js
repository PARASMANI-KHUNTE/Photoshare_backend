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
const corsOptions = {
    origin: "*", // Ensure no trailing slash
    methods: 'GET,POST,PUT,DELETE',
    credentials: true
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
