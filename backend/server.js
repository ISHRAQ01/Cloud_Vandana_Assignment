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

// Login endpoint
app.get('/auth/login', (req, res) => {
  const redirectUri = 'http://localhost:3001/oauth/callback';
  const loginUrl = `https://login.salesforce.com/services/oauth2/authorize?response_type=code&client_id=${process.env.CLIENT_ID}&redirect_uri=${encodeURIComponent(redirectUri)}&scope=api%20refresh_token`;
  
  console.log('Generated login URL');
  res.json({ url: loginUrl });
});

// OAuth callback endpoint
app.get('/oauth/callback', async (req, res) => {
  const { code, error, error_description } = req.query;
  
  if (error) {
    console.error('OAuth error:', error, error_description);
    return res.status(400).send(`Error: ${error} - ${error_description}`);
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
    
    console.log('✅ OAuth successful!');
    res.redirect('http://localhost:3000/dashboard');
  } catch (error) {
    console.error('Token error:', error);
    res.status(500).send('OAuth failed: ' + error.message);
  }
});

// Get all validation rules
app.get('/api/validation-rules', async (req, res) => {
  if (!req.session?.accessToken) {
    return res.status(401).json({ error: 'Not logged in' });
  }
  
  try {
    // Query to get validation rules
    const query = encodeURIComponent("SELECT Id, FullName, Metadata FROM ValidationRule");
    
    console.log('Fetching validation rules...');
    
    const response = await fetch(`${req.session.instanceUrl}/services/data/v58.0/tooling/query?q=${query}`, {
      headers: { 
        'Authorization': `Bearer ${req.session.accessToken}`,
        'Content-Type': 'application/json'
      }
    });
    
    const data = await response.json();
    
    console.log('Salesforce response status:', response.status);
    
    if (data.error) {
      console.error('Salesforce error:', data);
      return res.status(500).json({ error: data.error_description || 'Query failed' });
    }
    
    const rules = (data.records || []).map(rule => ({
      id: rule.Id,
      name: rule.FullName,
      active: rule.Metadata?.active || false
    }));
    
    console.log(`✅ Found ${rules.length} validation rules`);
    rules.forEach(rule => console.log(`  - ${rule.name}: ${rule.active ? 'Active' : 'Inactive'}`));
    
    res.json(rules);
  } catch (error) {
    console.error('Query error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Update a single validation rule
app.post('/api/update-rule', async (req, res) => {
  const { ruleName, active } = req.body;
  
  if (!req.session?.accessToken) {
    return res.status(401).json({ error: 'Not logged in' });
  }
  
  console.log(`Updating rule: ${ruleName} to ${active ? 'Active' : 'Inactive'}`);
  
  const conn = new jsforce.Connection({
    accessToken: req.session.accessToken,
    instanceUrl: req.session.instanceUrl
  });
  
  try {
    await conn.metadata.update('ValidationRule', {
      fullName: ruleName,
      active: active
    });
    
    console.log(`✅ Successfully updated: ${ruleName}`);
    res.json({ success: true, ruleName, active });
  } catch (error) {
    console.error('Update error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Check authentication status
app.get('/api/auth/status', (req, res) => {
  res.json({ 
    isLoggedIn: !!req.session?.accessToken,
    instanceUrl: req.session?.instanceUrl || null
  });
});

// Logout endpoint
app.get('/auth/logout', (req, res) => {
  req.session.destroy();
  console.log('User logged out');
  res.json({ success: true });
});

// Start server
const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`✅ Backend running on http://localhost:${PORT}`);
  console.log(`   OAuth Callback: http://localhost:${PORT}/oauth/callback`);
});