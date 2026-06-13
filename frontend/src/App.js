import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Shield, 
  LogIn, 
  LogOut, 
  RefreshCw, 
  CheckCircle, 
  XCircle,
  Database,
  Cloud,
  Activity,
  Bell,
  User,
  Zap,
  Sparkles,
  Menu,
  X,
  Loader2,
  ArrowRight,
  TrendingUp,
  Clock,
  Server,
  Building2,
  Mail,
  Lock,
  UserCheck
} from 'lucide-react';

// IMPORTANT: Set base URL and credentials for all axios requests
const API_BASE_URL = process.env.REACT_APP_API_URL || 'https://cloud-vandana-assignment.onrender.com';

// Configure axios defaults
axios.defaults.baseURL = API_BASE_URL;
axios.defaults.withCredentials = true;
axios.defaults.headers.common['Accept'] = 'application/json';
axios.defaults.headers.common['Content-Type'] = 'application/json';

function App() {
  const [rules, setRules] = useState([]);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [loading, setLoading] = useState(false);
  const [deploying, setDeploying] = useState(false);
  const [user, setUser] = useState(null);
  const [userInfo, setUserInfo] = useState(null);
  const [environment, setEnvironment] = useState('production');
  const [alert, setAlert] = useState(null);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [hoveredRule, setHoveredRule] = useState(null);

  const showAlert = (message, type = 'success') => {
    setAlert({ message, type });
    setTimeout(() => setAlert(null), 4000);
  };

  const handleLogin = async () => {
    try {
      const res = await axios.get('/auth/login');
      window.location.href = res.data.url;
    } catch (error) {
      showAlert('Login failed: ' + error.message, 'error');
    }
  };

  const handleLogout = async () => {
    try {
      await axios.get('/auth/logout');
    } catch (error) {
      console.error('Logout error:', error);
    }
    setIsLoggedIn(false);
    setRules([]);
    setUser(null);
    setUserInfo(null);
    showAlert('Logged out successfully', 'success');
  };

  const fetchMetadata = async () => {
    setLoading(true);
    try {
      const res = await axios.get('/api/validation-rules');
      setRules(res.data);
      showAlert(`✨ Successfully fetched ${res.data.length} validation rules`, 'success');
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

  const fetchUserInfo = async () => {
    try {
      console.log('Fetching user info from:', `${API_BASE_URL}/api/user/info`);
      const res = await axios.get('/api/user/info');
      console.log('User info response:', res.data);
      
      if (res.data && res.data.user) {
        setUserInfo(res.data.user);
        setUser({
          name: res.data.user.name,
          email: res.data.user.email,
          username: res.data.user.username,
          orgName: res.data.user.orgName
        });
      } else if (res.data && res.data.name) {
        setUserInfo(res.data);
        setUser({
          name: res.data.name,
          email: res.data.email,
          username: res.data.username
        });
      } else {
        setUser({ name: 'Salesforce User', email: 'Connected to Salesforce' });
      }
    } catch (error) {
      console.error('Error fetching user info:', error);
      setUser({ name: 'Salesforce User', email: 'Connected to Salesforce' });
    }
  };

  const toggleRule = async (ruleName, currentStatus) => {
    setDeploying(true);
    try {
      await axios.post('/api/update-rule', {
        ruleName,
        active: !currentStatus
      });
      await fetchMetadata();
      showAlert(`🎯 "${ruleName}" ${!currentStatus ? 'enabled' : 'disabled'}`, 'success');
    } catch (error) {
      showAlert('Error updating rule: ' + error.message, 'error');
    }
    setDeploying(false);
  };

  const enableAll = async () => {
    setDeploying(true);
    for (let rule of rules) {
      try {
        await axios.post('/api/update-rule', {
          ruleName: rule.name,
          active: true
        });
      } catch (error) {
        console.error(`Failed to update ${rule.name}:`, error);
      }
    }
    await fetchMetadata();
    showAlert(`🚀 All rules enabled successfully`, 'success');
    setDeploying(false);
  };

  const disableAll = async () => {
    setDeploying(true);
    for (let rule of rules) {
      try {
        await axios.post('/api/update-rule', {
          ruleName: rule.name,
          active: false
        });
      } catch (error) {
        console.error(`Failed to update ${rule.name}:`, error);
      }
    }
    await fetchMetadata();
    showAlert(`🔒 All rules disabled successfully`, 'success');
    setDeploying(false);
  };

  useEffect(() => {
    if (window.location.pathname === '/dashboard') {
      setIsLoggedIn(true);
      const loadData = async () => {
        await fetchUserInfo();
        await fetchMetadata();
      };
      loadData();
      window.history.pushState({}, '', '/');
    }
  }, []);

  const totalRules = rules.length;
  const activeRules = rules.filter(r => r.active).length;
  const inactiveRules = totalRules - activeRules;

  if (!isLoggedIn) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 relative overflow-hidden">
        <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1558591710-4b4a1ae0f04d?q=80&w=1974&auto=format')] bg-cover bg-center opacity-5"></div>
        <div className="absolute top-20 -right-20 w-96 h-96 bg-purple-500 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-pulse"></div>
        <div className="absolute -bottom-20 -left-20 w-96 h-96 bg-pink-500 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-pulse delay-1000"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-128 h-128 bg-blue-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-pulse delay-2000"></div>

        <div className="relative min-h-screen flex items-center justify-center px-4">
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, type: 'spring' }}
            className="max-w-md w-full"
          >
            <div className="backdrop-blur-2xl bg-white/5 rounded-3xl p-10 shadow-2xl border border-white/10">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ duration: 0.5, type: 'spring' }}
                className="flex justify-center mb-8"
              >
                <div className="w-24 h-24 bg-gradient-to-br from-purple-500 to-pink-500 rounded-2xl flex items-center justify-center shadow-2xl relative">
                  <div className="absolute inset-0 bg-gradient-to-br from-purple-500 to-pink-500 rounded-2xl blur-xl opacity-50"></div>
                  <Shield size={48} className="text-white relative z-10" />
                </div>
              </motion.div>

              <h1 className="text-5xl font-bold text-center text-white mb-3 bg-gradient-to-r from-purple-400 via-pink-400 to-purple-400 bg-clip-text text-transparent">
                Salesforce Switch
              </h1>
              <p className="text-center text-gray-300 mb-10">
                Enterprise Validation Rule Manager
              </p>

              <div className="mb-8">
                <label className="block text-gray-300 text-sm mb-3 font-medium">Select Environment</label>
                <div className="flex gap-3">
                  <button
                    onClick={() => setEnvironment('production')}
                    className="w-full py-3 rounded-xl font-semibold transition-all duration-300 bg-gradient-to-r from-purple-500 to-pink-500 text-white shadow-lg"
                  >
                    Production
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3 mb-8">
                <div className="text-center">
                  <div className="w-10 h-10 bg-white/10 rounded-xl flex items-center justify-center mx-auto mb-2">
                    <Lock size={18} className="text-purple-400" />
                  </div>
                  <p className="text-xs text-gray-400">Secure OAuth</p>
                </div>
                <div className="text-center">
                  <div className="w-10 h-10 bg-white/10 rounded-xl flex items-center justify-center mx-auto mb-2">
                    <Zap size={18} className="text-purple-400" />
                  </div>
                  <p className="text-xs text-gray-400">Real-time Sync</p>
                </div>
                <div className="text-center">
                  <div className="w-10 h-10 bg-white/10 rounded-xl flex items-center justify-center mx-auto mb-2">
                    <Database size={18} className="text-purple-400" />
                  </div>
                  <p className="text-xs text-gray-400">Metadata API</p>
                </div>
              </div>

              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={handleLogin}
                className="w-full py-4 bg-gradient-to-r from-purple-500 to-pink-500 rounded-xl font-bold text-white text-lg flex items-center justify-center gap-2 shadow-lg hover:shadow-2xl transition-all duration-300 relative overflow-hidden group"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-purple-600 to-pink-600 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                <LogIn size={20} className="relative z-10" />
                <span className="relative z-10">Login with OAuth</span>
                <ArrowRight size={18} className="relative z-10 group-hover:translate-x-1 transition-transform" />
              </motion.button>
            </div>
          </motion.div>
        </div>

        <AnimatePresence>
          {alert && (
            <motion.div
              initial={{ opacity: 0, x: 50, y: -20 }}
              animate={{ opacity: 1, x: 0, y: 0 }}
              exit={{ opacity: 0, x: 50 }}
              className="fixed top-5 right-5 z-50"
            >
              <div className={`backdrop-blur-2xl rounded-2xl px-6 py-4 flex items-center gap-3 shadow-2xl border ${
                alert.type === 'success' ? 'bg-green-500/20 border-green-500/30' : 'bg-red-500/20 border-red-500/30'
              } text-white`}>
                {alert.type === 'success' ? <CheckCircle size={20} /> : <XCircle size={20} />}
                <span className="text-sm font-medium">{alert.message}</span>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-50">
      <motion.aside
        initial={{ x: -300 }}
        animate={{ x: sidebarOpen ? 0 : -300 }}
        transition={{ duration: 0.3, type: 'spring' }}
        className="fixed left-0 top-0 bottom-0 w-80 bg-gradient-to-b from-slate-900 to-slate-800 shadow-2xl z-40 overflow-y-auto"
      >
        <div className="p-6 border-b border-white/10">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl flex items-center justify-center shadow-lg relative">
              <div className="absolute inset-0 bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl blur-md opacity-50"></div>
              <Shield size={22} className="text-white relative z-10" />
            </div>
            <div>
              <h3 className="font-bold text-white text-lg">Salesforce Switch</h3>
              <p className="text-xs text-gray-400">Enterprise Edition</p>
            </div>
          </div>
        </div>

        <nav className="p-4">
          <div className="mb-6">
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3 px-3">Main</p>
            <div className="w-full flex items-center gap-3 px-3 py-3 rounded-xl bg-gradient-to-r from-purple-500 to-pink-500 text-white shadow-lg">
              <Database size={18} />
              <span className="font-medium">Validation Rules</span>
            </div>
          </div>

          <div className="mb-6">
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3 px-3">Environment</p>
            <div className="px-3 py-3 flex items-center gap-3 bg-white/5 rounded-xl">
              <Cloud size={18} className="text-purple-400" />
              <span className="font-medium text-gray-300">Production</span>
            </div>
          </div>

          <div className="mb-6">
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3 px-3">Organization</p>
            <div className="px-3 py-3 flex items-center gap-3 bg-white/5 rounded-xl">
              <Building2 size={18} className="text-purple-400" />
              <span className="font-medium text-gray-300 text-sm truncate">
                {userInfo?.orgName || userInfo?.orgId || 'Salesforce Org'}
              </span>
            </div>
          </div>
        </nav>

        <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-white/10 bg-slate-800/50 backdrop-blur-sm">
          <div className="flex items-center gap-3 mb-3 p-2 rounded-xl bg-white/5">
            <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center shadow-md">
              <User size={18} className="text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-white text-sm truncate">{user?.name || 'Salesforce User'}</p>
              <p className="text-xs text-gray-400 truncate flex items-center gap-1">
                <Mail size={10} />
                {user?.email || 'Connected'}
              </p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="w-full py-3 bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 rounded-xl text-white font-medium flex items-center justify-center gap-2 transition-all duration-300 shadow-lg"
          >
            <LogOut size={16} />
            Logout
          </button>
        </div>
      </motion.aside>

      <div className={`transition-all duration-300 ${sidebarOpen ? 'ml-80' : 'ml-0'}`}>
        <header className="bg-white/80 backdrop-blur-md shadow-lg sticky top-0 z-30 border-b border-gray-100">
          <div className="px-8 py-4 flex justify-between items-center">
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="p-2 hover:bg-gray-100 rounded-xl transition-all"
            >
              {sidebarOpen ? <X size={20} className="text-gray-600" /> : <Menu size={20} className="text-gray-600" />}
            </button>
            <div className="flex items-center gap-4">
              <button className="p-2 hover:bg-gray-100 rounded-xl relative transition-all">
                <Bell size={20} className="text-gray-600" />
                <span className="absolute top-1 right-1 w-2 h-2 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full"></span>
              </button>
              <div className="flex items-center gap-3">
                <div className="text-right hidden sm:block">
                  <p className="text-sm font-semibold text-gray-800">{user?.name || 'Salesforce User'}</p>
                  <p className="text-xs text-gray-500">{user?.email || 'Connected'}</p>
                </div>
                <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center shadow-md relative">
                  <div className="absolute inset-0 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full blur-sm opacity-50"></div>
                  <UserCheck size={18} className="text-white relative z-10" />
                </div>
              </div>
            </div>
          </div>
        </header>

        <main className="p-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white rounded-2xl p-6 shadow-xl hover:shadow-2xl transition-all duration-300 border border-gray-100"
            >
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-gray-500 text-sm font-medium">Total Rules</p>
                  <p className="text-4xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent mt-2">{totalRules}</p>
                </div>
                <div className="w-14 h-14 bg-gradient-to-br from-purple-100 to-pink-100 rounded-2xl flex items-center justify-center">
                  <Database size={28} className="text-purple-600" />
                </div>
              </div>
              <div className="mt-4 flex items-center gap-2 text-sm">
                <TrendingUp size={14} className="text-green-500" />
                <span className="text-gray-600">Managed in real-time</span>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="bg-white rounded-2xl p-6 shadow-xl hover:shadow-2xl transition-all duration-300 border border-gray-100"
            >
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-gray-500 text-sm font-medium">Active Rules</p>
                  <p className="text-4xl font-bold text-green-600 mt-2">{activeRules}</p>
                </div>
                <div className="w-14 h-14 bg-gradient-to-br from-green-100 to-emerald-100 rounded-2xl flex items-center justify-center">
                  <CheckCircle size={28} className="text-green-600" />
                </div>
              </div>
              <div className="mt-4 flex items-center gap-2 text-sm">
                <Activity size={14} className="text-green-500" />
                <span className="text-gray-600">Actively enforced</span>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="bg-white rounded-2xl p-6 shadow-xl hover:shadow-2xl transition-all duration-300 border border-gray-100"
            >
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-gray-500 text-sm font-medium">Inactive Rules</p>
                  <p className="text-4xl font-bold text-red-600 mt-2">{inactiveRules}</p>
                </div>
                <div className="w-14 h-14 bg-gradient-to-br from-red-100 to-orange-100 rounded-2xl flex items-center justify-center">
                  <XCircle size={28} className="text-red-600" />
                </div>
              </div>
              <div className="mt-4 flex items-center gap-2 text-sm">
                <Clock size={14} className="text-red-500" />
                <span className="text-gray-600">Currently disabled</span>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="bg-gradient-to-br from-purple-600 to-pink-600 rounded-2xl p-6 shadow-xl relative overflow-hidden group"
            >
              <div className="absolute inset-0 bg-gradient-to-br from-purple-500 to-pink-500 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
              <div className="relative z-10">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="text-purple-100 text-sm font-medium">Sync Status</p>
                    <p className="text-4xl font-bold text-white mt-2">Live</p>
                  </div>
                  <div className="w-14 h-14 bg-white/20 rounded-2xl flex items-center justify-center backdrop-blur-sm">
                    <Server size={28} className="text-white" />
                  </div>
                </div>
                <div className="mt-4 flex items-center gap-2 text-sm text-purple-100">
                  <Activity size={14} />
                  <span>Connected to {userInfo?.orgName || 'Salesforce'}</span>
                </div>
              </div>
            </motion.div>
          </div>

          <div className="flex flex-wrap gap-4 mb-8">
            <button
              onClick={fetchMetadata}
              disabled={loading}
              className="px-8 py-3 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white rounded-xl font-semibold flex items-center gap-2 transition-all duration-300 shadow-lg hover:shadow-xl disabled:opacity-50"
            >
              {loading ? <Loader2 size={18} className="animate-spin" /> : <RefreshCw size={18} />}
              {loading ? 'Fetching...' : 'Get Me Metadata'}
            </button>
            <button
              onClick={enableAll}
              disabled={deploying}
              className="px-8 py-3 bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white rounded-xl font-semibold flex items-center gap-2 transition-all duration-300 shadow-lg hover:shadow-xl disabled:opacity-50"
            >
              <CheckCircle size={18} />
              Enable All
            </button>
            <button
              onClick={disableAll}
              disabled={deploying}
              className="px-8 py-3 bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white rounded-xl font-semibold flex items-center gap-2 transition-all duration-300 shadow-lg hover:shadow-xl disabled:opacity-50"
            >
              <XCircle size={18} />
              Disable All
            </button>
          </div>

          {(loading || deploying) && (
            <div className="flex flex-col items-center justify-center py-20">
              <div className="relative">
                <div className="w-20 h-20 border-4 border-purple-200 border-t-purple-600 rounded-full animate-spin"></div>
                <div className="absolute inset-0 flex items-center justify-center">
                  <Zap size={24} className="text-purple-600 animate-pulse" />
                </div>
              </div>
              <p className="text-gray-600 font-medium mt-4">
                {loading ? 'Querying metadata from Salesforce...' : 'Deploying changes to Salesforce...'}
              </p>
            </div>
          )}

          {!loading && !deploying && rules.length > 0 && (
            <div className="bg-white rounded-2xl shadow-xl overflow-hidden border border-gray-100">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="bg-gradient-to-r from-gray-50 to-gray-100 border-b border-gray-200">
                      <th className="px-6 py-5 text-left text-sm font-semibold text-gray-700">Rule Name</th>
                      <th className="px-6 py-5 text-left text-sm font-semibold text-gray-700">Status</th>
                      <th className="px-6 py-5 text-left text-sm font-semibold text-gray-700">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {rules.map((rule, index) => (
                      <tr
                        key={rule.id}
                        className="hover:bg-gradient-to-r hover:from-purple-50 hover:to-pink-50 transition-all duration-300 cursor-pointer"
                        onMouseEnter={() => setHoveredRule(rule.id)}
                        onMouseLeave={() => setHoveredRule(null)}
                      >
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 bg-gradient-to-br from-purple-100 to-pink-100 rounded-lg flex items-center justify-center">
                              <Database size={14} className="text-purple-600" />
                            </div>
                            <span className="font-semibold text-gray-800">{rule.name}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <span className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-semibold ${
                            rule.active
                              ? 'bg-gradient-to-r from-green-50 to-emerald-50 text-green-700 border border-green-200'
                              : 'bg-gradient-to-r from-red-50 to-orange-50 text-red-700 border border-red-200'
                          }`}>
                            {rule.active ? <CheckCircle size={14} /> : <XCircle size={14} />}
                            {rule.active ? 'Active' : 'Inactive'}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <button
                            onClick={() => toggleRule(rule.name, rule.active)}
                            className={`px-5 py-2 rounded-xl font-semibold transition-all duration-300 shadow-md ${
                              rule.active
                                ? 'bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white'
                                : 'bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white'
                            }`}
                          >
                            {rule.active ? 'Disable' : 'Enable'}
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </main>
      </div>

      <AnimatePresence>
        {alert && (
          <motion.div
            initial={{ opacity: 0, x: 50, y: -20 }}
            animate={{ opacity: 1, x: 0, y: 0 }}
            exit={{ opacity: 0, x: 50 }}
            className="fixed top-24 right-5 z-50"
          >
            <div className={`backdrop-blur-2xl rounded-2xl px-6 py-4 flex items-center gap-3 shadow-2xl border ${
              alert.type === 'success' ? 'bg-green-500/20 border-green-500/30' : 'bg-red-500/20 border-red-500/30'
            } text-white`}>
              {alert.type === 'success' ? <CheckCircle size={20} /> : <XCircle size={20} />}
              <span className="text-sm font-medium">{alert.message}</span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default App;