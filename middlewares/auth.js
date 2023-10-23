const jwt = require("jsonwebtoken");
const isAuthenticated = (req, res, next) => {
  const token = req.cookies.token;
  if (!token) {
    return res.status(401).json({message: "Authentication failed"});
  }
  jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
    if (err) {
      return res.status(401).json({ message: 'Authentication failed' });
    }
    req.user = decoded;
    next();
  });
};

module.exports = isAuthenticated;