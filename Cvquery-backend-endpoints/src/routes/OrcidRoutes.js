// backend/src/routes/orcidRoutes.js
const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const axios = require('axios');
const qs = require('qs');
const OrcidToken = require('../models/OrcidToken');
const CV = require('../models/CV');

// URL de autorização ORCID
const ORCID_AUTH_URL = 'https://orcid.org/oauth/authorize';
const ORCID_TOKEN_URL = 'https://orcid.org/oauth/token';
const ORCID_API_URL = process.env.ORCID_API_URL || 'https://pub.orcid.org/v3.0';

// Iniciar fluxo de autenticação ORCID
router.get('/auth', auth, (req, res) => {
  const params = qs.stringify({
    client_id: process.env.ORCID_CLIENT_ID,
    response_type: 'code',
    scope: '/read-limited',
    redirect_uri: process.env.ORCID_REDIRECT_URI,
    state: req.user.id
  });
  
  res.redirect(`${ORCID_AUTH_URL}?${params}`);
});

// Callback após autenticação
router.get('/callback', async (req, res) => {
  const { code, state } = req.query;
  
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
    
    // Guardar token
    await OrcidToken.findOneAndUpdate(
      { userId: state, orcidId: orcid },
      { accessToken: access_token, refreshToken: refresh_token, expiresAt: Date.now() + expires_in * 1000 },
      { upsert: true }
    );
    
    res.redirect(`${process.env.FRONTEND_URL}/import/orcid?success=true`);
  } catch (err) {
    console.error('Erro ORCID:', err);
    res.redirect(`${process.env.FRONTEND_URL}/import/orcid?error=true`);
  }
});

// Obter dados do ORCID
router.post('/fetch', auth, async (req, res) => {
  try {
    const { orcidId } = req.body;
    
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

// Criar CV a partir dos dados ORCID
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