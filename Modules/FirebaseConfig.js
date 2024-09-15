const dotenv = require('dotenv');
dotenv.config();
const admin = require('firebase-admin');
const serviceAccountPath = '/etc/secrets/ggvians-2c0ed-firebase-adminsdk-a9cow-626cd394ae.json';

// Load the service account from the secret file path
const serviceAccount = require(serviceAccountPath);

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  storageBucket: process.env.FIREBASE_STORAGE_BUCKET || 'ggvians-2c0ed.appspot.com',
});

const bucket = admin.storage().bucket();


module.exports = bucket;
