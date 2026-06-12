import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Shield, 
  Lock, 
  Mail, 
  LogIn, 
  LogOut, 
  RefreshCw, 
  Settings, 
  CheckCircle, 
  XCircle,
  Zap,
  Database,
  Cloud,
  Activity,
  Bell,
  User,
  ChevronDown,
  Menu,
  X
} from 'lucide-react';

axios.defaults.withCredentials = true;

function App() {
  const [rules, setRules] = useState([]);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [loading, setLoading] = useState(false);
  const [deploying, setDeploying] = useState(false);
  const [user, setUser] = useState(null);
  const [environment, setEnvironment] = useState('production');
  const [alert, setAlert] = useState(null);
  const [credentials, setCredentials] = useState({ username: '', password: '' });
  const [showCredentials, setShowCredentials] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const showAlert = (message, type = 'success') => {
    setAlert({ message, type });
    setTimeout(() => setAlert(null), 4000);
  };

  const handleLogin = async () => {
    if (showCredentials) {
      // Custom login with username/password
      setLoading(true);
      try {
        const res = await axios.post('http://localhost:3001/auth/custom-login', {
          username: credentials.username,
          password: credentials.password,
          environment: environment
        });
        if (res.data.success) {
          setUser(res.data.user);
          setIsLoggedIn(true);
          showAlert('Login successful! Welcome back.', 'success');
          fetchMetadata();
        }
      } catch (error) {
        showAlert('Invalid credentials. Please try again.', 'error');
      }
      setLoading(false);
    } else {
      // OAuth login
      try {
        const res = await axios.get('http://localhost:3001/auth/login');
        window.location.href = res.data.url;
      } catch (error) {
        showAlert('Login failed: ' + error.message, 'error');
      }
    }
  };

  const handleLogout = async () => {
    await axios.get('http://localhost:3001/auth/logout');
    setIsLoggedIn(false);
    setRules([]);
    setUser(null);
    setCredentials({ username: '', password: '' });
    showAlert('Logged out successfully', 'success');
  };

  const fetchMetadata = async () => {
    setLoading(true);
    try {
      const res = await axios.get('http://localhost:3001/api/validation-rules');
      setRules(res.data);
      showAlert(`Successfully fetched ${res.data.length} validation rules`, 'success');
    } catch (error) {
      if (error.response?.status === 401) {
        setIsLoggedIn(false);
        showAlert('Session expired. Please login again.', 'error');
      } else {
        showAlert('Error fetching rules: ' + error.message, 'error');
      }
    }
    setLoading(false);
  };

  const toggleRule = async (ruleName, currentStatus) => {
    setDeploying(true);
    try {
      await axios.post('http://localhost:3001/api/update-rule', {
        ruleName,
        active: !currentStatus
      });
      await fetchMetadata();
      showAlert(`"${ruleName}" ${!currentStatus ? 'enabled' : 'disabled'} successfully`, 'success');
    } catch (error) {
      showAlert('Error updating rule: ' + error.message, 'error');
    }
    setDeploying(false);
  };

  const deployChanges = async (action, rulesToUpdate) => {
    setDeploying(true);
    for (let rule of rulesToUpdate) {
      try {
        await axios.post('http://localhost:3001/api/update-rule', {
          ruleName: rule.name,
          active: action === 'enable'
        });
      } catch (error) {
        console.error(`Failed to update ${rule.name}:`, error);
      }
    }
    await fetchMetadata();
    showAlert(`Complete - All changes have been successfully deployed to ${environment === 'production' ? 'Production' : 'Sandbox'}`, 'success');
    setDeploying(false);
  };

  const enableAll = () => deployChanges('enable', rules);
  const disableAll = () => deployChanges('disable', rules);

  useEffect(() => {
    if (window.location.pathname === '/dashboard') {
      setIsLoggedIn(true);
      setUser({ username: 'Salesforce User', org: 'Developer Edition', email: 'user@salesforce.com' });
      fetchMetadata();
      window.history.pushState({}, '', '/');
    }
  }, []);

  // Premium Styles
  const styles = {
    gradientBg: {
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    },
    loginContainer: {
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    },
    loginCard: {
      background: 'rgba(255, 255, 255, 0.98)',
      borderRadius: '24px',
      padding: '48px',
      width: '100%',
      maxWidth: '480px',
      boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
    },
    logoIcon: {
      width: '64px',
      height: '64px',
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      borderRadius: '16px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      margin: '0 auto 24px',
    },
    input: {
      width: '100%',
      padding: '14px 16px',
      border: '1px solid #e2e8f0',
      borderRadius: '12px',
      fontSize: '14px',
      transition: 'all 0.3s',
      outline: 'none',
    },
    button: {
      width: '100%',
      padding: '14px',
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      color: 'white',
      border: 'none',
      borderRadius: '12px',
      fontSize: '16px',
      fontWeight: '600',
      cursor: 'pointer',
      transition: 'transform 0.2s',
    },
    dashboardContainer: {
      minHeight: '100vh',
      background: '#f7fafc',
    },
    sidebar: {
      width: '280px',
      background: 'white',
      boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
      position: 'fixed',
      left: 0,
      top: 0,
      bottom: 0,
      zIndex: 40,
      transition: 'transform 0.3s ease',
    },
    mainContent: {
      marginLeft: '280px',
      padding: '24px',
    },
    statCard: {
      background: 'white',
      borderRadius: '16px',
      padding: '20px',
      boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)',
    },
    ruleTable: {
      background: 'white',
      borderRadius: '16px',
      overflow: 'hidden',
      boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)',
    },
    badge: {
      padding: '4px 12px',
      borderRadius: '20px',
      fontSize: '12px',
      fontWeight: '600',
      display: 'inline-flex',
      alignItems: 'center',
      gap: '6px',
    },
  };

  if (!isLoggedIn) {
    return (
      <div style={styles.loginContainer}>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          style={styles.loginCard}
        >
          <div style={styles.logoIcon}>
            <Shield size={32} color="white" />
          </div>
          <h2 style={{ textAlign: 'center', fontSize: '28px', fontWeight: 'bold', marginBottom: '8px' }}>
            Salesforce Switch
          </h2>
          <p style={{ textAlign: 'center', color: '#718096', marginBottom: '32px' }}>
            Enterprise Validation Rule Manager
          </p>

          {/* Environment Toggle */}
          <div style={{ marginBottom: '24px' }}>
            <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500' }}>Environment</label>
            <div style={{ display: 'flex', gap: '12px' }}>
              <button
                onClick={() => setEnvironment('production')}
                style={{
                  flex: 1,
                  padding: '10px',
                  background: environment === 'production' ? 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' : '#f1f5f9',
                  color: environment === 'production' ? 'white' : '#475569',
                  border: 'none',
                  borderRadius: '10px',
                  cursor: 'pointer',
                  fontWeight: '500'
                }}
              >
                Production
              </button>
              <button
                onClick={() => setEnvironment('sandbox')}
                style={{
                  flex: 1,
                  padding: '10px',
                  background: environment === 'sandbox' ? 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' : '#f1f5f9',
                  color: environment === 'sandbox' ? 'white' : '#475569',
                  border: 'none',
                  borderRadius: '10px',
                  cursor: 'pointer',
                  fontWeight: '500'
                }}
              >
                Sandbox
              </button>
            </div>
          </div>

          {/* Login Method Toggle */}
          <div style={{ marginBottom: '24px' }}>
            <div style={{ display: 'flex', gap: '12px', marginBottom: '16px' }}>
              <button
                onClick={() => setShowCredentials(false)}
                style={{
                  flex: 1,
                  padding: '10px',
                  background: !showCredentials ? 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' : '#f1f5f9',
                  color: !showCredentials ? 'white' : '#475569',
                  border: 'none',
                  borderRadius: '10px',
                  cursor: 'pointer'
                }}
              >
                OAuth 2.0
              </button>
              <button
                onClick={() => setShowCredentials(true)}
                style={{
                  flex: 1,
                  padding: '10px',
                  background: showCredentials ? 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' : '#f1f5f9',
                  color: showCredentials ? 'white' : '#475569',
                  border: 'none',
                  borderRadius: '10px',
                  cursor: 'pointer'
                }}
              >
                Username/Password
              </button>
            </div>
          </div>

          {/* Credentials Form */}
          <AnimatePresence>
            {showCredentials && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
              >
                <div style={{ marginBottom: '16px' }}>
                  <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500' }}>
                    <Mail size={16} style={{ display: 'inline', marginRight: '8px' }} />
                    Username / Email
                  </label>
                  <input
                    type="email"
                    placeholder="admin@salesforce.com"
                    value={credentials.username}
                    onChange={(e) => setCredentials({ ...credentials, username: e.target.value })}
                    style={styles.input}
                  />
                </div>
                <div style={{ marginBottom: '24px' }}>
                  <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500' }}>
                    <Lock size={16} style={{ display: 'inline', marginRight: '8px' }} />
                    Password
                  </label>
                  <input
                    type="password"
                    placeholder="••••••••"
                    value={credentials.password}
                    onChange={(e) => setCredentials({ ...credentials, password: e.target.value })}
                    style={styles.input}
                  />
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={handleLogin}
            disabled={loading}
            style={styles.button}
          >
            {loading ? 'Connecting...' : (
              <>
                <LogIn size={18} style={{ display: 'inline', marginRight: '8px' }} />
                {showCredentials ? 'Login to Salesforce' : 'Login with OAuth'}
              </>
            )}
          </motion.button>

          <p style={{ textAlign: 'center', fontSize: '12px', color: '#a0aec0', marginTop: '24px' }}>
            Secured by OAuth 2.0 Protocol
          </p>
        </motion.div>

        {/* Alert Toast */}
        <AnimatePresence>
          {alert && (
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              style={{
                position: 'fixed',
                top: '20px',
                right: '20px',
                padding: '12px 20px',
                borderRadius: '12px',
                background: alert.type === 'success' ? '#48bb78' : '#f56565',
                color: 'white',
                zIndex: 1000
              }}
            >
              {alert.message}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    );
  }

  // Premium Dashboard
  return (
    <div style={styles.dashboardContainer}>
      {/* Sidebar */}
      <motion.aside
        initial={{ x: -280 }}
        animate={{ x: 0 }}
        transition={{ duration: 0.3 }}
        style={styles.sidebar}
      >
        <div style={{ padding: '24px', borderBottom: '1px solid #e2e8f0' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{ ...styles.logoIcon, width: '40px', height: '40px' }}>
              <Shield size={20} color="white" />
            </div>
            <div>
              <h3 style={{ fontWeight: 'bold' }}>Salesforce Switch</h3>
              <p style={{ fontSize: '12px', color: '#718096' }}>Enterprise Edition</p>
            </div>
          </div>
        </div>

        <nav style={{ padding: '24px' }}>
          <div style={{ marginBottom: '32px' }}>
            <p style={{ fontSize: '12px', color: '#a0aec0', marginBottom: '12px' }}>MAIN</p>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '10px', background: '#f7fafc', borderRadius: '10px' }}>
              <Database size={18} />
              <span>Validation Rules</span>
            </div>
          </div>

          <div style={{ marginBottom: '32px' }}>
            <p style={{ fontSize: '12px', color: '#a0aec0', marginBottom: '12px' }}>ENVIRONMENT</p>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '10px' }}>
              <Cloud size={18} />
              <span>{environment === 'production' ? 'Production' : 'Sandbox'}</span>
            </div>
          </div>
        </nav>

        <div style={{ position: 'absolute', bottom: '24px', left: '24px', right: '24px' }}>
          <button
            onClick={handleLogout}
            style={{ width: '100%', padding: '12px', background: '#f56565', color: 'white', border: 'none', borderRadius: '10px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
          >
            <LogOut size={18} />
            Logout
          </button>
        </div>
      </motion.aside>

      {/* Main Content */}
      <div style={styles.mainContent}>
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' }}>
          <div>
            <h1 style={{ fontSize: '28px', fontWeight: 'bold', color: '#1a202c' }}>Validation Rules Manager</h1>
            <p style={{ color: '#718096' }}>Manage Account object validation rules in real-time</p>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <div style={{ position: 'relative' }}>
              <Bell size={20} color="#718096" />
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <div style={{ width: '40px', height: '40px', background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <User size={20} color="white" />
              </div>
              <div>
                <p style={{ fontWeight: '500', fontSize: '14px' }}>{user?.username || 'Admin User'}</p>
                <p style={{ fontSize: '12px', color: '#718096' }}>{user?.email || 'admin@salesforce.com'}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '20px', marginBottom: '32px' }}>
          <div style={styles.statCard}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <p style={{ color: '#718096', fontSize: '14px' }}>Total Rules</p>
                <p style={{ fontSize: '32px', fontWeight: 'bold' }}>{rules.length}</p>
              </div>
              <div style={{ width: '48px', height: '48px', background: '#ebf4ff', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Database size={24} color="#667eea" />
              </div>
            </div>
          </div>
          <div style={styles.statCard}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <p style={{ color: '#718096', fontSize: '14px' }}>Active Rules</p>
                <p style={{ fontSize: '32px', fontWeight: 'bold', color: '#48bb78' }}>{rules.filter(r => r.active).length}</p>
              </div>
              <div style={{ width: '48px', height: '48px', background: '#f0fff4', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <CheckCircle size={24} color="#48bb78" />
              </div>
            </div>
          </div>
          <div style={styles.statCard}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <p style={{ color: '#718096', fontSize: '14px' }}>Inactive Rules</p>
                <p style={{ fontSize: '32px', fontWeight: 'bold', color: '#f56565' }}>{rules.filter(r => !r.active).length}</p>
              </div>
              <div style={{ width: '48px', height: '48px', background: '#fff5f5', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <XCircle size={24} color="#f56565" />
              </div>
            </div>
          </div>
          <div style={styles.statCard}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <p style={{ color: '#718096', fontSize: '14px' }}>Sync Status</p>
                <p style={{ fontSize: '32px', fontWeight: 'bold', color: '#4299e1' }}>Live</p>
              </div>
              <div style={{ width: '48px', height: '48px', background: '#ebf8ff', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Activity size={24} color="#4299e1" />
              </div>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div style={{ display: 'flex', gap: '12px', marginBottom: '24px' }}>
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={fetchMetadata}
            disabled={loading}
            style={{ padding: '12px 24px', background: '#4299e1', color: 'white', border: 'none', borderRadius: '10px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', fontWeight: '500' }}
          >
            <RefreshCw size={18} />
            {loading ? 'Fetching...' : 'Get Me Metadata'}
          </motion.button>
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={enableAll}
            disabled={deploying}
            style={{ padding: '12px 24px', background: '#48bb78', color: 'white', border: 'none', borderRadius: '10px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', fontWeight: '500' }}
          >
            <CheckCircle size={18} />
            Enable All
          </motion.button>
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={disableAll}
            disabled={deploying}
            style={{ padding: '12px 24px', background: '#f56565', color: 'white', border: 'none', borderRadius: '10px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', fontWeight: '500' }}
          >
            <XCircle size={18} />
            Disable All
          </motion.button>
        </div>

        {/* Loaders */}
        {(loading || deploying) && (
          <div style={{ textAlign: 'center', padding: '60px' }}>
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
              style={{ width: '48px', height: '48px', border: '4px solid #e2e8f0', borderTop: '4px solid #667eea', borderRadius: '50%', margin: '0 auto 16px' }}
            />
            <p>{loading ? 'Querying metadata from Salesforce...' : 'Deploying changes to Salesforce...'}</p>
          </div>
        )}

        {/* Rules Table */}
        {!loading && !deploying && rules.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            style={styles.ruleTable}
          >
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead style={{ background: '#f7fafc' }}>
                <tr>
                  <th style={{ padding: '16px', textAlign: 'left' }}>Rule Name</th>
                  <th style={{ padding: '16px', textAlign: 'left' }}>Status</th>
                  <th style={{ padding: '16px', textAlign: 'left' }}>Action</th>
                </tr>
              </thead>
              <tbody>
                {rules.map((rule, index) => (
                  <motion.tr
                    key={rule.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.1 }}
                    style={{ borderBottom: '1px solid #e2e8f0' }}
                  >
                    <td style={{ padding: '16px', fontWeight: '500' }}>{rule.name}</td>
                    <td style={{ padding: '16px' }}>
                      <span style={{
                        ...styles.badge,
                        background: rule.active ? '#f0fff4' : '#fff5f5',
                        color: rule.active ? '#48bb78' : '#f56565'
                      }}>
                        {rule.active ? <CheckCircle size={14} /> : <XCircle size={14} />}
                        {rule.active ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td style={{ padding: '16px' }}>
                      <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => toggleRule(rule.name, rule.active)}
                        style={{
                          padding: '8px 20px',
                          background: rule.active ? '#f56565' : '#48bb78',
                          color: 'white',
                          border: 'none',
                          borderRadius: '8px',
                          cursor: 'pointer',
                          fontWeight: '500'
                        }}
                      >
                        {rule.active ? 'Disable' : 'Enable'}
                      </motion.button>
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </motion.div>
        )}
      </div>

      {/* Alert Toast */}
      <AnimatePresence>
        {alert && (
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            style={{
              position: 'fixed',
              bottom: '20px',
              right: '20px',
              padding: '14px 24px',
              borderRadius: '12px',
              background: alert.type === 'success' ? '#48bb78' : '#f56565',
              color: 'white',
              zIndex: 1000,
              boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)'
            }}
          >
            {alert.type === 'success' ? <CheckCircle size={18} style={{ display: 'inline', marginRight: '8px' }} /> : <XCircle size={18} style={{ display: 'inline', marginRight: '8px' }} />}
            {alert.message}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default App;