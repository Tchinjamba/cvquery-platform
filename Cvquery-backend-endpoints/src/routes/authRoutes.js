const express = require('express');
const router = express.Router();
const { register, login } = require('../controllers/authController');
router.post('/register', register);
router.post('/login', login);

module.exports = router;
// backend/src/routes/authRoutes.js (adicionar)
const crypto = require('crypto');
const nodemailer = require('nodemailer');

// Configuração de email (usar ethereal.email para testes)
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'smtp.ethereal.email',
  port: process.env.SMTP_PORT || 587,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS
  }
});

// Solicitar recuperação de password
router.post('/forgot-password', async (req, res) => {
  try {
    const { email } = req.body;
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ error: 'Email não encontrado' });
    }

    const token = crypto.randomBytes(20).toString('hex');
    user.resetPasswordToken = token;
    user.resetPasswordExpires = Date.now() + 3600000; // 1 hora
    await user.save();

    const resetUrl = `${process.env.FRONTEND_URL}/reset-password/${token}`;
    
    await transporter.sendMail({
      to: user.email,
      subject: 'Recuperação de Password - CVQuery',
      html: `<p>Olá ${user.name},</p>
             <p>Clique no link abaixo para redefinir sua password:</p>
             <a href="${resetUrl}">${resetUrl}</a>
             <p>Este link expira em 1 hora.</p>
             <p>Se não solicitou, ignore este email.</p>`
    });

    res.json({ message: 'Email enviado com sucesso' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Redefinir password
router.post('/reset-password/:token', async (req, res) => {
  try {
    const { token } = req.params;
    const { password } = req.body;

    const user = await User.findOne({
      resetPasswordToken: token,
      resetPasswordExpires: { $gt: Date.now() }
    });

    if (!user) {
      return res.status(400).json({ error: 'Token inválido ou expirado' });
    }

    user.password = password;
    user.resetPasswordToken = undefined;
    user.resetPasswordExpires = undefined;
    await user.save();

    res.json({ message: 'Password redefinida com sucesso' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});