require('dotenv').config();
const express = require('express');
const session = require('express-session');
const cors = require('cors');
const jsforce = require('jsforce');

const app = express();

app.use(cors({
  origin: 'http://localhost:3000',
  credentials: true
}));
app.use(express.json());
app.use(session({
  secret: process.env.SESSION_SECRET,
  resave: false,
  saveUninitialized: true,
  cookie: { secure: false }
}));

// Login endpoint - manual URL without PKCE
app.get('/auth/login', (req, res) => {
  const redirectUri = 'http://localhost:3001/oauth/callback';
  const loginUrl = `https://login.salesforce.com/services/oauth2/authorize?response_type=code&client_id=${process.env.CLIENT_ID}&redirect_uri=${encodeURIComponent(redirectUri)}&scope=api%20refresh_token`;
  
  console.log('Login URL:', loginUrl);
  res.json({ url: loginUrl });
});

// Callback endpoint
app.get('/oauth/callback', async (req, res) => {
  const { code, error, error_description } = req.query;
  
  if (error) {
    return res.send(`Error: ${error} - ${error_description}`);
  }
  
  try {
    const params = new URLSearchParams();
    params.append('grant_type', 'authorization_code');
    params.append('code', code);
    params.append('client_id', process.env.CLIENT_ID);
    params.append('client_secret', process.env.CLIENT_SECRET);
    params.append('redirect_uri', 'http://localhost:3001/oauth/callback');
    
    const response = await fetch('https://login.salesforce.com/services/oauth2/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: params
    });
    
    const tokenData = await response.json();
    
    if (tokenData.error) {
      throw new Error(tokenData.error_description);
    }
    
    req.session.accessToken = tokenData.access_token;
    req.session.instanceUrl = tokenData.instance_url;
    
    console.log('Login successful!');
    res.redirect('http://localhost:3000/dashboard');
  } catch (error) {
    console.error('Token error:', error);
    res.status(500).send('OAuth failed: ' + error.message);
  }
});

// Get validation rules
app.get('/api/validation-rules', async (req, res) => {
  if (!req.session?.accessToken) {
    return res.status(401).json({ error: 'Not logged in' });
  }
  
  try {
    const query = encodeURIComponent("SELECT Id, FullName, Metadata FROM ValidationRule");
    const response = await fetch(`${req.session.instanceUrl}/services/data/v58.0/tooling/query?q=${query}`, {
      headers: { 'Authorization': `Bearer ${req.session.accessToken}` }
    });
    
    const data = await response.json();
    
    if (data.error) {
      throw new Error(data.error_description);
    }
    
    const rules = (data.records || []).map(rule => ({
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

// Update validation rule
app.post('/api/update-rule', async (req, res) => {
  const { ruleName, active } = req.body;
  
  if (!req.session?.accessToken) {
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
    console.error('Update error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Logout
app.get('/auth/logout', (req, res) => {
  req.session.destroy();
  res.json({ success: true });
});

app.listen(3001, () => {
  console.log('✅ Backend running on http://localhost:3001');
});