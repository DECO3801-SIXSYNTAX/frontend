import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  Palette,
  Monitor,
  Sun,
  Moon,
  Eye,
  Type,
  Volume2,
  VolumeX,
  Bell,
  BellOff,
  Globe,
  Accessibility
} from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';
import { SettingsService } from '../services/SettingsService';

interface AppSettings {
  theme: 'light' | 'dark' | 'system';
  primaryColor: string;
  secondaryColor: string;
  fontSize: 'small' | 'medium' | 'large';
  reducedMotion: boolean;
  soundEnabled: boolean;
  notificationsEnabled: boolean;
  language: string;
  highContrast: boolean;
  autoSave: boolean;
}

const AppSettings: React.FC = () => {
  const navigate = useNavigate();
  const { settings: themeSettings, updateSettings, isDark } = useTheme();
  const [systemSettings, setSystemSettings] = useState({
    soundEnabled: true,
    notificationsEnabled: true,
    language: 'en',
    autoSave: true
  });
  const [isSaving, setIsSaving] = useState(false);

  // Initialize service
  const settingsService = new SettingsService();

  const themes = [
    { id: 'light', name: 'Light', icon: Sun },
    { id: 'dark', name: 'Dark', icon: Moon },
    { id: 'system', name: 'System', icon: Monitor }
  ];

  const colors = [
    { name: 'Indigo', value: 'indigo' },
    { name: 'Purple', value: 'purple' },
    { name: 'Blue', value: 'blue' },
    { name: 'Green', value: 'green' }
  ];

  const languages = [
    { code: 'en', name: 'English' },
    { code: 'id', name: 'Bahasa Indonesia' },
    { code: 'fr', name: 'Français' },
    { code: 'es', name: 'Español' }
  ];

  useEffect(() => {
    loadSystemSettings();
  }, []);

  const loadSystemSettings = async () => {
    try {
      const settings = await settingsService.getSystemSettings();
      setSystemSettings(settings);
    } catch (error) {
      console.error('Error loading system settings:', error);
    }
  };

  const updateSystemSetting = async (key: keyof typeof systemSettings, value: any) => {
    setIsSaving(true);
    try {
      const newSystemSettings = { ...systemSettings, [key]: value };
      setSystemSettings(newSystemSettings);

      await settingsService.updateSystemSettings(newSystemSettings);
    } catch (error) {
      console.error('Error saving system settings:', error);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-6">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={() => navigate('/planner')}
            className="flex items-center text-gray-600 hover:text-gray-900 mb-4"
          >
            <ArrowLeft className="h-5 w-5 mr-2" />
            Back to Dashboard
          </button>
          <h1 className="text-3xl font-bold text-gray-900">App Settings</h1>
          <p className="text-gray-600 mt-2">Customize your SiPanit experience</p>
        </div>

        {/* Settings Sections */}
        <div className="space-y-6">
          {/* Theme & Appearance */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-lg shadow-sm border border-gray-200 p-6"
          >
            <div className="flex items-center mb-4">
              <Palette className="h-6 w-6 text-primary-600 mr-3" />
              <h2 className="text-xl font-semibold text-gray-900">Theme & Appearance</h2>
            </div>

            {/* Theme Selection */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-3">Theme</label>
              <div className="grid grid-cols-3 gap-3">
                {themes.map((theme) => {
                  const Icon = theme.icon;
                  return (
                    <button
                      key={theme.id}
                      type="button"
                      onClick={() => {
                        updateSettings({ theme: theme.id as 'light' | 'dark' | 'system' });
                      }}
                      className={`p-3 border-2 rounded-lg flex items-center justify-center transition-colors ${
                        themeSettings.theme === theme.id
                          ? 'border-primary-500 bg-primary-50'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <Icon className="h-5 w-5 mr-2" />
                      {theme.name}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Primary Color */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-3">Primary Color</label>
              <div className="flex space-x-3">
                {colors.map((color) => {
                  const colorValue = color.value === 'indigo' ? '#6366f1' :
                                   color.value === 'purple' ? '#8b5cf6' :
                                   color.value === 'blue' ? '#3b82f6' : '#10b981';
                  return (
                    <button
                      key={color.value}
                      type="button"
                      onClick={() => {
                        updateSettings({ primaryColor: color.value });
                      }}
                      className={`w-10 h-10 rounded-full border-4 transition-all ${
                        themeSettings.primaryColor === color.value
                          ? 'border-gray-400 scale-110'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                      style={{ backgroundColor: colorValue }}
                      title={color.name}
                    />
                  );
                })}
              </div>
            </div>

            {/* Font Size */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">Font Size</label>
              <div className="grid grid-cols-3 gap-3">
                {(['small', 'medium', 'large'] as const).map((size) => (
                  <button
                    key={size}
                    type="button"
                    onClick={() => {
                      updateSettings({ fontSize: size });
                    }}
                    className={`p-3 border-2 rounded-lg text-center transition-colors capitalize ${
                      themeSettings.fontSize === size
                        ? 'border-primary-500 bg-primary-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <Type className="h-5 w-5 mx-auto mb-1" />
                    {size}
                  </button>
                ))}
              </div>
            </div>

            {/* Compact Mode */}
            <div className="mt-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-medium text-gray-900">Compact Mode</h3>
                  <p className="text-sm text-gray-500">Reduce spacing and padding for more content</p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    updateSettings({ compactMode: !themeSettings.compactMode });
                  }}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                    themeSettings.compactMode ? 'bg-primary-600' : 'bg-gray-200'
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      themeSettings.compactMode ? 'translate-x-6' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>
            </div>
          </motion.div>

          {/* Accessibility */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-white rounded-lg shadow-sm border border-gray-200 p-6"
          >
            <div className="flex items-center mb-4">
              <Accessibility className="h-6 w-6 text-primary-600 mr-3" />
              <h2 className="text-xl font-semibold text-gray-900">Accessibility</h2>
            </div>

            <div className="space-y-4">
              {/* Reduced Motion */}
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-medium text-gray-900">Reduced Motion</h3>
                  <p className="text-sm text-gray-500">Minimize animations and transitions</p>
                </div>
                <button
                  onClick={() => updateSettings({ reducedMotion: !themeSettings.reducedMotion })}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                    themeSettings.reducedMotion ? 'bg-primary-600' : 'bg-gray-200'
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      themeSettings.reducedMotion ? 'translate-x-6' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>

              {/* High Contrast */}
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-medium text-gray-900">High Contrast</h3>
                  <p className="text-sm text-gray-500">Increase color contrast for better visibility</p>
                </div>
                <button
                  onClick={() => updateSettings({ highContrast: !themeSettings.highContrast })}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                    themeSettings.highContrast ? 'bg-primary-600' : 'bg-gray-200'
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      themeSettings.highContrast ? 'translate-x-6' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>
            </div>
          </motion.div>

          {/* System Preferences */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-white rounded-lg shadow-sm border border-gray-200 p-6"
          >
            <div className="flex items-center mb-4">
              <Globe className="h-6 w-6 text-primary-600 mr-3" />
              <h2 className="text-xl font-semibold text-gray-900">System Preferences</h2>
            </div>

            <div className="space-y-4">
              {/* Language */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Language</label>
                <select
                  value={systemSettings.language}
                  onChange={(e) => updateSystemSetting('language', e.target.value)}
                  className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                >
                  {languages.map((lang) => (
                    <option key={lang.code} value={lang.code}>
                      {lang.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Sound */}
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  {systemSettings.soundEnabled ? (
                    <Volume2 className="h-5 w-5 text-gray-400 mr-3" />
                  ) : (
                    <VolumeX className="h-5 w-5 text-gray-400 mr-3" />
                  )}
                  <div>
                    <h3 className="text-sm font-medium text-gray-900">Sound Effects</h3>
                    <p className="text-sm text-gray-500">Play sounds for interactions and notifications</p>
                  </div>
                </div>
                <button
                  onClick={() => updateSystemSetting('soundEnabled', !systemSettings.soundEnabled)}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                    systemSettings.soundEnabled ? 'bg-primary-600' : 'bg-gray-200'
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      systemSettings.soundEnabled ? 'translate-x-6' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>

              {/* Notifications */}
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  {systemSettings.notificationsEnabled ? (
                    <Bell className="h-5 w-5 text-gray-400 mr-3" />
                  ) : (
                    <BellOff className="h-5 w-5 text-gray-400 mr-3" />
                  )}
                  <div>
                    <h3 className="text-sm font-medium text-gray-900">Notifications</h3>
                    <p className="text-sm text-gray-500">Receive notifications for important updates</p>
                  </div>
                </div>
                <button
                  onClick={() => updateSystemSetting('notificationsEnabled', !systemSettings.notificationsEnabled)}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                    systemSettings.notificationsEnabled ? 'bg-primary-600' : 'bg-gray-200'
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      systemSettings.notificationsEnabled ? 'translate-x-6' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>

              {/* Auto Save */}
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-medium text-gray-900">Auto Save</h3>
                  <p className="text-sm text-gray-500">Automatically save changes as you work</p>
                </div>
                <button
                  onClick={() => updateSystemSetting('autoSave', !systemSettings.autoSave)}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                    systemSettings.autoSave ? 'bg-primary-600' : 'bg-gray-200'
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      systemSettings.autoSave ? 'translate-x-6' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>
            </div>
          </motion.div>
        </div>

        {/* Save Status */}
        {isSaving && (
          <div className="fixed bottom-4 right-4 bg-primary-600 text-white px-4 py-2 rounded-lg shadow-lg">
            Saving settings...
          </div>
        )}
      </div>
    </div>
  );
};

export default AppSettings;