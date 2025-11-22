// src/pages/meetings/MeetingsPage.jsx
import React, { useState, useEffect, useCallback } from 'react';
import { 
  Calendar, Users, Clock, Video, Plus, Search, Filter, Bell, 
  Download, Upload, Edit, Trash2, UserCheck, BarChart3, FileText, 
  Mic, Bot, Crown, User, X, Send, Loader, CheckCircle, AlertCircle,
  ChevronDown, ChevronUp, ExternalLink, Mail, Smartphone, Building,
  MoreVertical, Sparkles, Zap, Target, Coffee, MessageCircle,
  UserPlus, MapPin, Shield, Brain, Menu, Grid, List
} from 'lucide-react';

// Enhanced API Service with Error Handling
const meetingService = {
  baseURL: `${import.meta.env.VITE_BACKEND_URL}/api/meetings`,
  
  async request(endpoint, options = {}) {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${this.baseURL}${endpoint}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
          ...options.headers,
        },
        ...options,
      });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Request failed' }));
        throw new Error(errorData.error || `HTTP ${response.status}: ${response.statusText}`);
      }
      
      return response.json();
    } catch (error) {
      console.error(`API Request failed for ${endpoint}:`, error);
      throw error;
    }
  },

  // Meeting APIs
  async getMeetings(params = {}) {
    const query = new URLSearchParams(params).toString();
    return this.request(`?${query}`);
  },

  async getMeetingById(meetingId) {
    return this.request(`/${meetingId}`);
  },

  async createMeeting(data) {
    return this.request('', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  async updateMeeting(meetingId, data) {
    return this.request(`/${meetingId}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },

  async deleteMeeting(meetingId) {
    return this.request(`/${meetingId}`, {
      method: 'DELETE',
    });
  },

  // Participant APIs
  async addParticipants(meetingId, participants) {
    return this.request(`/${meetingId}/participants`, {
      method: 'POST',
      body: JSON.stringify({ participants }),
    });
  },

  async getAvailableParticipants(meetingId, search = '') {
    return this.request(`/${meetingId}/available-participants?search=${encodeURIComponent(search)}`);
  },

  // Bulk Operations
  async bulkInvite(meetingId, criteria) {
    return this.request(`/${meetingId}/bulk-invite`, {
      method: 'POST',
      body: JSON.stringify(criteria),
    });
  },

  async sendReminders(meetingId, reminderType = '15min') {
    return this.request(`/${meetingId}/reminders`, {
      method: 'POST',
      body: JSON.stringify({ reminderType }),
    });
  },

  // Analytics & AI
  async getAnalytics(meetingId) {
    return this.request(`/${meetingId}/analytics`);
  },

  async getSuggestedTimes(date = new Date().toISOString()) {
    return this.request(`/assistant/suggest-time?date=${encodeURIComponent(date)}`);
  },

  async getBrief(meetingId) {
    return this.request(`/${meetingId}/brief`);
  },

  async processTranscript(meetingId, transcript, options = {}) {
    return this.request(`/${meetingId}/process`, {
      method: 'POST',
      body: JSON.stringify({ transcript, options }),
    });
  },

  async uploadAudio(meetingId, audioFile) {
    try {
      const formData = new FormData();
      formData.append('audio', audioFile);
      
      const token = localStorage.getItem('token');
      const response = await fetch(`${this.baseURL}/${meetingId}/audio`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
        body: formData,
      });
      
      if (!response.ok) {
        throw new Error('Upload failed');
      }
      
      return response.json();
    } catch (error) {
      console.error('Audio upload failed:', error);
      throw error;
    }
  },

  async summarizeMeeting(meetingId, transcript = '') {
    return this.request(`/${meetingId}/summarize`, {
      method: 'POST',
      body: JSON.stringify({ transcript }),
    });
  },

  // Company Employees
  async getCompanyEmployees(search = '', department = '', limit = 100) {
    const params = new URLSearchParams({ 
      search: encodeURIComponent(search), 
      department: encodeURIComponent(department), 
      limit: limit.toString() 
    });
    return this.request(`/company/employees?${params}`);
  },

  // Assistant - Fixed to handle missing endpoint gracefully
  async getAssistantOverview() {
    try {
      return await this.request('/assistant/overview');
    } catch (error) {
      console.warn('Assistant overview endpoint not available, returning fallback data');
      // Return fallback data
      return {
        overview: {
          nextMeeting: null,
          pendingTasks: 0,
          upcomingMeetings: 0
        }
      };
    }
  }
};

// Enhanced Modal Component with Responsive Design
const ModalContainer = ({ isOpen, onClose, children, size = 'md' }) => {
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }

    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const sizeClasses = {
    sm: 'max-w-md',
    md: 'max-w-2xl',
    lg: 'max-w-4xl',
    xl: 'max-w-6xl'
  };

  return (
    <div 
      className="fixed inset-0 bg-black/80 backdrop-blur-2xl flex items-center justify-center z-50 p-3 sm:p-4 md:p-6 animate-fade-in"
      onClick={onClose}
    >
      <div 
        className={`bg-gradient-to-br from-gray-900/95 via-gray-900/90 to-gray-800/95 rounded-3xl w-full ${sizeClasses[size]} max-h-[95vh] overflow-hidden border border-gray-700/30 shadow-2xl backdrop-blur-2xl animate-scale-in`}
        onClick={(e) => e.stopPropagation()}
      >
        {children}
      </div>
    </div>
  );
};

// Enhanced Create Meeting Modal
const CreateMeetingModal = ({ isOpen, onClose, onMeetingCreated, currentUser }) => {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    timePhrase: '',
    scheduled_start: '',
    scheduled_end: '',
    participants: [],
    agenda: [''],
    addToCalendar: true,
    createGoogleMeet: true
  });
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [suggestedTimes, setSuggestedTimes] = useState([]);
  const [activeTab, setActiveTab] = useState('details');

  useEffect(() => {
    if (isOpen) {
      loadEmployees();
      loadSuggestedTimes();
      // Reset form when opening
      setFormData({
        title: '',
        description: '',
        timePhrase: '',
        scheduled_start: '',
        scheduled_end: '',
        participants: [],
        agenda: [''],
        addToCalendar: true,
        createGoogleMeet: true
      });
      setError('');
    }
  }, [isOpen]);

  const loadEmployees = async () => {
    try {
      const data = await meetingService.getCompanyEmployees();
      setEmployees(data.employees || []);
    } catch (err) {
      console.error('Error loading employees:', err);
      setEmployees([]);
    }
  };

  const loadSuggestedTimes = async () => {
    try {
      const data = await meetingService.getSuggestedTimes();
      setSuggestedTimes(data.suggestions || []);
    } catch (err) {
      console.error('Error loading suggested times:', err);
      setSuggestedTimes([]);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const result = await meetingService.createMeeting({
        ...formData,
        agenda: formData.agenda.filter(item => item.trim() !== '')
      });
      
      onMeetingCreated(result.meeting);
      onClose();
    } catch (err) {
      setError(err.message || 'Failed to create meeting');
    } finally {
      setLoading(false);
    }
  };

  const addAgendaItem = () => {
    setFormData(prev => ({
      ...prev,
      agenda: [...prev.agenda, '']
    }));
  };

  const updateAgendaItem = (index, value) => {
    setFormData(prev => ({
      ...prev,
      agenda: prev.agenda.map((item, i) => i === index ? value : item)
    }));
  };

  const removeAgendaItem = (index) => {
    setFormData(prev => ({
      ...prev,
      agenda: prev.agenda.filter((_, i) => i !== index)
    }));
  };

  const toggleParticipant = (employeeId) => {
    setFormData(prev => ({
      ...prev,
      participants: prev.participants.includes(employeeId)
        ? prev.participants.filter(id => id !== employeeId)
        : [...prev.participants, employeeId]
    }));
  };

  const useSuggestedTime = (time) => {
    setFormData(prev => ({
      ...prev,
      scheduled_start: time,
      timePhrase: ''
    }));
  };

  return (
    <ModalContainer isOpen={isOpen} onClose={onClose} size="xl">
      {/* Header */}
      <div className="flex items-center justify-between p-6 sm:p-8 border-b border-gray-700/30 bg-gradient-to-r from-gray-800/50 to-gray-900/50">
        <div className="flex items-center space-x-3 sm:space-x-4">
          <div className="p-2 sm:p-3 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-2xl shadow-lg">
            <Calendar className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
          </div>
          <div>
            <h2 className="text-xl sm:text-2xl font-bold text-white font-display">Create New Meeting</h2>
            <p className="text-gray-400 text-sm hidden sm:block">Schedule and organize your team meeting</p>
          </div>
        </div>
        <button
          onClick={onClose}
          className="p-2 hover:bg-gray-700/50 rounded-xl transition-all duration-200 text-gray-400 hover:text-white"
        >
          <X className="w-5 h-5 sm:w-6 sm:h-6" />
        </button>
      </div>

      {/* Mobile Tabs */}
      <div className="sm:hidden border-b border-gray-700/30">
        <div className="flex">
          {['details', 'participants', 'agenda'].map((tab) => (
            <button
              key={tab}
              type="button"
              onClick={() => setActiveTab(tab)}
              className={`flex-1 px-4 py-3 text-sm font-medium transition-all duration-200 ${
                activeTab === tab
                  ? 'text-blue-400 border-b-2 border-blue-400 bg-blue-400/10'
                  : 'text-gray-400 hover:text-gray-300'
              }`}
            >
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="p-4 sm:p-6 md:p-8 overflow-y-auto max-h-[calc(95vh-120px)]">
        {error && (
          <div className="mb-6 p-4 bg-red-500/10 border border-red-500/30 rounded-2xl flex items-center space-x-3 backdrop-blur-sm">
            <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0" />
            <p className="text-red-300 text-sm">{error}</p>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 md:gap-8">
          {/* Left Column - Always visible on desktop, conditional on mobile */}
          <div className={`space-y-6 md:space-y-8 ${activeTab !== 'details' ? 'hidden sm:block' : 'block'}`}>
            {/* Title */}
            <div>
              <label className="block text-sm font-semibold text-white mb-3 font-display">
                Meeting Title *
              </label>
              <input
                type="text"
                required
                value={formData.title}
                onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                placeholder="Weekly team sync, Project review..."
                className="w-full bg-gray-800/30 border border-gray-600/30 rounded-2xl px-4 py-3 md:py-4 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/30 backdrop-blur-sm transition-all duration-200 font-sans"
              />
            </div>

            {/* Description */}
            <div>
              <label className="block text-sm font-semibold text-white mb-3 font-display">
                Description
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Meeting purpose, discussion points..."
                rows="3"
                className="w-full bg-gray-800/30 border border-gray-600/30 rounded-2xl px-4 py-3 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/30 backdrop-blur-sm resize-none transition-all duration-200 font-sans"
              />
            </div>

            {/* Time Input */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-white mb-3 font-display">
                  Start Time *
                </label>
                <input
                  type="datetime-local"
                  required
                  value={formData.scheduled_start}
                  onChange={(e) => setFormData(prev => ({ ...prev, scheduled_start: e.target.value }))}
                  className="w-full bg-gray-800/30 border border-gray-600/30 rounded-2xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/30 backdrop-blur-sm transition-all duration-200 font-sans"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-white mb-3 font-display">
                  End Time
                </label>
                <input
                  type="datetime-local"
                  value={formData.scheduled_end}
                  onChange={(e) => setFormData(prev => ({ ...prev, scheduled_end: e.target.value }))}
                  className="w-full bg-gray-800/30 border border-gray-600/30 rounded-2xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/30 backdrop-blur-sm transition-all duration-200 font-sans"
                />
              </div>
            </div>

            {/* Smart Scheduling */}
            {suggestedTimes.length > 0 && (
              <div>
                <label className="block text-sm font-semibold text-white mb-3 font-display">
                  🚀 Suggested Times
                </label>
                <div className="space-y-3">
                  {suggestedTimes.slice(0, 3).map((time, index) => (
                    <button
                      key={index}
                      type="button"
                      onClick={() => useSuggestedTime(time)}
                      className="w-full text-left p-4 bg-gray-800/30 hover:bg-blue-500/20 rounded-2xl border border-gray-600/30 hover:border-blue-500/50 transition-all duration-200 group backdrop-blur-sm"
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-white font-medium font-sans">
                            {new Date(time).toLocaleDateString()}
                          </p>
                          <p className="text-gray-400 text-sm font-sans">
                            {new Date(time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </p>
                        </div>
                        <Zap className="w-4 h-4 text-yellow-500 opacity-0 group-hover:opacity-100 transition-all duration-200" />
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Right Column - Conditional on mobile */}
          <div className={`space-y-6 md:space-y-8 ${activeTab !== 'participants' && activeTab !== 'agenda' ? 'hidden sm:block' : 'block'}`}>
            {/* Participants - Show on participants tab and desktop */}
            <div className={`${activeTab === 'participants' || activeTab === 'details' ? 'block' : 'hidden sm:block'}`}>
              <label className="block text-sm font-semibold text-white mb-3 font-display">
                Participants
              </label>
              <div className="max-h-48 overflow-y-auto space-y-3 custom-scrollbar">
                {employees.map(employee => (
                  <div
                    key={employee.id}
                    className={`flex items-center space-x-3 p-3 rounded-2xl border transition-all duration-200 cursor-pointer backdrop-blur-sm ${
                      formData.participants.includes(employee.id)
                        ? 'bg-blue-500/20 border-blue-500/50'
                        : 'bg-gray-800/30 border-gray-600/30 hover:border-gray-500/50'
                    }`}
                    onClick={() => toggleParticipant(employee.id)}
                  >
                    <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-2xl flex items-center justify-center text-white text-sm font-semibold font-display shadow-lg">
                      {employee.first_name?.[0]}{employee.last_name?.[0]}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-white font-medium font-sans truncate">
                        {employee.first_name} {employee.last_name}
                      </p>
                      <p className="text-gray-400 text-sm font-sans truncate">{employee.position}</p>
                    </div>
                    {formData.participants.includes(employee.id) && (
                      <div className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center shadow-lg">
                        <div className="w-2 h-2 bg-white rounded-full" />
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Agenda - Show on agenda tab and desktop */}
            <div className={`${activeTab === 'agenda' || activeTab === 'details' ? 'block' : 'hidden sm:block'}`}>
              <div className="flex items-center justify-between mb-3">
                <label className="block text-sm font-semibold text-white font-display">
                  Agenda
                </label>
                <button
                  type="button"
                  onClick={addAgendaItem}
                  className="text-blue-400 hover:text-blue-300 text-sm flex items-center space-x-2 transition-all duration-200"
                >
                  <Plus className="w-4 h-4" />
                  <span>Add Item</span>
                </button>
              </div>
              <div className="space-y-3">
                {formData.agenda.map((item, index) => (
                  <div key={index} className="flex items-center space-x-3">
                    <input
                      type="text"
                      value={item}
                      onChange={(e) => updateAgendaItem(index, e.target.value)}
                      placeholder={`Agenda item ${index + 1}`}
                      className="flex-1 bg-gray-800/30 border border-gray-600/30 rounded-2xl px-4 py-3 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/30 backdrop-blur-sm transition-all duration-200 font-sans"
                    />
                    {formData.agenda.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeAgendaItem(index)}
                        className="p-2 text-gray-400 hover:text-red-400 transition-all duration-200"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Calendar Options */}
            <div className="space-y-4">
              <label className="block text-sm font-semibold text-white font-display">
                Calendar Integration
              </label>
              <div className="space-y-3">
                <label className="flex items-center space-x-3 cursor-pointer group">
                  <div className="relative">
                    <input
                      type="checkbox"
                      checked={formData.addToCalendar}
                      onChange={(e) => setFormData(prev => ({ ...prev, addToCalendar: e.target.checked }))}
                      className="sr-only"
                    />
                    <div className={`w-5 h-5 rounded border-2 transition-all duration-200 ${
                      formData.addToCalendar 
                        ? 'bg-blue-500 border-blue-500' 
                        : 'bg-gray-700 border-gray-600 group-hover:border-gray-500'
                    }`}>
                      {formData.addToCalendar && (
                        <CheckCircle className="w-4 h-4 text-white absolute top-0.5 left-0.5" />
                      )}
                    </div>
                  </div>
                  <span className="text-gray-300 text-sm font-sans">Add to Google Calendar</span>
                </label>
                <label className="flex items-center space-x-3 cursor-pointer group">
                  <div className="relative">
                    <input
                      type="checkbox"
                      checked={formData.createGoogleMeet}
                      onChange={(e) => setFormData(prev => ({ ...prev, createGoogleMeet: e.target.checked }))}
                      className="sr-only"
                    />
                    <div className={`w-5 h-5 rounded border-2 transition-all duration-200 ${
                      formData.createGoogleMeet 
                        ? 'bg-blue-500 border-blue-500' 
                        : 'bg-gray-700 border-gray-600 group-hover:border-gray-500'
                    }`}>
                      {formData.createGoogleMeet && (
                        <CheckCircle className="w-4 h-4 text-white absolute top-0.5 left-0.5" />
                      )}
                    </div>
                  </div>
                  <span className="text-gray-300 text-sm font-sans">Create Google Meet</span>
                </label>
              </div>
            </div>
          </div>
        </div>

        {/* Mobile Navigation */}
        <div className="sm:hidden flex justify-between pt-6 mt-6 border-t border-gray-700/30">
          <button
            type="button"
            onClick={() => {
              const tabs = ['details', 'participants', 'agenda'];
              const currentIndex = tabs.indexOf(activeTab);
              if (currentIndex > 0) setActiveTab(tabs[currentIndex - 1]);
            }}
            className="px-4 py-2 text-gray-400 hover:text-white transition-colors"
          >
            Previous
          </button>
          <button
            type="button"
            onClick={() => {
              const tabs = ['details', 'participants', 'agenda'];
              const currentIndex = tabs.indexOf(activeTab);
              if (currentIndex < tabs.length - 1) setActiveTab(tabs[currentIndex + 1]);
            }}
            className="px-4 py-2 text-blue-400 hover:text-blue-300 transition-colors"
          >
            Next
          </button>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row justify-end space-y-3 sm:space-y-0 sm:space-x-4 pt-6 mt-6 border-t border-gray-700/30">
          <button
            type="button"
            onClick={onClose}
            className="px-6 py-3 bg-gray-700/30 hover:bg-gray-600/50 rounded-2xl transition-all duration-200 text-white font-medium font-sans border border-gray-600/30 order-2 sm:order-1"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={loading}
            className="px-8 py-3 bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 rounded-2xl transition-all duration-200 transform hover:scale-105 text-white font-semibold font-display shadow-2xl disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 flex items-center justify-center space-x-2 order-1 sm:order-2"
          >
            {loading ? (
              <>
                <Loader className="w-4 h-4 animate-spin" />
                <span>Creating...</span>
              </>
            ) : (
              <>
                <Calendar className="w-4 h-4" />
                <span>Create Meeting</span>
              </>
            )}
          </button>
        </div>
      </form>
    </ModalContainer>
  );
};

// Fixed Add Participants Modal
const AddParticipantsModal = ({ isOpen, onClose, meeting, onParticipantsAdded }) => {
  const [employees, setEmployees] = useState([]);
  const [selectedParticipants, setSelectedParticipants] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');

  useEffect(() => {
    if (isOpen && meeting) {
      loadAvailableParticipants();
      setSelectedParticipants([]);
      setError('');
    }
  }, [isOpen, meeting, search]);

  const loadAvailableParticipants = async () => {
    try {
      const data = await meetingService.getAvailableParticipants(meeting?.id, search);
      setEmployees(data.employees || []);
    } catch (err) {
      console.error('Error loading participants:', err);
      setEmployees([]);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (selectedParticipants.length === 0 || !meeting) return;

    setLoading(true);
    setError('');

    try {
      const result = await meetingService.addParticipants(meeting.id, selectedParticipants);
      onParticipantsAdded(result.addedParticipants);
      onClose();
    } catch (err) {
      setError(err.message || 'Failed to add participants');
    } finally {
      setLoading(false);
    }
  };

  const toggleParticipant = (employeeId) => {
    setSelectedParticipants(prev =>
      prev.includes(employeeId)
        ? prev.filter(id => id !== employeeId)
        : [...prev, employeeId]
    );
  };

  if (!isOpen || !meeting) return null;

  return (
    <ModalContainer isOpen={isOpen} onClose={onClose} size="md">
      <div className="flex items-center justify-between p-6 sm:p-8 border-b border-gray-700/30">
        <div className="flex items-center space-x-3 sm:space-x-4">
          <div className="p-2 sm:p-3 bg-gradient-to-r from-green-500 to-emerald-500 rounded-2xl shadow-lg">
            <UserPlus className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
          </div>
          <div>
            <h2 className="text-xl sm:text-2xl font-bold text-white font-display">Add Participants</h2>
            <p className="text-gray-400 text-sm hidden sm:block">
              Add team members to {meeting?.title || 'this meeting'}
            </p>
          </div>
        </div>
        <button onClick={onClose} className="p-2 hover:bg-gray-700/50 rounded-xl transition-all duration-200">
          <X className="w-5 h-5 sm:w-6 sm:h-6 text-gray-400" />
        </button>
      </div>

      <form onSubmit={handleSubmit} className="p-4 sm:p-6 md:p-8">
        {error && (
          <div className="mb-6 p-4 bg-red-500/10 border border-red-500/30 rounded-2xl backdrop-blur-sm">
            <p className="text-red-300 text-sm font-sans">{error}</p>
          </div>
        )}

        {/* Search */}
        <div className="mb-6">
          <div className="relative">
            <Search className="w-5 h-5 text-gray-400 absolute left-4 top-1/2 transform -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search employees..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-gray-800/30 border border-gray-600/30 rounded-2xl pl-12 pr-4 py-3 md:py-4 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-green-500/50 focus:border-green-500/30 backdrop-blur-sm transition-all duration-200 font-sans"
            />
          </div>
        </div>

        {/* Participants List */}
        <div className="max-h-64 overflow-y-auto space-y-3 mb-6 custom-scrollbar">
          {employees.length > 0 ? (
            employees.map(employee => (
              <div
                key={employee.id}
                className={`flex items-center space-x-3 p-4 rounded-2xl border transition-all duration-200 cursor-pointer backdrop-blur-sm ${
                  selectedParticipants.includes(employee.id)
                    ? 'bg-green-500/20 border-green-500/50'
                    : 'bg-gray-800/30 border-gray-600/30 hover:border-gray-500/50'
                }`}
                onClick={() => toggleParticipant(employee.id)}
              >
                <div className="w-12 h-12 bg-gradient-to-r from-green-500 to-emerald-500 rounded-2xl flex items-center justify-center text-white font-semibold font-display shadow-lg">
                  {employee.first_name?.[0]}{employee.last_name?.[0]}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-white font-medium font-sans truncate">
                    {employee.first_name} {employee.last_name}
                  </p>
                  <p className="text-gray-400 text-sm font-sans truncate">
                    {employee.position} • {employee.department}
                  </p>
                </div>
                {selectedParticipants.includes(employee.id) && (
                  <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0" />
                )}
              </div>
            ))
          ) : (
            <div className="text-center py-8 text-gray-400 font-sans">
              No employees found
            </div>
          )}
        </div>

        <div className="flex flex-col sm:flex-row justify-end space-y-3 sm:space-y-0 sm:space-x-4">
          <button
            type="button"
            onClick={onClose}
            className="px-6 py-3 bg-gray-700/30 hover:bg-gray-600/50 rounded-2xl transition-all duration-200 text-white font-medium font-sans border border-gray-600/30 order-2 sm:order-1"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={loading || selectedParticipants.length === 0}
            className="px-6 py-3 bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 rounded-2xl transition-all duration-200 text-white font-semibold font-display disabled:opacity-50 flex items-center justify-center space-x-2 order-1 sm:order-2"
          >
            {loading ? <Loader className="w-4 h-4 animate-spin" /> : <UserPlus className="w-4 h-4" />}
            <span>Add {selectedParticipants.length} Participants</span>
          </button>
        </div>
      </form>
    </ModalContainer>
  );
};

// Fixed Bulk Invite Modal
const BulkInviteModal = ({ isOpen, onClose, meeting, onBulkInvite }) => {
  const [criteria, setCriteria] = useState({ department: '', role: '', customList: [] });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!meeting) return;
    
    setLoading(true);
    setError('');

    try {
      const result = await meetingService.bulkInvite(meeting.id, criteria);
      onBulkInvite(result);
      onClose();
      setCriteria({ department: '', role: '', customList: [] });
    } catch (err) {
      setError(err.message || 'Failed to send bulk invitations');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen || !meeting) return null;

  return (
    <ModalContainer isOpen={isOpen} onClose={onClose} size="sm">
      <div className="flex items-center justify-between p-6 sm:p-8 border-b border-gray-700/30">
        <div className="flex items-center space-x-3 sm:space-x-4">
          <div className="p-2 sm:p-3 bg-gradient-to-r from-purple-500 to-pink-500 rounded-2xl shadow-lg">
            <Users className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
          </div>
          <div>
            <h2 className="text-xl sm:text-2xl font-bold text-white font-display">Bulk Invite</h2>
            <p className="text-gray-400 text-sm hidden sm:block">Invite multiple participants at once</p>
          </div>
        </div>
        <button onClick={onClose} className="p-2 hover:bg-gray-700/50 rounded-xl transition-all duration-200">
          <X className="w-5 h-5 sm:w-6 sm:h-6 text-gray-400" />
        </button>
      </div>

      <form onSubmit={handleSubmit} className="p-4 sm:p-6 md:p-8">
        {error && (
          <div className="mb-6 p-4 bg-red-500/10 border border-red-500/30 rounded-2xl backdrop-blur-sm">
            <p className="text-red-300 text-sm font-sans">{error}</p>
          </div>
        )}

        <div className="space-y-6">
          <div>
            <label className="block text-sm font-semibold text-white mb-3 font-display">Department</label>
            <input
              type="text"
              placeholder="e.g., Engineering, Marketing"
              value={criteria.department}
              onChange={(e) => setCriteria(prev => ({ ...prev, department: e.target.value }))}
              className="w-full bg-gray-800/30 border border-gray-600/30 rounded-2xl px-4 py-3 md:py-4 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500/30 backdrop-blur-sm transition-all duration-200 font-sans"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-white mb-3 font-display">Role</label>
            <input
              type="text"
              placeholder="e.g., Manager, Developer"
              value={criteria.role}
              onChange={(e) => setCriteria(prev => ({ ...prev, role: e.target.value }))}
              className="w-full bg-gray-800/30 border border-gray-600/30 rounded-2xl px-4 py-3 md:py-4 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500/30 backdrop-blur-sm transition-all duration-200 font-sans"
            />
          </div>
        </div>

        <div className="flex flex-col sm:flex-row justify-end space-y-3 sm:space-y-0 sm:space-x-4 mt-8">
          <button
            type="button"
            onClick={onClose}
            className="px-6 py-3 bg-gray-700/30 hover:bg-gray-600/50 rounded-2xl transition-all duration-200 text-white font-medium font-sans border border-gray-600/30 order-2 sm:order-1"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={loading}
            className="px-6 py-3 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 rounded-2xl transition-all duration-200 text-white font-semibold font-display disabled:opacity-50 flex items-center justify-center space-x-2 order-1 sm:order-2"
          >
            {loading ? <Loader className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
            <span>Send Invitations</span>
          </button>
        </div>
      </form>
    </ModalContainer>
  );
};

// Fixed Reminder Modal
const ReminderModal = ({ isOpen, onClose, meeting, onRemindersSent }) => {
  const [reminderType, setReminderType] = useState('15min');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!meeting) return;
    
    setLoading(true);
    setError('');

    try {
      const result = await meetingService.sendReminders(meeting.id, reminderType);
      onRemindersSent(result);
      onClose();
    } catch (err) {
      setError(err.message || 'Failed to send reminders');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen || !meeting) return null;

  return (
    <ModalContainer isOpen={isOpen} onClose={onClose} size="sm">
      <div className="flex items-center justify-between p-6 sm:p-8 border-b border-gray-700/30">
        <div className="flex items-center space-x-3 sm:space-x-4">
          <div className="p-2 sm:p-3 bg-gradient-to-r from-amber-500 to-orange-500 rounded-2xl shadow-lg">
            <Bell className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
          </div>
          <div>
            <h2 className="text-xl sm:text-2xl font-bold text-white font-display">Send Reminders</h2>
            <p className="text-gray-400 text-sm hidden sm:block">
              Notify participants about {meeting?.title || 'this meeting'}
            </p>
          </div>
        </div>
        <button onClick={onClose} className="p-2 hover:bg-gray-700/50 rounded-xl transition-all duration-200">
          <X className="w-5 h-5 sm:w-6 sm:h-6 text-gray-400" />
        </button>
      </div>

      <form onSubmit={handleSubmit} className="p-4 sm:p-6 md:p-8">
        {error && (
          <div className="mb-6 p-4 bg-red-500/10 border border-red-500/30 rounded-2xl backdrop-blur-sm">
            <p className="text-red-300 text-sm font-sans">{error}</p>
          </div>
        )}

        <div className="space-y-6">
          <div>
            <label className="block text-sm font-semibold text-white mb-4 font-display">Reminder Timing</label>
            <div className="space-y-4">
              {[
                { value: '15min', label: '15 minutes before', desc: 'Quick reminder' },
                { value: '1hour', label: '1 hour before', desc: 'Standard reminder' },
                { value: '1day', label: '1 day before', desc: 'Advanced notice' },
              ].map((option) => (
                <label key={option.value} className="flex items-center space-x-4 p-4 bg-gray-800/30 rounded-2xl border border-gray-600/30 cursor-pointer hover:bg-gray-700/30 transition-all duration-200 backdrop-blur-sm group">
                  <div className="relative">
                    <input
                      type="radio"
                      name="reminderType"
                      value={option.value}
                      checked={reminderType === option.value}
                      onChange={(e) => setReminderType(e.target.value)}
                      className="sr-only"
                    />
                    <div className={`w-5 h-5 rounded-full border-2 transition-all duration-200 ${
                      reminderType === option.value 
                        ? 'bg-amber-500 border-amber-500' 
                        : 'bg-gray-700 border-gray-600 group-hover:border-gray-500'
                    }`}>
                      {reminderType === option.value && (
                        <div className="w-2 h-2 bg-white rounded-full absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2" />
                      )}
                    </div>
                  </div>
                  <div className="flex-1">
                    <p className="text-white font-medium font-sans">{option.label}</p>
                    <p className="text-gray-400 text-sm font-sans">{option.desc}</p>
                  </div>
                </label>
              ))}
            </div>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row justify-end space-y-3 sm:space-y-0 sm:space-x-4 mt-8">
          <button
            type="button"
            onClick={onClose}
            className="px-6 py-3 bg-gray-700/30 hover:bg-gray-600/50 rounded-2xl transition-all duration-200 text-white font-medium font-sans border border-gray-600/30 order-2 sm:order-1"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={loading}
            className="px-6 py-3 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 rounded-2xl transition-all duration-200 text-white font-semibold font-display disabled:opacity-50 flex items-center justify-center space-x-2 order-1 sm:order-2"
          >
            {loading ? <Loader className="w-4 h-4 animate-spin" /> : <Bell className="w-4 h-4" />}
            <span>Send Reminders</span>
          </button>
        </div>
      </form>
    </ModalContainer>
  );
};

// Fixed Analytics Modal
const AnalyticsModal = ({ isOpen, onClose, meeting }) => {
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (isOpen && meeting) {
      loadAnalytics();
    } else {
      setAnalytics(null);
      setError('');
    }
  }, [isOpen, meeting]);

  const loadAnalytics = async () => {
    if (!meeting) return;
    
    try {
      setLoading(true);
      setError('');
      const data = await meetingService.getAnalytics(meeting.id);
      setAnalytics(data.analytics);
    } catch (err) {
      setError(err.message || 'Failed to load analytics');
      setAnalytics(null);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen || !meeting) return null;

  return (
    <ModalContainer isOpen={isOpen} onClose={onClose} size="lg">
      <div className="flex items-center justify-between p-6 sm:p-8 border-b border-gray-700/30">
        <div className="flex items-center space-x-3 sm:space-x-4">
          <div className="p-2 sm:p-3 bg-gradient-to-r from-cyan-500 to-blue-500 rounded-2xl shadow-lg">
            <BarChart3 className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
          </div>
          <div>
            <h2 className="text-xl sm:text-2xl font-bold text-white font-display">Meeting Analytics</h2>
            <p className="text-gray-400 text-sm hidden sm:block">
              Participant insights for {meeting?.title || 'this meeting'}
            </p>
          </div>
        </div>
        <button onClick={onClose} className="p-2 hover:bg-gray-700/50 rounded-xl transition-all duration-200">
          <X className="w-5 h-5 sm:w-6 sm:h-6 text-gray-400" />
        </button>
      </div>

      <div className="p-4 sm:p-6 md:p-8 overflow-y-auto max-h-[calc(95vh-120px)]">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader className="w-8 h-8 text-cyan-500 animate-spin" />
          </div>
        ) : error ? (
          <div className="text-center py-12">
            <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
            <p className="text-red-300 font-sans">{error}</p>
            <button
              onClick={loadAnalytics}
              className="mt-4 px-6 py-3 bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600 rounded-2xl text-white font-semibold font-display transition-all duration-200"
            >
              Try Again
            </button>
          </div>
        ) : analytics ? (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Overview */}
            <div className="bg-gray-800/30 rounded-2xl p-6 border border-cyan-500/20 backdrop-blur-sm">
              <h3 className="text-lg font-semibold text-white mb-4 font-display">Overview</h3>
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-gray-400 font-sans">Total Participants</span>
                  <span className="text-2xl font-bold text-cyan-400 font-display">{analytics.totalParticipants || 0}</span>
                </div>
              </div>
            </div>

            {/* Departments */}
            <div className="bg-gray-800/30 rounded-2xl p-6 border border-blue-500/20 backdrop-blur-sm">
              <h3 className="text-lg font-semibold text-white mb-4 font-display">Departments</h3>
              <div className="space-y-3">
                {analytics.departments && Object.entries(analytics.departments).map(([dept, count]) => (
                  <div key={dept} className="flex justify-between items-center">
                    <span className="text-gray-300 font-sans">{dept}</span>
                    <span className="text-blue-400 font-semibold font-display">{count}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Roles */}
            <div className="bg-gray-800/30 rounded-2xl p-6 border border-green-500/20 backdrop-blur-sm">
              <h3 className="text-lg font-semibold text-white mb-4 font-display">Roles</h3>
              <div className="space-y-3">
                {analytics.roles && Object.entries(analytics.roles).map(([role, count]) => (
                  <div key={role} className="flex justify-between items-center">
                    <span className="text-gray-300 font-sans">{role}</span>
                    <span className="text-green-400 font-semibold font-display">{count}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Participant Details */}
            <div className="lg:col-span-2 bg-gray-800/30 rounded-2xl p-6 border border-purple-500/20 backdrop-blur-sm">
              <h3 className="text-lg font-semibold text-white mb-4 font-display">Participant Details</h3>
              <div className="space-y-4">
                {analytics.participantDetails && analytics.participantDetails.length > 0 ? (
                  analytics.participantDetails.map(participant => (
                    <div key={participant.id} className="flex items-center space-x-4 p-4 bg-gray-700/20 rounded-2xl">
                      <div className="w-10 h-10 bg-gradient-to-r from-purple-500 to-pink-500 rounded-2xl flex items-center justify-center text-white text-sm font-semibold font-display shadow-lg">
                        {participant.name?.split(' ').map(n => n[0]).join('') || 'UU'}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-white font-medium font-sans truncate">{participant.name || 'Unknown User'}</p>
                        <p className="text-gray-400 text-sm font-sans truncate">
                          {participant.position || 'No position'} • {participant.department || 'No department'}
                        </p>
                      </div>
                      <span className="text-gray-400 text-sm font-sans">{participant.role || 'Participant'}</span>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-8 text-gray-400 font-sans">
                    No participant details available
                  </div>
                )}
              </div>
            </div>
          </div>
        ) : (
          <div className="text-center py-12 text-gray-400 font-sans">
            No analytics data available
          </div>
        )}
      </div>
    </ModalContainer>
  );
};

// Fixed Brief Modal
const BriefModal = ({ isOpen, onClose, meeting }) => {
  const [brief, setBrief] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (isOpen && meeting) {
      generateBrief();
    } else {
      // Reset state when modal closes
      setBrief('');
      setError('');
      setLoading(false);
    }
  }, [isOpen, meeting]);

  const generateBrief = async () => {
    if (!meeting) {
      setError('No meeting selected');
      return;
    }

    try {
      setLoading(true);
      setError('');
      const data = await meetingService.getBrief(meeting.id);
      setBrief(data.brief || 'No brief available for this meeting.');
    } catch (err) {
      console.error('Error generating brief:', err);
      setError(err.message || 'Failed to generate meeting brief');
      setBrief('');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <ModalContainer isOpen={isOpen} onClose={onClose} size="lg">
      <div className="flex items-center justify-between p-6 sm:p-8 border-b border-gray-700/30">
        <div className="flex items-center space-x-3 sm:space-x-4">
          <div className="p-2 sm:p-3 bg-gradient-to-r from-purple-500 to-pink-500 rounded-2xl shadow-lg">
            <Brain className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
          </div>
          <div>
            <h2 className="text-xl sm:text-2xl font-bold text-white font-display">AI Meeting Brief</h2>
            <p className="text-gray-400 text-sm hidden sm:block">
              Pre-meeting analysis for {meeting?.title || 'selected meeting'}
            </p>
          </div>
        </div>
        <button onClick={onClose} className="p-2 hover:bg-gray-700/50 rounded-xl transition-all duration-200">
          <X className="w-5 h-5 sm:w-6 sm:h-6 text-gray-400" />
        </button>
      </div>

      <div className="p-4 sm:p-6 md:p-8 overflow-y-auto max-h-[calc(95vh-120px)]">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="text-center">
              <Loader className="w-8 h-8 text-purple-500 animate-spin mx-auto mb-4" />
              <p className="text-gray-400 font-sans">Generating AI-powered brief...</p>
            </div>
          </div>
        ) : error ? (
          <div className="text-center py-12">
            <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
            <p className="text-red-300 font-sans mb-4">{error}</p>
            <button
              onClick={generateBrief}
              className="px-6 py-3 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 rounded-2xl text-white font-semibold font-display transition-all duration-200"
            >
              Try Again
            </button>
          </div>
        ) : brief ? (
          <div className="bg-gradient-to-r from-purple-500/10 to-pink-500/10 rounded-2xl p-6 border border-purple-500/20 backdrop-blur-sm">
            <pre className="text-white whitespace-pre-wrap font-sans text-sm leading-relaxed">
              {brief}
            </pre>
          </div>
        ) : (
          <div className="text-center py-12 text-gray-400 font-sans">
            No brief content available.
          </div>
        )}
      </div>
    </ModalContainer>
  );
};

// Fixed Transcript Modal
const TranscriptModal = ({ isOpen, onClose, meeting, onTranscriptProcessed }) => {
  const [transcript, setTranscript] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [audioFile, setAudioFile] = useState(null);

  useEffect(() => {
    if (!isOpen) {
      setTranscript('');
      setError('');
      setAudioFile(null);
    }
  }, [isOpen]);

  const handleTextSubmit = async (e) => {
    e.preventDefault();
    if (!transcript.trim() || !meeting) return;

    setLoading(true);
    setError('');

    try {
      const result = await meetingService.processTranscript(meeting.id, transcript, {
        createTasksFromActions: true,
        generateSummary: true
      });
      onTranscriptProcessed(result);
      onClose();
    } catch (err) {
      setError(err.message || 'Failed to process transcript');
    } finally {
      setLoading(false);
    }
  };

  const handleAudioUpload = async (file) => {
    if (!meeting) return;
    
    setLoading(true);
    setError('');

    try {
      const result = await meetingService.uploadAudio(meeting.id, file);
      onTranscriptProcessed(result);
      onClose();
    } catch (err) {
      setError(err.message || 'Failed to upload audio');
    } finally {
      setLoading(false);
    }
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      handleAudioUpload(file);
    }
  };

  if (!isOpen || !meeting) return null;

  return (
    <ModalContainer isOpen={isOpen} onClose={onClose} size="md">
      <div className="flex items-center justify-between p-6 sm:p-8 border-b border-gray-700/30">
        <div className="flex items-center space-x-3 sm:space-x-4">
          <div className="p-2 sm:p-3 bg-gradient-to-r from-orange-500 to-red-500 rounded-2xl shadow-lg">
            <Mic className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
          </div>
          <div>
            <h2 className="text-xl sm:text-2xl font-bold text-white font-display">Process Transcript</h2>
            <p className="text-gray-400 text-sm hidden sm:block">Add meeting notes or upload audio</p>
          </div>
        </div>
        <button onClick={onClose} className="p-2 hover:bg-gray-700/50 rounded-xl transition-all duration-200">
          <X className="w-5 h-5 sm:w-6 sm:h-6 text-gray-400" />
        </button>
      </div>

      <div className="p-4 sm:p-6 md:p-8">
        {error && (
          <div className="mb-6 p-4 bg-red-500/10 border border-red-500/30 rounded-2xl backdrop-blur-sm">
            <p className="text-red-300 text-sm font-sans">{error}</p>
          </div>
        )}

        {/* Audio Upload */}
        <div className="mb-8">
          <label className="block text-sm font-semibold text-white mb-4 font-display">Upload Audio Recording</label>
          <div className="border-2 border-dashed border-gray-600/50 rounded-2xl p-6 text-center hover:border-orange-500/50 transition-all duration-200 backdrop-blur-sm">
            <Mic className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-400 mb-4 font-sans">Drag & drop audio file or click to browse</p>
            <input
              type="file"
              accept="audio/*"
              onChange={handleFileChange}
              className="hidden"
              id="audio-upload"
            />
            <label
              htmlFor="audio-upload"
              className="inline-block px-6 py-3 bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 rounded-2xl text-white font-semibold font-display cursor-pointer transition-all duration-200 shadow-lg"
            >
              Choose Audio File
            </label>
          </div>
        </div>

        {/* Text Transcript */}
        <form onSubmit={handleTextSubmit}>
          <div className="mb-6">
            <label className="block text-sm font-semibold text-white mb-3 font-display">Or Enter Transcript</label>
            <textarea
              value={transcript}
              onChange={(e) => setTranscript(e.target.value)}
              placeholder="Paste meeting transcript here..."
              rows="8"
              className="w-full bg-gray-800/30 border border-gray-600/30 rounded-2xl px-4 py-3 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-orange-500/50 focus:border-orange-500/30 backdrop-blur-sm resize-none transition-all duration-200 font-sans"
            />
          </div>

          <div className="flex flex-col sm:flex-row justify-end space-y-3 sm:space-y-0 sm:space-x-4">
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-3 bg-gray-700/30 hover:bg-gray-600/50 rounded-2xl transition-all duration-200 text-white font-medium font-sans border border-gray-600/30 order-2 sm:order-1"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading || !transcript.trim()}
              className="px-6 py-3 bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 rounded-2xl transition-all duration-200 text-white font-semibold font-display disabled:opacity-50 flex items-center justify-center space-x-2 order-1 sm:order-2"
            >
              {loading ? <Loader className="w-4 h-4 animate-spin" /> : <FileText className="w-4 h-4" />}
              <span>Process Transcript</span>
            </button>
          </div>
        </form>
      </div>
    </ModalContainer>
  );
};

// Enhanced Main Meetings Page Component
const MeetingsPage = () => {
  const [meetings, setMeetings] = useState([]);
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filter, setFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [analytics, setAnalytics] = useState(null);
  const [viewMode, setViewMode] = useState('grid');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Modal states
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showParticipantsModal, setShowParticipantsModal] = useState(false);
  const [showBulkInviteModal, setShowBulkInviteModal] = useState(false);
  const [showReminderModal, setShowReminderModal] = useState(false);
  const [showAnalyticsModal, setShowAnalyticsModal] = useState(false);
  const [showBriefModal, setShowBriefModal] = useState(false);
  const [showTranscriptModal, setShowTranscriptModal] = useState(false);
  const [selectedMeeting, setSelectedMeeting] = useState(null);

  useEffect(() => {
    loadMeetingsData();
    loadAnalytics();
  }, [filter]);

  const loadMeetingsData = async () => {
    try {
      setLoading(true);
      setError('');

      // Load current user (simulated)
      const userData = { id: '1', name: 'John Doe', role: 'admin' };
      setCurrentUser(userData);

      // Load meetings
      const params = {};
      if (filter === 'upcoming') params.type = 'upcoming';
      if (filter === 'past') params.type = 'past';

      const data = await meetingService.getMeetings(params);
      setMeetings(data.meetings || []);
    } catch (err) {
      setError(err.message || 'Failed to load meetings');
      setMeetings([]);
    } finally {
      setLoading(false);
    }
  };

  const loadAnalytics = async () => {
    try {
      const data = await meetingService.getAssistantOverview();
      setAnalytics(data.overview);
    } catch (err) {
      console.error('Error loading analytics:', err);
      setAnalytics({
        nextMeeting: null,
        pendingTasks: 0,
        upcomingMeetings: 0
      });
    }
  };

  const handleMeetingCreated = (newMeeting) => {
    setMeetings(prev => [newMeeting, ...prev]);
  };

  const handleDeleteMeeting = async (meetingId) => {
    if (window.confirm('Are you sure you want to delete this meeting?')) {
      try {
        await meetingService.deleteMeeting(meetingId);
        setMeetings(prev => prev.filter(m => m.id !== meetingId));
      } catch (err) {
        setError(err.message || 'Failed to delete meeting');
      }
    }
  };

  const formatDateTime = (dateString) => {
    try {
      const date = new Date(dateString);
      return {
        date: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
        time: date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
        fullDate: date.toLocaleDateString('en-US', { 
          weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' 
        })
      };
    } catch (error) {
      return {
        date: 'Invalid Date',
        time: 'Invalid Time',
        fullDate: 'Invalid Date'
      };
    }
  };

  const getMeetingStatus = (meeting) => {
    try {
      const now = new Date();
      const startTime = new Date(meeting.scheduled_start);
      
      if (meeting.status === 'completed') return 'completed';
      if (meeting.status === 'cancelled') return 'cancelled';
      if (startTime < now) return 'completed';
      return 'upcoming';
    } catch (error) {
      return 'unknown';
    }
  };

  const isAdmin = currentUser?.role === 'admin';

  const filteredMeetings = meetings.filter(meeting => {
    const matchesSearch = meeting.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         meeting.description?.toLowerCase().includes(searchTerm.toLowerCase());
    
    if (filter === 'all') return matchesSearch;
    if (filter === 'upcoming') return matchesSearch && getMeetingStatus(meeting) === 'upcoming';
    if (filter === 'past') return matchesSearch && getMeetingStatus(meeting) === 'completed';
    
    return matchesSearch;
  });

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 flex items-center justify-center p-4">
        <div className="text-center">
          <div className="relative">
            <div className="w-16 h-16 border-4 border-blue-500/30 rounded-full animate-spin"></div>
            <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
              <Sparkles className="w-8 h-8 text-blue-400 animate-pulse" />
            </div>
          </div>
          <p className="text-white text-lg mt-4 font-sans">Loading your meetings...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900">
      {/* Mobile Menu Overlay */}
      {mobileMenuOpen && (
        <div 
          className="fixed inset-0 bg-black/80 backdrop-blur-2xl z-40 lg:hidden animate-fade-in"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}

      <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-6 py-4 sm:py-6 lg:py-8">
        {/* Header */}
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between mb-6 sm:mb-8">
          <div className="flex items-center justify-between mb-4 lg:mb-0">
            <div className="flex items-center space-x-3 sm:space-x-4">
              <div className="p-2 sm:p-3 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-2xl shadow-lg">
                <Calendar className="w-6 h-6 sm:w-8 sm:h-8 text-white" />
              </div>
              <div>
                <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold bg-gradient-to-r from-blue-300 to-cyan-300 bg-clip-text text-transparent font-display">
                  Meetings
                </h1>
                <p className="text-gray-300 mt-1 sm:mt-2 text-sm sm:text-base font-sans">
                  {isAdmin ? 'Manage team meetings and analytics' : 'Join and manage your meetings'}
                </p>
              </div>
            </div>
            
            {/* Mobile Menu Button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="lg:hidden p-2 text-gray-400 hover:text-white transition-colors"
            >
              <Menu className="w-6 h-6" />
            </button>
          </div>
          
          {/* Action Buttons - Desktop */}
          <div className="hidden lg:flex space-x-3">
            <button
              onClick={() => setShowCreateModal(true)}
              className="px-6 py-3 bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 rounded-2xl transition-all duration-200 transform hover:scale-105 shadow-2xl flex items-center space-x-2 text-white font-semibold font-display"
            >
              <Plus className="w-5 h-5" />
              <span>Create Meeting</span>
            </button>
          </div>

          {/* Action Buttons - Mobile */}
          <div className={`lg:hidden fixed bottom-6 left-1/2 transform -translate-x-1/2 z-50 transition-all duration-300 ${
            mobileMenuOpen ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10 pointer-events-none'
          }`}>
            <button
              onClick={() => {
                setShowCreateModal(true);
                setMobileMenuOpen(false);
              }}
              className="px-8 py-4 bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 rounded-2xl transition-all duration-200 transform hover:scale-105 shadow-2xl flex items-center space-x-2 text-white font-semibold font-display"
            >
              <Plus className="w-5 h-5" />
              <span>Create Meeting</span>
            </button>
          </div>
        </div>

        {/* Analytics Dashboard */}
        {analytics && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 mb-6 sm:mb-8">
            <div className="bg-gray-800/50 backdrop-blur-sm rounded-2xl p-4 sm:p-6 border border-blue-500/20">
              <div className="flex items-center space-x-3 sm:space-x-4">
                <div className="p-2 sm:p-3 bg-green-500/20 rounded-2xl">
                  <Clock className="w-5 h-5 sm:w-6 sm:h-6 text-green-400" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-gray-400 text-sm font-sans truncate">Next Meeting</p>
                  <p className="text-white font-semibold font-sans truncate">
                    {analytics.nextMeeting?.title || 'No upcoming meetings'}
                  </p>
                </div>
              </div>
            </div>
            
            <div className="bg-gray-800/50 backdrop-blur-sm rounded-2xl p-4 sm:p-6 border border-cyan-500/20">
              <div className="flex items-center space-x-3 sm:space-x-4">
                <div className="p-2 sm:p-3 bg-blue-500/20 rounded-2xl">
                  <FileText className="w-5 h-5 sm:w-6 sm:h-6 text-blue-400" />
                </div>
                <div>
                  <p className="text-gray-400 text-sm font-sans">Pending Tasks</p>
                  <p className="text-white font-semibold text-xl sm:text-2xl font-display">{analytics.pendingTasks || 0}</p>
                </div>
              </div>
            </div>
            
            <div className="bg-gray-800/50 backdrop-blur-sm rounded-2xl p-4 sm:p-6 border border-green-500/20">
              <div className="flex items-center space-x-3 sm:space-x-4">
                <div className="p-2 sm:p-3 bg-cyan-500/20 rounded-2xl">
                  <Calendar className="w-5 h-5 sm:w-6 sm:h-6 text-cyan-400" />
                </div>
                <div>
                  <p className="text-gray-400 text-sm font-sans">Upcoming</p>
                  <p className="text-white font-semibold text-xl sm:text-2xl font-display">{analytics.upcomingMeetings || 0}</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Error Banner */}
        {error && (
          <div className="bg-red-500/20 border border-red-500/50 text-white p-4 rounded-2xl mb-6 backdrop-blur-sm">
            <div className="flex items-center space-x-2">
              <AlertCircle className="w-5 h-5 flex-shrink-0" />
              <span className="font-sans">{error}</span>
              <button
                onClick={() => setError('')}
                className="ml-auto text-red-300 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* Filters and Search */}
        <div className="bg-gray-800/50 backdrop-blur-sm rounded-2xl p-4 sm:p-6 mb-6 border border-gray-700/30">
          <div className="flex flex-col lg:flex-row lg:items-center space-y-4 lg:space-y-0 lg:space-x-6">
            {/* Search */}
            <div className="flex-1">
              <div className="relative">
                <Search className="w-5 h-5 text-gray-400 absolute left-4 top-1/2 transform -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Search meetings by title or description..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full bg-gray-700/30 border border-gray-600/30 rounded-2xl pl-12 pr-4 py-3 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500/30 backdrop-blur-sm transition-all duration-200 font-sans"
                />
              </div>
            </div>

            <div className="flex items-center space-x-3">
              {/* View Mode Toggle */}
              <div className="hidden sm:flex items-center space-x-1 bg-gray-700/30 rounded-2xl p-1 border border-gray-600/30">
                <button
                  onClick={() => setViewMode('grid')}
                  className={`p-2 rounded-xl transition-all duration-200 ${
                    viewMode === 'grid' 
                      ? 'bg-blue-500/20 text-blue-400' 
                      : 'text-gray-400 hover:text-gray-300'
                  }`}
                >
                  <Grid className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setViewMode('list')}
                  className={`p-2 rounded-xl transition-all duration-200 ${
                    viewMode === 'list' 
                      ? 'bg-blue-500/20 text-blue-400' 
                      : 'text-gray-400 hover:text-gray-300'
                  }`}
                >
                  <List className="w-4 h-4" />
                </button>
              </div>

              {/* Filter Buttons */}
              <div className="flex space-x-2 overflow-x-auto custom-scrollbar">
                {['all', 'upcoming', 'past'].map((filterType) => (
                  <button
                    key={filterType}
                    onClick={() => setFilter(filterType)}
                    className={`px-4 py-2 sm:px-6 sm:py-3 rounded-2xl transition-all duration-200 transform hover:scale-105 font-medium font-sans whitespace-nowrap ${
                      filter === filterType 
                        ? filterType === 'all' 
                          ? 'bg-gradient-to-r from-blue-500 to-cyan-500 text-white shadow-lg'
                          : filterType === 'upcoming'
                          ? 'bg-gradient-to-r from-green-500 to-emerald-500 text-white shadow-lg'
                          : 'bg-gradient-to-r from-gray-600 to-gray-700 text-white shadow-lg'
                        : 'bg-gray-700/30 text-gray-300 hover:bg-gray-600/50 border border-gray-600/30'
                    }`}
                  >
                    {filterType.charAt(0).toUpperCase() + filterType.slice(1)}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Meetings Grid/List */}
        {filteredMeetings.length > 0 ? (
          <div className={`${
            viewMode === 'grid' 
              ? 'grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4 sm:gap-6'
              : 'space-y-4 sm:space-y-6'
          }`}>
            {filteredMeetings.map((meeting) => {
              const { date, time, fullDate } = formatDateTime(meeting.scheduled_start);
              const status = getMeetingStatus(meeting);
              const isCreator = currentUser && meeting.created_by === currentUser.id;

              return viewMode === 'grid' ? (
                // Grid View Card
                <div 
                  key={meeting.id} 
                  className="group relative bg-gray-800/50 backdrop-blur-sm rounded-2xl p-4 sm:p-6 hover:bg-gray-800/70 transition-all duration-300 border border-gray-700/30 hover:border-blue-500/30 hover:shadow-2xl"
                >
                  {/* Admin Badge */}
                  {isAdmin && isCreator && (
                    <div className="absolute -top-2 -right-2 z-10">
                      <div className="bg-gradient-to-r from-amber-500 to-orange-500 text-white text-xs px-3 py-1 rounded-full flex items-center space-x-1 shadow-lg font-medium font-sans">
                        <Crown className="w-3 h-3" />
                        <span>Admin</span>
                      </div>
                    </div>
                  )}

                  {/* Meeting Header */}
                  <div className="flex justify-between items-start mb-4">
                    <div className="flex-1 pr-4 min-w-0">
                      <h3 className="text-lg sm:text-xl font-bold mb-2 line-clamp-2 text-white group-hover:text-blue-200 transition-colors duration-200 font-display">
                        {meeting.title || 'Untitled Meeting'}
                      </h3>
                      <div className="flex flex-wrap gap-2">
                        <span className={`px-3 py-1 rounded-full text-xs font-semibold font-sans ${
                          status === 'upcoming' 
                            ? 'bg-gradient-to-r from-green-500 to-emerald-500 text-white' 
                            : status === 'completed' 
                            ? 'bg-gradient-to-r from-blue-500 to-cyan-500 text-white'
                            : status === 'cancelled'
                            ? 'bg-gradient-to-r from-red-500 to-pink-500 text-white'
                            : 'bg-gradient-to-r from-gray-500 to-gray-600 text-white'
                        }`}>
                          {status === 'upcoming' ? 'Upcoming' : 
                           status === 'completed' ? 'Completed' : 
                           status === 'cancelled' ? 'Cancelled' : 'Unknown'}
                        </span>
                        {isCreator && (
                          <span className="px-3 py-1 rounded-full text-xs font-semibold font-sans bg-gradient-to-r from-amber-500 to-orange-500 text-white">
                            Organizer
                          </span>
                        )}
                      </div>
                    </div>
                    
                    {/* Enhanced Dropdown Menu */}
                    <div className="relative">
                      <button className="p-2 text-gray-400 hover:text-white hover:bg-gray-700/50 rounded-xl transition-all duration-200">
                        <MoreVertical className="w-5 h-5" />
                      </button>
                      
                      <div className="absolute right-0 top-10 bg-gray-800/95 backdrop-blur-sm rounded-2xl shadow-2xl py-2 w-64 z-10 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 border border-gray-700/30">
                        <button
                          onClick={() => window.open(`/meetings/${meeting.id}`, '_blank')}
                          className="w-full text-left px-4 py-3 text-sm text-white hover:bg-blue-500/20 transition-all duration-200 flex items-center space-x-3 font-sans"
                        >
                          <FileText className="w-4 h-4" />
                          <span>View Details</span>
                        </button>
                        
                        {status === 'upcoming' && (
                          <>
                            <button
                              onClick={() => {
                                setSelectedMeeting(meeting);
                                setShowReminderModal(true);
                              }}
                              className="w-full text-left px-4 py-3 text-sm text-white hover:bg-green-500/20 transition-all duration-200 flex items-center space-x-3 font-sans"
                            >
                              <Bell className="w-4 h-4" />
                              <span>Send Reminder</span>
                            </button>
                            
                            {isAdmin && (
                              <>
                                <button
                                  onClick={() => {
                                    setSelectedMeeting(meeting);
                                    setShowBulkInviteModal(true);
                                  }}
                                  className="w-full text-left px-4 py-3 text-sm text-white hover:bg-purple-500/20 transition-all duration-200 flex items-center space-x-3 font-sans"
                                >
                                  <UserPlus className="w-4 h-4" />
                                  <span>Bulk Invite</span>
                                </button>
                                <button
                                  onClick={() => {
                                    setSelectedMeeting(meeting);
                                    setShowParticipantsModal(true);
                                  }}
                                  className="w-full text-left px-4 py-3 text-sm text-white hover:bg-cyan-500/20 transition-all duration-200 flex items-center space-x-3 font-sans"
                                >
                                  <Users className="w-4 h-4" />
                                  <span>Add Participants</span>
                                </button>
                              </>
                            )}
                          </>
                        )}
                        
                        <button
                          onClick={() => {
                            setSelectedMeeting(meeting);
                            setShowBriefModal(true);
                          }}
                          className="w-full text-left px-4 py-3 text-sm text-white hover:bg-cyan-500/20 transition-all duration-200 flex items-center space-x-3 font-sans"
                        >
                          <Brain className="w-4 h-4" />
                          <span>AI Brief</span>
                        </button>

                        {isAdmin && (
                          <button
                            onClick={() => {
                              setSelectedMeeting(meeting);
                              setShowTranscriptModal(true);
                            }}
                            className="w-full text-left px-4 py-3 text-sm text-white hover:bg-yellow-500/20 transition-all duration-200 flex items-center space-x-3 font-sans"
                          >
                            <Mic className="w-4 h-4" />
                            <span>Process Audio</span>
                          </button>
                        )}

                        {isAdmin && (
                          <button
                            onClick={() => {
                              setSelectedMeeting(meeting);
                              setShowAnalyticsModal(true);
                            }}
                            className="w-full text-left px-4 py-3 text-sm text-white hover:bg-blue-500/20 transition-all duration-200 flex items-center space-x-3 font-sans"
                          >
                            <BarChart3 className="w-4 h-4" />
                            <span>View Analytics</span>
                          </button>
                        )}

                        {isCreator && (
                          <>
                            <div className="border-t border-gray-700/30 my-2"></div>
                            <button
                              onClick={() => window.open(`/meetings/${meeting.id}/edit`, '_blank')}
                              className="w-full text-left px-4 py-3 text-sm text-white hover:bg-yellow-500/20 transition-all duration-200 flex items-center space-x-3 font-sans"
                            >
                              <Edit className="w-4 h-4" />
                              <span>Edit Meeting</span>
                            </button>
                            <button
                              onClick={() => handleDeleteMeeting(meeting.id)}
                              className="w-full text-left px-4 py-3 text-sm text-red-400 hover:bg-red-500/20 transition-all duration-200 flex items-center space-x-3 font-sans"
                            >
                              <Trash2 className="w-4 h-4" />
                              <span>Delete Meeting</span>
                            </button>
                          </>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Meeting Details */}
                  <div className="space-y-3 mb-4">
                    <div className="flex items-center space-x-3 text-sm">
                      <div className="p-2 bg-blue-500/20 rounded-xl">
                        <Calendar className="w-4 h-4 text-blue-400" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-gray-300 font-sans truncate">{date}</p>
                        <p className="text-gray-400 text-xs font-sans truncate">{fullDate}</p>
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-3 text-sm">
                      <div className="p-2 bg-green-500/20 rounded-xl">
                        <Clock className="w-4 h-4 text-green-400" />
                      </div>
                      <span className="text-gray-300 font-sans">{time}</span>
                    </div>
                    
                    <div className="flex items-center space-x-3 text-sm">
                      <div className="p-2 bg-purple-500/20 rounded-xl">
                        <Users className="w-4 h-4 text-purple-400" />
                      </div>
                      <span className="text-gray-300 font-sans">{meeting.participants?.length || 0} participants</span>
                    </div>
                  </div>

                  {/* Description */}
                  {meeting.description && (
                    <p className="text-gray-400 text-sm mb-4 line-clamp-2 border-l-4 border-blue-500/50 pl-3 py-1 font-sans">
                      {meeting.description}
                    </p>
                  )}

                  {/* Action Buttons */}
                  <div className="flex space-x-3">
                    <button
                      onClick={() => window.open(`/meetings/${meeting.id}`, '_blank')}
                      className="flex-1 px-4 py-3 bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 rounded-2xl transition-all duration-200 transform hover:scale-105 text-sm text-white font-semibold font-display shadow-lg"
                    >
                      View Details
                    </button>
                    
                    {status === 'upcoming' && meeting.video_link && (
                      <button
                        onClick={() => window.open(meeting.video_link, '_blank')}
                        className="px-4 py-3 bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 rounded-2xl transition-all duration-200 transform hover:scale-105 text-sm text-white font-semibold font-display shadow-lg flex items-center space-x-2"
                      >
                        <Video className="w-4 h-4" />
                        <span>Join</span>
                      </button>
                    )}
                  </div>
                </div>
              ) : (
                // List View Item
                <div 
                  key={meeting.id}
                  className="group bg-gray-800/50 backdrop-blur-sm rounded-2xl p-4 sm:p-6 hover:bg-gray-800/70 transition-all duration-300 border border-gray-700/30 hover:border-blue-500/30 hover:shadow-2xl"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start space-x-4">
                        <div className="flex-shrink-0">
                          <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-2xl flex items-center justify-center shadow-lg">
                            <Calendar className="w-6 h-6 text-white" />
                          </div>
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex flex-wrap items-center gap-2 mb-2">
                            <h3 className="text-lg font-bold text-white font-display truncate">
                              {meeting.title || 'Untitled Meeting'}
                            </h3>
                            <span className={`px-3 py-1 rounded-full text-xs font-semibold font-sans ${
                              status === 'upcoming' 
                                ? 'bg-gradient-to-r from-green-500 to-emerald-500 text-white' 
                                : status === 'completed' 
                                ? 'bg-gradient-to-r from-blue-500 to-cyan-500 text-white'
                                : status === 'cancelled'
                                ? 'bg-gradient-to-r from-red-500 to-pink-500 text-white'
                                : 'bg-gradient-to-r from-gray-500 to-gray-600 text-white'
                            }`}>
                              {status === 'upcoming' ? 'Upcoming' : 
                               status === 'completed' ? 'Completed' : 
                               status === 'cancelled' ? 'Cancelled' : 'Unknown'}
                            </span>
                            {isCreator && (
                              <span className="px-3 py-1 rounded-full text-xs font-semibold font-sans bg-gradient-to-r from-amber-500 to-orange-500 text-white">
                                Organizer
                              </span>
                            )}
                          </div>
                          <div className="flex flex-wrap items-center gap-4 text-sm text-gray-300 font-sans">
                            <span className="flex items-center space-x-2">
                              <Clock className="w-4 h-4" />
                              <span>{date} at {time}</span>
                            </span>
                            <span className="flex items-center space-x-2">
                              <Users className="w-4 h-4" />
                              <span>{meeting.participants?.length || 0} participants</span>
                            </span>
                          </div>
                          {meeting.description && (
                            <p className="text-gray-400 text-sm mt-2 line-clamp-1 font-sans">
                              {meeting.description}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center space-x-3">
                      <button
                        onClick={() => window.open(`/meetings/${meeting.id}`, '_blank')}
                        className="px-4 py-2 bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 rounded-2xl transition-all duration-200 text-sm text-white font-semibold font-display"
                      >
                        View
                      </button>
                      <button className="p-2 text-gray-400 hover:text-white hover:bg-gray-700/50 rounded-xl transition-all duration-200">
                        <MoreVertical className="w-5 h-5" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="bg-gray-800/50 backdrop-blur-sm rounded-2xl p-8 sm:p-12 text-center border border-blue-500/20">
            <div className="max-w-md mx-auto">
              <div className="w-16 h-16 sm:w-20 sm:h-20 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg">
                <Calendar className="w-8 h-8 sm:w-10 sm:h-10 text-white" />
              </div>
              <h3 className="text-xl sm:text-2xl font-bold text-white mb-2 font-display">No meetings found</h3>
              <p className="text-gray-400 mb-6 font-sans">
                {searchTerm 
                  ? 'No meetings match your search criteria' 
                  : filter === 'upcoming' 
                    ? 'You have no upcoming meetings scheduled'
                    : filter === 'past'
                      ? 'No past meetings found'
                      : 'Get started by creating your first meeting'
                }
              </p>
              {!searchTerm && (
                <button
                  onClick={() => setShowCreateModal(true)}
                  className="px-6 py-3 bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 rounded-2xl transition-all duration-200 transform hover:scale-105 inline-flex items-center space-x-2 text-white font-semibold font-display shadow-2xl"
                >
                  <Plus className="w-5 h-5" />
                  <span>Create Meeting</span>
                </button>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Modals */}
      <CreateMeetingModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onMeetingCreated={handleMeetingCreated}
        currentUser={currentUser}
      />

      <AddParticipantsModal
        isOpen={showParticipantsModal}
        onClose={() => setShowParticipantsModal(false)}
        meeting={selectedMeeting}
        onParticipantsAdded={() => loadMeetingsData()}
      />

      <BulkInviteModal
        isOpen={showBulkInviteModal}
        onClose={() => setShowBulkInviteModal(false)}
        meeting={selectedMeeting}
        onBulkInvite={() => loadMeetingsData()}
      />

      <ReminderModal
        isOpen={showReminderModal}
        onClose={() => setShowReminderModal(false)}
        meeting={selectedMeeting}
        onRemindersSent={() => {}}
      />

      <AnalyticsModal
        isOpen={showAnalyticsModal}
        onClose={() => setShowAnalyticsModal(false)}
        meeting={selectedMeeting}
      />

      <BriefModal
        isOpen={showBriefModal}
        onClose={() => setShowBriefModal(false)}
        meeting={selectedMeeting}
      />

      <TranscriptModal
        isOpen={showTranscriptModal}
        onClose={() => setShowTranscriptModal(false)}
        meeting={selectedMeeting}
        onTranscriptProcessed={() => loadMeetingsData()}
      />
    </div>
  );
};

export default MeetingsPage;