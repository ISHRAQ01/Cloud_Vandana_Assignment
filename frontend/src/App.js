import React, { useState, useEffect } from 'react';
import axios from 'axios';

axios.defaults.withCredentials = true;

function App() {
  const [rules, setRules] = useState([]);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    try {
      const res = await axios.get('http://localhost:3001/auth/login');
      window.location.href = res.data.url;
    } catch (error) {
      console.error('Login failed:', error);
      alert('Login failed: ' + error.message);
    }
  };

  const handleLogout = async () => {
    await axios.get('http://localhost:3001/auth/logout');
    setIsLoggedIn(false);
    setRules([]);
    window.location.href = '/';
  };

  const fetchRules = async () => {
    setLoading(true);
    try {
      const res = await axios.get('http://localhost:3001/api/validation-rules');
      setRules(res.data);
    } catch (error) {
      if (error.response?.status === 401) {
        setIsLoggedIn(false);
        alert('Session expired. Please login again.');
      } else {
        alert('Error fetching rules: ' + error.message);
      }
    }
    setLoading(false);
  };

  const toggleRule = async (ruleName, currentStatus) => {
    try {
      await axios.post('http://localhost:3001/api/update-rule', {
        ruleName,
        active: !currentStatus
      });
      await fetchRules();
    } catch (error) {
      alert('Error updating rule: ' + error.message);
    }
  };

  const toggleAll = async (active) => {
    setLoading(true);
    for (let rule of rules) {
      try {
        await axios.post('http://localhost:3001/api/update-rule', {
          ruleName: rule.name,
          active: active
        });
      } catch (error) {
        console.error(`Failed to update ${rule.name}:`, error);
      }
    }
    await fetchRules();
    setLoading(false);
  };

  useEffect(() => {
    if (window.location.pathname === '/dashboard') {
      setIsLoggedIn(true);
      fetchRules();
      window.history.pushState({}, '', '/');
    }
  }, []);

  if (!isLoggedIn) {
    return (
      <div style={{ textAlign: 'center', marginTop: '100px' }}>
        <h1>🔐 Salesforce Validation Rule Manager</h1>
        <p>Login to manage validation rules in your Salesforce org</p>
        <button 
          onClick={handleLogin}
          style={{
            padding: '12px 24px',
            fontSize: '16px',
            backgroundColor: '#0070d2',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer'
          }}
        >
          Login to Salesforce
        </button>
      </div>
    );
  }

  return (
    <div style={{ padding: '20px', maxWidth: '1200px', margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h1>📋 Validation Rules Manager</h1>
        <button 
          onClick={handleLogout}
          style={{
            padding: '8px 16px',
            backgroundColor: '#dc3545',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer'
          }}
        >
          Logout
        </button>
      </div>
      
      <div style={{ marginBottom: '20px' }}>
        <button 
          onClick={() => toggleAll(true)}
          style={{ marginRight: '10px', padding: '8px 16px', cursor: 'pointer' }}
        >
          ✅ Enable All
        </button>
        <button 
          onClick={() => toggleAll(false)}
          style={{ marginRight: '10px', padding: '8px 16px', cursor: 'pointer' }}
        >
          ❌ Disable All
        </button>
        <button 
          onClick={fetchRules}
          style={{ padding: '8px 16px', cursor: 'pointer' }}
        >
          🔄 Refresh
        </button>
      </div>
      
      {loading && <p>⏳ Loading...</p>}
      
      <table border="1" cellPadding="12" style={{ width: '100%', borderCollapse: 'collapse' }}>
        <thead style={{ backgroundColor: '#f4f6f9' }}>
          <tr>
            <th>Rule Name</th>
            <th>Status</th>
            <th>Action</th>
          </tr>
        </thead>
        <tbody>
          {rules.map(rule => (
            <tr key={rule.id}>
              <td>{rule.name}</td>
              <td>
                <span style={{
                  color: rule.active ? 'green' : 'red',
                  fontWeight: 'bold'
                }}>
                  {rule.active ? '🟢 Active' : '🔴 Inactive'}
                </span>
              </td>
              <td>
                <button 
                  onClick={() => toggleRule(rule.name, rule.active)}
                  style={{
                    padding: '5px 10px',
                    backgroundColor: rule.active ? '#dc3545' : '#28a745',
                    color: 'white',
                    border: 'none',
                    borderRadius: '3px',
                    cursor: 'pointer'
                  }}
                >
                  {rule.active ? 'Disable' : 'Enable'}
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      
      {rules.length === 0 && !loading && (
        <p style={{ textAlign: 'center', marginTop: '40px' }}>
          No validation rules found. Create some on Account object first!
        </p>
      )}
    </div>
  );
}

export default App;