const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const axios = require('axios');
const qs = require('qs');
const OrcidToken = require('../models/OrcidToken');
const CV = require('../models/CV');

const ORCID_AUTH_URL = 'https://orcid.org/oauth/authorize';
const ORCID_TOKEN_URL = 'https://orcid.org/oauth/token';
const ORCID_API_URL = process.env.ORCID_API_URL || 'https://pub.orcid.org/v3.0';

// ⭐ Rota /auth - envia o userId como state
router.get('/auth', auth, async (req, res) => {
  try {
    // Verificar se as variáveis ORCID estão configuradas
    if (!process.env.ORCID_CLIENT_ID || process.env.ORCID_CLIENT_ID === 'APP-YOUR_CLIENT_ID_HERE') {
      return res.json({ 
        authUrl: null,
        mockMode: true,
        message: 'Modo de demonstração - ORCID não configurado'
      });
    }
    
    // ⭐ O state deve ser o userId (ObjectId), não o token JWT
    const state = req.user.id;  // ← Isto é o ObjectId do utilizador
    
    const params = qs.stringify({
      client_id: process.env.ORCID_CLIENT_ID,
      response_type: 'code',
      scope: '/read-public',
      redirect_uri: process.env.ORCID_REDIRECT_URI,
      state: state
    });
    
    const authUrl = `${ORCID_AUTH_URL}?${params}`;
    console.log(' URL ORCID gerada com sucesso');
    console.log(' State (userId):', state);
    
    res.json({ authUrl });
  } catch (err) {
    console.error(' Erro ao gerar URL ORCID:', err);
    res.status(500).json({ error: err.message });
  }
});

// ⭐ Rota /callback - recebe o state como userId
router.get('/callback', async (req, res) => {
  const { code, state } = req.query;
  
  console.log(' Callback recebido:', { code: code ? 'sim' : 'não', state });
  
  if (!code) {
    return res.status(400).json({ error: 'Código de autorização em falta' });
  }
  
  try {
    // Trocar código por token
    const tokenResponse = await axios.post(ORCID_TOKEN_URL, qs.stringify({
      client_id: process.env.ORCID_CLIENT_ID,
      client_secret: process.env.ORCID_CLIENT_SECRET,
      grant_type: 'authorization_code',
      code,
      redirect_uri: process.env.ORCID_REDIRECT_URI
    }), {
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
    });
    
    const { access_token, refresh_token, expires_in, orcid } = tokenResponse.data;
    console.log('✅ Token obtido para ORCID:', orcid);
    
    // ⭐ Verificar se o state é um ObjectId válido do MongoDB
    const mongoose = require('mongoose');
    const User = require('../models/User');
    
    let user = null;
    
    // Verificar se o state é um ObjectId válido
    if (mongoose.Types.ObjectId.isValid(state)) {
      user = await User.findById(state);
    }
    
    if (user) {
      // Guardar o token associado ao utilizador
      await OrcidToken.findOneAndUpdate(
        { userId: user._id, orcidId: orcid },
        { 
          accessToken: access_token, 
          refreshToken: refresh_token, 
          expiresAt: Date.now() + expires_in * 1000 
        },
        { upsert: true }
      );
      console.log('✅ Token guardado para utilizador:', user.email);
    } else {
      console.warn(' State não é um ObjectId válido ou utilizador não encontrado:', state);
      // Se não encontrar o utilizador, redireciona para o login
      const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
      return res.redirect(`${frontendUrl}/login?error=orcid_auth_failed`);
    }
    
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
    res.redirect(`${frontendUrl}/import/orcid?success=true`);
  } catch (err) {
    console.error(' Erro no callback ORCID:', err.response?.data || err.message);
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
    res.redirect(`${frontendUrl}/import/orcid?error=true`);
  }
});

// ⭐ Rota /fetch - buscar dados do ORCID
router.post('/fetch', auth, async (req, res) => {
  try {
    const { orcidId } = req.body;
    
    if (!orcidId) {
      return res.status(400).json({ error: 'ORCID ID é obrigatório' });
    }
    
    // Buscar token do utilizador
    const tokenDoc = await OrcidToken.findOne({ userId: req.user.id, orcidId });
    if (!tokenDoc || tokenDoc.expiresAt < Date.now()) {
      return res.status(401).json({ error: 'Token ORCID expirado. Reconecte sua conta.' });
    }
    
    // Buscar dados da API ORCID
    const [person, activities] = await Promise.all([
      axios.get(`${ORCID_API_URL}/${orcidId}/person`, {
        headers: { 'Authorization': `Bearer ${tokenDoc.accessToken}` }
      }),
      axios.get(`${ORCID_API_URL}/${orcidId}/activities`, {
        headers: { 'Authorization': `Bearer ${tokenDoc.accessToken}` }
      })
    ]);
    
    // Mapear dados para estrutura do CV
    const cvData = {
      name: person.data.name?.['given-names']?.value || '',
      surname: person.data.name?.['family-name']?.value || '',
      email: person.data.emails?.email?.[0]?.email || '',
      orcid: orcidId,
      education: [],
      experience: [],
      publications: []
    };
    
    // Mapear educação
    if (activities.data['educations']?.['education-summary']) {
      cvData.education = activities.data['educations']['education-summary'].map(edu => ({
        degree: edu['role-title'] || '',
        institution: edu['organization']?.name || '',
        period: `${edu['start-date']?.year?.value || ''} - ${edu['end-date']?.year?.value || ''}`,
        description: edu['department-name'] || ''
      }));
    }
    
    // Mapear experiência profissional
    if (activities.data['employments']?.['employment-summary']) {
      cvData.experience = activities.data['employments']['employment-summary'].map(emp => ({
        title: emp['role-title'] || '',
        company: emp['organization']?.name || '',
        period: `${emp['start-date']?.year?.value || ''} - ${emp['end-date']?.year?.value || 'Presente'}`,
        location: emp['organization']?.address?.city || ''
      }));
    }
    
    // Mapear publicações
    if (activities.data['works']?.['group']) {
      cvData.publications = activities.data['works']['group'].map(work => ({
        title: work['work-summary'][0]?.title?.title?.value || '',
        year: work['work-summary'][0]?.publication-date?.year?.value || '',
        journal: work['work-summary'][0]?.journalTitle?.value || '',
        doi: work['work-summary'][0]?.doi || ''
      }));
    }
    
    res.json(cvData);
  } catch (err) {
    console.error('Erro ao buscar ORCID:', err);
    res.status(500).json({ error: err.message });
  }
});

// ⭐ Rota /create-cv - criar CV a partir dos dados ORCID
router.post('/create-cv', auth, async (req, res) => {
  try {
    const { orcidId, cvData, cvName } = req.body;
    
    const newCV = new CV({
      name: cvName || `CV ORCID ${orcidId}`,
      data: cvData,
      owner: req.user.id
    });
    
    await newCV.save();
    res.json({ success: true, cvId: newCV._id });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;