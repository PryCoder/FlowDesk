// routes/meetings.js
import express from 'express';
import multer from 'multer';
import dayjs from 'dayjs';
import * as chrono from 'chrono-node';
import fs from 'fs';

import meetingService from '../services/meetingService.js';
import integrationService from '../services/integrationService.js';
import authService from '../services/authService.js';

const router = express.Router();
const upload = multer({ dest: 'uploads/' });

// -------------------- Middleware: Authenticate -------------------- //
const authenticate = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) return res.status(401).json({ error: 'No token provided' });

    const decoded = await authService.verifyToken(token);
    req.user = decoded;
    next();
  } catch (error) {
    res.status(401).json({ error: 'Invalid token' });
  }
};

// -------------------- Helper: Smart Scheduling -------------------- //
const findAvailableTime = async (userId, proposedTime) => {
  try {
    const userMeetings = await meetingService.getUserMeetings(userId, {
      dateFrom: dayjs().toISOString(),
      type: 'upcoming'
    });

    const proposedStart = dayjs(proposedTime);
    const proposedEnd = proposedStart.add(1, 'hour'); // Default 1-hour meeting

    const hasConflict = userMeetings.some(meeting => {
      const meetingStart = dayjs(meeting.scheduled_start);
      const meetingEnd = dayjs(meeting.scheduled_end);
      
      return (
        (proposedStart.isAfter(meetingStart) && proposedStart.isBefore(meetingEnd)) ||
        (proposedEnd.isAfter(meetingStart) && proposedEnd.isBefore(meetingEnd)) ||
        (proposedStart.isBefore(meetingStart) && proposedEnd.isAfter(meetingEnd))
      );
    });

    return hasConflict ? null : proposedTime;
  } catch (error) {
    console.error('findAvailableTime error:', error);
    return proposedTime; // Fallback to proposed time if check fails
  }
};

// -------------------- Get Company Employees for Meetings -------------------- //
router.get('/company/employees', authenticate, async (req, res) => {
  try {
    const { search = '', department = '', limit = 100 } = req.query;
    
    const employees = await authService.getCompanyEmployees(
      req.user.companyId,
      1, // page
      parseInt(limit),
      search,
      department
    );

    res.json({
      success: true,
      employees: employees.employees || [],
      total: employees.total || 0,
      message: `Found ${employees.employees?.length || 0} employees`
    });
  } catch (error) {
    console.error('Get company employees error:', error);
    res.status(400).json({ error: error.message });
  }
});

// -------------------- Get User Meetings (Sender & Receiver) -------------------- //
router.get('/', authenticate, async (req, res) => {
  try {
    const {
      dateFrom,
      dateTo,
      status,
      limit = 50,
      type = 'all'
    } = req.query;

    const options = { 
      limit: parseInt(limit),
      type,
      status 
    };

    if (dateFrom) options.dateFrom = dateFrom;
    if (dateTo) options.dateTo = dateTo;

    const meetings = await meetingService.getUserMeetings(req.user.userId, options);

    res.json({
      success: true,
      meetings,
      count: meetings.length,
      message: `Found ${meetings.length} meetings`
    });
  } catch (error) {
    console.error('Get meetings error:', error);
    res.status(400).json({ error: error.message });
  }
});

// -------------------- Get Specific Meeting -------------------- //
router.get('/:meetingId', authenticate, async (req, res) => {
  try {
    const meeting = await meetingService.getMeetingById(
      req.params.meetingId, 
      req.user.userId
    );

    // Get employee details for participants
    if (meeting.participants && meeting.participants.length > 0) {
      const employees = await authService.getEmployeesByIds(meeting.participants);
      meeting.participantDetails = employees;
    }

    res.json({
      success: true,
      meeting,
      userRole: meeting.created_by === req.user.userId ? 'creator' : 'participant'
    });
  } catch (error) {
    console.error('Get meeting error:', error);
    res.status(error.message.includes('Access denied') ? 403 : 400).json({ error: error.message });
  }
});

// -------------------- Create Meeting with Company Employees -------------------- //
router.post('/', authenticate, async (req, res) => {
  try {
    const meetingData = { 
      ...req.body, 
      companyId: req.user.companyId,
      created_by: req.user.userId
    };

    // Validate participants are from the same company
    if (meetingData.participants && meetingData.participants.length > 0) {
      const companyEmployees = await authService.getCompanyEmployees(req.user.companyId, 1, 1000);
      const validEmployeeIds = companyEmployees.employees.map(emp => emp.id);
      
      const invalidParticipants = meetingData.participants.filter(
        participantId => !validEmployeeIds.includes(participantId)
      );

      if (invalidParticipants.length > 0) {
        return res.status(400).json({ 
          error: `Invalid participants: ${invalidParticipants.join(', ')}. All participants must be from your company.` 
        });
      }
    }

    // Smart scheduling
    const proposedStart = chrono.parseDate(
      req.body.timePhrase || req.body.scheduled_start
    );
    
    if (!proposedStart) {
      return res.status(400).json({ error: 'Invalid meeting time provided' });
    }

    const availableTime = await findAvailableTime(req.user.userId, proposedStart);
    if (!availableTime) {
      return res.status(409).json({ error: 'Scheduling conflict detected. Try another time.' });
    }

    meetingData.scheduled_start = availableTime;

    // Set default duration if not provided
    if (!meetingData.scheduled_end) {
      const endTime = new Date(availableTime);
      endTime.setHours(endTime.getHours() + 1);
      meetingData.scheduled_end = endTime.toISOString();
    }

    // Generate Jitsi link
    meetingData.video_link = `https://meet.jit.si/${encodeURIComponent(
      meetingData.title.replace(/\s+/g, '-')
    )}-${Date.now()}`;

    let googleCalendarResult = null;

    // Google Calendar integration
    if (req.user.googleAccessToken && req.body.addToCalendar !== false) {
      try {
        // Prepare attendees from company employees
        const attendees = [];
        if (meetingData.participants && meetingData.participants.length > 0) {
          const employees = await authService.getEmployeesByIds(meetingData.participants);
          
          employees.forEach(employee => {
            if (employee && employee.email) {
              attendees.push({
                email: employee.email,
                displayName: `${employee.first_name} ${employee.last_name}`
              });
            }
          });
        }

        googleCalendarResult = await integrationService.addToGoogleCalendar(
          meetingData,
          req.user.googleAccessToken,
          {
            attendees,
            createMeet: req.body.createGoogleMeet !== false,
            sendUpdates: 'all'
          }
        );

        if (googleCalendarResult.ok) {
          meetingData.google_calendar_event_id = googleCalendarResult.eventId;
          if (googleCalendarResult.hangoutLink) {
            meetingData.video_link = googleCalendarResult.hangoutLink;
          }
        } else {
          console.warn('Google Calendar sync failed:', googleCalendarResult.error);
        }
      } catch (calendarError) {
        console.warn('Google Calendar integration error:', calendarError);
        // Continue with meeting creation even if calendar fails
      }
    }

    const meeting = await meetingService.createMeeting(meetingData, req.user.userId);

    // Send notifications to participants using company employee data
    if (meetingData.participants && meetingData.participants.length > 0) {
      try {
        const employees = await authService.getEmployeesByIds(meetingData.participants);

        for (const employee of employees) {
          if (employee) {
            await integrationService.sendNotification(
              employee,
              `Meeting Invitation: ${meeting.title}`,
              `You have been invited to a meeting:\n\n` +
              `Title: ${meeting.title}\n` +
              `Date: ${dayjs(meeting.scheduled_start).format('MMM D, YYYY [at] h:mm A')}\n` +
              `Duration: 1 hour\n` +
              `Organizer: ${req.user.firstName} ${req.user.lastName}\n\n` +
              `Join: ${meeting.video_link}\n\n` +
              `Description: ${meeting.description || 'No description provided'}\n\n` +
              `Agenda: ${meeting.agenda?.join(', ') || 'No agenda provided'}`,
              {
                meetingId: meeting.id,
                type: 'meeting_invite',
                priority: 'high'
              }
            );

            // Send calendar invite via email if integration available
            if (integrationService.sendEmailInvite) {
              await integrationService.sendEmailInvite(
                employee.email,
                meeting,
                req.user
              );
            }
          }
        }
      } catch (notificationError) {
        console.warn('Participant notification error:', notificationError);
      }
    }

    res.status(201).json({
      success: true,
      meeting,
      googleCalendar: googleCalendarResult,
      message: 'Meeting created successfully with notifications sent to participants'
    });
  } catch (error) {
    console.error('Create meeting error:', error);
    res.status(400).json({ error: error.message });
  }
});

// -------------------- Add Participants with Company Employee Validation -------------------- //
router.post('/:meetingId/participants', authenticate, async (req, res) => {
  try {
    const { participants = [] } = req.body;

    if (!Array.isArray(participants) || participants.length === 0) {
      return res.status(400).json({ error: 'Participants array required' });
    }

    // Get company employees and validate
    const companyEmployees = await authService.getCompanyEmployees(req.user.companyId, 1, 1000);
    const validEmployeeIds = companyEmployees.employees.map(emp => emp.id);
    
    const validParticipants = participants.filter(participantId => 
      validEmployeeIds.includes(participantId)
    );

    if (validParticipants.length === 0) {
      return res.status(400).json({ error: 'No valid company employees found' });
    }

    // Add participants to meeting
    const updatedMeeting = await meetingService.addMeetingParticipants(
      req.params.meetingId,
      validParticipants
    );

    // Get employee details for notifications
    const employees = await authService.getEmployeesByIds(validParticipants);

    // Send notifications to new participants
    for (const employee of employees) {
      if (employee) {
        await integrationService.sendNotification(
          employee,
          `Added to Meeting: ${updatedMeeting.title}`,
          `You have been added to a meeting:\n\n` +
          `Title: ${updatedMeeting.title}\n` +
          `Date: ${dayjs(updatedMeeting.scheduled_start).format('MMM D, YYYY [at] h:mm A')}\n` +
          `Organizer: ${req.user.firstName} ${req.user.lastName}\n\n` +
          `Join: ${updatedMeeting.video_link}\n\n` +
          `Description: ${updatedMeeting.description || 'No description provided'}`,
          {
            meetingId: updatedMeeting.id,
            type: 'meeting_added',
            priority: 'medium'
          }
        );

        // Update Google Calendar event if exists
        if (updatedMeeting.google_calendar_event_id && req.user.googleAccessToken) {
          try {
            await integrationService.updateGoogleCalendarEvent(
              updatedMeeting.google_calendar_event_id,
              updatedMeeting,
              req.user.googleAccessToken,
              {
                attendees: [{
                  email: employee.email,
                  displayName: `${employee.first_name} ${employee.last_name}`
                }],
                sendUpdates: 'all'
              }
            );
          } catch (calendarError) {
            console.warn('Google Calendar update error:', calendarError);
          }
        }
      }
    }

    res.json({
      success: true,
      meeting: updatedMeeting,
      addedParticipants: employees,
      message: `Added ${employees.length} participants and sent notifications`
    });
  } catch (error) {
    console.error('Add participants error:', error);
    res.status(400).json({ error: error.message });
  }
});

// -------------------- Get Available Company Employees for Meeting -------------------- //
router.get('/:meetingId/available-participants', authenticate, async (req, res) => {
  try {
    const { search = '', department = '' } = req.query;
    
    const employees = await authService.getCompanyEmployees(
      req.user.companyId,
      1,
      100,
      search,
      department
    );

    // Get current meeting to exclude already added participants
    const currentMeeting = await meetingService.getMeetingById(
      req.params.meetingId,
      req.user.userId
    );

    const currentParticipantIds = currentMeeting.participants || [];
    const availableEmployees = employees.employees.filter(
      emp => !currentParticipantIds.includes(emp.id) && emp.id !== req.user.userId
    );

    res.json({
      success: true,
      employees: availableEmployees,
      count: availableEmployees.length
    });
  } catch (error) {
    console.error('Get available participants error:', error);
    res.status(400).json({ error: error.message });
  }
});

// -------------------- Bulk Meeting Invitations -------------------- //
router.post('/:meetingId/bulk-invite', authenticate, async (req, res) => {
  try {
    const { department, role, customList = [] } = req.body;

    let employeeIds = [];

    if (department) {
      // Invite entire department
      const departmentEmployees = await authService.getCompanyEmployees(
        req.user.companyId,
        1,
        1000,
        '',
        department
      );
      employeeIds = departmentEmployees.employees.map(emp => emp.id);
    } else if (role) {
      // Invite by role
      const roleEmployees = await authService.getUsers({
        companyId: req.user.companyId,
        role: role,
        limit: 1000
      });
      employeeIds = roleEmployees.users.map(emp => emp.id);
    } else if (customList.length > 0) {
      // Custom list of employees
      employeeIds = customList;
    }

    if (employeeIds.length === 0) {
      return res.status(400).json({ error: 'No employees found for the specified criteria' });
    }

    // Remove duplicates and current user
    employeeIds = [...new Set(employeeIds)].filter(id => id !== req.user.userId);

    // Add participants to meeting
    const updatedMeeting = await meetingService.addMeetingParticipants(
      req.params.meetingId,
      employeeIds
    );

    // Get employee details for notifications
    const employees = await authService.getEmployeesByIds(employeeIds);

    // Send bulk notifications
    for (const employee of employees) {
      if (employee) {
        await integrationService.sendNotification(
          employee,
          `Meeting Invitation: ${updatedMeeting.title}`,
          `You have been invited to a meeting:\n\n` +
          `Title: ${updatedMeeting.title}\n` +
          `Date: ${dayjs(updatedMeeting.scheduled_start).format('MMM D, YYYY [at] h:mm A')}\n` +
          `Organizer: ${req.user.firstName} ${req.user.lastName}\n\n` +
          `Join: ${updatedMeeting.video_link}`,
          {
            meetingId: updatedMeeting.id,
            type: 'meeting_invite',
            priority: 'high'
          }
        );
      }
    }

    res.json({
      success: true,
      meeting: updatedMeeting,
      invitedCount: employees.length,
      message: `Sent ${employees.length} meeting invitations successfully`
    });
  } catch (error) {
    console.error('Bulk invite error:', error);
    res.status(400).json({ error: error.message });
  }
});

// -------------------- Meeting Reminders -------------------- //
router.post('/:meetingId/reminders', authenticate, async (req, res) => {
  try {
    const { reminderType = '15min' } = req.body; // 15min, 1hour, 1day
    
    const meeting = await meetingService.getMeetingById(
      req.params.meetingId,
      req.user.userId
    );

    if (meeting.created_by !== req.user.userId) {
      return res.status(403).json({ error: 'Only meeting creator can send reminders' });
    }

    const employees = await authService.getEmployeesByIds(meeting.participants || []);

    let reminderMessage = '';
    let reminderTime = '';

    switch (reminderType) {
      case '15min':
        reminderMessage = `Reminder: Meeting "${meeting.title}" starts in 15 minutes`;
        reminderTime = '15 minutes';
        break;
      case '1hour':
        reminderMessage = `Reminder: Meeting "${meeting.title}" starts in 1 hour`;
        reminderTime = '1 hour';
        break;
      case '1day':
        reminderMessage = `Reminder: Meeting "${meeting.title}" is scheduled for tomorrow`;
        reminderTime = '1 day';
        break;
      default:
        reminderMessage = `Reminder: Upcoming meeting "${meeting.title}"`;
    }

    // Send reminders to all participants
    for (const employee of employees) {
      if (employee) {
        await integrationService.sendNotification(
          employee,
          reminderMessage,
          `Meeting: ${meeting.title}\n` +
          `Time: ${dayjs(meeting.scheduled_start).format('MMM D, YYYY [at] h:mm A')}\n` +
          `Join: ${meeting.video_link}\n\n` +
          `This is a ${reminderTime} reminder.`,
          {
            meetingId: meeting.id,
            type: 'meeting_reminder',
            priority: 'medium'
          }
        );
      }
    }

    res.json({
      success: true,
      message: `Reminders sent to ${employees.length} participants`,
      reminderType,
      sentCount: employees.length
    });
  } catch (error) {
    console.error('Send reminders error:', error);
    res.status(400).json({ error: error.message });
  }
});

// -------------------- Get Meeting Participant Analytics -------------------- //
router.get('/:meetingId/analytics', authenticate, async (req, res) => {
  try {
    const meeting = await meetingService.getMeetingById(
      req.params.meetingId,
      req.user.userId
    );

    const employees = await authService.getEmployeesByIds(meeting.participants || []);

    // Group participants by department
    const departmentStats = employees.reduce((acc, employee) => {
      const dept = employee.department || 'Unknown';
      acc[dept] = (acc[dept] || 0) + 1;
      return acc;
    }, {});

    // Get participant roles distribution
    const roleStats = employees.reduce((acc, employee) => {
      const role = employee.role || 'employee';
      acc[role] = (acc[role] || 0) + 1;
      return acc;
    }, {});

    res.json({
      success: true,
      analytics: {
        totalParticipants: employees.length,
        departments: departmentStats,
        roles: roleStats,
        participantDetails: employees.map(emp => ({
          id: emp.id,
          name: `${emp.first_name} ${emp.last_name}`,
          email: emp.email,
          department: emp.department,
          role: emp.role,
          position: emp.position
        }))
      }
    });
  } catch (error) {
    console.error('Get meeting analytics error:', error);
    res.status(400).json({ error: error.message });
  }
});

// -------------------- Suggest Free Times -------------------- //
router.get('/assistant/suggest-time', authenticate, async (req, res) => {
  try {
    const { date = new Date().toISOString() } = req.query;
    
    const meetings = await meetingService.getUserMeetings(req.user.userId, {
      dateFrom: new Date().toISOString(),
      type: 'upcoming'
    });

    const slots = await meetingService.findOpenSlots(meetings, new Date(date));
    
    const formattedSlots = slots.map(slot => 
      dayjs(slot).format('YYYY-MM-DD HH:mm')
    );

    res.json({ 
      success: true, 
      suggestions: formattedSlots,
      count: formattedSlots.length
    });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// -------------------- AI Pre-Meeting Brief -------------------- //
router.get('/:meetingId/brief', authenticate, async (req, res) => {
  try {
    const meeting = await meetingService.getMeetingById(req.params.meetingId);

    // Get participant details for the brief
    const employees = await authService.getEmployeesByIds(meeting.participants || []);

    const briefPrompt = `
Create a concise pre-meeting brief for: "${meeting.title}".

Meeting Details:
- Scheduled: ${dayjs(meeting.scheduled_start).format('MMM D, YYYY [at] h:mm A')}
- Description: ${meeting.description || 'No description provided'}
- Agenda: ${meeting.agenda?.join(', ') || 'No agenda provided'}

Participants (${employees.length}):
${employees.map(emp => `- ${emp.first_name} ${emp.last_name} (${emp.position || emp.role})${emp.department ? ` - ${emp.department}` : ''}`).join('\n')}

Previous Action Items: ${meeting.action_items?.map(item => item.task).join(', ') || 'None'}

Please provide a brief that includes:
1. Key objectives
2. Important participants and their roles
3. Previous action items to follow up on
4. Any critical context from previous meetings
`;

    const brief = await integrationService.generateWithOllama(briefPrompt);

    res.json({ success: true, brief });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// -------------------- Process Transcript -------------------- //
router.post('/:meetingId/process', authenticate, async (req, res) => {
  try {
    const { transcript, options = {} } = req.body;
    if (!transcript) return res.status(400).json({ error: 'Transcript required' });

    const result = await meetingService.processMeetingTranscript(
      req.params.meetingId,
      transcript,
      {
        ...options,
        companyId: req.user.companyId
      }
    );

    // Optional: emit socket.io event if available
    const io = req.app.get('io');
    if (io) {
      io.to(req.user.companyId).emit('meeting_processed', {
        meetingId: req.params.meetingId,
        analysis: result.analysis,
      });
    }

    const meeting = await meetingService.getMeetingById(req.params.meetingId);

    // Notify participants about processed meeting
    if (meeting.participants && meeting.participants.length > 0) {
      const employees = await authService.getEmployeesByIds(meeting.participants);
      
      for (const employee of employees) {
        if (employee) {
          await integrationService.sendNotification(
            employee,
            `Meeting Summary: "${meeting.title}"`,
            'The meeting transcript has been processed and summary is now available.',
            {
              meetingId: meeting.id,
              type: 'meeting_processed'
            }
          );
        }
      }
    }

    res.json({
      success: true,
      ...result,
      message: 'Transcript processed and summary saved',
    });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// -------------------- Upload Audio and Transcribe -------------------- //
router.post('/:meetingId/audio', authenticate, upload.single('audio'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'Audio file required' });

    const transcript = await integrationService.transcribeAudio(req.file.path);

    const result = await meetingService.processMeetingTranscript(
      req.params.meetingId,
      transcript,
      {
        companyId: req.user.companyId,
        createTasksFromActions: true
      }
    );

    // Clean up uploaded file
    try {
      fs.unlinkSync(req.file.path);
    } catch (cleanupError) {
      console.warn('Failed to clean up audio file:', cleanupError.message);
    }

    res.json({ success: true, transcript, ...result });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// -------------------- Summarize Meeting -------------------- //
router.post('/:meetingId/summarize', authenticate, async (req, res) => {
  try {
    const meeting = await meetingService.getMeetingById(req.params.meetingId);
    const transcript = meeting.transcript || req.body.transcript;

    if (!transcript) {
      return res.status(400).json({ error: 'No transcript available for summarization' });
    }

    const summaryPrompt = `
Summarize this meeting transcript briefly, list 3 key decisions and 3 action items:

Meeting: ${meeting.title}
Participants: ${meeting.participants?.length || 0} attendees
Transcript:
${transcript}

Please provide:
1. A concise summary (2-3 paragraphs)
2. 3 key decisions made
3. 3 action items with owners
`;

    const summary = await integrationService.generateWithOllama(summaryPrompt);

    // Update meeting with generated summary if not already present
    if (!meeting.summary) {
      await meetingService.updateMeeting(meeting.id, { summary });
    }

    res.json({ success: true, summary });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// -------------------- Update Meeting -------------------- //
router.put('/:meetingId', authenticate, async (req, res) => {
  try {
    const updates = req.body;
    
    // Verify user has access to this meeting
    const currentMeeting = await meetingService.getMeetingById(
      req.params.meetingId,
      req.user.userId
    );

    const updatedMeeting = await meetingService.updateMeeting(
      req.params.meetingId,
      updates
    );

    // Notify participants about meeting updates
    if (updates.scheduled_start || updates.title || updates.description) {
      const employees = await authService.getEmployeesByIds(updatedMeeting.participants || []);
      
      for (const employee of employees) {
        if (employee) {
          await integrationService.sendNotification(
            employee,
            `Meeting Updated: ${updatedMeeting.title}`,
            `The meeting has been updated:\n\n` +
            `New Time: ${dayjs(updatedMeeting.scheduled_start).format('MMM D, YYYY [at] h:mm A')}\n` +
            `Join: ${updatedMeeting.video_link}\n\n` +
            `Please check the meeting details for changes.`,
            {
              meetingId: updatedMeeting.id,
              type: 'meeting_updated'
            }
          );
        }
      }
    }

    // Update Google Calendar if event exists and user has token
    if (currentMeeting.google_calendar_event_id && req.user.googleAccessToken) {
      try {
        await integrationService.updateGoogleCalendarEvent(
          currentMeeting.google_calendar_event_id,
          updatedMeeting,
          req.user.googleAccessToken
        );
      } catch (calendarError) {
        console.warn('Google Calendar update failed:', calendarError);
      }
    }

    res.json({
      success: true,
      meeting: updatedMeeting,
      message: 'Meeting updated successfully'
    });
  } catch (error) {
    console.error('Update meeting error:', error);
    res.status(400).json({ error: error.message });
  }
});

// -------------------- Delete Meeting -------------------- //
router.delete('/:meetingId', authenticate, async (req, res) => {
  try {
    // Verify user has access to this meeting
    const meeting = await meetingService.getMeetingById(
      req.params.meetingId,
      req.user.userId
    );

    // Check if user is the creator
    if (meeting.created_by !== req.user.userId) {
      return res.status(403).json({ error: 'Only meeting creator can delete the meeting' });
    }

    // Notify participants about meeting cancellation
    const employees = await authService.getEmployeesByIds(meeting.participants || []);
    
    for (const employee of employees) {
      if (employee) {
        await integrationService.sendNotification(
          employee,
          `Meeting Cancelled: ${meeting.title}`,
          `The meeting scheduled for ${dayjs(meeting.scheduled_start).format('MMM D, YYYY [at] h:mm A')} has been cancelled.`,
          {
            meetingId: meeting.id,
            type: 'meeting_cancelled'
          }
        );
      }
    }

    await meetingService.deleteMeeting(req.params.meetingId);

    res.json({
      success: true,
      message: 'Meeting deleted successfully and participants notified'
    });
  } catch (error) {
    console.error('Delete meeting error:', error);
    res.status(400).json({ error: error.message });
  }
});

// -------------------- Assistant Overview -------------------- //
router.get('/assistant/overview', authenticate, async (req, res) => {
  try {
    const tasks = await meetingService.getPendingTasks(req.user.userId);
    const nextMeeting = await meetingService.getNextMeeting(req.user.userId);

    res.json({
      success: true,
      overview: {
        nextMeeting,
        pendingTasks: tasks.length,
        upcomingMeetings: (await meetingService.getUserMeetings(req.user.userId, { 
          type: 'upcoming', 
          limit: 5 
        })).length,
        note: `You have ${tasks.length} tasks pending. Next meeting: ${
          nextMeeting?.title || 'none scheduled'
        }.`,
      },
    });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

export default router;