const { MongoClient } = require("mongodb");
require('dotenv').config();  // Load environment variables

let database;

async function connect() {
  const uri = process.env.MONGODB_URI;  // Get MongoDB URI from environment variable
  if (!uri) {
    throw new Error('MongoDB connection URI is not defined');
  }
  
  try {
    const client = await MongoClient.connect(uri);
    database = client.db(process.env.DB_NAME || "datasecurity");
    console.log('Connected to MongoDB Atlas');
  } catch (error) {
    console.error('Failed to connect to the database.', error);
    throw error;
  }
}

function getDb() {
  if (!database) {
    throw new Error("Database connection not established!");
  }
  return database;
}

module.exports = {
  connectToDatabase: connect,
  getDb: getDb
};


// const mongodb = require("mongodb");
// const MongoClient = mongodb.MongoClient;


// let database;

// async function connect() {

//   const client = await MongoClient.connect("");
//   database = client.db("datasecurity");
// }

// function getDb(){
//     if(!database){
//         throw { message: "Database connection not established!" };
//     }
//     return database;
// }

// module.exports = {
//     connectToDatabase: connect,
//     getDb: getDb
// };
