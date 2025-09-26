import React, { useState, useEffect } from 'react';
import { useSuperAdminAuth } from '../../context/SuperAdminAuthContext';
import { useNotification } from '../../context/NotificationContext';
import { 
  Settings, 
  Globe, 
  Shield, 
  Database, 
  Mail, 
  Bell,
  Save,
  Key,
  Server,
  Lock
} from 'lucide-react';

const SuperAdminSettings = () => {
  const { apiCall, user } = useSuperAdminAuth();
  const { addNotification } = useNotification();
  
  const [platformSettings, setPlatformSettings] = useState({
    platform_name: 'RestaurantAI',
    platform_description: 'AI-Powered Multi-Restaurant Management Platform',
    maintenance_mode: false,
    allow_new_registrations: true,
    max_restaurants: 100,
    commission_rate: 5.0,
    currency: 'USD',
    timezone: 'America/New_York'
  });
  
  const [securitySettings, setSecuritySettings] = useState({
    session_timeout: 24,
    password_min_length: 8,
    require_2fa: false,
    max_login_attempts: 5,
    lockout_duration: 30
  });
  
  const [emailSettings, setEmailSettings] = useState({
    smtp_host: '',
    smtp_port: 587,
    smtp_username: '',
    smtp_password: '',
    from_email: '',
    from_name: 'RestaurantAI'
  });
  
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [activeTab, setActiveTab] = useState('platform');

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    setIsLoading(true);
    try {
      const response = await apiCall('/super-admin/settings');
      if (response && response.success) {
        setPlatformSettings(response.data.platform || platformSettings);
        setSecuritySettings(response.data.security || securitySettings);
        setEmailSettings(response.data.email || emailSettings);
      } else {
        console.warn('Settings endpoint response format unexpected, using default settings');
      }
    } catch (error) {
      console.error('Failed to load settings:', error);
      // Keep default settings and don't show error
      console.warn('Settings endpoint not available, using default settings');
    } finally {
      setIsLoading(false);
    }
  };

  const saveSettings = async (settingsType, settings) => {
    setIsSaving(true);
    try {
      const response = await apiCall(`/super-admin/settings/${settingsType}`, {
        method: 'PUT',
        body: settings
      });

      if (response.success) {
        addNotification(`${settingsType} settings updated successfully`, 'success');
        // Reload settings to ensure consistency
        setTimeout(() => loadSettings(), 1000);
      }
    } catch (error) {
      addNotification(`Failed to update ${settingsType} settings`, 'error');
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-4 border-yellow-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Platform Settings</h1>
        <p className="text-gray-600">Configure global platform settings and preferences</p>
      </div>

      {/* Settings Tabs */}
      <div className="bg-white rounded-xl shadow-sm border">
        <div className="border-b border-gray-200">
          <nav className="flex space-x-8 px-6">
            {[
              { id: 'platform', label: 'Platform', icon: Globe },
              { id: 'security', label: 'Security', icon: Shield },
              { id: 'email', label: 'Email', icon: Mail },
              { id: 'database', label: 'Database', icon: Database }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center space-x-2 py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === tab.id
                    ? 'border-yellow-500 text-yellow-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <tab.icon className="w-5 h-5" />
                <span>{tab.label}</span>
              </button>
            ))}
          </nav>
        </div>

        <div className="p-6">
          {/* Platform Settings */}
          {activeTab === 'platform' && (
            <div className="space-y-6">
              <h3 className="text-lg font-semibold text-gray-900">Platform Configuration</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Platform Name</label>
                  <input
                    type="text"
                    value={platformSettings.platform_name}
                    onChange={(e) => setPlatformSettings(prev => ({ ...prev, platform_name: e.target.value }))}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-500"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Currency</label>
                  <select
                    value={platformSettings.currency}
                    onChange={(e) => setPlatformSettings(prev => ({ ...prev, currency: e.target.value }))}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-500"
                  >
                    <option value="USD">USD ($)</option>
                    <option value="EUR">EUR (€)</option>
                    <option value="GBP">GBP (£)</option>
                    <option value="CAD">CAD (C$)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Platform Description</label>
                <textarea
                  value={platformSettings.platform_description}
                  onChange={(e) => setPlatformSettings(prev => ({ ...prev, platform_description: e.target.value }))}
                  rows={3}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-500"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Max Restaurants</label>
                  <input
                    type="number"
                    value={platformSettings.max_restaurants}
                    onChange={(e) => setPlatformSettings(prev => ({ ...prev, max_restaurants: parseInt(e.target.value) }))}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-500"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Commission Rate (%)</label>
                  <input
                    type="number"
                    step="0.1"
                    value={platformSettings.commission_rate}
                    onChange={(e) => setPlatformSettings(prev => ({ ...prev, commission_rate: parseFloat(e.target.value) }))}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-500"
                  />
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-gray-900">Maintenance Mode</p>
                    <p className="text-sm text-gray-500">Temporarily disable platform access</p>
                  </div>
                  <input
                    type="checkbox"
                    checked={platformSettings.maintenance_mode}
                    onChange={(e) => setPlatformSettings(prev => ({ ...prev, maintenance_mode: e.target.checked }))}
                    className="rounded"
                  />
                </div>
                
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-gray-900">Allow New Registrations</p>
                    <p className="text-sm text-gray-500">Enable new customer and restaurant signups</p>
                  </div>
                  <input
                    type="checkbox"
                    checked={platformSettings.allow_new_registrations}
                    onChange={(e) => setPlatformSettings(prev => ({ ...prev, allow_new_registrations: e.target.checked }))}
                    className="rounded"
                  />
                </div>
              </div>

              <button
                onClick={() => saveSettings('platform', platformSettings)}
                disabled={isSaving}
                className="w-full bg-yellow-600 text-white py-2 px-4 rounded-lg hover:bg-yellow-700 transition-colors disabled:opacity-50 flex items-center justify-center space-x-2"
              >
                <Save className="w-4 h-4" />
                <span>{isSaving ? 'Saving...' : 'Save Platform Settings'}</span>
              </button>
            </div>
          )}

          {/* Security Settings */}
          {activeTab === 'security' && (
            <div className="space-y-6">
              <h3 className="text-lg font-semibold text-gray-900">Security Configuration</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Session Timeout (hours)</label>
                  <input
                    type="number"
                    value={securitySettings.session_timeout}
                    onChange={(e) => setSecuritySettings(prev => ({ ...prev, session_timeout: parseInt(e.target.value) }))}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-500"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Password Min Length</label>
                  <input
                    type="number"
                    value={securitySettings.password_min_length}
                    onChange={(e) => setSecuritySettings(prev => ({ ...prev, password_min_length: parseInt(e.target.value) }))}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Max Login Attempts</label>
                  <input
                    type="number"
                    value={securitySettings.max_login_attempts}
                    onChange={(e) => setSecuritySettings(prev => ({ ...prev, max_login_attempts: parseInt(e.target.value) }))}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-500"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Lockout Duration (minutes)</label>
                  <input
                    type="number"
                    value={securitySettings.lockout_duration}
                    onChange={(e) => setSecuritySettings(prev => ({ ...prev, lockout_duration: parseInt(e.target.value) }))}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-500"
                  />
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-gray-900">Require Two-Factor Authentication</p>
                    <p className="text-sm text-gray-500">Enforce 2FA for all admin accounts</p>
                  </div>
                  <input
                    type="checkbox"
                    checked={securitySettings.require_2fa}
                    onChange={(e) => setSecuritySettings(prev => ({ ...prev, require_2fa: e.target.checked }))}
                    className="rounded"
                  />
                </div>
              </div>

              <button
                onClick={() => saveSettings('security', securitySettings)}
                disabled={isSaving}
                className="w-full bg-yellow-600 text-white py-2 px-4 rounded-lg hover:bg-yellow-700 transition-colors disabled:opacity-50 flex items-center justify-center space-x-2"
              >
                <Shield className="w-4 h-4" />
                <span>{isSaving ? 'Saving...' : 'Save Security Settings'}</span>
              </button>
            </div>
          )}

          {/* Email Settings */}
          {activeTab === 'email' && (
            <div className="space-y-6">
              <h3 className="text-lg font-semibold text-gray-900">Email Configuration</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">SMTP Host</label>
                  <input
                    type="text"
                    value={emailSettings.smtp_host}
                    onChange={(e) => setEmailSettings(prev => ({ ...prev, smtp_host: e.target.value }))}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-500"
                    placeholder="smtp.gmail.com"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">SMTP Port</label>
                  <input
                    type="number"
                    value={emailSettings.smtp_port}
                    onChange={(e) => setEmailSettings(prev => ({ ...prev, smtp_port: parseInt(e.target.value) }))}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">SMTP Username</label>
                  <input
                    type="text"
                    value={emailSettings.smtp_username}
                    onChange={(e) => setEmailSettings(prev => ({ ...prev, smtp_username: e.target.value }))}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-500"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">SMTP Password</label>
                  <input
                    type="password"
                    value={emailSettings.smtp_password}
                    onChange={(e) => setEmailSettings(prev => ({ ...prev, smtp_password: e.target.value }))}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">From Email</label>
                  <input
                    type="email"
                    value={emailSettings.from_email}
                    onChange={(e) => setEmailSettings(prev => ({ ...prev, from_email: e.target.value }))}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-500"
                    placeholder="noreply@restaurantai.com"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">From Name</label>
                  <input
                    type="text"
                    value={emailSettings.from_name}
                    onChange={(e) => setEmailSettings(prev => ({ ...prev, from_name: e.target.value }))}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-500"
                  />
                </div>
              </div>

              <button
                onClick={() => saveSettings('email', emailSettings)}
                disabled={isSaving}
                className="w-full bg-yellow-600 text-white py-2 px-4 rounded-lg hover:bg-yellow-700 transition-colors disabled:opacity-50 flex items-center justify-center space-x-2"
              >
                <Mail className="w-4 h-4" />
                <span>{isSaving ? 'Saving...' : 'Save Email Settings'}</span>
              </button>
            </div>
          )}

          {/* Database Settings */}
          {activeTab === 'database' && (
            <div className="space-y-6">
              <h3 className="text-lg font-semibold text-gray-900">Database Management</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-gray-50 rounded-lg p-4">
                  <div className="flex items-center space-x-2 mb-2">
                    <Database className="w-5 h-5 text-blue-600" />
                    <h4 className="font-medium text-gray-900">Database Size</h4>
                  </div>
                  <p className="text-2xl font-bold text-blue-600">2.4 GB</p>
                  <p className="text-sm text-gray-500">Total database size</p>
                </div>
                
                <div className="bg-gray-50 rounded-lg p-4">
                  <div className="flex items-center space-x-2 mb-2">
                    <Server className="w-5 h-5 text-green-600" />
                    <h4 className="font-medium text-gray-900">Connections</h4>
                  </div>
                  <p className="text-2xl font-bold text-green-600">45/100</p>
                  <p className="text-sm text-gray-500">Active connections</p>
                </div>
                
                <div className="bg-gray-50 rounded-lg p-4">
                  <div className="flex items-center space-x-2 mb-2">
                    <Lock className="w-5 h-5 text-purple-600" />
                    <h4 className="font-medium text-gray-900">Last Backup</h4>
                  </div>
                  <p className="text-2xl font-bold text-purple-600">2h ago</p>
                  <p className="text-sm text-gray-500">Automated backup</p>
                </div>
              </div>

              <div className="space-y-4">
                <button className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center space-x-2">
                  <Database className="w-4 h-4" />
                  <span>Create Manual Backup</span>
                </button>
                
                <button className="w-full bg-green-600 text-white py-3 px-4 rounded-lg hover:bg-green-700 transition-colors flex items-center justify-center space-x-2">
                  <Server className="w-4 h-4" />
                  <span>Optimize Database</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* System Information */}
      <div className="bg-white rounded-xl shadow-sm border p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-6">System Information</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="text-center">
            <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-3">
              <Server className="w-6 h-6 text-blue-600" />
            </div>
            <p className="text-sm font-medium text-gray-700">Server Version</p>
            <p className="text-lg font-bold text-gray-900">v2.1.0</p>
          </div>
          
          <div className="text-center">
            <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3">
              <Database className="w-6 h-6 text-green-600" />
            </div>
            <p className="text-sm font-medium text-gray-700">Database Version</p>
            <p className="text-lg font-bold text-gray-900">SQLite 3.42</p>
          </div>
          
          <div className="text-center">
            <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-3">
              <Globe className="w-6 h-6 text-purple-600" />
            </div>
            <p className="text-sm font-medium text-gray-700">API Version</p>
            <p className="text-lg font-bold text-gray-900">v1.0.0</p>
          </div>
          
          <div className="text-center">
            <div className="w-12 h-12 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-3">
              <Shield className="w-6 h-6 text-yellow-600" />
            </div>
            <p className="text-sm font-medium text-gray-700">Security Level</p>
            <p className="text-lg font-bold text-gray-900">High</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SuperAdminSettings;   