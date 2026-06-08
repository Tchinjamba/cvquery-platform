const jwt = require('jsonwebtoken');
const User = require('../models/User');

function signToken(user) {
  return jwt.sign(
    { id: user._id, email: user.email },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
  );
}

async function register(req, res) {
  const { email, password } = req.body;
  if (!email || !password) return res.status(400).json({ error: 'email e password sao obrigatorios.' });
  try {
    const exists = await User.findOne({ email });
    if (exists) return res.status(409).json({ error: 'Email ja registado.' });
    const user = await User.create({ email, password });
    return res.status(201).json({ token: signToken(user) });
  } catch (err) { return res.status(500).json({ error: err.message }); }
}

async function login(req, res) {
  const { email, password } = req.body;
  if (!email || !password) return res.status(400).json({ error: 'email e password sao obrigatorios.' });
  try {
    const user = await User.findOne({ email });
    if (!user) return res.status(401).json({ error: 'Credenciais invalidas.' });
    const valid = await user.comparePassword(password);
    if (!valid) return res.status(401).json({ error: 'Credenciais invalidas.' });
    return res.json({ token: signToken(user) });
  } catch (err) { return res.status(500).json({ error: err.message }); }
}

module.exports = { register, login };
