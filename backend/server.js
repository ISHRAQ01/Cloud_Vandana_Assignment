require('dotenv').config();
const express = require('express');
const session = require('express-session');
const cors = require('cors');
const jsforce = require('jsforce');

const app = express();

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
  const oauth2 = new jsforce.OAuth2({
    clientId: process.env.CLIENT_ID,
    clientSecret: process.env.CLIENT_SECRET,
    redirectUri: 'http://localhost:3001/oauth/callback'
  });
  const authUrl = oauth2.getAuthorizationUrl({ scope: 'api refresh_token' });
  res.json({ url: authUrl });
});

// OAuth callback endpoint
app.get('/oauth/callback', async (req, res) => {
  const { code } = req.query;
  const oauth2 = new jsforce.OAuth2({
    clientId: process.env.CLIENT_ID,
    clientSecret: process.env.CLIENT_SECRET,
    redirectUri: 'http://localhost:3001/oauth/callback'
  });
  
  try {
    const tokenResponse = await oauth2.requestToken(code);
    req.session.accessToken = tokenResponse.access_token;
    req.session.instanceUrl = tokenResponse.instance_url;
    res.redirect('http://localhost:3000/dashboard');
  } catch (error) {
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
    instanceUrl: req.session.instanceUrl
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
    instanceUrl: req.session.instanceUrl
  });
  
  try {
    await conn.metadata.update('ValidationRule', {
      fullName: ruleName,
      active: active
    });
    res.json({ success: true, ruleName, active });
  } catch (error) {
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