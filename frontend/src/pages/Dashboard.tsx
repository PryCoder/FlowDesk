import React, { useEffect, useState } from "react";
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Calendar, Mail, CheckSquare, TrendingUp, Clock, Users, Zap, Brain, 
  Lightbulb, Bot, Sparkles, ArrowRight, MessageCircle, Briefcase, 
  CheckSquareIcon, Loader2, Bell, Inbox, FileText, BarChart3, 
  Target, Rocket, Shield, Database, Cpu, Globe, Smartphone,
  Tablet, Laptop, Monitor, Wifi, Cloud, Server, Code, Palette,
  Music, Camera, Video, Map, Heart, Star, Crown, Coffee,
  Moon, Sun, CloudRain, CloudSnow, Wind
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useNavigate } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';

interface User {
  id: number;
  email: string;
  first_name: string;
  last_name: string;
  full_name?: string;
  role: string;
  department?: string;
  work_style?: string;
  skills?: string[];
  enable_2fa?: boolean;
  hire_date?: string;
  last_login?: string;
  company_id?: number;
  companies?: {
    id: number;
    name: string;
    email: string;
    industry: string;
  };
}

interface Email {
  id: string;
  subject: string;
  from: string;
  snippet: string;
  date: string;
  priority: string;
  unread?: boolean;
}

interface DashboardStats {
  meetings: number;
  emails: number;
  tasks: number;
  productivity: number;
  unreadEmails: number;
  highPriorityEmails: number;
  completedTasks: number;
  upcomingMeetings: number;
}

const DashboardPage = () => {
  const [user, setUser] = useState<User | null>(null);
  const [tasks, setTasks] = useState<any[]>([]);
  const [emails, setEmails] = useState<Email[]>([]);
  const [meetings, setMeetings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>('');
  const [timeOfDay, setTimeOfDay] = useState('');
  const [weather, setWeather] = useState<any>(null);
  const [activeTab, setActiveTab] = useState('overview');
  const [systemStatus, setSystemStatus] = useState<any>(null);
  const navigate = useNavigate();
  const { toast } = useToast();

  // Get token and check authentication
  const token = localStorage.getItem('token');
  const storedEmails = localStorage.getItem('gmail_emails_cache');

  const fetchCurrentUser = async () => {
    if (!token) {
      setError('No authentication token found');
      navigate('/login');
      return;
    }

    try {
      const res = await fetch('http://localhost:3001/api/auth/current-user', {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (!res.ok) throw new Error('Unauthorized');
      
      const data = await res.json();
      setUser(data.user);
      
      // Store user in localStorage for persistence
      localStorage.setItem('current_user', JSON.stringify(data.user));
    } catch (err: any) {
      console.error('Failed to fetch user:', err);
      setError('Failed to fetch user data');
      
      // Try to get user from localStorage as fallback
      const savedUser = localStorage.getItem('current_user');
      if (savedUser) {
        setUser(JSON.parse(savedUser));
      } else {
        navigate('/login');
      }
    }
  };

  // Load emails from localStorage
  const loadStoredEmails = () => {
    if (storedEmails) {
      try {
        const parsedEmails = JSON.parse(storedEmails);
        const emailList: Email[] = parsedEmails.map((email: any) => ({
          id: email.id,
          subject: email.subject || 'No Subject',
          from: email.from || 'Unknown Sender',
          snippet: email.snippet || 'No content',
          date: email.date || new Date().toISOString(),
          priority: email.importance || 'normal',
          unread: Math.random() > 0.7 // Random unread status for demo
        }));
        setEmails(emailList);
      } catch (err) {
        console.error('Error loading stored emails:', err);
      }
    }
  };

  // Fetch weather data
  const fetchWeather = async () => {
    try {
      // Mock weather data - in real app, you'd call a weather API
      const mockWeather = {
        temperature: Math.floor(Math.random() * 30) + 10,
        condition: ['sunny', 'cloudy', 'rainy', 'snowy'][Math.floor(Math.random() * 4)],
        humidity: Math.floor(Math.random() * 100),
        wind: Math.floor(Math.random() * 20)
      };
      setWeather(mockWeather);
    } catch (err) {
      console.error('Error fetching weather:', err);
    }
  };

  // Generate system status
  const generateSystemStatus = () => {
    const status = {
      cpu: Math.floor(Math.random() * 100),
      memory: Math.floor(Math.random() * 100),
      storage: Math.floor(Math.random() * 100),
      network: Math.floor(Math.random() * 100),
      services: ['Auth', 'Database', 'API', 'Cache', 'AI Processing'].map(service => ({
        name: service,
        status: Math.random() > 0.2 ? 'operational' : 'degraded',
        latency: Math.floor(Math.random() * 200) + 50
      }))
    };
    setSystemStatus(status);
  };

  // Generate mock data based on user profile
  const generateMockData = (user: User): DashboardStats => {
    const baseStats = {
      meetings: Math.floor(Math.random() * 6) + 2,
      emails: Math.floor(Math.random() * 20) + 5,
      tasks: Math.floor(Math.random() * 10) + 3,
      productivity: Math.floor(Math.random() * 30) + 70,
      unreadEmails: Math.floor(Math.random() * 8) + 2,
      highPriorityEmails: Math.floor(Math.random() * 5) + 1,
      completedTasks: Math.floor(Math.random() * 8) + 2,
      upcomingMeetings: Math.floor(Math.random() * 4) + 1
    };

    // Adjust based on work style
    if (user.work_style === 'independent') {
      baseStats.meetings = Math.max(1, baseStats.meetings - 2);
      baseStats.productivity += 8;
      baseStats.completedTasks += 2;
    } else if (user.work_style === 'collaborative') {
      baseStats.meetings += 2;
      baseStats.emails += 5;
      baseStats.unreadEmails += 3;
    }

    return baseStats;
  };

  const generateDepartmentInsights = (department?: string) => {
    const insights = {
      engineering: [
        "Code review efficiency improved by 23% this week",
        "New deployment pipeline reduced build times by 40%",
        "Team velocity increased by 15% compared to last sprint"
      ],
      design: [
        "Design system adoption reached 95% across products",
        "User testing shows 30% improvement in task completion",
        "New component library reduced design time by 50%"
      ],
      marketing: [
        "Campaign ROI increased by 45% this quarter",
        "Social media engagement grew by 60% month-over-month",
        "Lead conversion rates improved by 22%"
      ],
      sales: [
        "Q4 revenue tracking 25% above projections",
        "Customer satisfaction scores reached 4.9/5",
        "New enterprise deals increased by 40%"
      ],
      hr: [
        "Employee retention improved by 30% this year",
        "Training program completion rates at 95%",
        "Team satisfaction scores increased by 35%"
      ],
      product: [
        "User adoption exceeded targets by 40%",
        "Feature usage metrics show strong engagement",
        "Product roadmap alignment at 90%"
      ]
    };
    return insights[department as keyof typeof insights] || [
      "System performance optimized for your workflow",
      "AI recommendations tailored to your preferences",
      "Productivity tools configured for maximum efficiency"
    ];
  };

  const generateWorkStyleActions = (workStyle?: string) => {
    const baseActions = [
      { 
        title: 'AI Daily Briefing', 
        description: 'Personalized insights and recommendations', 
        icon: Bot, 
        variant: 'default' as const,
        color: 'from-purple-500 to-pink-500',
        action: () => toast({ title: "Generating your daily briefing...", description: "AI is analyzing your schedule and priorities" })
      },
      { 
        title: 'Focus Session', 
        description: 'Block distractions for deep work', 
        icon: Zap, 
        variant: 'premium' as const,
        color: 'from-cyan-500 to-blue-500',
        action: () => toast({ title: "Starting focus session", description: "Notifications muted for 25 minutes" })
      }
    ];

    if (workStyle === 'independent') {
      baseActions.push({ 
        title: 'Deep Work Block', 
        description: '2 hours of uninterrupted work time', 
        icon: Brain, 
        variant: 'premium' as const,
        color: 'from-green-500 to-emerald-500',
        action: () => toast({ title: "Deep work session scheduled", description: "2 hours of focused time blocked" })
      });
    } else if (workStyle === 'collaborative') {
      baseActions.push({ 
        title: 'Team Sync', 
        description: 'Quick collaboration session', 
        icon: Users, 
        variant: 'default' as const,
        color: 'from-orange-500 to-red-500',
        action: () => toast({ title: "Scheduling team sync", description: "Finding the best time for your team" })
      });
    }

    return baseActions;
  };

  const getWeatherIcon = (condition: string) => {
    const icons = {
      sunny: Sun,
      cloudy: Cloud,
      rainy: CloudRain,
      snowy: CloudSnow
    };
    return icons[condition as keyof typeof icons] || Cloud;
  };

  useEffect(() => {
    // Set time of day
    const hour = new Date().getHours();
    if (hour < 12) setTimeOfDay('morning');
    else if (hour < 17) setTimeOfDay('afternoon');
    else setTimeOfDay('evening');

    // Initialize data
    fetchCurrentUser();
    loadStoredEmails();
    fetchWeather();
    generateSystemStatus();
  }, []);

  useEffect(() => {
    if (!user) return;

    const stats = generateMockData(user);

    // Generate meetings
    const mockMeetings = [
      { id: 1, title: 'Daily Standup', time: '9:00 AM - 9:30 AM', location: 'Conference Room A', priority: 'high', participants: ['You', 'Team Lead', 'Dev Team'], type: 'team' },
      { id: 2, title: 'Product Review', time: '11:00 AM - 12:00 PM', location: 'Zoom Meeting', priority: 'medium', participants: ['You', 'Product Manager', 'Design Lead'], type: 'cross-team' },
      { id: 3, title: `${user.department} Sync`, time: '2:00 PM - 3:00 PM', location: 'Slack Huddle', priority: 'medium', participants: ['You', `${user.department} Team`], type: 'department' },
      { id: 4, title: 'Client Presentation', time: '4:00 PM - 5:00 PM', location: 'Google Meet', priority: 'high', participants: ['You', 'Client Team', 'Sales Lead'], type: 'client' }
    ].slice(0, stats.meetings);
    setMeetings(mockMeetings);

    // Generate tasks
    const mockTasks = (user.skills || ['Development', 'Planning', 'Research']).slice(0, stats.tasks).map((skill, index) => ({
      id: index + 1,
      title: `${skill} Task`,
      priority: index === 0 ? 'high' : index < 3 ? 'medium' : 'low',
      due: index === 0 ? 'Today' : index < 3 ? 'This week' : 'Next week',
      completed: index < stats.completedTasks,
      category: skill.toLowerCase()
    }));
    setTasks(mockTasks);

    // Set loading to false after data is ready
    setTimeout(() => setLoading(false), 1000);
  }, [user]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center space-y-6 text-white"
        >
          <div className="relative">
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
              className="w-20 h-20 border-4 border-cyan-500/30 border-t-cyan-400 rounded-full mx-auto"
            />
            <Brain className="w-8 h-8 text-cyan-400 absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2" />
          </div>
          <div className="space-y-2">
            <h2 className="text-2xl font-bold bg-gradient-to-r from-cyan-400 to-blue-400 bg-clip-text text-transparent">
              Initializing AI Dashboard
            </h2>
            <p className="text-white/60">Personalizing your workspace experience</p>
            <div className="flex justify-center space-x-1">
              {[0, 1, 2].map(i => (
                <motion.div
                  key={i}
                  animate={{ scale: [1, 1.2, 1] }}
                  transition={{ duration: 1, repeat: Infinity, delay: i * 0.2 }}
                  className="w-2 h-2 bg-cyan-400 rounded-full"
                />
              ))}
            </div>
          </div>
        </motion.div>
      </div>
    );
  }

  if (error || !user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center space-y-6 text-white max-w-md"
        >
          <div className="bg-gradient-to-br from-red-500/20 to-red-600/20 p-8 rounded-3xl border border-red-500/30">
            <Shield className="w-16 h-16 mx-auto mb-4 text-red-400" />
            <h2 className="text-2xl font-bold mb-2">Access Required</h2>
            <p className="text-white/60 mb-6">{error || 'Please log in to access your dashboard'}</p>
            <div className="flex gap-3 justify-center">
              <Button 
                onClick={() => window.location.reload()}
                className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
              >
                Try Again
              </Button>
              <Button 
                variant="outline" 
                onClick={() => navigate('/login')}
                className="border-white/20 text-white hover:bg-white/10"
              >
                Go to Login
              </Button>
            </div>
          </div>
        </motion.div>
      </div>
    );
  }

  const safeUser = { 
    full_name: user.full_name || `${user.first_name} ${user.last_name}`,
    department: user.department || 'General',
    work_style: user.work_style || 'hybrid',
    skills: user.skills || ['Adaptive', 'Collaborative', 'Problem-Solving'],
    enable_2fa: user.enable_2fa || false,
    company: user.companies?.name || 'Your Company'
  };

  const userStats = generateMockData(user);
  const quickActions = generateWorkStyleActions(safeUser.work_style);
  const departmentInsights = generateDepartmentInsights(safeUser.department);

  const stats = [
    { 
      title: 'Meetings Today', 
      value: userStats.meetings.toString(), 
      change: `${userStats.meetings - 4 >= 0 ? '+' : ''}${userStats.meetings - 4} from average`, 
      icon: Calendar, 
      color: 'text-blue-400', 
      bgColor: 'bg-blue-500/10',
      trend: userStats.meetings > 4 ? 'up' : 'down'
    },
    { 
      title: 'Unread Emails', 
      value: userStats.unreadEmails.toString(), 
      change: `${userStats.highPriorityEmails} high priority`, 
      icon: Mail, 
      color: 'text-orange-400', 
      bgColor: 'bg-orange-500/10',
      trend: userStats.unreadEmails > 5 ? 'up' : 'down'
    },
    { 
      title: 'Active Tasks', 
      value: userStats.tasks.toString(), 
      change: `${userStats.completedTasks} completed today`, 
      icon: CheckSquare, 
      color: 'text-purple-400', 
      bgColor: 'bg-purple-500/10',
      trend: 'neutral'
    },
    { 
      title: 'Productivity', 
      value: `${userStats.productivity}%`, 
      change: `${userStats.productivity - 75 >= 0 ? '+' : ''}${userStats.productivity - 75}% from target`, 
      icon: TrendingUp, 
      color: 'text-green-400', 
      bgColor: 'bg-green-500/10',
      trend: userStats.productivity > 75 ? 'up' : 'down'
    }
  ];

  const aiInsights = [
    { 
      title: 'Department Insights', 
      insight: departmentInsights[0], 
      action: 'View Analytics', 
      priority: 'positive' as const,
      icon: BarChart3,
      color: 'text-blue-400'
    },
    { 
      title: 'Work Style Optimization', 
      insight: safeUser.work_style === 'independent' 
        ? "Perfect time for deep work sessions with minimal interruptions" 
        : safeUser.work_style === 'collaborative' 
        ? "Ideal schedule for team collaboration and brainstorming sessions"
        : "Balanced day for both focused work and team interactions", 
      action: 'Optimize Schedule', 
      priority: 'medium' as const,
      icon: Zap,
      color: 'text-purple-400'
    },
    { 
      title: 'Skill Development', 
      insight: `Leverage your ${safeUser.skills.length} core skills for upcoming projects and challenges`, 
      action: 'Explore Opportunities', 
      priority: 'positive' as const,
      icon: Target,
      color: 'text-green-400'
    }
  ];

  const recentActivity = [
    { type: 'department', title: `Joined ${safeUser.department} team`, time: '2 days ago', icon: Briefcase, color: 'text-blue-400' },
    { type: 'workstyle', title: `Work style: ${safeUser.work_style}`, time: '1 day ago', icon: safeUser.work_style === 'collaborative' ? Users : safeUser.work_style === 'independent' ? Brain : Lightbulb, color: 'text-purple-400' },
    { type: 'skills', title: `Added ${safeUser.skills.length} skills to profile`, time: '5 hours ago', icon: CheckSquareIcon, color: 'text-green-400' },
    { type: 'ai', title: 'AI assistant personalized for you', time: 'Just now', icon: Bot, color: 'text-orange-400' }
  ];

  const containerVariants = { 
    hidden: { opacity: 0 }, 
    visible: { 
      opacity: 1, 
      transition: { 
        staggerChildren: 0.1,
        duration: 0.6
      } 
    } 
  };
  
  const itemVariants = { 
    hidden: { opacity: 0, y: 20 }, 
    visible: { 
      opacity: 1, 
      y: 0,
      transition: {
        type: "spring",
        stiffness: 100,
        damping: 15
      }
    } 
  };

  const WeatherWidget = () => {
    if (!weather) return null;
    const WeatherIcon = getWeatherIcon(weather.condition);
    
    return (
      <motion.div variants={itemVariants}>
        <Card className="bg-gradient-to-br from-cyan-500/10 to-blue-500/10 border-cyan-500/20 backdrop-blur-xl text-white shadow-2xl">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="space-y-2">
                <p className="text-sm text-cyan-300 font-medium">Current Weather</p>
                <div className="flex items-baseline space-x-2">
                  <p className="text-3xl font-bold">{weather.temperature}°</p>
                  <p className="text-sm text-cyan-300 capitalize">{weather.condition}</p>
                </div>
                <p className="text-xs text-cyan-400">Humidity: {weather.humidity}% • Wind: {weather.wind} km/h</p>
              </div>
              <div className="p-3 bg-cyan-500/20 rounded-2xl">
                <WeatherIcon className="w-8 h-8 text-cyan-300" />
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    );
  };

  const SystemStatusWidget = () => {
    if (!systemStatus) return null;
    
    return (
      <motion.div variants={itemVariants}>
        <Card className="bg-gradient-to-br from-slate-800/50 to-slate-900/50 border-slate-700/50 backdrop-blur-xl text-white shadow-2xl">
          <CardHeader className="pb-4">
            <CardTitle className="flex items-center space-x-2 text-lg">
              <Server className="w-5 h-5 text-green-400" />
              <span>System Status</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-slate-400">CPU</span>
                  <span className="text-slate-300">{systemStatus.cpu}%</span>
                </div>
                <Progress value={systemStatus.cpu} className="h-2 bg-slate-700" />
              </div>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-slate-400">Memory</span>
                  <span className="text-slate-300">{systemStatus.memory}%</span>
                </div>
                <Progress value={systemStatus.memory} className="h-2 bg-slate-700" />
              </div>
            </div>
            <div className="space-y-2">
              {systemStatus.services.slice(0, 3).map((service: any, index: number) => (
                <div key={index} className="flex justify-between items-center text-sm">
                  <span className="text-slate-400">{service.name}</span>
                  <Badge 
                    variant={service.status === 'operational' ? 'default' : 'destructive'}
                    className="text-xs"
                  >
                    {service.status}
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </motion.div>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      {/* Animated Background Elements */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-gradient-to-r from-blue-500/10 to-purple-500/10 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-gradient-to-r from-cyan-500/10 to-blue-500/10 rounded-full blur-3xl animate-pulse delay-1000"></div>
        <div className="absolute top-1/3 left-1/4 w-60 h-60 bg-gradient-to-r from-purple-500/10 to-pink-500/10 rounded-full blur-3xl animate-pulse delay-500"></div>
      </div>

      <div className="relative z-10">
        <motion.div 
          variants={containerVariants} 
          initial="hidden" 
          animate="visible" 
          className="p-6 lg:p-8 space-y-8"
        >
          {/* Welcome Header with Weather */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <motion.div variants={itemVariants} className="lg:col-span-2 space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-2">
                  <div className="flex items-center space-x-3">
                    <h1 className="text-3xl lg:text-4xl font-bold text-white">
                      Good {timeOfDay}, {safeUser.full_name.split(' ')[0]}!
                    </h1>
                    <motion.div 
                      animate={{ rotate: [0, 15, 0] }} 
                      transition={{ duration: 1, repeat: Infinity, repeatDelay: 3 }}
                      className="text-2xl"
                    >
                      {timeOfDay === 'morning' ? '☀️' : timeOfDay === 'afternoon' ? '🌤️' : '🌙'}
                    </motion.div>
                  </div>
                  <p className="text-lg text-white/60">
                    Your {safeUser.department} AI assistant is ready to help • {new Date().toLocaleDateString('en-US', { 
                      weekday: 'long', 
                      year: 'numeric', 
                      month: 'long', 
                      day: 'numeric' 
                    })}
                  </p>
                  
                  {/* Enhanced Badges */}
                  <div className="flex flex-wrap gap-2 mt-4">
                    <Badge className="bg-blue-500/20 text-blue-300 border-blue-500/30 hover:bg-blue-500/30 transition-colors">
                      <Briefcase className="w-3 h-3 mr-1" />
                      {safeUser.department}
                    </Badge>
                    <Badge className="bg-purple-500/20 text-purple-300 border-purple-500/30 hover:bg-purple-500/30 transition-colors">
                      <Brain className="w-3 h-3 mr-1" />
                      {safeUser.work_style}
                    </Badge>
                    <Badge className="bg-green-500/20 text-green-300 border-green-500/30 hover:bg-green-500/30 transition-colors">
                      <CheckSquare className="w-3 h-3 mr-1" />
                      {safeUser.skills.length} skills
                    </Badge>
                    {safeUser.enable_2fa && (
                      <Badge className="bg-orange-500/20 text-orange-300 border-orange-500/30 hover:bg-orange-500/30 transition-colors">
                        <Shield className="w-3 h-3 mr-1" />
                        2FA Enabled
                      </Badge>
                    )}
                    <Badge className="bg-cyan-500/20 text-cyan-300 border-cyan-500/30 hover:bg-cyan-500/30 transition-colors">
                      <Database className="w-3 h-3 mr-1" />
                      {emails.length} emails synced
                    </Badge>
                  </div>
                </div>
              </div>
            </motion.div>
            
            <div className="space-y-6">
              <WeatherWidget />
              <SystemStatusWidget />
            </div>
          </div>

          {/* Stats Overview */}
          <motion.div variants={itemVariants} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {stats.map((stat) => (
              <motion.div 
                key={stat.title} 
                whileHover={{ scale: 1.02, y: -2 }}
                whileTap={{ scale: 0.98 }}
                transition={{ type: "spring", stiffness: 300, damping: 20 }}
              >
                <Card className="bg-white/10 border-white/20 backdrop-blur-xl text-white shadow-2xl hover:shadow-3xl transition-all duration-300 group">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div className="space-y-2">
                        <p className="text-sm text-white/60 font-medium">{stat.title}</p>
                        <p className="text-3xl font-bold text-white">{stat.value}</p>
                        <p className="text-xs text-white/60 flex items-center space-x-1">
                          <TrendingUp className={`w-3 h-3 ${
                            stat.trend === 'up' ? 'text-green-400' : 
                            stat.trend === 'down' ? 'text-red-400' : 'text-yellow-400'
                          }`} />
                          <span>{stat.change}</span>
                        </p>
                      </div>
                      <div className={`p-3 rounded-xl ${stat.bgColor} group-hover:scale-110 transition-transform duration-200`}>
                        <stat.icon className={`w-6 h-6 ${stat.color}`} />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </motion.div>

          {/* Main Content Grid */}
          <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
            {/* Left Column - Quick Actions & Meetings */}
            <motion.div variants={itemVariants} className="xl:col-span-2 space-y-8">
              {/* Quick Actions */}
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <h2 className="text-xl font-semibold text-white flex items-center space-x-2">
                    <Rocket className="w-5 h-5 text-cyan-400" />
                    <span>Quick Actions for {safeUser.work_style} Work</span>
                  </h2>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="text-white/60 hover:text-white hover:bg-white/10 transition-colors"
                  >
                    View All <ArrowRight className="w-4 h-4 ml-2" />
                  </Button>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {quickActions.map((action, index) => (
                    <motion.div 
                      key={action.title}
                      whileHover={{ scale: 1.02, y: -2 }}
                      whileTap={{ scale: 0.98 }}
                      transition={{ type: "spring", stiffness: 300, damping: 20 }}
                    >
                      <Card 
                        className="bg-gradient-to-br from-white/10 to-white/5 border-white/20 backdrop-blur-xl cursor-pointer group hover:shadow-2xl transition-all duration-300 overflow-hidden"
                        onClick={action.action}
                      >
                        <CardContent className="p-6 relative">
                          <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-br from-white/5 to-transparent rounded-bl-full"></div>
                          <div className="flex items-start justify-between mb-4">
                            <div className={`p-3 rounded-xl bg-gradient-to-r ${action.color} shadow-lg group-hover:scale-110 transition-transform duration-200`}>
                              <action.icon className="w-5 h-5 text-white" />
                            </div>
                            {action.variant === 'premium' && (
                              <Crown className="w-4 h-4 text-yellow-400" />
                            )}
                          </div>
                          <h3 className="font-semibold mb-2 text-white text-lg">{action.title}</h3>
                          <p className="text-sm text-white/60 leading-relaxed">{action.description}</p>
                        </CardContent>
                      </Card>
                    </motion.div>
                  ))}
                </div>
              </div>

              {/* Today's Meetings */}
              <motion.div variants={itemVariants}>
                <Card className="bg-white/10 border-white/20 backdrop-blur-xl text-white shadow-2xl">
                  <CardHeader className="pb-4">
                    <CardTitle className="flex items-center space-x-2 text-white text-xl">
                      <Calendar className="w-5 h-5 text-cyan-400" />
                      <span>Today's Meetings</span>
                      <Badge className="bg-cyan-500/20 text-cyan-300 border-cyan-500/30 ml-2">
                        {meetings.length}
                      </Badge>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <AnimatePresence>
                        {meetings.map((meeting) => (
                          <motion.div 
                            key={meeting.id}
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: 20 }}
                            whileHover={{ scale: 1.02 }}
                            transition={{ type: "spring", stiffness: 300, damping: 20 }}
                            className="p-4 rounded-xl bg-white/5 border border-white/10 flex justify-between items-center group hover:bg-white/10 transition-all duration-200"
                          >
                            <div className="flex-1">
                              <div className="flex items-center space-x-3 mb-2">
                                <p className="font-semibold text-white">{meeting.title}</p>
                                <Badge 
                                  variant="outline" 
                                  className="text-xs bg-white/5 border-white/10 text-white/70"
                                >
                                  {meeting.type}
                                </Badge>
                              </div>
                              <p className="text-sm text-white/60 mb-1">{meeting.time} • {meeting.location}</p>
                              <p className="text-xs text-white/50">{meeting.participants.join(', ')}</p>
                            </div>
                            <Badge className={`text-xs ${
                              meeting.priority === 'high' 
                                ? 'bg-red-500/20 text-red-400 border-red-500/30' 
                                : meeting.priority === 'medium' 
                                ? 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30'
                                : 'bg-green-500/20 text-green-400 border-green-500/30'
                            } group-hover:scale-110 transition-transform duration-200`}>
                              {meeting.priority}
                            </Badge>
                          </motion.div>
                        ))}
                      </AnimatePresence>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            </motion.div>

            {/* Right Column - AI Insights & Activity */}
            <motion.div variants={itemVariants} className="space-y-8">
              {/* AI Insights */}
              <div className="space-y-6">
                <h2 className="text-xl font-semibold text-white flex items-center space-x-2">
                  <Brain className="w-5 h-5 text-purple-400" />
                  <span>AI Insights</span>
                </h2>
                <div className="space-y-4">
                  {aiInsights.map((insight, index) => (
                    <motion.div
                      key={insight.title}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.1 }}
                    >
                      <Card className="bg-gradient-to-br from-white/10 to-white/5 border-white/20 backdrop-blur-xl text-white shadow-xl hover:shadow-2xl transition-all duration-300 group">
                        <CardContent className="p-6">
                          <div className="flex items-start space-x-3 mb-3">
                            <div className={`p-2 rounded-xl bg-white/5 ${insight.color} bg-opacity-20`}>
                              <insight.icon className={`w-4 h-4 ${insight.color}`} />
                            </div>
                            <div className="flex-1">
                              <div className="flex items-center justify-between mb-2">
                                <p className="text-sm font-medium text-white/80">{insight.title}</p>
                                <Badge 
                                  className={`text-xs ${
                                    insight.priority === 'positive' 
                                      ? 'bg-green-500/20 text-green-400 border-green-500/30'
                                      : 'bg-blue-500/20 text-blue-400 border-blue-500/30'
                                  }`}
                                >
                                  {insight.priority}
                                </Badge>
                              </div>
                              <p className="text-sm text-white/60 leading-relaxed mb-3">{insight.insight}</p>
                              <Button 
                                variant="ghost" 
                                size="sm" 
                                className="text-white/60 hover:text-white hover:bg-white/10 transition-colors w-full justify-start"
                              >
                                {insight.action} <ArrowRight className="w-3 h-3 ml-1" />
                              </Button>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    </motion.div>
                  ))}
                </div>
              </div>

              {/* Recent Activity */}
              <motion.div variants={itemVariants}>
                <Card className="bg-white/10 border-white/20 backdrop-blur-xl text-white shadow-2xl">
                  <CardHeader className="pb-4">
                    <CardTitle className="flex items-center space-x-2 text-white text-xl">
                      <Sparkles className="w-5 h-5 text-cyan-400" />
                      <span>Recent Activity</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <AnimatePresence>
                        {recentActivity.map((activity, index) => (
                          <motion.div
                            key={index}
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: index * 0.1 }}
                            whileHover={{ scale: 1.02 }}
                            className="flex items-center justify-between bg-white/5 p-3 rounded-xl border border-white/10 group hover:bg-white/10 transition-all duration-200 cursor-pointer"
                          >
                            <div className="flex items-center space-x-3">
                              <div className={`p-2 rounded-xl bg-white/5 ${activity.color} bg-opacity-20 group-hover:scale-110 transition-transform duration-200`}>
                                <activity.icon className={`w-4 h-4 ${activity.color}`} />
                              </div>
                              <div className="flex flex-col">
                                <p className="text-sm text-white font-medium">{activity.title}</p>
                                <p className="text-xs text-white/50">{activity.time}</p>
                              </div>
                            </div>
                            <ArrowRight className="w-4 h-4 text-white/60 group-hover:text-white group-hover:translate-x-1 transition-all duration-200" />
                          </motion.div>
                        ))}
                      </AnimatePresence>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>

              {/* Email Summary */}
              {emails.length > 0 && (
                <motion.div variants={itemVariants}>
                  <Card className="bg-gradient-to-br from-orange-500/10 to-red-500/10 border-orange-500/20 backdrop-blur-xl text-white shadow-2xl">
                    <CardHeader className="pb-4">
                      <CardTitle className="flex items-center space-x-2 text-white text-xl">
                        <Inbox className="w-5 h-5 text-orange-400" />
                        <span>Email Summary</span>
                        <Badge className="bg-orange-500/20 text-orange-300 border-orange-500/30">
                          {userStats.unreadEmails} unread
                        </Badge>
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        {emails.slice(0, 3).map((email, index) => (
                          <motion.div
                            key={email.id}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: index * 0.1 }}
                            className="flex items-center justify-between p-3 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 transition-all duration-200 cursor-pointer"
                          >
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium text-white truncate">{email.subject}</p>
                              <p className="text-xs text-white/60 truncate">{email.from}</p>
                            </div>
                            {email.unread && (
                              <div className="w-2 h-2 bg-orange-400 rounded-full ml-2 flex-shrink-0"></div>
                            )}
                          </motion.div>
                        ))}
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          className="w-full text-orange-300 hover:text-orange-200 hover:bg-orange-500/20 mt-2"
                          onClick={() => navigate('/emails')}
                        >
                          View All Emails <ArrowRight className="w-3 h-3 ml-1" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              )}
            </motion.div>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default DashboardPage;