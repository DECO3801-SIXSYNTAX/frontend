import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, UserPlus, Copy, CheckCircle, Share, Mail, Link } from 'lucide-react';
import { DashboardService } from '../../services/DashboardService';
import { useDashboard } from '../../contexts/DashboardContext';

interface InviteTeamModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const InviteTeamModal: React.FC<InviteTeamModalProps> = ({ isOpen, onClose }) => {
  const { currentUser } = useDashboard();
  const [inviteCode, setInviteCode] = useState<string>('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [copied, setCopied] = useState(false);
  const [step, setStep] = useState<'generate' | 'share'>('generate');

  const dashboardService = new DashboardService();

  const generateInviteCode = async () => {
    setIsGenerating(true);
    try {
      const invitation = await dashboardService.createInvitation(currentUser?.id || '');
      setInviteCode(invitation.code);
      setStep('share');
    } catch (error) {
      console.error('Error generating invite code:', error);
    } finally {
      setIsGenerating(false);
    }
  };

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy text: ', err);
    }
  };

  const getInviteLink = () => {
    return `${window.location.origin}/join?code=${inviteCode}`;
  };

  const shareViaEmail = () => {
    const subject = 'Join our SiPanit event planning team';
    const body = `Hi there!

You've been invited to join our event planning team on SiPanit.

Use this invitation code to join: ${inviteCode}

Or click this link: ${getInviteLink()}

The invitation will expire in 7 days.

Best regards,
${currentUser?.name || 'Your Team'}`;

    const mailtoLink = `mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    window.location.href = mailtoLink;
  };

  const handleClose = () => {
    setStep('generate');
    setInviteCode('');
    setCopied(false);
    onClose();
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
            className="bg-white rounded-xl shadow-xl w-full max-w-md"
          >
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <div className="flex items-center space-x-3">
                <UserPlus className="w-6 h-6 text-indigo-600" />
                <h2 className="text-xl font-semibold text-gray-800">Invite Team Member</h2>
              </div>
              <button
                onClick={handleClose}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Content */}
            <div className="p-6">
              {step === 'generate' ? (
                <div className="text-center space-y-6">
                  <div className="w-16 h-16 bg-indigo-100 rounded-full flex items-center justify-center mx-auto">
                    <UserPlus className="w-8 h-8 text-indigo-600" />
                  </div>

                  <div>
                    <h3 className="text-lg font-medium text-gray-800 mb-2">
                      Add a new team member
                    </h3>
                    <p className="text-sm text-gray-600">
                      Generate a secure invitation code that can be shared with your new team member.
                      The invitation will expire in 7 days.
                    </p>
                  </div>

                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <h4 className="text-sm font-medium text-blue-800 mb-2">Team members can:</h4>
                    <ul className="text-xs text-blue-700 space-y-1 text-left">
                      <li>• Create and manage events</li>
                      <li>• Import and manage guest lists</li>
                      <li>• View team activities and statistics</li>
                      <li>• Collaborate on event planning</li>
                    </ul>
                  </div>

                  <button
                    onClick={generateInviteCode}
                    disabled={isGenerating}
                    className="w-full bg-indigo-500 text-white py-3 rounded-lg hover:bg-indigo-600 disabled:opacity-50 transition-colors"
                  >
                    {isGenerating ? 'Generating...' : 'Generate Invitation Code'}
                  </button>
                </div>
              ) : (
                <div className="space-y-6">
                  <div className="text-center">
                    <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                      <CheckCircle className="w-8 h-8 text-green-600" />
                    </div>
                    <h3 className="text-lg font-medium text-gray-800 mb-2">
                      Invitation Created!
                    </h3>
                    <p className="text-sm text-gray-600">
                      Share this code with your new team member
                    </p>
                  </div>

                  {/* Invitation Code */}
                  <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Invitation Code
                    </label>
                    <div className="flex items-center space-x-2">
                      <input
                        type="text"
                        value={inviteCode}
                        readOnly
                        className="flex-1 px-3 py-2 bg-white border border-gray-300 rounded-lg text-center font-mono text-lg"
                      />
                      <button
                        onClick={() => copyToClipboard(inviteCode)}
                        className="p-2 bg-indigo-500 text-white rounded-lg hover:bg-indigo-600 transition-colors"
                      >
                        {copied ? <CheckCircle className="w-5 h-5" /> : <Copy className="w-5 h-5" />}
                      </button>
                    </div>
                    {copied && (
                      <p className="text-xs text-green-600 mt-1">Copied to clipboard!</p>
                    )}
                  </div>

                  {/* Invitation Link */}
                  <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Direct Link
                    </label>
                    <div className="flex items-center space-x-2">
                      <input
                        type="text"
                        value={getInviteLink()}
                        readOnly
                        className="flex-1 px-3 py-2 bg-white border border-gray-300 rounded-lg text-sm"
                      />
                      <button
                        onClick={() => copyToClipboard(getInviteLink())}
                        className="p-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors"
                      >
                        <Link className="w-5 h-5" />
                      </button>
                    </div>
                  </div>

                  {/* Sharing Options */}
                  <div className="space-y-3">
                    <button
                      onClick={shareViaEmail}
                      className="w-full flex items-center justify-center space-x-2 bg-blue-500 text-white py-3 rounded-lg hover:bg-blue-600 transition-colors"
                    >
                      <Mail className="w-5 h-5" />
                      <span>Share via Email</span>
                    </button>

                    <button
                      onClick={() => {
                        if (navigator.share) {
                          navigator.share({
                            title: 'Join our SiPanit team',
                            text: `Use invitation code: ${inviteCode}`,
                            url: getInviteLink()
                          });
                        } else {
                          copyToClipboard(`Join our SiPanit team! Use invitation code: ${inviteCode} or visit: ${getInviteLink()}`);
                        }
                      }}
                      className="w-full flex items-center justify-center space-x-2 bg-green-500 text-white py-3 rounded-lg hover:bg-green-600 transition-colors"
                    >
                      <Share className="w-5 h-5" />
                      <span>Share via Other Apps</span>
                    </button>
                  </div>

                  <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                    <p className="text-xs text-yellow-800">
                      <strong>Note:</strong> This invitation will expire in 7 days. The new team member
                      should use this code during their sign-up process to join your team.
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* Footer */}
            {step === 'share' && (
              <div className="px-6 pb-6">
                <button
                  onClick={handleClose}
                  className="w-full bg-gray-500 text-white py-2 rounded-lg hover:bg-gray-600 transition-colors"
                >
                  Done
                </button>
              </div>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default InviteTeamModal;