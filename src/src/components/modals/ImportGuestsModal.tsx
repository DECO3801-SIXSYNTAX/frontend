import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Upload, File, CheckCircle, XCircle, Download, Users } from 'lucide-react';
import Papa from 'papaparse';
import ExcelJS from 'exceljs';
import { Guest } from '../../types/dashboard';
import { DashboardService } from '../../services/DashboardService';
import { useDashboard } from '../../contexts/DashboardContext';

interface ImportGuestsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface GuestRow {
  name: string;
  email: string;
  phone: string;
  dietaryRestrictions: string;
  accessibilityNeeds: string;
  eventId?: string;
}

const ImportGuestsModal: React.FC<ImportGuestsModalProps> = ({ isOpen, onClose }) => {
  const { events, currentUser, refreshData } = useDashboard();
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [selectedEventId, setSelectedEventId] = useState<string>('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [step, setStep] = useState<'select' | 'preview' | 'result'>('select');
  const [parsedData, setParsedData] = useState<GuestRow[]>([]);
  const [importResults, setImportResults] = useState<{
    successful: number;
    failed: number;
    errors: string[];
  }>({ successful: 0, failed: 0, errors: [] });

  const dashboardService = new DashboardService();

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      parseFile(file);
    }
  };

  const parseFile = async (file: File) => {
    setIsProcessing(true);
    try {
      const fileExtension = file.name.split('.').pop()?.toLowerCase();

      if (fileExtension === 'csv') {
        parseCSV(file);
      } else if (fileExtension === 'xlsx' || fileExtension === 'xls') {
        parseExcel(file);
      } else {
        throw new Error('Unsupported file format. Please use CSV, XLS, or XLSX files.');
      }
    } catch (error: any) {
      setImportResults({
        successful: 0,
        failed: 0,
        errors: [error.message || 'Failed to parse file']
      });
      setStep('result');
    } finally {
      setIsProcessing(false);
    }
  };

  const parseCSV = (file: File) => {
    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        if (results.errors.length > 0) {
          setImportResults({
            successful: 0,
            failed: 0,
            errors: results.errors.map(error => error.message)
          });
          setStep('result');
          return;
        }

        const processedData = processRawData(results.data as any[]);
        setParsedData(processedData);
        setStep('preview');
      },
      error: (error) => {
        setImportResults({
          successful: 0,
          failed: 0,
          errors: [error.message || 'Failed to parse CSV file']
        });
        setStep('result');
      }
    });
  };

  const parseExcel = async (file: File) => {
    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        const arrayBuffer = e.target?.result as ArrayBuffer;
        const workbook = new ExcelJS.Workbook();
        await workbook.xlsx.load(arrayBuffer);
        
        const worksheet = workbook.worksheets[0];
        if (!worksheet) {
          throw new Error('No worksheet found in Excel file');
        }

        const jsonData: any[] = [];
        const headers: string[] = [];
        
        // Get headers from first row
        worksheet.getRow(1).eachCell((cell, colNumber) => {
          headers[colNumber - 1] = cell.value?.toString() || `Column${colNumber}`;
        });

        // Get data from subsequent rows
        worksheet.eachRow((row, rowNumber) => {
          if (rowNumber === 1) return; // Skip header row
          
          const rowData: any = {};
          row.eachCell((cell, colNumber) => {
            const header = headers[colNumber - 1];
            rowData[header] = cell.value;
          });
          
          jsonData.push(rowData);
        });

        const processedData = processRawData(jsonData);
        setParsedData(processedData);
        setStep('preview');
      } catch (error: any) {
        setImportResults({
          successful: 0,
          failed: 0,
          errors: [error.message || 'Failed to parse Excel file']
        });
        setStep('result');
      }
    };
    reader.readAsArrayBuffer(file);
  };

  const processRawData = (rawData: any[]): GuestRow[] => {
    return rawData.map((row, index) => {
      // Try to map common column names to our expected fields
      const normalizedRow: GuestRow = {
        name: row.name || row.Name || row.full_name || row['Full Name'] || row.guest_name || row['Guest Name'] || '',
        email: row.email || row.Email || row.email_address || row['Email Address'] || '',
        phone: row.phone || row.Phone || row.phone_number || row['Phone Number'] || row.mobile || row.Mobile || '',
        dietaryRestrictions: row.dietary_restrictions || row['Dietary Restrictions'] || row.dietary || row.Dietary || row.diet || row.Diet || 'none',
        accessibilityNeeds: row.accessibility_needs || row['Accessibility Needs'] || row.accessibility || row.Accessibility || row.special_needs || row['Special Needs'] || 'none'
      };

      return normalizedRow;
    }).filter(row => row.name && row.email); // Filter out rows without required fields
  };

  const validateData = (data: GuestRow[]): { valid: GuestRow[], errors: string[] } => {
    const valid: GuestRow[] = [];
    const errors: string[] = [];
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    data.forEach((row, index) => {
      if (!row.name.trim()) {
        errors.push(`Row ${index + 1}: Name is required`);
        return;
      }
      if (!row.email.trim()) {
        errors.push(`Row ${index + 1}: Email is required`);
        return;
      }
      if (!emailRegex.test(row.email)) {
        errors.push(`Row ${index + 1}: Invalid email format`);
        return;
      }
      valid.push(row);
    });

    return { valid, errors };
  };

  const handleImport = async () => {
    if (!selectedEventId) {
      setImportResults({
        successful: 0,
        failed: 0,
        errors: ['Please select an event for the guests']
      });
      setStep('result');
      return;
    }

    if (!selectedFile) {
      setImportResults({
        successful: 0,
        failed: 0,
        errors: ['Please select a file to import']
      });
      setStep('result');
      return;
    }

    setIsProcessing(true);

    try {
      // Use the new importGuestsFromCSV method that goes through Django backend
      const result: any = await dashboardService.importGuestsFromCSV(selectedFile, selectedEventId);
      await refreshData();

      // Backend returns {imported: number, skipped: [{line: number, reason: string}]}
      const imported = result.imported || 0;
      const skippedArray = Array.isArray(result.skipped) ? result.skipped : [];
      const skippedCount = skippedArray.length;

      // Convert skipped array to error messages
      const errorMessages = skippedArray.map((item: any) =>
        `Line ${item.line}: ${item.reason}`
      );

      setImportResults({
        successful: imported,
        failed: skippedCount,
        errors: errorMessages.slice(0, 10) // Show only first 10 errors
      });
      setStep('result');
    } catch (error: any) {
      setImportResults({
        successful: 0,
        failed: parsedData.length,
        errors: [error.message || 'Failed to import guests']
      });
      setStep('result');
    } finally {
      setIsProcessing(false);
    }
  };

  const downloadTemplate = () => {
    const template = [
      {
        name: 'John Doe',
        email: 'john.doe@example.com',
        phone: '+1-555-123-4567',
        dietary_restrictions: 'vegetarian',
        accessibility_needs: 'wheelchair access'
      },
      {
        name: 'Jane Smith',
        email: 'jane.smith@example.com',
        phone: '+1-555-987-6543',
        dietary_restrictions: 'none',
        accessibility_needs: 'none'
      }
    ];

    const csv = Papa.unparse(template);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', 'guest_import_template.csv');
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const resetModal = () => {
    setSelectedFile(null);
    setSelectedEventId('');
    setParsedData([]);
    setStep('select');
    setImportResults({ successful: 0, failed: 0, errors: [] });
  };

  const handleClose = () => {
    resetModal();
    onClose();
  };

  const renderStepContent = () => {
    switch (step) {
      case 'select':
        return (
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Select Event
              </label>
              <select
                value={selectedEventId}
                onChange={(e) => setSelectedEventId(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="">Choose an event...</option>
                {events.map(event => (
                  <option key={event.id} value={event.id}>
                    {event.name} - {new Date(event.startDate).toLocaleDateString()}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Upload File
              </label>
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-indigo-400 transition-colors">
                <input
                  type="file"
                  accept=".csv,.xlsx,.xls"
                  onChange={handleFileSelect}
                  className="hidden"
                  id="file-upload"
                />
                <label htmlFor="file-upload" className="cursor-pointer">
                  <Upload className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                  <div className="text-sm text-gray-600">
                    <span className="font-medium text-indigo-600 hover:text-indigo-500">
                      Click to upload
                    </span>{' '}
                    or drag and drop
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    CSV, XLSX or XLS files up to 10MB
                  </p>
                </label>
              </div>

              {selectedFile && (
                <div className="mt-3 flex items-center text-sm text-gray-600">
                  <File className="w-4 h-4 mr-2" />
                  {selectedFile.name} ({(selectedFile.size / 1024).toFixed(1)} KB)
                </div>
              )}
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h4 className="text-sm font-medium text-blue-800 mb-2">Expected Columns:</h4>
              <ul className="text-xs text-blue-700 space-y-1">
                <li>• <strong>name</strong> (required) - Guest full name</li>
                <li>• <strong>email</strong> (required) - Guest email address</li>
                <li>• <strong>phone</strong> - Phone number</li>
                <li>• <strong>dietary_restrictions</strong> - Any dietary requirements</li>
                <li>• <strong>accessibility_needs</strong> - Accessibility requirements</li>
              </ul>
              <button
                onClick={downloadTemplate}
                className="mt-3 flex items-center text-xs text-indigo-600 hover:text-indigo-700"
              >
                <Download className="w-3 h-3 mr-1" />
                Download template
              </button>
            </div>
          </div>
        );

      case 'preview':
        return (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-medium text-gray-800">Preview Data</h3>
              <span className="text-sm text-gray-500">{parsedData.length} guests found</span>
            </div>

            <div className="max-h-64 overflow-y-auto border border-gray-200 rounded-lg">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Name</th>
                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Email</th>
                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Phone</th>
                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Dietary</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {parsedData.slice(0, 10).map((guest, index) => (
                    <tr key={index} className="hover:bg-gray-50">
                      <td className="px-3 py-2 text-sm text-gray-900">{guest.name}</td>
                      <td className="px-3 py-2 text-sm text-gray-900">{guest.email}</td>
                      <td className="px-3 py-2 text-sm text-gray-900">{guest.phone || '-'}</td>
                      <td className="px-3 py-2 text-sm text-gray-900">{guest.dietaryRestrictions || 'none'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {parsedData.length > 10 && (
                <div className="bg-gray-50 px-3 py-2 text-xs text-gray-500 text-center">
                  ... and {parsedData.length - 10} more guests
                </div>
              )}
            </div>

            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
              <p className="text-sm text-yellow-800">
                <strong>Event:</strong> {events.find(e => e.id === selectedEventId)?.name}
              </p>
              <p className="text-xs text-yellow-700 mt-1">
                These guests will be imported to the selected event with "pending" RSVP status.
              </p>
            </div>
          </div>
        );

      case 'result':
        return (
          <div className="space-y-4">
            <div className="text-center">
              {importResults.successful > 0 ? (
                <CheckCircle className="mx-auto h-12 w-12 text-green-500 mb-4" />
              ) : (
                <XCircle className="mx-auto h-12 w-12 text-red-500 mb-4" />
              )}

              <h3 className="text-lg font-medium text-gray-800 mb-2">Import Results</h3>

              <div className="grid grid-cols-2 gap-4 mb-4">
                <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                  <div className="text-2xl font-bold text-green-600">{importResults.successful}</div>
                  <div className="text-sm text-green-700">Successful</div>
                </div>
                <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                  <div className="text-2xl font-bold text-red-600">{importResults.failed}</div>
                  <div className="text-sm text-red-700">Failed</div>
                </div>
              </div>
            </div>

            {importResults.errors.length > 0 && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <h4 className="text-sm font-medium text-red-800 mb-2">Errors:</h4>
                <ul className="text-xs text-red-700 space-y-1 max-h-32 overflow-y-auto">
                  {importResults.errors.map((error, index) => (
                    <li key={index}>• {error}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
          onClick={handleClose}
        >
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.95, opacity: 0 }}
            onClick={(e) => e.stopPropagation()}
            className="bg-white rounded-xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-hidden"
          >
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <div className="flex items-center space-x-3">
                <Users className="w-6 h-6 text-indigo-600" />
                <h2 className="text-xl font-semibold text-gray-800">Import Guests</h2>
              </div>
              <button
                onClick={handleClose}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Content */}
            <div className="p-6 max-h-96 overflow-y-auto">
              {renderStepContent()}
            </div>

            {/* Footer */}
            <div className="flex items-center justify-between p-6 border-t border-gray-200">
              <div className="flex items-center space-x-2">
                {['select', 'preview', 'result'].map((stepName, index) => (
                  <div
                    key={stepName}
                    className={`w-3 h-3 rounded-full ${
                      step === stepName ? 'bg-indigo-600' :
                      ['preview', 'result'].includes(step) && index < ['select', 'preview', 'result'].indexOf(step)
                        ? 'bg-green-500' : 'bg-gray-300'
                    }`}
                  />
                ))}
              </div>

              <div className="flex space-x-3">
                {step === 'preview' && (
                  <>
                    <button
                      onClick={() => setStep('select')}
                      className="px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50"
                    >
                      Back
                    </button>
                    <button
                      onClick={handleImport}
                      disabled={isProcessing || !selectedEventId}
                      className="px-6 py-2 bg-indigo-500 text-white rounded-lg hover:bg-indigo-600 disabled:opacity-50"
                    >
                      {isProcessing ? 'Importing...' : 'Import Guests'}
                    </button>
                  </>
                )}

                {step === 'result' && (
                  <button
                    onClick={handleClose}
                    className="px-6 py-2 bg-indigo-500 text-white rounded-lg hover:bg-indigo-600"
                  >
                    Done
                  </button>
                )}
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default ImportGuestsModal;