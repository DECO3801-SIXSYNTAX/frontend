import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Calendar, MapPin, Users, DollarSign, Clock, Tag, AlertCircle } from 'lucide-react';
import { CreateEventForm, CreateEventFormErrors } from '../../types/dashboard';
import { DashboardService } from '../../services/DashboardService';
import { useDashboard } from '../../contexts/DashboardContext';

interface CreateEventModalProps {
  isOpen: boolean;
  onClose: () => void;
  editEvent?: any;
}

const CreateEventModal: React.FC<CreateEventModalProps> = ({ isOpen, onClose, editEvent }) => {
  const { currentUser, refreshData } = useDashboard();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);

  const [formData, setFormData] = useState<CreateEventForm>({
    name: editEvent?.name || '',
    description: editEvent?.description || '',
    type: editEvent?.type || '',
    startDate: editEvent?.startDate ? editEvent.startDate.split('T')[0] : '',
    endDate: editEvent?.endDate ? editEvent.endDate.split('T')[0] : '',
    venue: editEvent?.venue || '',
    address: editEvent?.address || '',
    capacity: editEvent?.capacity || 0,
    expectedAttendees: editEvent?.expectedAttendees || 0,
    budget: editEvent?.budget || 0,
    dietaryNeeds: editEvent?.dietaryNeeds || 0,
    accessibilityNeeds: editEvent?.accessibilityNeeds || 0,
    tags: editEvent?.tags || [],
    priority: editEvent?.priority || 'medium',
    notes: editEvent?.notes || ''
  });

  const [errors, setErrors] = useState<CreateEventFormErrors>({});
  const [tagInput, setTagInput] = useState('');

  // Update form data when editEvent changes
  useEffect(() => {
    if (editEvent) {
      setFormData({
        name: editEvent.name || '',
        description: editEvent.description || '',
        type: editEvent.type || '',
        startDate: editEvent.startDate ? editEvent.startDate.split('T')[0] : '',
        endDate: editEvent.endDate ? editEvent.endDate.split('T')[0] : '',
        venue: editEvent.venue || '',
        address: editEvent.address || '',
        capacity: editEvent.capacity || 0,
        expectedAttendees: editEvent.expectedAttendees || 0,
        budget: editEvent.budget || 0,
        dietaryNeeds: editEvent.dietaryNeeds || 0,
        accessibilityNeeds: editEvent.accessibilityNeeds || 0,
        tags: editEvent.tags || [],
        priority: editEvent.priority || 'medium',
        notes: editEvent.notes || ''
      });
      setCurrentStep(1); // Reset to first step when editing
    } else {
      // Reset form for new event
      setFormData({
        name: '',
        description: '',
        type: '',
        startDate: '',
        endDate: '',
        venue: '',
        address: '',
        capacity: 0,
        expectedAttendees: 0,
        budget: 0,
        dietaryNeeds: 0,
        accessibilityNeeds: 0,
        tags: [],
        priority: 'medium',
        notes: ''
      });
      setCurrentStep(1);
    }
  }, [editEvent]);

  const eventTypes = [
    'conference', 'wedding', 'corporate', 'birthday', 'anniversary',
    'product-launch', 'seminar', 'workshop', 'gala', 'fundraiser',
    'networking', 'trade-show', 'exhibition', 'concert', 'festival'
  ];

  const steps = [
    { id: 1, title: 'Basic Info', icon: Calendar },
    { id: 2, title: 'Details', icon: MapPin },
    { id: 3, title: 'Management', icon: Users },
    { id: 4, title: 'Finalize', icon: Tag }
  ];

  const dashboardService = new DashboardService();

  const validateStep = (step: number): boolean => {
    const newErrors: CreateEventFormErrors = {};

    switch (step) {
      case 1:
        if (!formData.name.trim()) newErrors.name = 'Event name is required';
        if (!formData.description.trim()) newErrors.description = 'Description is required';
        if (!formData.type) newErrors.type = 'Event type is required';
        break;
      case 2:
        if (!formData.startDate) newErrors.startDate = 'Start date is required';
        if (!formData.endDate) newErrors.endDate = 'End date is required';
        if (formData.startDate && formData.endDate && formData.startDate > formData.endDate) {
          newErrors.endDate = 'End date must be after start date';
        }
        if (!formData.venue.trim()) newErrors.venue = 'Venue is required';
        break;
      case 3:
        if (formData.capacity <= 0) newErrors.capacity = 'Capacity must be greater than 0';
        if (formData.expectedAttendees < 0) newErrors.expectedAttendees = 'Expected attendees cannot be negative';
        if (formData.expectedAttendees > formData.capacity) {
          newErrors.expectedAttendees = 'Expected attendees cannot exceed capacity';
        }
        if (formData.budget < 0) newErrors.budget = 'Budget cannot be negative';
        break;
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = () => {
    if (validateStep(currentStep) && currentStep < 4) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handlePrevious = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleSubmit = async () => {
    if (!validateStep(currentStep)) return;

    setIsSubmitting(true);
    try {
      if (editEvent) {
        await dashboardService.updateEvent(editEvent.id, formData, currentUser?.id || '');
      } else {
        await dashboardService.createEvent(formData, currentUser?.id || '');
      }

      await refreshData();
      onClose();
    } catch (error) {
      console.error('Error saving event:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const addTag = () => {
    if (tagInput.trim() && !formData.tags.includes(tagInput.trim())) {
      setFormData({
        ...formData,
        tags: [...formData.tags, tagInput.trim()]
      });
      setTagInput('');
    }
  };

  const removeTag = (tagToRemove: string) => {
    setFormData({
      ...formData,
      tags: formData.tags.filter(tag => tag !== tagToRemove)
    });
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Event Name *
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 ${
                  errors.name ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder="Enter event name"
              />
              {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Description *
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                rows={3}
                className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 ${
                  errors.description ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder="Describe your event"
              />
              {errors.description && <p className="text-red-500 text-xs mt-1">{errors.description}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Event Type *
              </label>
              <select
                value={formData.type}
                onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 ${
                  errors.type ? 'border-red-500' : 'border-gray-300'
                }`}
              >
                <option value="">Select event type</option>
                {eventTypes.map(type => (
                  <option key={type} value={type}>
                    {type.charAt(0).toUpperCase() + type.slice(1).replace('-', ' ')}
                  </option>
                ))}
              </select>
              {errors.type && <p className="text-red-500 text-xs mt-1">{errors.type}</p>}
            </div>
          </div>
        );

      case 2:
        return (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Start Date *
                </label>
                <input
                  type="date"
                  value={formData.startDate}
                  onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                  className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 ${
                    errors.startDate ? 'border-red-500' : 'border-gray-300'
                  }`}
                />
                {errors.startDate && <p className="text-red-500 text-xs mt-1">{errors.startDate}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  End Date *
                </label>
                <input
                  type="date"
                  value={formData.endDate}
                  onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                  className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 ${
                    errors.endDate ? 'border-red-500' : 'border-gray-300'
                  }`}
                />
                {errors.endDate && <p className="text-red-500 text-xs mt-1">{errors.endDate}</p>}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Venue *
              </label>
              <input
                type="text"
                value={formData.venue}
                onChange={(e) => setFormData({ ...formData, venue: e.target.value })}
                className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 ${
                  errors.venue ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder="Enter venue name"
              />
              {errors.venue && <p className="text-red-500 text-xs mt-1">{errors.venue}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Address
              </label>
              <input
                type="text"
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                placeholder="Enter full address"
              />
            </div>
          </div>
        );

      case 3:
        return (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Capacity *
                </label>
                <input
                  type="number"
                  value={formData.capacity}
                  onChange={(e) => setFormData({ ...formData, capacity: parseInt(e.target.value) || 0 })}
                  className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 ${
                    errors.capacity ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder="0"
                  min="1"
                />
                {errors.capacity && <p className="text-red-500 text-xs mt-1">{errors.capacity}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Expected Attendees
                </label>
                <input
                  type="number"
                  value={formData.expectedAttendees}
                  onChange={(e) => setFormData({ ...formData, expectedAttendees: parseInt(e.target.value) || 0 })}
                  className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 ${
                    errors.expectedAttendees ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder="0"
                  min="0"
                />
                {errors.expectedAttendees && <p className="text-red-500 text-xs mt-1">{errors.expectedAttendees}</p>}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Budget ($)
              </label>
              <input
                type="number"
                value={formData.budget}
                onChange={(e) => setFormData({ ...formData, budget: parseInt(e.target.value) || 0 })}
                className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 ${
                  errors.budget ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder="0"
                min="0"
              />
              {errors.budget && <p className="text-red-500 text-xs mt-1">{errors.budget}</p>}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Dietary Requirements Count
                </label>
                <input
                  type="number"
                  value={formData.dietaryNeeds}
                  onChange={(e) => setFormData({ ...formData, dietaryNeeds: parseInt(e.target.value) || 0 })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  placeholder="0"
                  min="0"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Accessibility Needs Count
                </label>
                <input
                  type="number"
                  value={formData.accessibilityNeeds}
                  onChange={(e) => setFormData({ ...formData, accessibilityNeeds: parseInt(e.target.value) || 0 })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  placeholder="0"
                  min="0"
                />
              </div>
            </div>
          </div>
        );

      case 4:
        return (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Priority Level
              </label>
              <select
                value={formData.priority}
                onChange={(e) => setFormData({ ...formData, priority: e.target.value as 'low' | 'medium' | 'high' })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="low">Low Priority</option>
                <option value="medium">Medium Priority</option>
                <option value="high">High Priority</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Tags
              </label>
              <div className="flex space-x-2 mb-2">
                <input
                  type="text"
                  value={tagInput}
                  onChange={(e) => setTagInput(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && addTag()}
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  placeholder="Add a tag"
                />
                <button
                  type="button"
                  onClick={addTag}
                  className="px-4 py-2 bg-indigo-500 text-white rounded-lg hover:bg-indigo-600"
                >
                  Add
                </button>
              </div>
              <div className="flex flex-wrap gap-2">
                {formData.tags.map(tag => (
                  <span
                    key={tag}
                    className="inline-flex items-center px-2 py-1 bg-indigo-100 text-indigo-800 text-sm rounded-md"
                  >
                    {tag}
                    <button
                      type="button"
                      onClick={() => removeTag(tag)}
                      className="ml-1 text-indigo-600 hover:text-indigo-800"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Notes
              </label>
              <textarea
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                rows={4}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                placeholder="Additional notes or requirements"
              />
            </div>
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
          onClick={onClose}
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
              <h2 className="text-xl font-semibold text-gray-800">
                {editEvent ? 'Edit Event' : 'Create New Event'}
              </h2>
              <button
                onClick={onClose}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Progress Steps */}
            <div className="px-6 py-4 border-b border-gray-200">
              <div className="flex items-center justify-between">
                {steps.map((step, index) => {
                  const Icon = step.icon;
                  const isActive = currentStep === step.id;
                  const isCompleted = currentStep > step.id;

                  return (
                    <div key={step.id} className="flex items-center">
                      <div className={`flex items-center justify-center w-8 h-8 rounded-full ${
                        isCompleted
                          ? 'bg-green-500 text-white'
                          : isActive
                          ? 'bg-indigo-500 text-white'
                          : 'bg-gray-200 text-gray-500'
                      }`}>
                        <Icon className="w-4 h-4" />
                      </div>
                      <span className={`ml-2 text-sm font-medium ${
                        isActive ? 'text-indigo-600' : 'text-gray-500'
                      }`}>
                        {step.title}
                      </span>
                      {index < steps.length - 1 && (
                        <div className={`mx-4 h-0.5 w-8 ${
                          isCompleted ? 'bg-green-500' : 'bg-gray-200'
                        }`} />
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Content */}
            <div className="p-6 max-h-96 overflow-y-auto">
              {renderStepContent()}
            </div>

            {/* Footer */}
            <div className="flex items-center justify-between p-6 border-t border-gray-200">
              <button
                onClick={handlePrevious}
                disabled={currentStep === 1}
                className="px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Previous
              </button>

              <div className="flex space-x-3">
                {currentStep < 4 ? (
                  <button
                    onClick={handleNext}
                    className="px-6 py-2 bg-indigo-500 text-white rounded-lg hover:bg-indigo-600"
                  >
                    Next
                  </button>
                ) : (
                  <button
                    onClick={handleSubmit}
                    disabled={isSubmitting}
                    className="px-6 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 disabled:opacity-50"
                  >
                    {isSubmitting ? 'Saving...' : editEvent ? 'Update Event' : 'Create Event'}
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

export default CreateEventModal;