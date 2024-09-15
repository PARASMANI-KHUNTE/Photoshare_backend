// const jwt = require('jsonwebtoken');
// const SecretKey = process.env.JWT_SECRET;

// const verifyToken = (req, res, next) => {
//   const authHeader = req.headers['authorization'];

//   // Check if the token is provided in the Authorization header
//   if (!authHeader) return res.status(401).json({ message: 'No token provided' });

//   const token = authHeader.split(' ')[1]; // Bearer <token>

//   if (!token) {
//     return res.status(403).json({ message: 'Access denied, no token provided' });
//   }

//   try {
//     const verified = jwt.verify(token, SecretKey);
//     req.user = verified; // Store the verified user details in req.user
//     next(); // Proceed to the next middleware or route handler
//   } catch (error) {
//     res.status(400).json({ message: 'Invalid token' });
//   }
// };

// module.exports = verifyToken;


// const jwt = require('jsonwebtoken');
// const SecretKey = process.env.JWT_SECRET; // Secret key used for signing tokens

// const verifyToken = (req, res, next) => {
//   const token = req.cookies.token; // Get the token from cookies

//   if (!token) {
//     return res.status(401).json({ message: 'No token provided, authorization denied.' });
//   }

//   try {
//     const decoded = jwt.verify(token, SecretKey); // Verify the token
//     req.user = decoded; // Attach the decoded token (which contains user info) to the request object
//     next(); // Move to the next middleware/route handler
//   } catch (err) {
//     return res.status(401).json({ message: 'Token is not valid, authorization denied.' });
//   }
// };


const verifyToken = (req, res, next) => {
  const token = req.cookies.token || req.headers['authorization']?.split(' ')[1]; // Check cookies or Authorization header

  if (!token) {
    return res.status(401).json({ message: 'No token provided, authorization denied.' });
  }

  try {
    const decoded = jwt.verify(token, SecretKey);
    req.user = decoded;
    next();
  } catch (err) {
    return res.status(401).json({ message: 'Token is not valid, authorization denied.' });
  }
};


module.exports = verifyToken;
