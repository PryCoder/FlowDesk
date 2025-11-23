import React, { useState, useEffect } from 'react';

const CalendarMeetTestPage = () => {
  const [token, setToken] = useState('');
  const [userId, setUserId] = useState('');
  const [results, setResults] = useState({});
  const [loading, setLoading] = useState(false);
  const [connectedServices, setConnectedServices] = useState({});

  // Load token and user from localStorage on component mount
  useEffect(() => {
    const savedToken = localStorage.getItem('token');
    const savedUser = localStorage.getItem('current_user');
    
    if (savedToken) {
      setToken(savedToken);
    }
    
    if (savedUser) {
      try {
        const userData = JSON.parse(savedUser);
        setUserId(userData.id);
      } catch (error) {
        console.error('Error parsing user data:', error);
      }
    }
  }, []);

  const makeApiCall = async (endpoint, method = 'GET', body = null) => {
    setLoading(true);
    try {
      const headers = {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      };

      const options = {
        method,
        headers
      };

      if (body && method !== 'GET') {
        options.body = JSON.stringify(body);
      }

      const response = await fetch(`${import.meta.env.VITE_BACKEND_URL}${endpoint}`, options);
      const data = await response.json();
      
      setResults(prev => ({
        ...prev,
        [endpoint]: {
          status: response.status,
          data: data,
          timestamp: new Date().toLocaleTimeString()
        }
      }));

      return data;
    } catch (error) {
      setResults(prev => ({
        ...prev,
        [endpoint]: {
          status: 'ERROR',
          data: { error: error.message },
          timestamp: new Date().toLocaleTimeString()
        }
      }));
    } finally {
      setLoading(false);
    }
  };

  // Token Management Tests
  const testConnectedServices = () => makeApiCall('/api/calendar-meet/connected-services');
  
  const testDisconnectService = (service) => {
    if (window.confirm(`Are you sure you want to disconnect ${service}?`)) {
      makeApiCall(`/api/calendar-meet/disconnect/${service}`, 'DELETE');
    }
  };

  // Calendar Tests
  const testCalendarAuthUrl = () => makeApiCall('/api/calendar-meet/calendar/auth-url');
  
  const testCalendarCallback = () => {
    const code = prompt('Enter the authorization code from Google:');
    if (code) {
      makeApiCall('/api/calendar-meet/calendar/callback', 'POST', { code });
    }
  };

  const testSyncCalendars = () => makeApiCall('/api/calendar-meet/calendar/sync-calendars', 'POST');
  
  const testSyncEvents = () => {
    const calendarId = prompt('Enter calendar ID (default: primary):', 'primary');
    makeApiCall('/api/calendar-meet/calendar/sync-events', 'POST', {
      calendarId: calendarId || 'primary',
      maxResults: 20
    });
  };

  const testCreateEvent = () => {
    const eventData = {
      title: 'Test Event from API',
      description: 'This is a test event created via API',
      startTime: new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString(), // 2 hours from now
      endTime: new Date(Date.now() + 3 * 60 * 60 * 1000).toISOString(), // 3 hours from now
      location: 'Test Location',
      attendees: ['test@example.com']
    };
    
    makeApiCall('/api/calendar-meet/calendar/events', 'POST', {
      calendarId: 'primary',
      eventData
    });
  };

  const testGetEvents = () => makeApiCall('/api/calendar-meet/calendar/events');

  // Meet Tests
  const testMeetAuthUrl = () => makeApiCall('/api/calendar-meet/meet/auth-url');
  
  const testMeetCallback = () => {
    const code = prompt('Enter the authorization code from Google:');
    if (code) {
      makeApiCall('/api/calendar-meet/meet/callback', 'POST', { code });
    }
  };

  const testCreateMeeting = () => {
    const meetingData = {
      title: 'Test Meeting from API',
      description: 'This is a test meeting created via API',
      startTime: new Date(Date.now() + 1 * 60 * 60 * 1000).toISOString(), // 1 hour from now
      endTime: new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString(), // 2 hours from now
    };
    
    makeApiCall('/api/calendar-meet/meet/meetings', 'POST', { meetingData });
  };

  const testCreateScheduledMeeting = () => {
    const meetingData = {
      title: 'Scheduled Test Meeting',
      description: 'This is a scheduled test meeting with Calendar integration',
      startTime: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(), // Tomorrow
      endTime: new Date(Date.now() + 25 * 60 * 60 * 1000).toISOString(), // 25 hours from now
      attendees: ['team@example.com']
    };
    
    makeApiCall('/api/calendar-meet/meet/scheduled-meetings', 'POST', { meetingData });
  };

  const testGetMeetings = () => makeApiCall('/api/calendar-meet/meet/meetings');

  // Combined Tests
  const testFullSync = () => makeApiCall('/api/calendar-meet/sync-all', 'POST');

  // Load connected services on component mount
  useEffect(() => {
    if (token) {
      testConnectedServices().then(data => {
        if (data?.success) {
          setConnectedServices(data.services);
        }
      });
    }
  }, [token]);

  return (
    <div style={{ padding: '20px', fontFamily: 'Arial, sans-serif', maxWidth: '1200px', margin: '0 auto' }}>
      <h1>Calendar & Meet API Test Page</h1>
      
      {/* Token and User Info */}
      <div style={{ marginBottom: '20px', padding: '15px', border: '1px solid #ccc', borderRadius: '5px' }}>
        <h3>Authentication Info</h3>
        <div style={{ marginBottom: '10px' }}>
          <label>
            Token: 
            <input 
              type="text" 
              value={token} 
              onChange={(e) => setToken(e.target.value)} 
              placeholder="Enter JWT token"
              style={{ width: '400px', marginLeft: '10px', padding: '5px' }}
            />
          </label>
        </div>
        <div style={{ marginBottom: '10px' }}>
          <label>
            User ID: 
            <input 
              type="text" 
              value={userId} 
              onChange={(e) => setUserId(e.target.value)} 
              placeholder="Enter user ID"
              style={{ width: '200px', marginLeft: '10px', padding: '5px' }}
            />
          </label>
        </div>
        <div>
          <strong>Connected Services:</strong>
          <div style={{ marginTop: '5px' }}>
            {Object.entries(connectedServices).map(([service, data]) => (
              <span 
                key={service} 
                style={{ 
                  display: 'inline-block', 
                  margin: '0 10px 5px 0', 
                  padding: '2px 8px', 
                  backgroundColor: data.connected ? '#4CAF50' : '#f44336',
                  color: 'white',
                  borderRadius: '3px',
                  fontSize: '12px'
                }}
              >
                {service}: {data.connected ? '✅' : '❌'}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* API Test Sections */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
        
        {/* Token Management */}
        <div style={{ border: '1px solid #ccc', borderRadius: '5px', padding: '15px' }}>
          <h3>🔐 Token Management</h3>
          <button onClick={testConnectedServices} disabled={loading} style={buttonStyle}>
            Get Connected Services
          </button>
          <div style={{ marginTop: '10px' }}>
            {Object.entries(connectedServices).map(([service, data]) => (
              <button 
                key={service} 
                onClick={() => testDisconnectService(service)}
                disabled={!data.connected || loading}
                style={{ ...buttonStyle, margin: '2px', fontSize: '12px', padding: '5px 8px' }}
              >
                Disconnect {service}
              </button>
            ))}
          </div>
        </div>

        {/* Calendar Tests */}
        <div style={{ border: '1px solid #ccc', borderRadius: '5px', padding: '15px' }}>
          <h3>📅 Calendar API Tests</h3>
          <button onClick={testCalendarAuthUrl} disabled={loading} style={buttonStyle}>
            Get Calendar Auth URL
          </button>
          <button onClick={testCalendarCallback} disabled={loading} style={buttonStyle}>
            Handle Calendar Callback
          </button>
          <button onClick={testSyncCalendars} disabled={loading} style={buttonStyle}>
            Sync Calendars
          </button>
          <button onClick={testSyncEvents} disabled={loading} style={buttonStyle}>
            Sync Events
          </button>
          <button onClick={testCreateEvent} disabled={loading} style={buttonStyle}>
            Create Event
          </button>
          <button onClick={testGetEvents} disabled={loading} style={buttonStyle}>
            Get Events
          </button>
        </div>

        {/* Meet Tests */}
        <div style={{ border: '1px solid #ccc', borderRadius: '5px', padding: '15px' }}>
          <h3>🎥 Meet API Tests</h3>
          <button onClick={testMeetAuthUrl} disabled={loading} style={buttonStyle}>
            Get Meet Auth URL
          </button>
          <button onClick={testMeetCallback} disabled={loading} style={buttonStyle}>
            Handle Meet Callback
          </button>
          <button onClick={testCreateMeeting} disabled={loading} style={buttonStyle}>
            Create Instant Meeting
          </button>
          <button onClick={testCreateScheduledMeeting} disabled={loading} style={buttonStyle}>
            Create Scheduled Meeting
          </button>
          <button onClick={testGetMeetings} disabled={loading} style={buttonStyle}>
            Get Meetings
          </button>
        </div>

        {/* Combined Tests */}
        <div style={{ border: '1px solid #ccc', borderRadius: '5px', padding: '15px' }}>
          <h3>🔄 Combined Operations</h3>
          <button onClick={testFullSync} disabled={loading} style={buttonStyle}>
            Full Sync (Calendar + Meet)
          </button>
        </div>
      </div>

      {/* Results Display */}
      <div style={{ marginTop: '30px' }}>
        <h3>API Responses</h3>
        {loading && <div style={{ padding: '10px', backgroundColor: '#fff3cd', border: '1px solid #ffeaa7' }}>Loading...</div>}
        
        {Object.entries(results).map(([endpoint, result]) => (
          <div key={endpoint} style={{ marginBottom: '15px', border: '1px solid #ddd', borderRadius: '5px', padding: '10px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '5px' }}>
              <strong style={{ color: result.status === 200 ? '#4CAF50' : '#f44336' }}>
                {endpoint} 
                <span style={{ fontSize: '12px', marginLeft: '10px', color: '#666' }}>
                  (Status: {result.status})
                </span>
              </strong>
              <span style={{ fontSize: '12px', color: '#666' }}>{result.timestamp}</span>
            </div>
            <pre style={{ 
              backgroundColor: '#f5f5f5', 
              padding: '10px', 
              borderRadius: '3px', 
              fontSize: '12px', 
              maxHeight: '300px', 
              overflow: 'auto',
              whiteSpace: 'pre-wrap',
              wordWrap: 'break-word'
            }}>
              {JSON.stringify(result.data, null, 2)}
            </pre>
          </div>
        ))}
      </div>

      {/* Instructions */}
      <div style={{ marginTop: '30px', padding: '15px', backgroundColor: '#e7f3ff', border: '1px solid #b3d9ff', borderRadius: '5px' }}>
        <h3>📋 Testing Instructions</h3>
        <ol>
          <li>Make sure you have a valid JWT token (get it from login)</li>
          <li>Start with "Get Connected Services" to see current connections</li>
          <li>Use "Get Auth URL" buttons to get OAuth URLs (open in new tab)</li>
          <li>After OAuth flow, use callback endpoints with the authorization code</li>
          <li>Test sync operations after connecting services</li>
          <li>Check responses in the results section below</li>
        </ol>
        <p><strong>Note:</strong> Make sure your backend is running on {import.meta.env.VITE_BACKEND_URL}</p>
      </div>
    </div>
  );
};

// Button styles
const buttonStyle = {
  display: 'block',
  width: '100%',
  margin: '5px 0',
  padding: '10px',
  backgroundColor: '#007bff',
  color: 'white',
  border: 'none',
  borderRadius: '4px',
  cursor: 'pointer'
};

export default CalendarMeetTestPage;