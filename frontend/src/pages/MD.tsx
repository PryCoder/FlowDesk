// src/pages/meetings/MeetingDetailPage.jsx
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Calendar,
  Clock,
  Users,
  Video,
  FileText,
  Mic,
  Trash2,
  Edit,
  CheckCircle,
  AlertCircle,
  User,
  Building,
  Mail,
  Share2,
  Bell,
  Loader2,
  ArrowLeft,
  Download,
  Play
} from 'lucide-react';

const MeetingDetailPage = () => {
  const { meetingId } = useParams();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('overview');
  const [meeting, setMeeting] = useState(null);
  const [currentUser, setCurrentUser] = useState(null);
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [processingTranscript, setProcessingTranscript] = useState(false);

  const token = localStorage.getItem('token');

  useEffect(() => {
    if (meetingId) {
      loadMeetingData();
    }
  }, [meetingId]);

  const loadMeetingData = async () => {
    try {
      setLoading(true);
      setError('');

      // Load current user
      const userResponse = await fetch('http://localhost:3001/api/auth/current-user', {
        headers: { 
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (userResponse.ok) {
        const userData = await userResponse.json();
        setCurrentUser(userData.user);
      }

      // Load meeting details
      const meetingResponse = await fetch(`http://localhost:3001/api/meetings/${meetingId}`, {
        headers: { 
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (meetingResponse.ok) {
        const meetingData = await meetingResponse.json();
        setMeeting(meetingData.meeting);
      } else {
        throw new Error('Failed to load meeting details');
      }

      // Load company employees
      const employeesResponse = await fetch('http://localhost:3001/api/auth/company/employees', {
        headers: { 
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (employeesResponse.ok) {
        const employeesData = await employeesResponse.json();
        setEmployees(employeesData.employees || []);
      }

    } catch (err) {
      console.error('Error loading meeting data:', err);
      setError(err.message || 'Failed to load meeting data');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteMeeting = async () => {
    if (window.confirm('Are you sure you want to delete this meeting?')) {
      try {
        const response = await fetch(`http://localhost:3001/api/meetings/${meetingId}`, {
          method: 'DELETE',
          headers: { 
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });
        
        if (response.ok) {
          navigate('/meetings');
        } else {
          throw new Error('Failed to delete meeting');
        }
      } catch (err) {
        setError('Failed to delete meeting: ' + err.message);
      }
    }
  };

  const handleProcessTranscript = async () => {
    setProcessingTranscript(true);
    try {
      const response = await fetch(`http://localhost:3001/api/meetings/${meetingId}/summarize`, {
        method: 'POST',
        headers: { 
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (response.ok) {
        const result = await response.json();
        setMeeting(prev => ({ ...prev, summary: result.summary }));
        alert('Meeting processed successfully!');
      } else {
        throw new Error('Failed to process meeting');
      }
    } catch (err) {
      setError('Failed to process meeting: ' + err.message);
    } finally {
      setProcessingTranscript(false);
    }
  };

  const formatDateTime = (dateString) => {
    try {
      const date = new Date(dateString);
      return {
        date: date.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }),
        time: date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
      };
    } catch (error) {
      return {
        date: 'Invalid date',
        time: 'Invalid time'
      };
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin text-blue-500 mx-auto mb-4" />
          <p className="text-white text-lg">Loading meeting...</p>
        </div>
      </div>
    );
  }

  if (error && !meeting) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-red-500 text-center max-w-md">
          <AlertCircle className="w-16 h-16 mx-auto mb-4" />
          <p className="text-xl font-semibold mb-2">Error Loading Meeting</p>
          <p className="text-gray-300 mb-4">{error}</p>
          <div className="space-y-2">
            <button
              onClick={loadMeetingData}
              className="w-full px-6 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors text-white"
            >
              Try Again
            </button>
            <button
              onClick={() => navigate('/meetings')}
              className="w-full px-6 py-2 bg-gray-600 hover:bg-gray-500 rounded-lg transition-colors text-white"
            >
              Back to Meetings
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!meeting) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-white text-center">
          <AlertCircle className="w-12 h-12 mx-auto mb-4" />
          <p className="text-xl">Meeting not found</p>
          <button
            onClick={() => navigate('/meetings')}
            className="mt-4 px-6 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors"
          >
            Back to Meetings
          </button>
        </div>
      </div>
    );
  }

  const { date, time } = formatDateTime(meeting.scheduled_start);
  const isCreator = currentUser && meeting.created_by === currentUser.id;

  return (
    <div className="max-w-6xl mx-auto">
      {/* Header Navigation */}
      <div className="flex items-center justify-between mb-6">
        <button
          onClick={() => navigate('/meetings')}
          className="flex items-center space-x-2 text-gray-400 hover:text-white transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
          <span>Back to Meetings</span>
        </button>

        <div className="flex space-x-3">
          {isCreator && (
            <>
              <button
                onClick={() => navigate(`/meetings/${meetingId}/edit`)}
                className="px-4 py-2 bg-yellow-600 hover:bg-yellow-700 rounded-lg transition-colors flex items-center space-x-2 text-white"
              >
                <Edit className="w-4 h-4" />
                <span>Edit</span>
              </button>
              <button
                onClick={handleDeleteMeeting}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 rounded-lg transition-colors flex items-center space-x-2 text-white"
              >
                <Trash2 className="w-4 h-4" />
                <span>Delete</span>
              </button>
            </>
          )}
          <button 
            onClick={() => window.open(meeting.video_link, '_blank')}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors flex items-center space-x-2 text-white"
          >
            <Video className="w-4 h-4" />
            <span>Join Meeting</span>
          </button>
        </div>
      </div>

      {/* Error Banner */}
      {error && (
        <div className="bg-red-600 text-white p-4 rounded-lg mb-6">
          <div className="flex items-center space-x-2">
            <AlertCircle className="w-5 h-5" />
            <span>{error}</span>
          </div>
        </div>
      )}

      {/* Meeting Header */}
      <div className="bg-gray-800 rounded-lg p-6 mb-6">
        <div className="flex justify-between items-start">
          <div className="flex-1">
            <h1 className="text-3xl font-bold text-white mb-2">{meeting.title}</h1>
            <p className="text-gray-300 mb-4">{meeting.description}</p>
            
            <div className="flex flex-wrap gap-4 text-sm">
              <div className="flex items-center space-x-2">
                <Calendar className="w-4 h-4 text-blue-400" />
                <span className="text-gray-300">{date}</span>
              </div>
              <div className="flex items-center space-x-2">
                <Clock className="w-4 h-4 text-green-400" />
                <span className="text-gray-300">{time}</span>
              </div>
              <div className="flex items-center space-x-2">
                <Video className="w-4 h-4 text-purple-400" />
                <a 
                  href={meeting.video_link} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-blue-400 hover:underline"
                >
                  Join Meeting
                </a>
              </div>
              {meeting.google_calendar_event_id && (
                <div className="flex items-center space-x-2">
                  <CheckCircle className="w-4 h-4 text-green-400" />
                  <span className="text-gray-300">Added to Calendar</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="bg-gray-800 rounded-lg mb-6">
        <div className="border-b border-gray-700">
          <nav className="flex space-x-8 px-6">
            {['overview', 'participants', 'transcript', 'action-items', 'analytics'].map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                  activeTab === tab
                    ? 'border-blue-500 text-blue-400'
                    : 'border-transparent text-gray-400 hover:text-gray-300'
                }`}
              >
                {tab.split('-').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')}
              </button>
            ))}
          </nav>
        </div>
      </div>

      {/* Tab Content */}
      <div className="bg-gray-800 rounded-lg p-6">
        {activeTab === 'overview' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-gray-700 rounded-lg p-4">
                <h3 className="text-lg font-semibold text-white mb-3">Meeting Details</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-400">Status:</span>
                    <span className={`px-2 py-1 rounded-full text-xs ${
                      meeting.status === 'scheduled' ? 'bg-green-500 text-green-900' : 
                      meeting.status === 'completed' ? 'bg-blue-500 text-blue-900' : 'bg-yellow-500 text-yellow-900'
                    }`}>
                      {meeting.status || 'scheduled'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Duration:</span>
                    <span className="text-white">1 hour</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Created by:</span>
                    <span className="text-white">{currentUser?.firstName} {currentUser?.lastName}</span>
                  </div>
                </div>
              </div>

              <div className="bg-gray-700 rounded-lg p-4">
                <h3 className="text-lg font-semibold text-white mb-3">Quick Actions</h3>
                <div className="space-y-2">
                  <button 
                    onClick={handleProcessTranscript}
                    disabled={processingTranscript}
                    className="w-full px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors text-left flex items-center space-x-2 disabled:opacity-50 text-white"
                  >
                    {processingTranscript ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <FileText className="w-4 h-4" />
                    )}
                    <span>{processingTranscript ? 'Processing...' : 'Generate Summary'}</span>
                  </button>
                  <button className="w-full px-4 py-2 bg-green-600 hover:bg-green-700 rounded-lg transition-colors text-left flex items-center space-x-2 text-white">
                    <Share2 className="w-4 h-4" />
                    <span>Share Meeting</span>
                  </button>
                </div>
              </div>
            </div>

            {meeting.agenda && meeting.agenda.length > 0 && (
              <div className="bg-gray-700 rounded-lg p-4">
                <h3 className="text-lg font-semibold text-white mb-3">Agenda</h3>
                <ol className="list-decimal list-inside space-y-2">
                  {meeting.agenda.map((item, index) => (
                    <li key={index} className="text-gray-300">{item}</li>
                  ))}
                </ol>
              </div>
            )}

            {meeting.summary && (
              <div className="bg-gray-700 rounded-lg p-4">
                <h3 className="text-lg font-semibold text-white mb-3">Meeting Summary</h3>
                <p className="text-gray-300 whitespace-pre-wrap">{meeting.summary}</p>
              </div>
            )}
          </div>
        )}

        {activeTab === 'participants' && (
          <div>
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-semibold text-white">
                Participants ({meeting.participants?.length || 0})
              </h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {meeting.participants?.map(participantId => {
                const employee = employees.find(emp => emp.id === participantId);
                const participant = employee || {
                  firstName: 'Unknown',
                  lastName: 'User',
                  email: 'unknown@example.com',
                  position: 'N/A',
                  department: 'N/A'
                };

                return (
                  <div key={participantId} className="bg-gray-700 rounded-lg p-4">
                    <div className="flex items-center space-x-3 mb-3">
                      <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center">
                        <User className="w-6 h-6 text-white" />
                      </div>
                      <div>
                        <h4 className="font-semibold text-white">
                          {participant.firstName} {participant.lastName}
                          {participantId === meeting.created_by && (
                            <span className="ml-2 text-xs bg-yellow-500 text-yellow-900 px-2 py-1 rounded-full">Creator</span>
                          )}
                        </h4>
                        <p className="text-sm text-gray-400">{participant.position}</p>
                      </div>
                    </div>
                    <div className="space-y-1 text-sm">
                      <div className="flex items-center space-x-2">
                        <Mail className="w-4 h-4 text-gray-400" />
                        <span className="text-gray-300">{participant.email}</span>
                      </div>
                      {participant.department && participant.department !== 'N/A' && (
                        <div className="flex items-center space-x-2">
                          <Building className="w-4 h-4 text-gray-400" />
                          <span className="text-gray-300">{participant.department}</span>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            {(!meeting.participants || meeting.participants.length === 0) && (
              <div className="text-center py-8 text-gray-400">
                <Users className="w-12 h-12 mx-auto mb-4" />
                <p>No participants yet.</p>
              </div>
            )}
          </div>
        )}

        {activeTab === 'transcript' && (
          <div>
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-semibold text-white">Meeting Transcript</h3>
              <div className="flex space-x-3">
                <button className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors flex items-center space-x-2 text-white">
                  <Mic className="w-4 h-4" />
                  <span>Upload Audio</span>
                </button>
                <button className="px-4 py-2 bg-green-600 hover:bg-green-700 rounded-lg transition-colors flex items-center space-x-2 text-white">
                  <Download className="w-4 h-4" />
                  <span>Export</span>
                </button>
              </div>
            </div>

            {meeting.transcript ? (
              <div className="bg-gray-700 rounded-lg p-6">
                <pre className="text-gray-300 whitespace-pre-wrap font-sans">
                  {meeting.transcript}
                </pre>
              </div>
            ) : (
              <div className="text-center py-12 text-gray-400">
                <FileText className="w-16 h-16 mx-auto mb-4" />
                <h3 className="text-xl font-semibold mb-2">No Transcript Available</h3>
                <p className="mb-6">Upload audio or process this meeting to generate a transcript.</p>
                <button className="px-6 py-3 bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors flex items-center space-x-2 mx-auto text-white">
                  <Play className="w-5 h-5" />
                  <span>Process Meeting</span>
                </button>
              </div>
            )}
          </div>
        )}

        {/* Add other tabs as needed */}
        {!['overview', 'participants', 'transcript'].includes(activeTab) && (
          <div className="text-center py-12 text-gray-400">
            <FileText className="w-16 h-16 mx-auto mb-4" />
            <h3 className="text-xl font-semibold mb-2">Coming Soon</h3>
            <p>This section is under development.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default MeetingDetailPage;