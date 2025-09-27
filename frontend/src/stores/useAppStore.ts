import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface User {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  role: string;
  department: string;
}

interface Task {
  id: string;
  title: string;
  description: string;
  status: 'todo' | 'in-progress' | 'review' | 'done';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  assignee: string;
  dueDate: string;
  tags: string[];
  createdAt: string;
  updatedAt: string;
}

interface Meeting {
  id: string;
  title: string;
  description: string;
  startTime: string;
  endTime: string;
  attendees: string[];
  status: 'upcoming' | 'ongoing' | 'completed';
  location: string;
  meetingUrl?: string;
  agenda?: string[];
  summary?: string;
}

interface Email {
  id: string;
  from: string;
  to: string[];
  subject: string;
  body: string;
  timestamp: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  status: 'unread' | 'read' | 'replied' | 'archived';
  attachments?: string[];
  sentiment?: 'positive' | 'neutral' | 'negative';
}

interface WellnessData {
  date: string;
  wellnessScore: number;
  mood: 'great' | 'good' | 'okay' | 'stressed' | 'exhausted';
  stressLevel: number;
  energyLevel: number;
  focusTime: number;
  breaks: number;
  suggestions: string[];
}

interface AppState {
  // User
  user: User | null;
  setUser: (user: User) => void;
  
  // Navigation
  sidebarCollapsed: boolean;
  setSidebarCollapsed: (collapsed: boolean) => void;
  currentPage: string;
  setCurrentPage: (page: string) => void;
  
  // Tasks
  tasks: Task[];
  addTask: (task: Omit<Task, 'id' | 'createdAt' | 'updatedAt'>) => void;
  updateTask: (id: string, updates: Partial<Task>) => void;
  deleteTask: (id: string) => void;
  
  // Meetings
  meetings: Meeting[];
  addMeeting: (meeting: Omit<Meeting, 'id'>) => void;
  updateMeeting: (id: string, updates: Partial<Meeting>) => void;
  
  // Emails
  emails: Email[];
  addEmail: (email: Omit<Email, 'id'>) => void;
  updateEmail: (id: string, updates: Partial<Email>) => void;
  
  // Wellness
  wellnessData: WellnessData[];
  addWellnessData: (data: WellnessData) => void;
  
  // UI State
  notifications: Array<{
    id: string;
    title: string;
    message: string;
    type: 'info' | 'success' | 'warning' | 'error';
    timestamp: string;
    read: boolean;
  }>;
  addNotification: (notification: Omit<AppState['notifications'][0], 'id' | 'timestamp' | 'read'>) => void;
  markNotificationRead: (id: string) => void;
}

export const useAppStore = create<AppState>()(
  persist(
    (set, get) => ({
      // User
      user: {
        id: '1',
        name: 'Alex Johnson',
        email: 'alex.johnson@company.com',
        avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face',
        role: 'Senior Product Manager',
        department: 'Product'
      },
      setUser: (user) => set({ user }),
      
      // Navigation
      sidebarCollapsed: false,
      setSidebarCollapsed: (collapsed) => set({ sidebarCollapsed: collapsed }),
      currentPage: 'dashboard',
      setCurrentPage: (page) => set({ currentPage: page }),
      
      // Tasks
      tasks: [
        {
          id: '1',
          title: 'Review Q4 Product Roadmap',
          description: 'Analyze and approve the Q4 product roadmap with engineering team',
          status: 'in-progress',
          priority: 'high',
          assignee: 'Alex Johnson',
          dueDate: '2024-01-15',
          tags: ['product', 'roadmap', 'q4'],
          createdAt: '2024-01-10T09:00:00Z',
          updatedAt: '2024-01-12T14:30:00Z'
        },
        {
          id: '2',
          title: 'Prepare User Research Presentation',
          description: 'Create presentation slides for user research findings',
          status: 'todo',
          priority: 'medium',
          assignee: 'Alex Johnson',
          dueDate: '2024-01-18',
          tags: ['research', 'presentation'],
          createdAt: '2024-01-10T11:00:00Z',
          updatedAt: '2024-01-10T11:00:00Z'
        },
        {
          id: '3',
          title: 'Code Review - Authentication Module',
          description: 'Review and approve authentication module implementation',
          status: 'review',
          priority: 'urgent',
          assignee: 'Alex Johnson',
          dueDate: '2024-01-14',
          tags: ['code-review', 'security'],
          createdAt: '2024-01-09T16:00:00Z',
          updatedAt: '2024-01-13T10:15:00Z'
        }
      ],
      addTask: (taskData) => {
        const newTask: Task = {
          ...taskData,
          id: Date.now().toString(),
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        };
        set((state) => ({ tasks: [...state.tasks, newTask] }));
      },
      updateTask: (id, updates) => set((state) => ({
        tasks: state.tasks.map(task => 
          task.id === id ? { ...task, ...updates, updatedAt: new Date().toISOString() } : task
        )
      })),
      deleteTask: (id) => set((state) => ({
        tasks: state.tasks.filter(task => task.id !== id)
      })),
      
      // Meetings
      meetings: [
        {
          id: '1',
          title: 'Weekly Product Sync',
          description: 'Weekly sync with product team to discuss progress and blockers',
          startTime: '2024-01-15T10:00:00Z',
          endTime: '2024-01-15T11:00:00Z',
          attendees: ['Alex Johnson', 'Sarah Chen', 'Mike Rodriguez'],
          status: 'upcoming',
          location: 'Conference Room A',
          meetingUrl: 'https://meet.google.com/abc-defg-hij',
          agenda: ['Review last week progress', 'Discuss Q4 roadmap', 'Address blockers']
        },
        {
          id: '2',
          title: 'User Research Review',
          description: 'Review findings from recent user research study',
          startTime: '2024-01-16T14:00:00Z',
          endTime: '2024-01-16T15:30:00Z',
          attendees: ['Alex Johnson', 'Emma Davis', 'Lisa Wong'],
          status: 'upcoming',
          location: 'Virtual',
          meetingUrl: 'https://zoom.us/j/1234567890',
          agenda: ['Present research findings', 'Discuss implications', 'Plan next steps']
        }
      ],
      addMeeting: (meetingData) => {
        const newMeeting: Meeting = {
          ...meetingData,
          id: Date.now().toString()
        };
        set((state) => ({ meetings: [...state.meetings, newMeeting] }));
      },
      updateMeeting: (id, updates) => set((state) => ({
        meetings: state.meetings.map(meeting => 
          meeting.id === id ? { ...meeting, ...updates } : meeting
        )
      })),
      
      // Emails
      emails: [
        {
          id: '1',
          from: 'sarah.chen@company.com',
          to: ['alex.johnson@company.com'],
          subject: 'Q4 Roadmap Updates - Action Required',
          body: 'Hi Alex, I need your review on the updated Q4 roadmap. The engineering team has made some adjustments to the timeline. Can you please review and provide feedback by EOD?',
          timestamp: '2024-01-13T09:30:00Z',
          priority: 'high',
          status: 'unread',
          sentiment: 'neutral'
        },
        {
          id: '2',
          from: 'mike.rodriguez@company.com',
          to: ['alex.johnson@company.com', 'team@company.com'],
          subject: 'Great work on the user research!',
          body: 'Team, fantastic job on the user research presentation. The insights are very valuable and will help guide our product decisions. Looking forward to implementing these findings.',
          timestamp: '2024-01-12T16:45:00Z',
          priority: 'medium',
          status: 'read',
          sentiment: 'positive'
        },
        {
          id: '3',
          from: 'security@company.com',
          to: ['alex.johnson@company.com'],
          subject: 'URGENT: Security Review Required',
          body: 'Alex, we need your immediate attention on the authentication module security review. There are some critical issues that need to be addressed before deployment.',
          timestamp: '2024-01-13T14:20:00Z',
          priority: 'urgent',
          status: 'unread',
          sentiment: 'negative'
        }
      ],
      addEmail: (emailData) => {
        const newEmail: Email = {
          ...emailData,
          id: Date.now().toString()
        };
        set((state) => ({ emails: [...state.emails, newEmail] }));
      },
      updateEmail: (id, updates) => set((state) => ({
        emails: state.emails.map(email => 
          email.id === id ? { ...email, ...updates } : email
        )
      })),
      
      // Wellness
      wellnessData: [
        {
          date: '2024-01-13',
          wellnessScore: 75,
          mood: 'good',
          stressLevel: 3,
          energyLevel: 7,
          focusTime: 6.5,
          breaks: 4,
          suggestions: ['Take a 10-minute walk', 'Practice deep breathing', 'Hydrate more']
        },
        {
          date: '2024-01-12',
          wellnessScore: 82,
          mood: 'great',
          stressLevel: 2,
          energyLevel: 8,
          focusTime: 7.2,
          breaks: 5,
          suggestions: ['Keep up the good work!', 'Consider meditation', 'Maintain sleep schedule']
        }
      ],
      addWellnessData: (data) => set((state) => ({
        wellnessData: [...state.wellnessData, data]
      })),
      
      // Notifications
      notifications: [
        {
          id: '1',
          title: 'Meeting reminder',
          message: 'Weekly Product Sync starts in 15 minutes',
          type: 'info',
          timestamp: '2024-01-15T09:45:00Z',
          read: false
        },
        {
          id: '2',
          title: 'Task overdue',
          message: 'Code Review - Authentication Module is overdue',
          type: 'warning',
          timestamp: '2024-01-14T09:00:00Z',
          read: false
        }
      ],
      addNotification: (notificationData) => {
        const newNotification = {
          ...notificationData,
          id: Date.now().toString(),
          timestamp: new Date().toISOString(),
          read: false
        };
        set((state) => ({ 
          notifications: [newNotification, ...state.notifications] 
        }));
      },
      markNotificationRead: (id) => set((state) => ({
        notifications: state.notifications.map(notification => 
          notification.id === id ? { ...notification, read: true } : notification
        )
      }))
    }),
    {
      name: 'ai-employee-assistant-storage',
      partialize: (state) => ({
        user: state.user,
        sidebarCollapsed: state.sidebarCollapsed,
        tasks: state.tasks,
        meetings: state.meetings,
        emails: state.emails,
        wellnessData: state.wellnessData,
        notifications: state.notifications
      })
    }
  )
);