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
      callback(null, true); // Allow anyway for debugging
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization', 'Cookie', 'X-Requested-With', 'Accept'],
  exposedHeaders: ['Set-Cookie']
}));

app.use(express.json());
app.set('trust proxy', 1);

// ==================== SESSION (Simplified) ====================
app.use(session({
  secret: process.env.SESSION_SECRET || 'your-secret-key',
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: false,  // Set to false for Render
    httpOnly: true,
    sameSite: 'lax',
    maxAge: 24 * 60 * 60 * 1000
  }
}));

// In-memory storage for OAuth states (bypass session issue)
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

// Global token storage (for demo)
let globalAccessToken = null;
let globalInstanceUrl = null;
let cachedRules = [];

// ==================== OAuth ROUTES ====================

// Login - Generate OAuth URL
app.get('/auth/login', (req, res) => {
  const state = crypto.randomBytes(16).toString('hex');
  const redirectUri = `${backendUrl}/oauth/callback`;
  
  // Store state in memory (not session)
  stateStore.set(state, {
    timestamp: Date.now(),
    used: false
  });
  
  console.log('🔐 Generated state:', state);
  console.log('🔐 Redirect URI:', redirectUri);
  
  const loginUrl = `https://login.salesforce.com/services/oauth2/authorize?` +
    `response_type=code&` +
    `client_id=${process.env.CLIENT_ID}&` +
    `redirect_uri=${encodeURIComponent(redirectUri)}&` +
    `scope=api refresh_token&` +
    `state=${state}`;
  
  res.json({ url: loginUrl });
});

// Callback - Exchange code for token
app.get('/oauth/callback', async (req, res) => {
  const { code, state } = req.query;
  
  console.log('📞 Callback received');
  console.log('📞 State:', state);
  console.log('📞 Code exists:', !!code);
  
  // Verify state
  const storedState = stateStore.get(state);
  if (!storedState) {
    console.error('❌ Invalid state');
    return res.status(400).send('Invalid state parameter');
  }
  
  if (storedState.used) {
    console.error('❌ State already used');
    return res.status(400).send('State already used');
  }
  
  if (!code) {
    console.error('❌ No code received');
    return res.status(400).send('No authorization code');
  }
  
  // Mark state as used
  stateStore.set(state, { ...storedState, used: true });
  
  try {
    const redirectUri = `${backendUrl}/oauth/callback`;
    const params = new URLSearchParams();
    params.append('grant_type', 'authorization_code');
    params.append('code', code);
    params.append('client_id', process.env.CLIENT_ID);
    params.append('client_secret', process.env.CLIENT_SECRET);
    params.append('redirect_uri', redirectUri);
    
    console.log('🔄 Exchanging code for token...');
    
    const response = await fetch('https://login.salesforce.com/services/oauth2/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: params
    });
    
    const data = await response.json();
    
    if (data.error) {
      throw new Error(data.error_description);
    }
    
    // Store tokens globally
    globalAccessToken = data.access_token;
    globalInstanceUrl = data.instance_url;
    
    console.log('✅ OAuth successful!');
    
    // Clean up state
    stateStore.delete(state);
    
    // Redirect to frontend dashboard
    res.redirect(`${frontendUrl}/dashboard`);
  } catch (error) {
    console.error('❌ OAuth error:', error);
    res.status(500).send('OAuth failed: ' + error.message);
  }
});

// ==================== API ROUTES ====================

// Get validation rules
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
    console.log(`✅ Returning ${rules.length} rules`);
    res.json(rules);
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Update rule
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
    
    const updateRes = await fetch(`${globalInstanceUrl}/services/data/v58.0/tooling/sobjects/ValidationRule/${rule.id}`, {
      method: 'PATCH',
      headers: {
        'Authorization': `Bearer ${globalAccessToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        Metadata: { active: active }
      })
    });
    
    if (updateRes.ok) {
      rule.active = active;
      console.log(`✅ Updated ${ruleName}`);
      res.json({ success: true });
    } else {
      res.json({ success: false });
    }
  } catch (error) {
    res.json({ success: false });
  }
});

// Get user info
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

// Auth status
app.get('/api/auth/status', (req, res) => {
  res.json({ isLoggedIn: !!globalAccessToken });
});

// Logout
app.get('/auth/logout', (req, res) => {
  globalAccessToken = null;
  globalInstanceUrl = null;
  cachedRules = [];
  res.json({ success: true });
});

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'healthy', timestamp: new Date().toISOString() });
});

// ==================== START SERVER ====================
const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`\n🚀 Backend running on port ${PORT}`);
  console.log(`📡 Health: ${backendUrl}/api/health\n`);
});