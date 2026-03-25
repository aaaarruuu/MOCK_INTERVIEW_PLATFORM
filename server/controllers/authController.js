const jwt  = require('jsonwebtoken');
const User = require('../models/User');

const token = id => jwt.sign({ userId: id.toString() }, process.env.JWT_SECRET, { expiresIn: '7d' });

exports.register = async (req, res) => {
  try {
    const { name, email, password } = req.body;
    if (!name?.trim() || !email?.trim() || !password)
      return res.status(400).json({ message: 'Name, email and password are required.' });
    if (password.length < 6)
      return res.status(400).json({ message: 'Password must be at least 6 characters.' });
    const norm = email.toLowerCase().trim();
    if (await User.findOne({ email: norm }))
      return res.status(409).json({ message: 'Email already in use.' });
    const user = await new User({ name: name.trim(), email: norm, password }).save();
    res.status(201).json({ token: token(user._id), user: user.toJSON() });
  } catch(e) {
    if (e.name === 'ValidationError') return res.status(400).json({ message: Object.values(e.errors).map(x=>x.message).join(', ') });
    if (e.code === 11000) return res.status(409).json({ message: 'Email already in use.' });
    console.error('Register:', e); res.status(500).json({ message: 'Registration failed.' });
  }
};

exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email?.trim() || !password) return res.status(400).json({ message: 'Email and password required.' });
    const user  = await User.findOne({ email: email.toLowerCase().trim() });
    const valid = user ? await user.comparePassword(password) : false;
    if (!user || !valid) return res.status(401).json({ message: 'Invalid email or password.' });
    res.json({ token: token(user._id), user: user.toJSON() });
  } catch(e) { console.error('Login:', e); res.status(500).json({ message: 'Login failed.' }); }
};

exports.getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select('-password');
    if (!user) return res.status(404).json({ message: 'User not found.' });
    res.json({ user });
  } catch(e) { res.status(500).json({ message: 'Failed to get user.' }); }
};
