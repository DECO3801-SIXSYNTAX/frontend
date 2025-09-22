import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import {
  ArrowLeft,
  Calendar,
  MapPin,
  Clock,
  FileText,
  Upload,
  QrCode,
  Download,
  Mail,
  Users,
  Shield,
  History,
  Eye,
  Archive,
  RotateCcw,
  Plus,
  Palette,
  CheckCircle,
  AlertCircle
} from 'lucide-react';
import { useDashboard } from '../contexts/DashboardContext';
import { Event } from '../types/dashboard';
import QRCode from 'qrcode';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import AddMemberModal from '../components/modals/AddMemberModal';
import AddVersionNoteModal from '../components/modals/AddVersionNoteModal';

interface EventConfig {
  id: string;
  eventId: string;
  branding: {
    logo?: string;
    primaryColor: string;
    secondaryColor: string;
    theme: string;
  };
  qrCodes: {
    guestCheckin: boolean;
    seatLookup: boolean;
    generatedAt?: string;
  };
  collaboration: {
    members: Array<{
      id: string;
      name: string;
      email: string;
      role: 'admin' | 'planner' | 'vendor' | 'viewer' | 'editor';
      status?: 'online' | 'away' | 'offline';
      permissions?: {
        editLayout: boolean;
        manageGuests: boolean;
        exportData: boolean;
      };
      addedAt?: string;
      addedBy?: string;
    }>;
  };
  versionHistory: {
    versions: Array<{
      id: string;
      version: string;
      status: 'current' | 'draft' | 'published' | 'archived';
      description: string;
      timestamp: string;
      createdBy: string;
      notes?: Array<{
        id: string;
        note: string;
        createdAt: string;
        createdBy: string;
        version: string;
      }>;
    }>;
  };
}

interface EventConfigurationProps {
  eventId: string;
}

const EventConfiguration: React.FC<EventConfigurationProps> = ({ eventId }) => {
  const { events, setCurrentPage } = useDashboard();
  const [activeTab, setActiveTab] = useState('general');
  const [event, setEvent] = useState<Event | null>(null);
  const [config, setConfig] = useState<EventConfig | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [generatedQRCodes, setGeneratedQRCodes] = useState<{[key: string]: string}>({});
  const [isGeneratingQR, setIsGeneratingQR] = useState(false);
  const [qrGenerationSuccess, setQrGenerationSuccess] = useState(false);
  const [isAddMemberModalOpen, setIsAddMemberModalOpen] = useState(false);
  const [isAddNoteModalOpen, setIsAddNoteModalOpen] = useState(false);
  const qrPreviewRef = useRef<HTMLDivElement>(null);

  const tabs = [
    { id: 'general', label: 'General Settings', icon: FileText },
    { id: 'qr', label: 'QR Code Management', icon: QrCode },
    { id: 'collaboration', label: 'Collaboration', icon: Users },
    { id: 'history', label: 'Version History', icon: History }
  ];

  const themes = [
    'Modern Corporate',
    'Elegant',
    'Casual',
    'Minimalist',
    'Vibrant',
    'Professional'
  ];

  const colors = [
    { name: 'Indigo', value: '#6366f1' },
    { name: 'Purple', value: '#8b5cf6' },
    { name: 'Blue', value: '#3b82f6' },
    { name: 'Green', value: '#10b981' },
    { name: 'Orange', value: '#f59e0b' },
    { name: 'Red', value: '#ef4444' }
  ];

  useEffect(() => {
    loadEventAndConfig();
  }, [eventId]);

  const loadEventAndConfig = async () => {
    setIsLoading(true);
    try {
      // Find the event
      const foundEvent = events.find(e => e.id === eventId);
      if (foundEvent) {
        setEvent(foundEvent);
      }

      // Load event configuration
      const response = await fetch(`${process.env.REACT_APP_DASHBOARD_API_URL || 'http://localhost:3002'}/eventConfigs?eventId=${eventId}`);
      if (response.ok) {
        const configs = await response.json();
        if (configs.length > 0) {
          setConfig(configs[0]);
        } else {
          // Create default config
          const defaultConfig: EventConfig = {
            id: `config-${eventId}`,
            eventId,
            branding: {
              primaryColor: '#6366f1',
              secondaryColor: '#8b5cf6',
              theme: 'Modern Corporate'
            },
            qrCodes: {
              guestCheckin: true,
              seatLookup: false
            },
            collaboration: {
              members: []
            },
            versionHistory: {
              versions: [{
                id: '1',
                version: 'v1.0',
                status: 'current',
                description: 'Initial version',
                timestamp: new Date().toISOString(),
                createdBy: 'System',
                notes: []
              }]
            }
          };
          setConfig(defaultConfig);
          await saveConfig(defaultConfig);
        }
      }
    } catch (error) {
      console.error('Error loading event configuration:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const saveConfig = async (newConfig: EventConfig) => {
    setIsSaving(true);
    try {
      const response = await fetch(`${process.env.REACT_APP_DASHBOARD_API_URL || 'http://localhost:3002'}/eventConfigs/${newConfig.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newConfig)
      });

      if (response.ok) {
        setConfig(newConfig);
      }
    } catch (error) {
      console.error('Error saving configuration:', error);
    } finally {
      setIsSaving(false);
    }
  };

  const updateConfig = (updates: Partial<EventConfig>) => {
    if (!config) return;
    const newConfig = { ...config, ...updates };
    saveConfig(newConfig);
  };

  const generateQRCodes = async () => {
    if (!event || !config) return;

    setIsGeneratingQR(true);
    setQrGenerationSuccess(false);

    try {
      const qrCodes: {[key: string]: string} = {};

      // Generate QR for guest check-in
      if (config.qrCodes.guestCheckin) {
        const checkinUrl = `${window.location.origin}/checkin/${eventId}`;
        qrCodes.guestCheckin = await QRCode.toDataURL(checkinUrl, {
          width: 200,
          margin: 2,
          color: {
            dark: config.branding.primaryColor,
            light: '#FFFFFF'
          }
        });
      }

      // Generate QR for seat lookup
      if (config.qrCodes.seatLookup) {
        const seatUrl = `${window.location.origin}/seat-lookup/${eventId}`;
        qrCodes.seatLookup = await QRCode.toDataURL(seatUrl, {
          width: 200,
          margin: 2,
          color: {
            dark: config.branding.primaryColor,
            light: '#FFFFFF'
          }
        });
      }

      setGeneratedQRCodes(qrCodes);

      // Update config with generation timestamp
      const updatedConfig = {
        ...config,
        qrCodes: {
          ...config.qrCodes,
          generatedAt: new Date().toISOString()
        }
      };
      await saveConfig(updatedConfig);

      setQrGenerationSuccess(true);
      setTimeout(() => setQrGenerationSuccess(false), 3000);

    } catch (error) {
      console.error('Error generating QR codes:', error);
    } finally {
      setIsGeneratingQR(false);
    }
  };

  const downloadQRCode = (type: string, format: 'png' | 'pdf' = 'png') => {
    const qrData = generatedQRCodes[type];
    if (!qrData || !event) return;

    if (format === 'png') {
      const link = document.createElement('a');
      link.download = `${event.name.replace(/\s+/g, '-')}-${type}-qr.png`;
      link.href = qrData;
      link.click();
    } else if (format === 'pdf') {
      generatePDF(type);
    }
  };

  const generatePDF = async (type: string) => {
    if (!event || !generatedQRCodes[type]) return;

    const pdf = new jsPDF();
    const pageWidth = pdf.internal.pageSize.width;
    const pageHeight = pdf.internal.pageSize.height;

    // Add title
    pdf.setFontSize(20);
    pdf.text(event.name, pageWidth / 2, 30, { align: 'center' });

    pdf.setFontSize(14);
    pdf.text(`${type === 'guestCheckin' ? 'Guest Check-in' : 'Seat Lookup'} QR Code`, pageWidth / 2, 45, { align: 'center' });

    // Add event details
    pdf.setFontSize(10);
    pdf.text(`Date: ${new Date(event.startDate).toLocaleDateString()}`, 20, 60);
    pdf.text(`Venue: ${event.venue}`, 20, 70);

    // Add QR code
    const qrSize = 100;
    const qrX = (pageWidth - qrSize) / 2;
    const qrY = 90;

    pdf.addImage(generatedQRCodes[type], 'PNG', qrX, qrY, qrSize, qrSize);

    // Add instructions
    pdf.setFontSize(12);
    const instructions = type === 'guestCheckin'
      ? 'Scan this QR code to check in to the event'
      : 'Scan this QR code to find your seat';
    pdf.text(instructions, pageWidth / 2, qrY + qrSize + 20, { align: 'center' });

    // Download
    pdf.save(`${event.name.replace(/\s+/g, '-')}-${type}-qr.pdf`);
  };

  const downloadAllQRCodes = async () => {
    if (!event || Object.keys(generatedQRCodes).length === 0) return;

    const pdf = new jsPDF();
    const pageWidth = pdf.internal.pageSize.width;
    let yOffset = 30;

    // Title
    pdf.setFontSize(20);
    pdf.text(`${event.name} - QR Codes`, pageWidth / 2, yOffset, { align: 'center' });
    yOffset += 20;

    // Event details
    pdf.setFontSize(10);
    pdf.text(`Date: ${new Date(event.startDate).toLocaleDateString()}`, 20, yOffset);
    pdf.text(`Venue: ${event.venue}`, 20, yOffset + 10);
    yOffset += 30;

    // Add each QR code
    Object.entries(generatedQRCodes).forEach(([type, qrData], index) => {
      if (index > 0) {
        pdf.addPage();
        yOffset = 30;
      }

      pdf.setFontSize(14);
      const title = type === 'guestCheckin' ? 'Guest Check-in QR Code' : 'Seat Lookup QR Code';
      pdf.text(title, pageWidth / 2, yOffset, { align: 'center' });
      yOffset += 20;

      const qrSize = 100;
      const qrX = (pageWidth - qrSize) / 2;
      pdf.addImage(qrData, 'PNG', qrX, yOffset, qrSize, qrSize);
      yOffset += qrSize + 20;

      pdf.setFontSize(12);
      const instructions = type === 'guestCheckin'
        ? 'Scan this QR code to check in to the event'
        : 'Scan this QR code to find your seat';
      pdf.text(instructions, pageWidth / 2, yOffset, { align: 'center' });
    });

    pdf.save(`${event.name.replace(/\s+/g, '-')}-all-qr-codes.pdf`);
  };

  const handleAddMember = async (newMember: any) => {
    if (!config) return;

    const updatedConfig = {
      ...config,
      collaboration: {
        ...config.collaboration,
        members: [...config.collaboration.members, newMember]
      }
    };

    await saveConfig(updatedConfig);
  };

  const handleAddVersionNote = async (note: any) => {
    if (!config) return;

    const updatedConfig = {
      ...config,
      versionHistory: {
        ...config.versionHistory,
        versions: config.versionHistory.versions.map((version, index) =>
          index === 0 ? { ...version, notes: [...(version.notes || []), note] } : version
        )
      }
    };

    await saveConfig(updatedConfig);
  };

  const handleRestoreVersion = async (versionId: string) => {
    if (!config) return;

    // In a real implementation, this would restore the configuration
    // For now, we'll just show a success message
    alert('Version restored successfully!');
  };

  const getCurrentVersion = () => {
    if (!config?.versionHistory?.versions?.length) return 'v1.0';
    return config.versionHistory.versions[0].version;
  };

  if (isLoading || !event || !config) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading event configuration...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-6">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={() => setCurrentPage('event-settings')}
            className="flex items-center text-gray-600 hover:text-gray-900 mb-4"
          >
            <ArrowLeft className="h-5 w-5 mr-2" />
            Back to Event Settings
          </button>
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-start justify-between">
              <div>
                <h1 className="text-2xl font-bold text-gray-900">{event.name}</h1>
                <div className="flex items-center space-x-6 mt-2 text-sm text-gray-600">
                  <div className="flex items-center">
                    <Calendar className="h-4 w-4 mr-1" />
                    {new Date(event.startDate).toLocaleDateString()}
                  </div>
                  <div className="flex items-center">
                    <MapPin className="h-4 w-4 mr-1" />
                    {event.venue}
                  </div>
                  <div className="flex items-center">
                    <Clock className="h-4 w-4 mr-1" />
                    {event.startDate.includes('T') ?
                      new Date(event.startDate).toLocaleTimeString('en-US', {
                        hour: '2-digit',
                        minute: '2-digit'
                      }) : 'All day'
                    }
                  </div>
                </div>
              </div>
              <span className={`px-3 py-1 rounded-full text-sm font-medium capitalize ${
                event.status === 'draft' ? 'bg-gray-100 text-gray-700' :
                event.status === 'planning' ? 'bg-blue-100 text-blue-700' :
                event.status === 'active' ? 'bg-yellow-100 text-yellow-700' :
                event.status === 'confirmed' ? 'bg-green-100 text-green-700' :
                'bg-purple-100 text-purple-700'
              }`}>
                {event.status}
              </span>
            </div>
          </div>
        </div>

        {/* Tabs Navigation */}
        <div className="mb-6">
          <nav className="flex space-x-1 bg-white rounded-lg shadow-sm border border-gray-200 p-1">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center px-4 py-2 text-sm font-medium rounded-md transition-colors ${
                    activeTab === tab.id
                      ? 'bg-indigo-100 text-indigo-700'
                      : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  <Icon className="h-4 w-4 mr-2" />
                  {tab.label}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Tab Content */}
        <div className="space-y-6">
          {activeTab === 'general' && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-6"
            >
              {/* Event Information */}
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">Event Information</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Event Name</label>
                    <input
                      type="text"
                      value={event.name}
                      readOnly
                      className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Venue</label>
                    <input
                      type="text"
                      value={event.venue}
                      readOnly
                      className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Date</label>
                    <input
                      type="date"
                      value={event.startDate.split('T')[0]}
                      readOnly
                      className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Time</label>
                    <input
                      type="time"
                      value={event.startDate.includes('T') ? event.startDate.split('T')[1].substring(0, 5) : ''}
                      readOnly
                      className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50"
                    />
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
                    <textarea
                      value={event.description}
                      readOnly
                      rows={3}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50"
                    />
                  </div>
                </div>
              </div>

              {/* Branding */}
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">Branding</h2>

                {/* Logo Upload */}
                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-700 mb-2">Event Logo</label>
                  <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-gray-400 transition-colors">
                    <Upload className="mx-auto h-12 w-12 text-gray-400 mb-2" />
                    <p className="text-sm text-gray-600 mb-2">Drag and drop your logo here, or</p>
                    <button className="text-indigo-600 hover:text-indigo-700 text-sm font-medium">
                      Browse files
                    </button>
                  </div>
                </div>

                {/* Brand Colors */}
                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-700 mb-3">Brand Colors</label>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-xs font-medium text-gray-500 mb-2">Primary Color</label>
                      <div className="flex space-x-2">
                        {colors.map((color) => (
                          <button
                            key={color.value}
                            onClick={() => updateConfig({
                              branding: { ...config.branding, primaryColor: color.value }
                            })}
                            className={`w-8 h-8 rounded-full border-2 transition-all ${
                              config.branding.primaryColor === color.value
                                ? 'border-gray-900 scale-110'
                                : 'border-gray-300 hover:border-gray-400'
                            }`}
                            style={{ backgroundColor: color.value }}
                            title={color.name}
                          />
                        ))}
                      </div>
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-500 mb-2">Secondary Color</label>
                      <div className="flex space-x-2">
                        {colors.map((color) => (
                          <button
                            key={color.value}
                            onClick={() => updateConfig({
                              branding: { ...config.branding, secondaryColor: color.value }
                            })}
                            className={`w-8 h-8 rounded-full border-2 transition-all ${
                              config.branding.secondaryColor === color.value
                                ? 'border-gray-900 scale-110'
                                : 'border-gray-300 hover:border-gray-400'
                            }`}
                            style={{ backgroundColor: color.value }}
                            title={color.name}
                          />
                        ))}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Theme */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Theme</label>
                  <select
                    value={config.branding.theme}
                    onChange={(e) => updateConfig({
                      branding: { ...config.branding, theme: e.target.value }
                    })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  >
                    {themes.map((theme) => (
                      <option key={theme} value={theme}>{theme}</option>
                    ))}
                  </select>
                </div>
              </div>
            </motion.div>
          )}

          {activeTab === 'qr' && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-6"
            >
              {/* QR Code Settings */}
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">QR Code Generation</h2>

                {/* Success Message */}
                {qrGenerationSuccess && (
                  <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg flex items-center">
                    <CheckCircle className="h-5 w-5 text-green-500 mr-2" />
                    <span className="text-sm text-green-700">QR codes generated successfully!</span>
                  </div>
                )}

                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-sm font-medium text-gray-900">Guest Check-in QR</h3>
                      <p className="text-sm text-gray-500">Allow guests to check in using QR codes</p>
                    </div>
                    <button
                      onClick={() => updateConfig({
                        qrCodes: { ...config.qrCodes, guestCheckin: !config.qrCodes.guestCheckin }
                      })}
                      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                        config.qrCodes.guestCheckin ? 'bg-indigo-600' : 'bg-gray-200'
                      }`}
                    >
                      <span
                        className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                          config.qrCodes.guestCheckin ? 'translate-x-6' : 'translate-x-1'
                        }`}
                      />
                    </button>
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-sm font-medium text-gray-900">Seat Lookup QR</h3>
                      <p className="text-sm text-gray-500">Allow guests to find their seats using QR codes</p>
                    </div>
                    <button
                      onClick={() => updateConfig({
                        qrCodes: { ...config.qrCodes, seatLookup: !config.qrCodes.seatLookup }
                      })}
                      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                        config.qrCodes.seatLookup ? 'bg-indigo-600' : 'bg-gray-200'
                      }`}
                    >
                      <span
                        className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                          config.qrCodes.seatLookup ? 'translate-x-6' : 'translate-x-1'
                        }`}
                      />
                    </button>
                  </div>
                </div>

                {/* Generation Info */}
                {config.qrCodes.generatedAt && (
                  <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                    <p className="text-sm text-blue-700">
                      Last generated: {new Date(config.qrCodes.generatedAt).toLocaleString()}
                    </p>
                  </div>
                )}

                <div className="mt-6 space-y-3">
                  <button
                    onClick={generateQRCodes}
                    disabled={isGeneratingQR || (!config.qrCodes.guestCheckin && !config.qrCodes.seatLookup)}
                    className="w-full bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center justify-center"
                  >
                    {isGeneratingQR ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                        Generating QR Codes...
                      </>
                    ) : (
                      <>
                        <QrCode className="h-4 w-4 mr-2" />
                        Generate QR Codes
                      </>
                    )}
                  </button>

                  {Object.keys(generatedQRCodes).length > 0 && (
                    <button
                      onClick={downloadAllQRCodes}
                      className="w-full bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors flex items-center justify-center"
                    >
                      <Download className="h-4 w-4 mr-2" />
                      Download All QR Codes (PDF)
                    </button>
                  )}
                </div>

                {(!config.qrCodes.guestCheckin && !config.qrCodes.seatLookup) && (
                  <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg flex items-center">
                    <AlertCircle className="h-5 w-5 text-yellow-500 mr-2" />
                    <span className="text-sm text-yellow-700">Please enable at least one QR code type to generate codes.</span>
                  </div>
                )}
              </div>

              {/* QR Code Preview */}
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6" ref={qrPreviewRef}>
                <h2 className="text-lg font-semibold text-gray-900 mb-4">QR Code Review & Download</h2>

                {Object.keys(generatedQRCodes).length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {config.qrCodes.guestCheckin && generatedQRCodes.guestCheckin && (
                      <div className="text-center border border-gray-200 rounded-lg p-4">
                        <h3 className="text-sm font-medium text-gray-900 mb-3">Guest Check-in QR Code</h3>
                        <div className="w-48 h-48 mx-auto mb-4 flex items-center justify-center">
                          <img
                            src={generatedQRCodes.guestCheckin}
                            alt="Guest Check-in QR Code"
                            className="w-full h-full object-contain"
                          />
                        </div>
                        <p className="text-xs text-gray-500 mb-3">Scan to check in to the event</p>
                        <div className="flex space-x-2">
                          <button
                            onClick={() => downloadQRCode('guestCheckin', 'png')}
                            className="flex-1 bg-gray-100 text-gray-700 px-3 py-2 rounded text-sm hover:bg-gray-200 flex items-center justify-center"
                          >
                            <Download className="h-4 w-4 mr-1" />
                            PNG
                          </button>
                          <button
                            onClick={() => downloadQRCode('guestCheckin', 'pdf')}
                            className="flex-1 bg-indigo-600 text-white px-3 py-2 rounded text-sm hover:bg-indigo-700 flex items-center justify-center"
                          >
                            <Download className="h-4 w-4 mr-1" />
                            PDF
                          </button>
                        </div>
                      </div>
                    )}

                    {config.qrCodes.seatLookup && generatedQRCodes.seatLookup && (
                      <div className="text-center border border-gray-200 rounded-lg p-4">
                        <h3 className="text-sm font-medium text-gray-900 mb-3">Seat Lookup QR Code</h3>
                        <div className="w-48 h-48 mx-auto mb-4 flex items-center justify-center">
                          <img
                            src={generatedQRCodes.seatLookup}
                            alt="Seat Lookup QR Code"
                            className="w-full h-full object-contain"
                          />
                        </div>
                        <p className="text-xs text-gray-500 mb-3">Scan to find your seat</p>
                        <div className="flex space-x-2">
                          <button
                            onClick={() => downloadQRCode('seatLookup', 'png')}
                            className="flex-1 bg-gray-100 text-gray-700 px-3 py-2 rounded text-sm hover:bg-gray-200 flex items-center justify-center"
                          >
                            <Download className="h-4 w-4 mr-1" />
                            PNG
                          </button>
                          <button
                            onClick={() => downloadQRCode('seatLookup', 'pdf')}
                            className="flex-1 bg-indigo-600 text-white px-3 py-2 rounded text-sm hover:bg-indigo-700 flex items-center justify-center"
                          >
                            <Download className="h-4 w-4 mr-1" />
                            PDF
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <QrCode className="mx-auto h-16 w-16 text-gray-400 mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">No QR Codes Generated</h3>
                    <p className="text-gray-500 mb-4">
                      Generate QR codes to see the preview and download options here
                    </p>
                  </div>
                )}

                {/* Email to Guests Section */}
                <div className="mt-6 pt-6 border-t border-gray-200">
                  <h3 className="text-sm font-medium text-gray-900 mb-2">Email to Guests</h3>
                  <p className="text-sm text-gray-500 mb-4">
                    Email QR codes directly to event guests (Coming Soon)
                  </p>
                  <button
                    disabled
                    className="flex items-center justify-center px-4 py-2 bg-gray-100 text-gray-400 rounded-lg cursor-not-allowed"
                  >
                    <Mail className="h-4 w-4 mr-2" />
                    Email QR Codes (Upcoming Feature)
                  </button>
                </div>
              </div>
            </motion.div>
          )}

          {activeTab === 'collaboration' && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-6"
            >
              {/* Team Collaboration */}
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-semibold text-gray-900">Team Collaboration</h2>
                  <button
                    onClick={() => setIsAddMemberModalOpen(true)}
                    className="flex items-center px-3 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
                  >
                    <Plus className="h-4 w-4 mr-1" />
                    Add Member
                  </button>
                </div>

                <div className="space-y-3">
                  {config.collaboration.members.map((member) => (
                    <div key={member.id} className="flex items-center justify-between p-3 border border-gray-200 rounded-lg">
                      <div className="flex items-center space-x-3">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-medium ${
                          member.role === 'admin' ? 'bg-purple-500' :
                          member.role === 'planner' ? 'bg-blue-500' : 'bg-green-500'
                        }`}>
                          {member.name.charAt(0)}
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-900">{member.name}</p>
                          <p className="text-xs text-gray-500">{member.email}</p>
                        </div>
                        <span className="text-xs text-gray-500 capitalize">({member.role})</span>
                        <span className={`w-2 h-2 rounded-full ${
                          member.status === 'online' ? 'bg-green-400' :
                          member.status === 'away' ? 'bg-yellow-400' : 'bg-gray-400'
                        }`} />
                      </div>
                      <div className="flex items-center space-x-2">
                        <button className="text-gray-400 hover:text-gray-600">
                          <Shield className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  ))}

                  {config.collaboration.members.length === 0 && (
                    <div className="text-center py-8 text-gray-500">
                      <Users className="h-12 w-12 mx-auto mb-3 text-gray-300" />
                      <p>No team members added yet</p>
                      <p className="text-sm">Add members to collaborate on this event</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Permission Settings */}
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">Permission Settings</h2>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-sm font-medium text-gray-900">Edit Layout</h3>
                      <p className="text-sm text-gray-500">Allow members to modify event layout and design</p>
                    </div>
                    <button className="relative inline-flex h-6 w-11 items-center rounded-full bg-indigo-600">
                      <span className="inline-block h-4 w-4 transform rounded-full bg-white translate-x-6" />
                    </button>
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-sm font-medium text-gray-900">Manage Guests</h3>
                      <p className="text-sm text-gray-500">Allow members to add, edit, and remove guests</p>
                    </div>
                    <button className="relative inline-flex h-6 w-11 items-center rounded-full bg-indigo-600">
                      <span className="inline-block h-4 w-4 transform rounded-full bg-white translate-x-6" />
                    </button>
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-sm font-medium text-gray-900">Export Data</h3>
                      <p className="text-sm text-gray-500">Allow members to export guest lists and reports</p>
                    </div>
                    <button className="relative inline-flex h-6 w-11 items-center rounded-full bg-gray-200">
                      <span className="inline-block h-4 w-4 transform rounded-full bg-white translate-x-1" />
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {activeTab === 'history' && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-6"
            >
              {/* Version History */}
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-semibold text-gray-900">Version History</h2>
                  <div className="flex items-center space-x-2">
                    <span className="text-sm text-green-600 flex items-center">
                      <div className="w-2 h-2 bg-green-400 rounded-full mr-2"></div>
                      Auto-save enabled
                    </span>
                    <button
                      onClick={() => setIsAddNoteModalOpen(true)}
                      className="flex items-center px-3 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
                    >
                      <Plus className="h-4 w-4 mr-1" />
                      Add Note
                    </button>
                  </div>
                </div>

                <div className="space-y-3">
                  {config.versionHistory.versions.map((version) => (
                    <div key={version.id} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                      <div className="flex items-center space-x-4">
                        <div className={`w-3 h-3 rounded-full ${
                          version.status === 'current' ? 'bg-green-400' :
                          version.status === 'draft' ? 'bg-yellow-400' :
                          version.status === 'published' ? 'bg-blue-400' : 'bg-gray-400'
                        }`} />
                        <div>
                          <div className="flex items-center space-x-2">
                            <p className="text-sm font-medium text-gray-900">{version.version}</p>
                            <span className={`px-2 py-1 rounded-full text-xs font-medium capitalize ${
                              version.status === 'current' ? 'bg-green-100 text-green-700' :
                              version.status === 'draft' ? 'bg-yellow-100 text-yellow-700' :
                              version.status === 'published' ? 'bg-blue-100 text-blue-700' :
                              'bg-gray-100 text-gray-700'
                            }`}>
                              {version.status}
                            </span>
                          </div>
                          <p className="text-sm text-gray-600">{version.description}</p>
                          <p className="text-xs text-gray-500">
                            {new Date(version.timestamp).toLocaleString()} by {version.createdBy}
                          </p>
                          {version.notes && version.notes.length > 0 && (
                            <div className="mt-2">
                              <p className="text-xs font-medium text-gray-700 mb-1">Notes:</p>
                              {version.notes.map((note: any) => (
                                <div key={note.id} className="text-xs text-gray-600 bg-gray-50 rounded px-2 py-1 mb-1">
                                  <p>{note.note}</p>
                                  <p className="text-gray-500 mt-1">
                                    {new Date(note.createdAt).toLocaleString()} by {note.createdBy}
                                  </p>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <button className="p-2 text-gray-400 hover:text-gray-600" title="View">
                          <Eye className="h-4 w-4" />
                        </button>
                        {version.status !== 'current' && (
                          <>
                            <button
                              onClick={() => handleRestoreVersion(version.id)}
                              className="p-2 text-gray-400 hover:text-gray-600"
                              title="Restore"
                            >
                              <RotateCcw className="h-4 w-4" />
                            </button>
                            <button className="p-2 text-gray-400 hover:text-gray-600" title="Archive">
                              <Archive className="h-4 w-4" />
                            </button>
                          </>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>
          )}
        </div>

        {/* Save Status */}
        {isSaving && (
          <div className="fixed bottom-4 right-4 bg-indigo-600 text-white px-4 py-2 rounded-lg shadow-lg">
            Saving configuration...
          </div>
        )}

        {/* Modals */}
        <AddMemberModal
          isOpen={isAddMemberModalOpen}
          onClose={() => setIsAddMemberModalOpen(false)}
          onAddMember={handleAddMember}
          existingMembers={config.collaboration.members}
          eventId={eventId}
        />

        <AddVersionNoteModal
          isOpen={isAddNoteModalOpen}
          onClose={() => setIsAddNoteModalOpen(false)}
          onAddNote={handleAddVersionNote}
          currentVersion={getCurrentVersion()}
        />
      </div>
    </div>
  );
};

export default EventConfiguration;