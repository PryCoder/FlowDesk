import React, { useEffect, useState } from "react";
import { motion } from 'framer-motion';
import { 
  Calendar, 
  Mail, 
  CheckSquare, 
  TrendingUp, 
  Clock, 
  Users, 
  Zap, 
  Heart,
  Bot,
  Sparkles,
  ArrowRight,
  MessageCircle,
  BarChart3,
  Briefcase,
  Brain,
  Lightbulb,
  Loader2,
  Bell,
  CheckSquareIcon
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { authAPI, getCurrentUser, isAuthenticated, User } from '@/services/api';
import { useNavigate } from 'react-router-dom';

const DashboardPage = () => {
  const [user, setUser] = useState<User | null>(null);
  const [tasks, setTasks] = useState<any[]>([]);
  const [emails, setEmails] = useState<any[]>([]);
  const [meetings, setMeetings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>('');
  const [timeOfDay, setTimeOfDay] = useState('');
  const navigate = useNavigate();

  // Generate mock data based on user profile
  const generateMockData = (user: User) => {
    const baseStats = {
      meetings: Math.floor(Math.random() * 6) + 2,
      emails: Math.floor(Math.random() * 20) + 5,
      tasks: Math.floor(Math.random() * 10) + 3,
      productivity: Math.floor(Math.random() * 30) + 70
    };

    if (user.work_style === 'independent') {
      baseStats.meetings = Math.max(1, baseStats.meetings - 2);
      baseStats.productivity += 5;
    } else if (user.work_style === 'collaborative') {
      baseStats.meetings += 2;
      baseStats.emails += 5;
    }

    return baseStats;
  };

  const generateDepartmentInsights = (department: string) => {
    const insights = {
      engineering: [
        "Code review backlog is 15% lower than last week",
        "New feature deployment scheduled for tomorrow",
        "API performance improved by 23% this month"
      ],
      design: [
        "Design system updates completed successfully",
        "User feedback shows 95% satisfaction with new UI",
        "3 new prototypes ready for review"
      ],
      marketing: [
        "Campaign CTR increased by 34% this week",
        "New leads are up 27% from last month",
        "Social media engagement at all-time high"
      ],
      sales: [
        "Q4 targets 15% ahead of schedule",
        "New enterprise deal in final stages",
        "Customer satisfaction scores improved"
      ],
      hr: [
        "Employee wellness participation up 40%",
        "New hire onboarding feedback: 4.8/5",
        "Team collaboration scores improved"
      ],
      product: [
        "User adoption rates exceeding expectations",
        "Feature request backlog prioritized",
        "Roadmap alignment session scheduled"
      ]
    };

    return insights[department as keyof typeof insights] || insights.engineering;
  };

  const generateWorkStyleActions = (workStyle: string) => {
    const baseActions = [
      {
        title: 'Start Focus Session',
        description: 'Block distractions for deep work',
        icon: Zap,
        variant: 'premium' as const,
        time: '25 min'
      },
      {
        title: 'AI Daily Briefing',
        description: 'Get personalized insights & suggestions',
        icon: Bot,
        variant: 'default' as const,
        isNew: true
      }
    ];

    if (workStyle === 'independent') {
      baseActions.push({
        title: 'Deep Work Block',
        description: '2 hours of uninterrupted work time',
        icon: Brain,
        variant: 'premium' as const,
        time: '2 hours'
      });
    } 

    return baseActions;
  };

  useEffect(() => {
    const fetchDashboardData = async () => {
      setLoading(true);
      setError('');
      
      try {
        // Check authentication first
        if (!isAuthenticated()) {
          navigate('/login');
          return;
        }

        console.log('Starting dashboard data fetch...');

        // Try to get user from localStorage first (faster)
        const cachedUser = getCurrentUser();
        console.log('Cached user:', cachedUser);

        if (cachedUser) {
          setUser(cachedUser);
        }

        // Then try to fetch fresh data from API
        try {
          console.log('Fetching fresh user data from API...');
          const freshUser = await authAPI.getCurrentUser();
          console.log('Fresh user data:', freshUser);
          setUser(freshUser);
        } catch (apiError) {
          console.warn('API fetch failed, using cached data:', apiError);
          // If API fails but we have cached data, continue with cached data
          if (!cachedUser) {
            throw new Error('Failed to fetch user data');
          }
        }

        // Set time-based greeting
        const hour = new Date().getHours();
        if (hour < 12) setTimeOfDay('morning');
        else if (hour < 17) setTimeOfDay('afternoon');
        else setTimeOfDay('evening');

        // Generate mock data based on user profile
        const currentUser = user || cachedUser;
        console.log('Current user for mock data:', currentUser);

        if (currentUser) {
          const stats = generateMockData(currentUser);
          console.log('Generated stats:', stats);
          
          // Mock meetings data
          const mockMeetings = [
            {
              id: 1,
              title: 'Daily Standup',
              time: '9:00 AM - 9:30 AM',
              location: 'Conference Room A',
              priority: 'High',
              participants: ['You', 'Team Lead', 'Dev Team']
            },
            {
              id: 2,
              title: 'Product Review',
              time: '11:00 AM - 12:00 PM',
              location: 'Zoom Meeting',
              priority: 'Medium',
              participants: ['You', 'Product Manager', 'Design Lead']
            },
            {
              id: 3,
              title: `${currentUser.department} Sync`,
              time: '2:00 PM - 3:00 PM',
              location: 'Slack Huddle',
              priority: 'Medium',
              participants: ['You', `${currentUser.department} Team`]
            }
          ].slice(0, stats.meetings);

          setMeetings(mockMeetings);
          console.log('Mock meetings:', mockMeetings);

          // Mock tasks based on user skills
          const mockTasks = (currentUser.skills || []).slice(0, stats.tasks).map((skill, index) => ({
            id: index + 1,
            title: `${skill} Task`,
            priority: index === 0 ? 'High' : 'Medium',
            due: index === 0 ? 'Today' : 'This week'
          }));

          setTasks(mockTasks);
          console.log('Mock tasks:', mockTasks);

          // Mock emails
          const mockEmails = Array.from({ length: stats.emails }, (_, index) => ({
            id: index + 1,
            subject: `Important update about ${currentUser.department}`,
            sender: 'company@example.com',
            priority: index < 3 ? 'High' : 'Normal'
          }));

          setEmails(mockEmails);
          console.log('Mock emails count:', stats.emails);
        }

      } catch (err: any) {
        console.error("Error fetching dashboard data:", err);
        setError(err.response?.data?.detail || err.message || 'Failed to load dashboard');
        
        // If unauthorized, redirect to login
        if (err.response?.status === 401) {
          navigate('/login');
          return;
        }
      } finally {
        setLoading(false);
        console.log('Dashboard loading complete');
      }
    };

    fetchDashboardData();
  }, [navigate]);

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center">
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center space-y-4 text-white"
        >
          <Loader2 className="w-12 h-12 mx-auto animate-spin text-cyan-400" />
          <h2 className="text-2xl font-bold">Loading your dashboard...</h2>
          <p className="text-white/60">Personalizing your AI workspace</p>
        </motion.div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center">
        <div className="text-center space-y-4 text-white max-w-md">
          <h2 className="text-2xl font-bold">Failed to load dashboard</h2>
          <p className="text-white/60">{error}</p>
          <div className="flex gap-4 justify-center">
            <Button onClick={() => window.location.reload()}>
              Try Again
            </Button>
            <Button variant="outline" onClick={() => navigate('/login')}>
              Go to Login
            </Button>
          </div>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center">
        <div className="text-center space-y-4 text-white">
          <h2 className="text-2xl font-bold">No user data found</h2>
          <p className="text-white/60">Please log in to access your dashboard</p>
          <Button onClick={() => navigate('/login')}>
            Go to Login
          </Button>
        </div>
      </div>
    );
  }

  console.log('Rendering dashboard with user:', user);

  // Safe user data with fallbacks
  const safeUser = {
    full_name: user.full_name || 'User',
    department: user.department || 'General',
    work_style: user.work_style || 'hybrid',
    skills: user.skills || [],
    enable_2fa: user.enable_2fa || false
  };

  const userStats = generateMockData(user);
  const quickActions = generateWorkStyleActions(safeUser.work_style);
  const departmentInsights = generateDepartmentInsights(safeUser.department);

  const stats = [
    {
      title: 'Meetings Today',
      value: userStats.meetings.toString(),
      change: `${userStats.meetings > 4 ? '+' : ''}${userStats.meetings - 4} from average`,
      icon: Calendar,
      color: 'text-blue-400',
      bgColor: 'bg-blue-500/10'
    },
    {
      title: 'Unread Emails',
      value: userStats.emails.toString(),
      change: `${Math.floor(userStats.emails * 0.2)} high priority`,
      icon: Mail,
      color: 'text-orange-400',
      bgColor: 'bg-orange-500/10'
    },
    {
      title: 'Active Tasks',
      value: userStats.tasks.toString(),
      change: `${Math.floor(userStats.tasks * 0.3)} due today`,
      icon: CheckSquare,
      color: 'text-purple-400',
      bgColor: 'bg-purple-500/10'
    },
    {
      title: 'Productivity Score',
      value: `${userStats.productivity}%`,
      change: `${userStats.productivity > 75 ? '+' : ''}${userStats.productivity - 75}% from target`,
      icon: TrendingUp,
      color: 'text-green-400',
      bgColor: 'bg-green-500/10'
    }
  ];

  const aiInsights = [
    {
      title: 'Department Insights',
      insight: departmentInsights[0] || "Getting your workspace ready...",
      action: 'View More',
      priority: 'medium' as const
    },
    {
      title: 'Work Style Optimization',
      insight: safeUser.work_style === 'independent' 
        ? "Perfect time for deep work sessions today" 
        : safeUser.work_style === 'collaborative'
        ? "Great day for team collaboration and meetings"
        : "Good balance of focus and collaboration time available",
      action: 'Optimize',
      priority: 'positive' as const
    },
    {
      title: 'Skill Development',
      insight: `Based on your ${safeUser.skills.length} skills, consider exploring advanced topics`,
      action: 'Learn More',
      priority: 'medium' as const
    }
  ];

  const recentActivity = [
    {
      type: 'department',
      title: `Joined ${safeUser.department} team`,
      time: 'Recently',
      icon: Briefcase,
      color: 'text-blue-400'
    },
    {
      type: 'workstyle',
      title: `Work style: ${safeUser.work_style}`,
      time: 'Recently',
      icon: safeUser.work_style === 'collaborative' ? Users : 
            safeUser.work_style === 'independent' ? Brain : Lightbulb,
      color: 'text-purple-400'
    },
    {
      type: 'skills',
      title: `Added ${safeUser.skills.length} skills to profile`,
      time: 'Recently',
      icon: CheckSquareIcon,
      color: 'text-green-400'
    },
    {
      type: 'ai',
      title: 'AI assistant personalized for you',
      time: 'Just now',
      icon: Bot,
      color: 'text-orange-400'
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      <div className="relative z-10">
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="p-6 lg:p-8 space-y-8"
        >
          {/* Welcome Header */}
          <motion.div variants={itemVariants} className="space-y-2">
            <div className="flex items-center space-x-3">
              <h1 className="text-3xl lg:text-4xl font-bold text-white">
                Good {timeOfDay}, {safeUser.full_name.split(' ')[0]}! 
              </h1>
              <motion.div
                animate={{ rotate: [0, 15, 0] }}
                transition={{ duration: 1, repeat: Infinity, repeatDelay: 3 }}
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
            
            {/* User Profile Badge */}
            <div className="flex flex-wrap gap-2 mt-4">
              <Badge className="bg-blue-500/20 text-blue-300 border-blue-500/30">
                <Briefcase className="w-3 h-3 mr-1" />
                {safeUser.department}
              </Badge>
              <Badge className="bg-purple-500/20 text-purple-300 border-purple-500/30">
                <Brain className="w-3 h-3 mr-1" />
                {safeUser.work_style}
              </Badge>
              <Badge className="bg-green-500/20 text-green-300 border-green-500/30">
                <CheckSquare className="w-3 h-3 mr-1" />
                {safeUser.skills.length} skills
              </Badge>
              {safeUser.enable_2fa && (
                <Badge className="bg-orange-500/20 text-orange-300 border-orange-500/30">
                  🔒 2FA Enabled
                </Badge>
              )}
            </div>
          </motion.div>

          {/* Stats Overview */}
          <motion.div 
            variants={itemVariants}
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6"
          >
            {stats.map((stat, index) => (
              <motion.div
                key={stat.title}
                whileHover={{ scale: 1.02 }}
                transition={{ type: "spring", stiffness: 300, damping: 20 }}
              >
                <Card className="bg-white/10 border-white/20 backdrop-blur-xl text-white shadow-xl">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div className="space-y-2">
                        <p className="text-sm text-white/60 font-medium">
                          {stat.title}
                        </p>
                        <p className="text-3xl font-bold text-white">
                          {stat.value}
                        </p>
                        <p className="text-xs text-white/60">
                          {stat.change}
                        </p>
                      </div>
                      <div className={`p-3 rounded-xl ${stat.bgColor}`}>
                        <stat.icon className={`w-6 h-6 ${stat.color}`} />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </motion.div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Quick Actions */}
            <motion.div variants={itemVariants} className="lg:col-span-2 space-y-6">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold text-white">
                  Quick Actions for {safeUser.work_style} Work
                </h2>
                <Button variant="ghost" size="sm" className="text-white/60 hover:text-white hover:bg-white/10">
                  View All
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {quickActions.map((action, index) => (
                  <motion.div
                    key={action.title}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    transition={{ type: "spring", stiffness: 300, damping: 20 }}
                  >
                    <Card className="bg-white/10 border-white/20 backdrop-blur-xl cursor-pointer group hover:bg-white/15 transition-all duration-300 shadow-xl">
                      <CardContent className="p-6">
                        <div className="flex items-start justify-between mb-4">
                          <div className={`p-3 rounded-xl transition-all duration-200 ${
                            action.variant === 'premium' 
                              ? 'bg-gradient-to-r from-cyan-500 to-blue-500' 
                              : 'bg-white/10'
                          }`}>
                            <action.icon className={`w-5 h-5 group-hover:scale-110 transition-transform duration-200 ${
                              action.variant === 'premium' ? 'text-white' : 'text-cyan-400'
                            }`} />
                          </div>
                          
                          {action.isNew && (
                            <Badge className="bg-cyan-500/20 text-cyan-300 border-cyan-500/30">
                              New
                            </Badge>
                          )}
                          
                          {action.time && (
                            <div className="flex items-center space-x-1 text-white/60">
                              <Clock className="w-3 h-3" />
                              <span className="text-xs">{action.time}</span>
                            </div>
                          )}
                        </div>
                        
                        <h3 className="font-semibold mb-2 text-white text-lg">
                          {action.title}
                        </h3>
                        <p className="text-sm text-white/60 leading-relaxed">
                          {action.description}
                        </p>
                      </CardContent>
                    </Card>
                  </motion.div>
                ))}
              </div>

              {/* Today's Meetings */}
              <Card className="bg-white/10 border-white/20 backdrop-blur-xl text-white shadow-xl">
                <CardHeader className="pb-4">
                  <CardTitle className="flex items-center space-x-2 text-white text-xl">
                    <Calendar className="w-5 h-5 text-cyan-400" />
                    <span>Today's Meetings</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {meetings.map((meeting) => (
                      <motion.div
                        key={meeting.id}
                        whileHover={{ scale: 1.01 }}
                        className="flex items-center justify-between p-4 rounded-lg bg-white/5 border border-white/10 hover:bg-white/10 transition-all duration-200"
                      >
                        <div className="flex-1">
                          <h4 className="font-semibold text-sm mb-1 text-white">
                            {meeting.title}
                          </h4>
                          <p className="text-sm text-white/60 mb-1">
                            {meeting.time} • {meeting.location}
                          </p>
                          <div className="flex items-center space-x-2">
                            <Badge variant={meeting.priority === 'High' ? 'destructive' : 'secondary'} className="text-xs">
                              {meeting.priority}
                            </Badge>
                            <span className="text-xs text-white/60">
                              {meeting.participants.length} participants
                            </span>
                          </div>
                        </div>
                        <Button variant="ghost" size="sm" className="text-white/60 hover:text-white hover:bg-white/10">
                          Join
                        </Button>
                      </motion.div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            {/* AI Insights */}
            <motion.div variants={itemVariants} className="space-y-6">
              <div className="flex items-center space-x-2">
                <Sparkles className="w-5 h-5 text-cyan-400" />
                <h2 className="text-xl font-semibold text-white">AI Insights</h2>
              </div>
              
              <div className="space-y-4">
                {aiInsights.map((insight, index) => (
                  <motion.div
                    key={insight.title}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.3, delay: index * 0.1 }}
                  >
                    <Card className={`bg-white/10 border-l-4 backdrop-blur-xl shadow-xl ${
                     
                      insight.priority === 'positive' ? 'border-l-green-400' :
                      'border-l-cyan-400'
                    }`}>
                      <CardContent className="p-4">
                        <h4 className="font-semibold text-sm mb-2 text-white">
                          {insight.title}
                        </h4>
                        <p className="text-sm text-white/60 mb-3 leading-relaxed">
                          {insight.insight}
                        </p>
                        <Button variant="ghost" size="sm" className="text-xs text-white/60 hover:text-white hover:bg-white/10">
                          {insight.action}
                          <ArrowRight className="w-3 h-3 ml-1" />
                        </Button>
                      </CardContent>
                    </Card>
                  </motion.div>
                ))}
              </div>

              {/* AI Chat Widget */}
              <Card className="bg-white/10 border-cyan-400/20 backdrop-blur-xl text-white shadow-xl">
                <CardContent className="p-6">
                  <div className="flex items-center space-x-3 mb-4">
                    <div className="p-2 bg-gradient-to-r from-cyan-500 to-blue-500 rounded-lg shadow-lg">
                      <Bot className="w-4 h-4 text-white" />
                    </div>
                    <div>
                      <h4 className="font-semibold text-sm text-white">
                        Your {safeUser.department} Assistant
                      </h4>
                      <p className="text-xs text-white/60">
                        Specialized in {safeUser.department.toLowerCase()} tasks
                      </p>
                    </div>
                  </div>
                  
                  <div className="space-y-3">
                    <div className="p-3 bg-white/5 rounded-lg border border-white/10">
                      <p className="text-sm text-white leading-relaxed">
                        {safeUser.work_style === 'independent' 
                          ? "Ready to help you focus? I can block distractions and optimize your deep work time."
                          : safeUser.work_style === 'collaborative'
                          ? "Want me to help schedule team collaborations or prepare meeting notes?"
                          : "I can help balance your collaborative and focused work time today."
                        }
                      </p>
                    </div>
                    
                    <div className="flex space-x-2">
                      <Button 
                        className="flex-1 bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600 shadow-lg"
                        size="sm"
                      >
                        <MessageCircle className="w-3 h-3 mr-2" />
                        Chat Now
                      </Button>
                      <Button variant="ghost" size="sm" className="text-white/60 hover:text-white hover:bg-white/10">
                        Later
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Recent Activity */}
              <Card className="bg-white/10 border-white/20 backdrop-blur-xl text-white shadow-xl">
                <CardHeader className="pb-4">
                  <CardTitle className="flex items-center space-x-2 text-white text-xl">
                    <Bell className="w-5 h-5 text-cyan-400" />
                    <span>Recent Activity</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {recentActivity.map((activity, index) => (
                      <motion.div
                        key={index}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.3, delay: index * 0.1 }}
                        className="flex items-center space-x-3 p-2 rounded-lg hover:bg-white/5 transition-all duration-200 border border-transparent hover:border-white/10"
                      >
                        <div className="p-2 bg-white/5 rounded-lg">
                          <activity.icon className={`w-3 h-3 ${activity.color}`} />
                        </div>
                        <div className="flex-1">
                          <p className="font-medium text-xs text-white">
                            {activity.title}
                          </p>
                          <p className="text-xs text-white/60">
                            {activity.time}
                          </p>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default DashboardPage;