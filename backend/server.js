require('dotenv').config();
const express = require('express');
const session = require('express-session');
const cors = require('cors');
const crypto = require('crypto');

const app = express();

// Helper function to clean URLs
const cleanUrl = (url) => url ? url.replace(/\/$/, '') : url;

// Get and clean environment variables
const rawOrigins = process.env.CORS_ORIGINS ? process.env.CORS_ORIGINS.split(',') : [];
const allowedOrigins = rawOrigins.map(origin => cleanUrl(origin));
const frontendUrl = cleanUrl(process.env.FRONTEND_URL) || 'https://vandana-assignment.vercel.app';
const backendUrl = cleanUrl(process.env.BACKEND_URL) || 'https://cloud-vandana-assignment.onrender.com';

console.log('✅ Allowed CORS Origins:', allowedOrigins);
console.log('✅ Frontend URL:', frontendUrl);
console.log('✅ Backend URL:', backendUrl);

// ==================== CORS ====================
app.use(cors({
  origin: function(origin, callback) {
    if (!origin) return callback(null, true);
    if (allowedOrigins.length === 0 || allowedOrigins.includes(cleanUrl(origin))) {
      callback(null, true);
    } else {
      console.log('❌ Blocked origin:', origin);
      callback(null, true);
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization', 'Cookie', 'X-Requested-With', 'Accept'],
  exposedHeaders: ['Set-Cookie']
}));

app.use(express.json());
app.set('trust proxy', 1);

// Session configuration
app.use(session({
  secret: process.env.SESSION_SECRET || 'your-secret-key',
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: false,
    httpOnly: true,
    sameSite: 'lax',
    maxAge: 24 * 60 * 60 * 1000
  }
}));

// In-memory storage for OAuth states
const stateStore = new Map();

// Clean up old states every 5 minutes
setInterval(() => {
  const now = Date.now();
  for (const [key, value] of stateStore.entries()) {
    if (now - value.timestamp > 10 * 60 * 1000) {
      stateStore.delete(key);
    }
  }
}, 5 * 60 * 1000);

// Global token storage
let globalAccessToken = null;
let globalInstanceUrl = null;
let cachedRules = [];

// ==================== OAuth ROUTES ====================

app.get('/auth/login', (req, res) => {
  const state = crypto.randomBytes(16).toString('hex');
  const redirectUri = `${backendUrl}/oauth/callback`;
  
  stateStore.set(state, {
    timestamp: Date.now(),
    used: false
  });
  
  const loginUrl = `https://login.salesforce.com/services/oauth2/authorize?` +
    `response_type=code&` +
    `client_id=${process.env.CLIENT_ID}&` +
    `redirect_uri=${encodeURIComponent(redirectUri)}&` +
    `scope=api refresh_token&` +
    `state=${state}`;
  
  res.json({ url: loginUrl });
});

app.get('/oauth/callback', async (req, res) => {
  const { code, state } = req.query;
  
  const storedState = stateStore.get(state);
  if (!storedState || storedState.used) {
    return res.status(400).send('Invalid state parameter');
  }
  
  if (!code) {
    return res.status(400).send('No authorization code');
  }
  
  stateStore.set(state, { ...storedState, used: true });
  
  try {
    const redirectUri = `${backendUrl}/oauth/callback`;
    const params = new URLSearchParams();
    params.append('grant_type', 'authorization_code');
    params.append('code', code);
    params.append('client_id', process.env.CLIENT_ID);
    params.append('client_secret', process.env.CLIENT_SECRET);
    params.append('redirect_uri', redirectUri);
    
    const response = await fetch('https://login.salesforce.com/services/oauth2/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: params
    });
    
    const data = await response.json();
    
    if (data.error) {
      throw new Error(data.error_description);
    }
    
    globalAccessToken = data.access_token;
    globalInstanceUrl = data.instance_url;
    
    stateStore.delete(state);
    res.redirect(`${frontendUrl}/dashboard`);
  } catch (error) {
    res.status(500).send('OAuth failed: ' + error.message);
  }
});

// ==================== API ROUTES ====================

app.get('/api/validation-rules', async (req, res) => {
  if (!globalAccessToken) {
    return res.status(401).json({ error: 'Not logged in' });
  }
  
  try {
    const query = encodeURIComponent("SELECT Id FROM ValidationRule");
    const response = await fetch(`${globalInstanceUrl}/services/data/v58.0/tooling/query?q=${query}`, {
      headers: { 'Authorization': `Bearer ${globalAccessToken}` }
    });
    
    const data = await response.json();
    
    if (!data.records || data.records.length === 0) {
      return res.json([]);
    }
    
    const rules = [];
    for (const record of data.records) {
      const ruleRes = await fetch(`${globalInstanceUrl}/services/data/v58.0/tooling/sobjects/ValidationRule/${record.Id}`, {
        headers: { 'Authorization': `Bearer ${globalAccessToken}` }
      });
      const ruleData = await ruleRes.json();
      
      let cleanName = ruleData.FullName;
      if (cleanName.includes('.')) {
        cleanName = cleanName.split('.').pop();
      }
      
      rules.push({
        id: ruleData.Id,
        name: cleanName,
        fullName: ruleData.FullName,
        active: ruleData.Metadata?.active || false
      });
    }
    
    cachedRules = rules;
    res.json(rules);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/update-rule', async (req, res) => {
  const { ruleName, active } = req.body;
  
  if (!globalAccessToken) {
    return res.status(401).json({ error: 'Not logged in' });
  }
  
  try {
    const rule = cachedRules.find(r => r.name === ruleName);
    if (!rule) {
      return res.json({ success: false });
    }
    
    // Get the full rule metadata first
    const getRes = await fetch(`${globalInstanceUrl}/services/data/v58.0/tooling/sobjects/ValidationRule/${rule.id}`, {
      headers: { 'Authorization': `Bearer ${globalAccessToken}` }
    });
    const ruleData = await getRes.json();
    const currentMetadata = ruleData.Metadata || {};
    
    // Update with complete metadata
    const updateRes = await fetch(`${globalInstanceUrl}/services/data/v58.0/tooling/sobjects/ValidationRule/${rule.id}`, {
      method: 'PATCH',
      headers: {
        'Authorization': `Bearer ${globalAccessToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        Metadata: {
          active: active,
          errorConditionFormula: currentMetadata.errorConditionFormula || 'true',
          errorMessage: currentMetadata.errorMessage || 'Validation Error',
          description: currentMetadata.description || ''
        }
      })
    });
    
    if (updateRes.ok) {
      rule.active = active;
      res.json({ success: true });
    } else {
      res.json({ success: false });
    }
  } catch (error) {
    res.json({ success: false });
  }
});

app.get('/api/user/info', async (req, res) => {
  if (!globalAccessToken) {
    return res.status(401).json({ error: 'Not logged in' });
  }
  
  try {
    const response = await fetch(`${globalInstanceUrl}/services/oauth2/userinfo`, {
      headers: { 'Authorization': `Bearer ${globalAccessToken}` }
    });
    const userInfo = await response.json();
    
    res.json({
      success: true,
      user: {
        username: userInfo.username,
        name: userInfo.name,
        email: userInfo.email,
        orgName: userInfo.organization_name || 'Salesforce Org'
      }
    });
  } catch (error) {
    res.status(500).json({ success: false });
  }
});

app.get('/api/auth/status', (req, res) => {
  res.json({ isLoggedIn: !!globalAccessToken });
});

app.get('/auth/logout', (req, res) => {
  globalAccessToken = null;
  globalInstanceUrl = null;
  cachedRules = [];
  res.json({ success: true });
});

app.get('/api/health', (req, res) => {
  res.json({ status: 'healthy', timestamp: new Date().toISOString() });
});

// ==================== START SERVER ====================
const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`\n🚀 Backend running on port ${PORT}`);
  console.log(`📡 Health: ${backendUrl}/api/health\n`);
});