require('dotenv').config();
const express = require('express');
const session = require('express-session');
const cors = require('cors');
const crypto = require('crypto');

const app = express();

app.use(cors({
  origin: 'http://localhost:3000',
  credentials: true
}));
app.use(express.json());

app.use(session({
  secret: process.env.SESSION_SECRET || 'your-secret-key',
  resave: false,
  saveUninitialized: false,
  cookie: { 
    secure: false,
    maxAge: 24 * 60 * 60 * 1000
  }
}));

let globalAccessToken = null;
let globalInstanceUrl = null;

app.get('/auth/login', (req, res) => {
  const redirectUri = 'http://localhost:3001/oauth/callback';
  const state = crypto.randomBytes(16).toString('hex');
  req.session.oauthState = state;
  
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
  
  if (state !== req.session.oauthState) {
    return res.status(400).send('Invalid state parameter');
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
    globalAccessToken = tokenData.access_token;
    globalInstanceUrl = tokenData.instance_url;
    
    console.log('✅ Login successful!');
    res.redirect('http://localhost:3000/dashboard');
  } catch (error) {
    console.error('OAuth error:', error);
    res.status(500).send('OAuth failed: ' + error.message);
  }
});

// Get validation rules
app.get('/api/validation-rules', async (req, res) => {
  const token = req.session?.accessToken || globalAccessToken;
  const instanceUrl = req.session?.instanceUrl || globalInstanceUrl;
  
  if (!token) {
    return res.status(401).json({ error: 'Not logged in' });
  }
  
  try {
    // Simple query without DeveloperName
    const query = encodeURIComponent("SELECT Id, FullName, Metadata FROM ValidationRule");
    const response = await fetch(`${instanceUrl}/services/data/v58.0/tooling/query?q=${query}`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    
    const data = await response.json();
    
    if (data.records && data.records.length > 0) {
      const rules = data.records.map(rule => ({
        id: rule.Id,
        name: rule.FullName,
        active: rule.Metadata?.active || false
      }));
      console.log(`✅ Found ${rules.length} rules from Salesforce`);
      return res.json(rules);
    }
    
    console.log('No rules found, returning empty array');
    res.json([]);
    
  } catch (error) {
    console.error('Error:', error.message);
    res.json([]);
  }
});

// Update validation rule - FIXED VERSION
app.post('/api/update-rule', async (req, res) => {
  const { ruleName, active } = req.body;
  const token = req.session?.accessToken || globalAccessToken;
  const instanceUrl = req.session?.instanceUrl || globalInstanceUrl;
  
  console.log(`📝 Updating rule: "${ruleName}" to ${active ? 'Active' : 'Inactive'}`);
  
  if (!token) {
    return res.status(401).json({ error: 'Not logged in' });
  }
  
  try {
    // First, get all rules to find the matching one
    const query = encodeURIComponent("SELECT Id, FullName FROM ValidationRule");
    const response = await fetch(`${instanceUrl}/services/data/v58.0/tooling/query?q=${query}`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    
    const data = await response.json();
    
    if (!data.records || data.records.length === 0) {
      console.log('No rules found in org');
      return res.json({ success: false });
    }
    
    // Find the rule that matches (case insensitive)
    const rule = data.records.find(r => 
      r.FullName.toLowerCase() === ruleName.toLowerCase() ||
      r.FullName.replace(/_/g, ' ').toLowerCase() === ruleName.toLowerCase()
    );
    
    if (!rule) {
      console.log(`❌ Rule "${ruleName}" not found. Available rules:`, data.records.map(r => r.FullName));
      return res.json({ success: false });
    }
    
    console.log(`Found rule: ${rule.FullName} (ID: ${rule.Id})`);
    
    // Update the rule
    const updateResponse = await fetch(`${instanceUrl}/services/data/v58.0/tooling/sobjects/ValidationRule/${rule.Id}`, {
      method: 'PATCH',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        Metadata: { active: active }
      })
    });
    
    if (updateResponse.ok) {
      console.log(`✅ Successfully updated ${rule.FullName} to ${active ? 'Active' : 'Inactive'}`);
      res.json({ success: true });
    } else {
      const errorText = await updateResponse.text();
      console.log(`❌ Update failed: ${errorText}`);
      res.json({ success: false });
    }
    
  } catch (error) {
    console.error('Update error:', error.message);
    res.json({ success: false });
  }
});

app.get('/api/auth/status', (req, res) => {
  const token = req.session?.accessToken || globalAccessToken;
  res.json({ isLoggedIn: !!token });
});

app.get('/auth/logout', (req, res) => {
  req.session.destroy();
  globalAccessToken = null;
  globalInstanceUrl = null;
  res.json({ success: true });
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`✅ Backend running on http://localhost:${PORT}`);
});