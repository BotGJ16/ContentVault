const jwt = require('jsonwebtoken');
const User = require('../models/User');

const auth = async (req, res, next) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    
    if (!token) {
      return res.status(401).json({ error: 'No token provided' });
    }
    
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // For Web3 auth, we expect the decoded token to contain the user's address
    // and signature verification details
    if (!decoded.address) {
      return res.status(401).json({ error: 'Invalid token format' });
    }
    
    const user = await User.findOne({ address: decoded.address.toLowerCase() });
    
    if (!user) {
      return res.status(401).json({ error: 'User not found' });
    }
    
    req.user = user;
    req.token = token;
    next();
  } catch (error) {
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({ error: 'Invalid token' });
    }
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ error: 'Token expired' });
    }
    
    console.error('Auth middleware error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Optional auth - doesn't require authentication but loads user if token is present
const optionalAuth = async (req, res, next) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    
    if (token) {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const user = await User.findOne({ address: decoded.address.toLowerCase() });
      req.user = user;
      req.token = token;
    }
    
    next();
  } catch (error) {
    // Ignore token errors for optional auth
    next();
  }
};

// Creator-only middleware
const creatorOnly = async (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({ error: 'Authentication required' });
  }
  
  if (!req.user.isCreator) {
    return res.status(403).json({ error: 'Creator access required' });
  }
  
  next();
};

// Admin-only middleware
const adminOnly = async (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({ error: 'Authentication required' });
  }
  
  // Check if user has admin role (would need to implement role system)
  const adminAddresses = process.env.ADMIN_ADDRESSES?.split(',') || [];
  if (!adminAddresses.includes(req.user.address.toLowerCase())) {
    return res.status(403).json({ error: 'Admin access required' });
  }
  
  next();
};

module.exports = {
  auth,
  optionalAuth,
  creatorOnly,
  adminOnly
};