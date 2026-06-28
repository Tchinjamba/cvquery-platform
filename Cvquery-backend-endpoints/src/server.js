require('dotenv').config();
const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const app = express();

// ⭐ 1. MIDDLEWARE GLOBAL (devem vir ANTES das rotas)
app.use(cors());
app.use(express.json());

// ⭐ 2. ROTAS (vêm depois dos middlewares)
app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/cv', require('./routes/cvRoutes'));
app.use('/api/templates', require('./routes/templatesRoutes'));
app.use('/api/tutorials', require('./routes/tutorialsRoutes'));
app.use('/api/export', require('./routes/exportRoutes'));
app.use('/api/orcid', require('./routes/orcidRoutes'));

// ⭐ 3. HEALTH CHECK (pode estar antes ou depois das rotas)
app.get('/', (req, res) => res.json({ status: 'ok' }));
app.get("/api/health", (req, res) => {
  res.json({
    ok: true,
    message: "Backend ativo"
  });
});

// ⭐ 4. PORTA E MONGODB
const PORT = process.env.PORT || 5001;
const MONGODB_URI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/cvquery';

mongoose.connect(MONGODB_URI)
  .then(() => {
    console.log('MongoDB ligado');
    app.listen(PORT, () => console.log('Servidor na porta ' + PORT));
  })
  .catch(err => { 
    console.error('Erro MongoDB:', err.message); 
    process.exit(1); 
  });