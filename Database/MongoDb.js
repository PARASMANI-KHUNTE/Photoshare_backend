const mongoose = require('mongoose');
const dotenv = require('dotenv');
dotenv.config();
const Db = ()=>{
    try {
        const con = mongoose.connect(`${process.env.MONGODB_URI}/${process.env.DB_NAME}`)
        if(con){
            console.log("MongoDb Atlas Server is Up.");
        }else{
            console.log(" Failed to connect with MongoDb Atlas Server. ");
        }
    } catch (error) {
        console.log(`MongoDB Connectio error - ${error}`);
    }
};

module.exports = Db;