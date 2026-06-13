require('dotenv').config();
const express = require('express');
const session = require('express-session');
const cors = require('cors');
const crypto = require('crypto');

const app = express();

// Helper function to clean URLs (remove trailing slashes)
const cleanUrl = (url) => url ? url.replace(/\/$/, '') : url;

// Get and clean environment variables
const rawOrigins = process.env.CORS_ORIGINS ? process.env.CORS_ORIGINS.split(',') : [];
const allowedOrigins = rawOrigins.map(origin => cleanUrl(origin));
const frontendUrl = cleanUrl(process.env.FRONTEND_URL) || 'https://vandana-assignment.vercel.app';
const backendUrl = cleanUrl(process.env.BACKEND_URL) || 'https://cloud-vandana-assignment.onrender.com';

console.log('✅ Cleaned CORS Origins:', allowedOrigins);
console.log('✅ Cleaned Frontend URL:', frontendUrl);
console.log('✅ Cleaned Backend URL:', backendUrl);

// ==================== CORS CONFIGURATION ====================
app.use(cors({
  origin: function(origin, callback) {
    // Allow requests with no origin
    if (!origin) return callback(null, true);
    
    const cleanOrigin = cleanUrl(origin);
    
    if (allowedOrigins.length === 0 || allowedOrigins.includes(cleanOrigin)) {
      callback(null, true);
    } else {
      console.log('❌ Blocked origin:', origin);
      callback(null, true); // Temporarily allow for debugging
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization', 'Cookie', 'X-Requested-With', 'Accept'],
  exposedHeaders: ['Set-Cookie']
}));

// ==================== OTHER MIDDLEWARE ====================
app.use(express.json());
app.set('trust proxy', 1);

// ==================== SESSION CONFIGURATION ====================
app.use(session({
  secret: process.env.SESSION_SECRET || 'your-secret-key',
  resave: false,
  saveUninitialized: false,
  cookie: { 
    secure: true,        // Must be true for HTTPS (Render serves over HTTPS)
    httpOnly: true,
    sameSite: 'none',    // Required for cross-origin (Vercel -> Render)
    maxAge: 24 * 60 * 60 * 1000
  }
}));

let globalAccessToken = null;
let globalInstanceUrl = null;
let cachedRules = [];

// ==================== OAuth 2.0 LOGIN ====================
app.get('/auth/login', (req, res) => {
  const redirectUri = `${backendUrl}/oauth/callback`;
  const state = crypto.randomBytes(16).toString('hex');
  req.session.oauthState = state;
  
  console.log('\n🔐 OAuth Login URL generated');
  console.log('🔐 State stored in session:', state);
  console.log('🔐 Session ID:', req.session.id);
  console.log('🔐 Redirect URI:', redirectUri);
  
  const loginUrl = `https://login.salesforce.com/services/oauth2/authorize?` +
    `response_type=code&` +
    `client_id=${process.env.CLIENT_ID}&` +
    `redirect_uri=${encodeURIComponent(redirectUri)}&` +
    `scope=api refresh_token&` +
    `state=${state}`;
  
  res.json({ url: loginUrl });
});

// OAuth Callback
app.get('/oauth/callback', async (req, res) => {
  const { code, state } = req.query;
  
  console.log('\n📞 OAuth Callback received');
  console.log('📞 State from query:', state);
  console.log('📞 Session ID:', req.session?.id);
  console.log('📞 Session oauthState:', req.session?.oauthState);
  
  // Check session
  if (!req.session) {
    console.error('❌ No session found');
    return res.status(400).send('No session found');
  }
  
  // Validate state parameter
  if (state !== req.session.oauthState) {
    console.error('❌ Invalid state parameter');
    console.error('Expected:', req.session.oauthState);
    console.error('Received:', state);
    return res.status(400).send('Invalid state parameter');
  }
  
  if (!code) {
    console.error('❌ No authorization code received');
    return res.status(400).send('No authorization code received');
  }
  
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
    
    const tokenData = await response.json();
    
    if (tokenData.error) {
      console.error('❌ Token error:', tokenData);
      throw new Error(tokenData.error_description);
    }
    
    req.session.accessToken = tokenData.access_token;
    req.session.instanceUrl = tokenData.instance_url;
    req.session.userId = tokenData.id;
    
    globalAccessToken = tokenData.access_token;
    globalInstanceUrl = tokenData.instance_url;
    
    console.log('✅ OAuth Login successful!');
    console.log('✅ User ID:', tokenData.id);
    
    res.redirect(`${frontendUrl}/dashboard`);
  } catch (error) {
    console.error('❌ OAuth error:', error);
    res.status(500).send('OAuth failed: ' + error.message);
  }
});

// ==================== VALIDATION RULES ENDPOINTS ====================

// Get all validation rules
app.get('/api/validation-rules', async (req, res) => {
  const token = req.session?.accessToken || globalAccessToken;
  const instanceUrl = req.session?.instanceUrl || globalInstanceUrl;
  
  console.log('\n📊 Fetching validation rules...');
  
  if (!token) {
    return res.status(401).json({ error: 'Not logged in' });
  }
  
  try {
    const idQuery = encodeURIComponent("SELECT Id FROM ValidationRule");
    const idResponse = await fetch(`${instanceUrl}/services/data/v58.0/tooling/query?q=${idQuery}`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    
    const idData = await idResponse.json();
    
    if (!idData.records || idData.records.length === 0) {
      console.log('No validation rules found');
      return res.json([]);
    }
    
    console.log(`Found ${idData.records.length} rule IDs`);
    
    const rules = [];
    for (const record of idData.records) {
      const ruleResponse = await fetch(`${instanceUrl}/services/data/v58.0/tooling/sobjects/ValidationRule/${record.Id}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      const ruleData = await ruleResponse.json();
      
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
    
    console.log(`✅ Retrieved ${rules.length} validation rules`);
    rules.forEach(r => console.log(`  - ${r.name}: ${r.active ? '🟢 Active' : '🔴 Inactive'}`));
    
    res.json(rules);
    
  } catch (error) {
    console.error('❌ Error fetching rules:', error.message);
    res.status(500).json({ error: error.message });
  }
});

// Update validation rule
app.post('/api/update-rule', async (req, res) => {
  const { ruleName, active } = req.body;
  const token = req.session?.accessToken || globalAccessToken;
  const instanceUrl = req.session?.instanceUrl || globalInstanceUrl;
  
  console.log(`\n📝 Updating rule: "${ruleName}" → ${active ? '🟢 Active' : '🔴 Inactive'}`);
  
  if (!token) {
    return res.status(401).json({ error: 'Not logged in' });
  }
  
  try {
    const rule = cachedRules.find(r => r.name === ruleName);
    
    if (!rule) {
      console.log(`❌ Rule "${ruleName}" not found`);
      return res.json({ success: false, error: 'Rule not found' });
    }
    
    console.log(`Found rule: ${rule.fullName} (ID: ${rule.id})`);
    
    const getResponse = await fetch(`${instanceUrl}/services/data/v58.0/tooling/sobjects/ValidationRule/${rule.id}`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    
    const ruleData = await getResponse.json();
    const currentMetadata = ruleData.Metadata || {};
    
    const updateMetadata = {
      active: active,
      errorConditionFormula: currentMetadata.errorConditionFormula || 'true',
      errorMessage: currentMetadata.errorMessage || 'Validation Error',
      description: currentMetadata.description || ''
    };
    
    const updateResponse = await fetch(`${instanceUrl}/services/data/v58.0/tooling/sobjects/ValidationRule/${rule.id}`, {
      method: 'PATCH',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        Metadata: updateMetadata
      })
    });
    
    if (updateResponse.ok) {
      console.log(`✅ Successfully updated "${ruleName}"`);
      rule.active = active;
      res.json({ success: true });
    } else {
      const errorText = await updateResponse.text();
      console.log(`❌ Update failed: ${errorText}`);
      res.json({ success: false });
    }
    
  } catch (error) {
    console.error('❌ Update error:', error.message);
    res.json({ success: false });
  }
});

// ==================== UTILITY ENDPOINTS ====================

// Check authentication status
app.get('/api/auth/status', (req, res) => {
  const token = req.session?.accessToken || globalAccessToken;
  res.json({ 
    isLoggedIn: !!token
  });
});

// Get current user info from Salesforce
app.get('/api/user/info', async (req, res) => {
  const token = req.session?.accessToken || globalAccessToken;
  const instanceUrl = req.session?.instanceUrl || globalInstanceUrl;
  
  console.log('\n👤 Fetching user info from Salesforce...');
  
  if (!token) {
    return res.status(401).json({ error: 'Not logged in' });
  }
  
  try {
    const response = await fetch(`${instanceUrl}/services/oauth2/userinfo`, {
      headers: { 
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }
    
    const userInfo = await response.json();
    
    res.json({
      success: true,
      user: {
        username: userInfo.username || 'unknown',
        name: userInfo.name || 'Salesforce User',
        email: userInfo.email || userInfo.username,
        userId: userInfo.user_id,
        orgId: userInfo.organization_id,
        orgName: userInfo.organization_name || 'Salesforce Org',
        instanceUrl: instanceUrl
      }
    });
  } catch (error) {
    console.error('❌ Error fetching user info:', error.message);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Logout
app.get('/auth/logout', (req, res) => {
  req.session.destroy();
  globalAccessToken = null;
  globalInstanceUrl = null;
  cachedRules = [];
  console.log('👋 User logged out');
  res.json({ success: true });
});

// Health check
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'healthy', 
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

// ==================== START SERVER ====================

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log('\n🚀 =====================================');
  console.log('✨ Salesforce Switch Backend Server');
  console.log('=====================================');
  console.log(`📡 Server: ${backendUrl}`);
  console.log(`🔐 OAuth Login: ${backendUrl}/auth/login`);
  console.log(`💚 Health: ${backendUrl}/api/health`);
  console.log('=====================================\n');
});