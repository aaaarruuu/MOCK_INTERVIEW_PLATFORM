const jwt  = require('jsonwebtoken');
const User = require('../models/User');

module.exports = async (req, res, next) => {
  try {
    const h = req.headers.authorization;
    if (!h?.startsWith('Bearer ')) return res.status(401).json({ message: 'No token provided.' });
    const decoded = jwt.verify(h.split(' ')[1], process.env.JWT_SECRET);
    if (!decoded.userId) return res.status(401).json({ message: 'Invalid token.' });
    const user = await User.findById(decoded.userId).select('-password -__v');
    if (!user) return res.status(401).json({ message: 'User not found.' });
    req.user = user;
    next();
  } catch(e) {
    if (e.name === 'TokenExpiredError') return res.status(401).json({ message: 'Token expired. Please login again.' });
    if (e.name === 'JsonWebTokenError')  return res.status(401).json({ message: 'Invalid token.' });
    res.status(500).json({ message: 'Authentication error.' });
  }
};
