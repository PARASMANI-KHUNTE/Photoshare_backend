const { v4: uuidv4 } = require('uuid');
const bucket = require('./FirebaseConfig'); // Firebase Storage bucket

// Function to upload file to Firebase
const uploadToFirebase = (file, folderName = 'posts') => {
  return new Promise((resolve, reject) => {
    const fileName = `${uuidv4()}_${file.originalname}`;
    const fileUpload = bucket.file(`${folderName}/${fileName}`);

    console.log(`Uploading file: ${folderName}/${fileName}`);

    if (!file.buffer) {
      console.error('File buffer is missing');
      return reject('File data is not available');
    }

    // Create stream and upload file to Firebase Storage
    const stream = fileUpload.createWriteStream({
      metadata: {
        contentType: file.mimetype,
      },
    });

    stream.on('error', (err) => {
      console.error('Error uploading file to Firebase:', err);
      reject('File upload failed');
    });

    stream.on('finish', async () => {
      try {
        // Get the download URL for the uploaded file
        const [downloadURL] = await fileUpload.getSignedUrl({
          action: 'read',
          expires: '03-01-2500', // Set an expiration far in the future
        });
        resolve(downloadURL);
      } catch (error) {
        console.error('Error getting file URL:', error);
        reject('Failed to get file URL');
      }
    });

    stream.end(file.buffer);
  });
};

// Function to delete file from Firebase
const deleteFromFirebase = (fileUrl, folderName = 'avatars') => {
  return new Promise((resolve, reject) => {
    // Extract the path to the file from the URL (removing everything after '?')
    const fileName = fileUrl.split(`${folderName}/`)[1]?.split('?')[0];
    
    if (!fileName) {
      console.error('Could not extract file name from URL:', fileUrl);
      return reject('Invalid file path');
    }

    const fileToDelete = bucket.file(`${folderName}/${fileName}`);

    fileToDelete.delete()
      .then(() => {
        console.log(`Successfully deleted file: ${folderName}/${fileName}`);
        resolve(true);
      })
      .catch((error) => {
        console.error(`Error deleting file from Firebase: ${folderName}/${fileName}`, error);
        reject('Failed to delete file from Firebase');
      });
  });
};

module.exports = { uploadToFirebase, deleteFromFirebase };
