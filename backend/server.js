require('dotenv').config();
const express = require('express');
const session = require('express-session');
const cors = require('cors');
const jsforce = require('jsforce');
const crypto = require('crypto');

const app = express();

// Generate PKCE verifier and challenge
function generatePKCE() {
  const verifier = crypto.randomBytes(32).toString('base64url');
  const challenge = crypto
    .createHash('sha256')
    .update(verifier)
    .digest('base64url');
  return { verifier, challenge };
}

// Middleware
app.use(cors({
  origin: 'http://localhost:3000',
  credentials: true
}));
app.use(express.json());
app.use(session({
  secret: process.env.SESSION_SECRET,
  resave: false,
  saveUninitialized: false,
  cookie: { secure: false }
}));

// OAuth login endpoint
app.get('/auth/login', (req, res) => {
  const { verifier, challenge } = generatePKCE();
  
  // Store verifier in session for later use
  req.session.pkceVerifier = verifier;
  
  const oauth2 = new jsforce.OAuth2({
    clientId: process.env.CLIENT_ID,
    clientSecret: process.env.CLIENT_SECRET,
    redirectUri: 'http://localhost:3001/oauth/callback'
  });
  
  const authUrl = oauth2.getAuthorizationUrl({
    scope: 'api refresh_token',
    code_challenge: challenge,
    code_challenge_method: 'S256'
  });
  
  res.json({ url: authUrl });
});

// OAuth callback endpoint
app.get('/oauth/callback', async (req, res) => {
  const { code, error, error_description } = req.query;
  
  if (error) {
    return res.status(400).send(`OAuth Error: ${error} - ${error_description}`);
  }
  
  const oauth2 = new jsforce.OAuth2({
    clientId: process.env.CLIENT_ID,
    clientSecret: process.env.CLIENT_SECRET,
    redirectUri: 'http://localhost:3001/oauth/callback'
  });
  
  try {
    const tokenResponse = await oauth2.requestToken(code, {
      code_verifier: req.session.pkceVerifier
    });
    
    req.session.accessToken = tokenResponse.access_token;
    req.session.instanceUrl = tokenResponse.instance_url;
    req.session.refreshToken = tokenResponse.refresh_token;
    
    // Clear PKCE verifier
    delete req.session.pkceVerifier;
    
    res.redirect('http://localhost:3000/dashboard');
  } catch (error) {
    console.error('Token error:', error);
    res.status(500).send('OAuth failed: ' + error.message);
  }
});

// Get all validation rules
app.get('/api/validation-rules', async (req, res) => {
  if (!req.session.accessToken) {
    return res.status(401).json({ error: 'Not logged in' });
  }
  
  const conn = new jsforce.Connection({
    accessToken: req.session.accessToken,
    instanceUrl: req.session.instanceUrl,
    refreshToken: req.session.refreshToken,
    clientId: process.env.CLIENT_ID,
    clientSecret: process.env.CLIENT_SECRET
  });
  
  try {
    const result = await conn.tooling.query(
      "SELECT Id, FullName, Metadata FROM ValidationRule"
    );
    
    const rules = result.records.map(rule => ({
      id: rule.Id,
      name: rule.FullName,
      active: rule.Metadata?.active || false
    }));
    
    res.json(rules);
  } catch (error) {
    console.error('Query error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Update a single validation rule
app.post('/api/update-rule', async (req, res) => {
  const { ruleName, active } = req.body;
  
  if (!req.session.accessToken) {
    return res.status(401).json({ error: 'Not logged in' });
  }
  
  const conn = new jsforce.Connection({
    accessToken: req.session.accessToken,
    instanceUrl: req.session.instanceUrl,
    refreshToken: req.session.refreshToken,
    clientId: process.env.CLIENT_ID,
    clientSecret: process.env.CLIENT_SECRET
  });
  
  try {
    await conn.metadata.update('ValidationRule', {
      fullName: ruleName,
      active: active
    });
    res.json({ success: true, ruleName, active });
  } catch (error) {
    console.error('Update error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Logout endpoint
app.get('/auth/logout', (req, res) => {
  req.session.destroy();
  res.json({ success: true });
});

app.listen(3001, () => {
  console.log('✅ Backend running on http://localhost:3001');
});