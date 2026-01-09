import React, { useState, useEffect } from 'react';

const CalendarMeetTestPage = () => {
  const [token, setToken] = useState('');
  const [userId, setUserId] = useState('');
  const [results, setResults] = useState({});
  const [loading, setLoading] = useState(false);
  const [connectedServices, setConnectedServices] = useState({});
  const [activeTab, setActiveTab] = useState('overview');
  const [authWindows, setAuthWindows] = useState({});
  const [realTimeData, setRealTimeData] = useState({
    calendars: [],
    events: [],
    meetings: []
  });

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

      // Update real-time data if applicable
      if (endpoint.includes('/calendar/events') && method === 'GET') {
        setRealTimeData(prev => ({ ...prev, events: data.events || [] }));
      } else if (endpoint.includes('/meet/meetings') && method === 'GET') {
        setRealTimeData(prev => ({ ...prev, meetings: data.meetings || [] }));
      } else if (endpoint.includes('/sync-calendars') && method === 'POST') {
        setRealTimeData(prev => ({ ...prev, calendars: data.calendars || [] }));
      }

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

  // Enhanced OAuth Flow Functions
  const startOAuthFlow = async (service) => {
    try {
      const endpoint = `/api/calendar-meet/${service}/auth-url`;
      const result = await makeApiCall(endpoint);
      
      if (result.success && result.authUrl) {
        // Open auth window
        const authWindow = window.open(
          result.authUrl,
          `${service}-oauth`,
          'width=600,height=700,left=100,top=100'
        );
        
        setAuthWindows(prev => ({
          ...prev,
          [service]: authWindow
        }));

        // Poll for completion
        const checkAuth = setInterval(() => {
          if (authWindow.closed) {
            clearInterval(checkAuth);
            handleOAuthCallback(service);
          }
        }, 1000);
      }
    } catch (error) {
      console.error(`OAuth flow failed for ${service}:`, error);
    }
  };

  const handleOAuthCallback = async (service) => {
    const code = prompt(`Enter the authorization code from Google ${service}:`);
    if (code) {
      await makeApiCall(`/api/calendar-meet/${service}/callback`, 'POST', { code });
      // Refresh connected services
      await testConnectedServices();
    }
  };

  // Token Management Tests
  const testConnectedServices = () => makeApiCall('/api/calendar-meet/connected-services').then(data => {
    if (data?.success) {
      setConnectedServices(data.services);
    }
    return data;
  });
  
  const testDisconnectService = (service) => {
    if (window.confirm(`Are you sure you want to disconnect ${service}?`)) {
      makeApiCall(`/api/calendar-meet/disconnect/${service}`, 'DELETE').then(() => {
        testConnectedServices();
      });
    }
  };

  // Calendar Tests
  const testSyncCalendars = () => makeApiCall('/api/calendar-meet/calendar/sync-calendars', 'POST');
  
  const testSyncEvents = () => {
    makeApiCall('/api/calendar-meet/calendar/sync-events', 'POST', {
      calendarId: 'primary',
      maxResults: 50
    });
  };

  const testCreateEvent = () => {
    const eventData = {
      title: 'Test Event from AI Assistant',
      description: 'This event was created automatically via the API test interface',
      startTime: new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString(),
      endTime: new Date(Date.now() + 3 * 60 * 60 * 1000).toISOString(),
      location: 'Virtual Meeting',
      attendees: ['test@example.com'],
      createMeet: true
    };
    
    makeApiCall('/api/calendar-meet/calendar/events', 'POST', {
      calendarId: 'primary',
      eventData
    });
  };

  const testGetEvents = () => makeApiCall('/api/calendar-meet/calendar/events');

  // Meet Tests
  const testCreateMeeting = () => {
    const meetingData = {
      title: 'Instant Team Meeting',
      description: 'Quick sync meeting created via AI Assistant',
      startTime: new Date(Date.now() + 30 * 60 * 1000).toISOString(),
      endTime: new Date(Date.now() + 90 * 60 * 1000).toISOString(),
    };
    
    makeApiCall('/api/calendar-meet/meet/meetings', 'POST', { meetingData });
  };

  const testCreateScheduledMeeting = () => {
    const meetingData = {
      title: 'Scheduled Team Planning',
      description: 'Weekly team planning session with Calendar integration',
      startTime: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
      endTime: new Date(Date.now() + 25 * 60 * 60 * 1000).toISOString(),
      attendees: ['team@company.com', 'manager@company.com']
    };
    
    makeApiCall('/api/calendar-meet/meet/scheduled-meetings', 'POST', { meetingData });
  };

  const testGetMeetings = () => makeApiCall('/api/calendar-meet/meet/meetings');

  // Combined Tests
  const testFullSync = () => makeApiCall('/api/calendar-meet/sync-all', 'POST');

  // Quick Actions
  const quickConnectAll = async () => {
    if (!connectedServices.calendar?.connected) {
      await startOAuthFlow('calendar');
    }
    if (!connectedServices.meet?.connected) {
      await startOAuthFlow('meet');
    }
  };

  // Load connected services on component mount and token change
  useEffect(() => {
    if (token) {
      testConnectedServices();
      testGetEvents();
      testGetMeetings();
    }
  }, [token]);

  // CSS Styles
  const styles = {
    container: {
      padding: '20px',
      fontFamily: 'system-ui, -apple-system, sans-serif',
      maxWidth: '1400px',
      margin: '0 auto',
      backgroundColor: '#f8fafc',
      minHeight: '100vh'
    },
    header: {
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      color: 'white',
      padding: '30px',
      borderRadius: '12px',
      marginBottom: '24px',
      boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)'
    },
    card: {
      backgroundColor: 'white',
      border: '1px solid #e2e8f0',
      borderRadius: '12px',
      padding: '20px',
      marginBottom: '20px',
      boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)'
    },
    button: {
      backgroundColor: '#3b82f6',
      color: 'white',
      border: 'none',
      padding: '12px 16px',
      borderRadius: '8px',
      cursor: 'pointer',
      fontSize: '14px',
      fontWeight: '500',
      transition: 'all 0.2s',
      margin: '4px',
      flex: '1',
      minWidth: '120px'
    },
    buttonSecondary: {
      backgroundColor: '#6b7280',
      color: 'white',
      border: 'none',
      padding: '10px 14px',
      borderRadius: '6px',
      cursor: 'pointer',
      fontSize: '12px',
      transition: 'all 0.2s',
      margin: '2px'
    },
    buttonSuccess: {
      backgroundColor: '#10b981',
      color: 'white',
      border: 'none',
      padding: '12px 16px',
      borderRadius: '8px',
      cursor: 'pointer',
      fontSize: '14px',
      fontWeight: '500',
      transition: 'all 0.2s'
    },
    buttonDanger: {
      backgroundColor: '#ef4444',
      color: 'white',
      border: 'none',
      padding: '8px 12px',
      borderRadius: '6px',
      cursor: 'pointer',
      fontSize: '12px',
      transition: 'all 0.2s'
    },
    tabButton: {
      padding: '12px 24px',
      border: 'none',
      backgroundColor: 'transparent',
      cursor: 'pointer',
      fontSize: '14px',
      fontWeight: '500',
      borderBottom: '3px solid transparent',
      transition: 'all 0.2s'
    },
    tabButtonActive: {
      borderBottom: '3px solid #3b82f6',
      color: '#3b82f6'
    },
    statusIndicator: {
      display: 'inline-block',
      width: '8px',
      height: '8px',
      borderRadius: '50%',
      marginRight: '8px'
    },
    statusConnected: {
      backgroundColor: '#10b981'
    },
    statusDisconnected: {
      backgroundColor: '#ef4444'
    },
    dataItem: {
      padding: '12px',
      border: '1px solid #e2e8f0',
      borderRadius: '8px',
      marginBottom: '8px',
      backgroundColor: '#f8fafc'
    }
  };

  return (
    <div style={styles.container}>
      {/* Header */}
      <div style={styles.header}>
        <h1 style={{ margin: 0, fontSize: '2.5rem', fontWeight: '700' }}>Google Services Integration</h1>
        <p style={{ margin: '8px 0 0 0', opacity: 0.9, fontSize: '1.1rem' }}>
          Test and manage your Google Calendar and Meet integrations
        </p>
      </div>

      {/* Connection Status */}
      <div style={styles.card}>
        <h2 style={{ margin: '0 0 16px 0', color: '#1f2937' }}>Connection Status</h2>
        <div style={{ display: 'flex', gap: '20px', flexWrap: 'wrap' }}>
          {Object.entries(connectedServices).map(([service, data]) => (
            <div key={service} style={{ 
              padding: '16px', 
              border: `2px solid ${data.connected ? '#10b981' : '#ef4444'}`,
              borderRadius: '8px',
              backgroundColor: data.connected ? '#f0fdf4' : '#fef2f2',
              flex: 1,
              minWidth: '200px'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', marginBottom: '8px' }}>
                <div style={{
                  ...styles.statusIndicator,
                  ...(data.connected ? styles.statusConnected : styles.statusDisconnected)
                }}></div>
                <span style={{ 
                  fontWeight: '600', 
                  textTransform: 'capitalize',
                  color: data.connected ? '#065f46' : '#991b1b'
                }}>
                  {service}
                </span>
              </div>
              <div style={{ fontSize: '12px', color: '#6b7280', marginBottom: '12px' }}>
                {data.connected ? 'Connected' : 'Not Connected'}
              </div>
              <div style={{ display: 'flex', gap: '8px' }}>
                {!data.connected ? (
                  <button 
                    onClick={() => startOAuthFlow(service)}
                    style={styles.button}
                    disabled={loading}
                  >
                    Connect
                  </button>
                ) : (
                  <button 
                    onClick={() => testDisconnectService(service)}
                    style={styles.buttonDanger}
                    disabled={loading}
                  >
                    Disconnect
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
        
        <div style={{ marginTop: '16px', display: 'flex', gap: '12px' }}>
          <button 
            onClick={quickConnectAll}
            style={styles.buttonSuccess}
            disabled={loading}
          >
            Connect All Services
          </button>
          <button 
            onClick={testConnectedServices}
            style={styles.buttonSecondary}
            disabled={loading}
          >
            Refresh Status
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: '8px', marginBottom: '20px', borderBottom: '1px solid #e2e8f0' }}>
        {['overview', 'calendar', 'meet', 'api', 'results'].map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            style={{
              ...styles.tabButton,
              ...(activeTab === tab ? styles.tabButtonActive : {})
            }}
          >
            {tab.charAt(0).toUpperCase() + tab.slice(1)}
          </button>
        ))}
      </div>

      {/* Overview Tab */}
      {activeTab === 'overview' && (
        <div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
            {/* Quick Actions */}
            <div style={styles.card}>
              <h3>Quick Actions</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <button onClick={testFullSync} style={styles.button} disabled={loading}>
                  Full Sync All Data
                </button>
                <button onClick={testSyncCalendars} style={styles.button} disabled={loading}>
                  Sync Calendars
                </button>
                <button onClick={testSyncEvents} style={styles.button} disabled={loading}>
                  Sync Events
                </button>
                <button onClick={testCreateEvent} style={styles.button} disabled={loading}>
                  Create Test Event
                </button>
                <button onClick={testCreateMeeting} style={styles.button} disabled={loading}>
                  Create Instant Meeting
                </button>
              </div>
            </div>

            {/* Real-time Data Preview */}
            <div style={styles.card}>
              <h3>Data Preview</h3>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <h4 style={{ fontSize: '14px', margin: '0 0 8px 0' }}>Calendars</h4>
                  <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#3b82f6' }}>
                    {realTimeData.calendars.length}
                  </div>
                </div>
                <div>
                  <h4 style={{ fontSize: '14px', margin: '0 0 8px 0' }}>Events</h4>
                  <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#10b981' }}>
                    {realTimeData.events.length}
                  </div>
                </div>
                <div>
                  <h4 style={{ fontSize: '14px', margin: '0 0 8px 0' }}>Meetings</h4>
                  <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#8b5cf6' }}>
                    {realTimeData.meetings.length}
                  </div>
                </div>
                <div>
                  <h4 style={{ fontSize: '14px', margin: '0 0 8px 0' }}>Connected</h4>
                  <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#f59e0b' }}>
                    {Object.values(connectedServices).filter(s => s.connected).length}/3
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Recent Events */}
          {realTimeData.events.length > 0 && (
            <div style={styles.card}>
              <h3>Recent Events</h3>
              <div style={{ maxHeight: '200px', overflowY: 'auto' }}>
                {realTimeData.events.slice(0, 5).map((event, index) => (
                  <div key={index} style={styles.dataItem}>
                    <div style={{ fontWeight: '600', marginBottom: '4px' }}>{event.title}</div>
                    <div style={{ fontSize: '12px', color: '#6b7280' }}>
                      {new Date(event.start_time).toLocaleString()}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Calendar Tab */}
      {activeTab === 'calendar' && (
        <div style={styles.card}>
          <h3>Calendar Operations</h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '12px' }}>
            <button onClick={() => startOAuthFlow('calendar')} style={styles.button} disabled={loading}>
              Connect Calendar
            </button>
            <button onClick={testSyncCalendars} style={styles.button} disabled={loading}>
              Sync Calendars
            </button>
            <button onClick={testSyncEvents} style={styles.button} disabled={loading}>
              Sync Events
            </button>
            <button onClick={testCreateEvent} style={styles.button} disabled={loading}>
              Create Event
            </button>
            <button onClick={testGetEvents} style={styles.button} disabled={loading}>
              Get Events
            </button>
          </div>
        </div>
      )}

      {/* Meet Tab */}
      {activeTab === 'meet' && (
        <div style={styles.card}>
          <h3>Meet Operations</h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '12px' }}>
            <button onClick={() => startOAuthFlow('meet')} style={styles.button} disabled={loading}>
              Connect Meet
            </button>
            <button onClick={testCreateMeeting} style={styles.button} disabled={loading}>
              Instant Meeting
            </button>
            <button onClick={testCreateScheduledMeeting} style={styles.button} disabled={loading}>
              Scheduled Meeting
            </button>
            <button onClick={testGetMeetings} style={styles.button} disabled={loading}>
              Get Meetings
            </button>
          </div>
        </div>
      )}

      {/* API Tab */}
      {activeTab === 'api' && (
        <div style={styles.card}>
          <h3>API Testing</h3>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
            <div>
              <h4>Calendar APIs</h4>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <button onClick={testCalendarAuthUrl} style={styles.buttonSecondary}>
                  Get Auth URL
                </button>
                <button onClick={() => startOAuthFlow('calendar')} style={styles.buttonSecondary}>
                  Start OAuth Flow
                </button>
                <button onClick={testSyncCalendars} style={styles.buttonSecondary}>
                  Sync Calendars
                </button>
                <button onClick={testSyncEvents} style={styles.buttonSecondary}>
                  Sync Events
                </button>
                <button onClick={testCreateEvent} style={styles.buttonSecondary}>
                  Create Event
                </button>
                <button onClick={testGetEvents} style={styles.buttonSecondary}>
                  Get Events
                </button>
              </div>
            </div>
            <div>
              <h4>Meet APIs</h4>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <button onClick={testMeetAuthUrl} style={styles.buttonSecondary}>
                  Get Auth URL
                </button>
                <button onClick={() => startOAuthFlow('meet')} style={styles.buttonSecondary}>
                  Start OAuth Flow
                </button>
                <button onClick={testCreateMeeting} style={styles.buttonSecondary}>
                  Create Meeting
                </button>
                <button onClick={testCreateScheduledMeeting} style={styles.buttonSecondary}>
                  Scheduled Meeting
                </button>
                <button onClick={testGetMeetings} style={styles.buttonSecondary}>
                  Get Meetings
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Results Tab */}
      {activeTab === 'results' && (
        <div>
          <h3>API Responses</h3>
          {loading && (
            <div style={{
              padding: '16px',
              backgroundColor: '#fff7ed',
              border: '1px solid #fdba74',
              borderRadius: '8px',
              marginBottom: '16px',
              color: '#9a3412'
            }}>
              Loading API response...
            </div>
          )}
          
          {Object.entries(results).map(([endpoint, result]) => (
            <div key={endpoint} style={{
              ...styles.card,
              borderLeft: `4px solid ${result.status === 200 ? '#10b981' : result.status === 'ERROR' ? '#ef4444' : '#f59e0b'}`
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                <div>
                  <strong style={{ 
                    color: result.status === 200 ? '#065f46' : result.status === 'ERROR' ? '#991b1b' : '#92400e'
                  }}>
                    {endpoint}
                  </strong>
                  <span style={{ fontSize: '12px', color: '#6b7280', marginLeft: '8px' }}>
                    Status: {result.status} • {result.timestamp}
                  </span>
                </div>
              </div>
              <pre style={{ 
                backgroundColor: '#f8fafc', 
                padding: '12px', 
                borderRadius: '6px', 
                fontSize: '12px', 
                maxHeight: '300px', 
                overflow: 'auto',
                whiteSpace: 'pre-wrap',
                wordWrap: 'break-word',
                border: '1px solid #e2e8f0'
              }}>
                {JSON.stringify(result.data, null, 2)}
              </pre>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default CalendarMeetTestPage;