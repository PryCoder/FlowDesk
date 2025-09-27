import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Calendar, 
  Clock, 
  Users, 
  Video, 
  MapPin, 
  Plus,
  Filter,
  Search,
  Play,
  Bot,
  FileText,
  Copy,
  ExternalLink,
  ChevronRight,
  Star,
  AlertCircle,
  CheckSquare
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAppStore } from '@/stores/useAppStore';
import { cn } from '@/lib/utils';

const upcomingMeetings = [
  {
    id: '1',
    title: 'Weekly Product Sync',
    description: 'Review progress and discuss Q4 roadmap priorities',
    startTime: '2024-01-15T10:00:00Z',
    endTime: '2024-01-15T11:00:00Z',
    attendees: [
      { name: 'Alex Johnson', avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&h=100&fit=crop&crop=face' },
      { name: 'Sarah Chen', avatar: 'https://images.unsplash.com/photo-1494790108755-2616b812e2ce?w=100&h=100&fit=crop&crop=face' },
      { name: 'Mike Rodriguez', avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop&crop=face' }
    ],
    location: 'Conference Room A',
    meetingUrl: 'https://meet.google.com/abc-defg-hij',
    status: 'upcoming',
    priority: 'high',
    hasAgenda: true,
    conflictRisk: false
  },
  {
    id: '2',
    title: 'User Research Review',
    description: 'Present and discuss recent user research findings',
    startTime: '2024-01-15T14:00:00Z',
    endTime: '2024-01-15T15:30:00Z',
    attendees: [
      { name: 'Alex Johnson', avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&h=100&fit=crop&crop=face' },
      { name: 'Emma Davis', avatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=100&h=100&fit=crop&crop=face' },
      { name: 'Lisa Wong', avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&h=100&fit=crop&crop=face' }
    ],
    location: 'Virtual',
    meetingUrl: 'https://zoom.us/j/1234567890',
    status: 'upcoming',
    priority: 'medium',
    hasAgenda: true,
    conflictRisk: true
  },
  {
    id: '3',
    title: '1:1 with Sarah Chen',
    description: 'Monthly check-in and career development discussion',
    startTime: '2024-01-15T16:00:00Z',
    endTime: '2024-01-15T16:30:00Z',
    attendees: [
      { name: 'Alex Johnson', avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&h=100&fit=crop&crop=face' },
      { name: 'Sarah Chen', avatar: 'https://images.unsplash.com/photo-1494790108755-2616b812e2ce?w=100&h=100&fit=crop&crop=face' }
    ],
    location: 'Coffee Corner',
    status: 'upcoming',
    priority: 'medium',
    hasAgenda: false,
    conflictRisk: false
  }
];

const pastMeetings = [
  {
    id: '4',
    title: 'Architecture Review - Auth System',
    description: 'Technical review of authentication module implementation',
    startTime: '2024-01-14T15:00:00Z',
    endTime: '2024-01-14T16:00:00Z',
    attendees: [
      { name: 'Alex Johnson', avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&h=100&fit=crop&crop=face' },
      { name: 'Tech Team', avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop&crop=face' }
    ],
    status: 'completed',
    hasSummary: true,
    rating: 4.5,
    actionItems: 3
  },
  {
    id: '5',
    title: 'Sprint Planning - Q1 2024',
    description: 'Plan upcoming sprint priorities and resource allocation',
    startTime: '2024-01-12T09:00:00Z',
    endTime: '2024-01-12T11:00:00Z',
    attendees: [
      { name: 'Product Team', avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&h=100&fit=crop&crop=face' }
    ],
    status: 'completed',
    hasSummary: true,
    rating: 4.8,
    actionItems: 7
  }
];

export default function Meetings() {
  const [selectedTab, setSelectedTab] = useState('upcoming');
  const [searchQuery, setSearchQuery] = useState('');
  const [showAIAssistant, setShowAIAssistant] = useState(false);
  const [selectedMeeting, setSelectedMeeting] = useState(null);

  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric'
    });
  };

  const getDuration = (start: string, end: string) => {
    const startTime = new Date(start);
    const endTime = new Date(end);
    const diffMs = endTime.getTime() - startTime.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    
    if (diffMins < 60) {
      return `${diffMins}m`;
    } else {
      const hours = Math.floor(diffMins / 60);
      const mins = diffMins % 60;
      return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
    }
  };

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

  return (
    <div className="min-h-screen bg-background">
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="p-6 lg:p-8 space-y-8"
      >
        {/* Header */}
        <motion.div variants={itemVariants} className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl lg:text-4xl font-clash font-bold gradient-text">
                Meetings
              </h1>
              <p className="text-muted-foreground font-satoshi mt-2">
                Manage your schedule with AI-powered insights
              </p>
            </div>
            <div className="flex items-center space-x-3">
              <Button
                variant="glass"
                onClick={() => setShowAIAssistant(!showAIAssistant)}
                className="hidden lg:flex"
              >
                <Bot className="w-4 h-4 mr-2" />
                AI Assistant
              </Button>
              <Button variant="premium">
                <Plus className="w-4 h-4 mr-2" />
                Schedule Meeting
              </Button>
            </div>
          </div>

          {/* Search and Filters */}
          <div className="flex flex-col lg:flex-row gap-4">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search meetings..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 glass-card border-glass-border/50 focus:border-primary/50"
              />
            </div>
            <Button variant="glass" size="icon">
              <Filter className="w-4 h-4" />
            </Button>
          </div>
        </motion.div>

        <div className="grid grid-cols-1 xl:grid-cols-4 gap-8">
          {/* Main Content */}
          <div className="xl:col-span-3 space-y-6">
            {/* Today's Schedule Overview */}
            <motion.div variants={itemVariants}>
              <Card className="glass-card border-glass-border/50 backdrop-blur-xl">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="font-clash">Today's Schedule</CardTitle>
                      <CardDescription>Monday, January 15, 2024</CardDescription>
                    </div>
                    <Badge className="bg-primary/20 text-primary border-primary/30">
                      4 meetings
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="relative">
                    {/* Timeline */}
                    <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-glass-border"></div>
                    
                    <div className="space-y-6">
                      {upcomingMeetings.slice(0, 3).map((meeting, index) => (
                        <motion.div
                          key={meeting.id}
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ duration: 0.3, delay: index * 0.1 }}
                          className="relative pl-12"
                        >
                          <div className="absolute left-2 w-4 h-4 bg-primary rounded-full border-4 border-background shadow-glow"></div>
                          
                          <div className="glass-card glass-hover rounded-xl p-4 border-glass-border/30">
                            <div className="flex items-start justify-between mb-3">
                              <div className="flex-1">
                                <h4 className="font-jakarta font-semibold mb-1">
                                  {meeting.title}
                                </h4>
                                <p className="text-sm text-muted-foreground mb-2">
                                  {meeting.description}
                                </p>
                                <div className="flex items-center space-x-4 text-xs text-muted-foreground">
                                  <div className="flex items-center">
                                    <Clock className="w-3 h-3 mr-1" />
                                    {formatTime(meeting.startTime)} - {formatTime(meeting.endTime)}
                                  </div>
                                  <div className="flex items-center">
                                    <MapPin className="w-3 h-3 mr-1" />
                                    {meeting.location}
                                  </div>
                                  <div className="flex items-center">
                                    <Users className="w-3 h-3 mr-1" />
                                    {meeting.attendees.length}
                                  </div>
                                </div>
                              </div>
                              
                              <div className="flex items-center space-x-2 ml-4">
                                {meeting.conflictRisk && (
                                  <Badge variant="destructive" className="text-xs">
                                    <AlertCircle className="w-3 h-3 mr-1" />
                                    Conflict
                                  </Badge>
                                )}
                                {meeting.priority === 'high' && (
                                  <Badge className="bg-destructive/20 text-destructive border-destructive/30 text-xs">
                                    High Priority
                                  </Badge>
                                )}
                                <Button variant="premium" size="sm">
                                  <Play className="w-3 h-3 mr-1" />
                                  Join
                                </Button>
                              </div>
                            </div>
                            
                            <div className="flex items-center justify-between">
                              <div className="flex -space-x-2">
                                {meeting.attendees.slice(0, 3).map((attendee, idx) => (
                                  <img
                                    key={idx}
                                    src={attendee.avatar}
                                    alt={attendee.name}
                                    className="w-6 h-6 rounded-full border-2 border-background"
                                  />
                                ))}
                                {meeting.attendees.length > 3 && (
                                  <div className="w-6 h-6 rounded-full bg-glass border-2 border-background flex items-center justify-center">
                                    <span className="text-xs font-medium">
                                      +{meeting.attendees.length - 3}
                                    </span>
                                  </div>
                                )}
                              </div>
                              
                              <div className="flex items-center space-x-2">
                                {meeting.hasAgenda && (
                                  <Button variant="ghost" size="icon-sm">
                                    <FileText className="w-3 h-3" />
                                  </Button>
                                )}
                                <Button variant="ghost" size="icon-sm">
                                  <Copy className="w-3 h-3" />
                                </Button>
                                <Button variant="ghost" size="icon-sm">
                                  <ExternalLink className="w-3 h-3" />
                                </Button>
                              </div>
                            </div>
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            {/* Tabs for Upcoming/Past */}
            <motion.div variants={itemVariants}>
              <Tabs value={selectedTab} onValueChange={setSelectedTab}>
                <TabsList className="glass-card border-glass-border/50">
                  <TabsTrigger value="upcoming" className="font-jakarta">
                    Upcoming ({upcomingMeetings.length})
                  </TabsTrigger>
                  <TabsTrigger value="past" className="font-jakarta">
                    Past ({pastMeetings.length})
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="upcoming" className="mt-6">
                  <div className="grid gap-4">
                    {upcomingMeetings.map((meeting, index) => (
                      <motion.div
                        key={meeting.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.3, delay: index * 0.05 }}
                        whileHover={{ scale: 1.01 }}
                        className="cursor-pointer"
                      >
                        <Card className="glass-card glass-hover border-glass-border/50 backdrop-blur-xl">
                          <CardContent className="p-6">
                            <div className="flex items-center justify-between mb-4">
                              <div className="flex-1">
                                <h3 className="font-jakarta font-semibold text-lg mb-2">
                                  {meeting.title}
                                </h3>
                                <p className="text-muted-foreground mb-3">
                                  {meeting.description}
                                </p>
                                
                                <div className="flex items-center space-x-6 text-sm text-muted-foreground">
                                  <div className="flex items-center">
                                    <Calendar className="w-4 h-4 mr-2" />
                                    {formatDate(meeting.startTime)}
                                  </div>
                                  <div className="flex items-center">
                                    <Clock className="w-4 h-4 mr-2" />
                                    {formatTime(meeting.startTime)} ({getDuration(meeting.startTime, meeting.endTime)})
                                  </div>
                                  <div className="flex items-center">
                                    <MapPin className="w-4 h-4 mr-2" />
                                    {meeting.location}
                                  </div>
                                </div>
                              </div>
                              
                              <div className="flex items-center space-x-3">
                                <Button variant="glass">
                                  <FileText className="w-4 h-4 mr-2" />
                                  Agenda
                                </Button>
                                <Button variant="premium">
                                  <Video className="w-4 h-4 mr-2" />
                                  Join Meeting
                                </Button>
                              </div>
                            </div>
                            
                            <div className="flex items-center justify-between">
                              <div className="flex -space-x-2">
                                {meeting.attendees.map((attendee, idx) => (
                                  <img
                                    key={idx}
                                    src={attendee.avatar}
                                    alt={attendee.name}
                                    className="w-8 h-8 rounded-full border-2 border-background"
                                    title={attendee.name}
                                  />
                                ))}
                              </div>
                              
                              <div className="flex items-center space-x-2">
                                {meeting.priority === 'high' && (
                                  <Badge className="bg-destructive/20 text-destructive border-destructive/30">
                                    High Priority
                                  </Badge>
                                )}
                                {meeting.conflictRisk && (
                                  <Badge variant="destructive">
                                    Schedule Conflict
                                  </Badge>
                                )}
                                <ChevronRight className="w-4 h-4 text-muted-foreground" />
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      </motion.div>
                    ))}
                  </div>
                </TabsContent>

                <TabsContent value="past" className="mt-6">
                  <div className="grid gap-4">
                    {pastMeetings.map((meeting, index) => (
                      <motion.div
                        key={meeting.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.3, delay: index * 0.05 }}
                        whileHover={{ scale: 1.01 }}
                        className="cursor-pointer"
                      >
                        <Card className="glass-card glass-hover border-glass-border/50 backdrop-blur-xl">
                          <CardContent className="p-6">
                            <div className="flex items-center justify-between mb-4">
                              <div className="flex-1">
                                <h3 className="font-jakarta font-semibold text-lg mb-2">
                                  {meeting.title}
                                </h3>
                                <p className="text-muted-foreground mb-3">
                                  {meeting.description}
                                </p>
                                
                                <div className="flex items-center space-x-6 text-sm text-muted-foreground">
                                  <div className="flex items-center">
                                    <Calendar className="w-4 h-4 mr-2" />
                                    {formatDate(meeting.startTime)}
                                  </div>
                                  <div className="flex items-center">
                                    <Clock className="w-4 h-4 mr-2" />
                                    {formatTime(meeting.startTime)} ({getDuration(meeting.startTime, meeting.endTime)})
                                  </div>
                                  {meeting.actionItems && (
                                    <div className="flex items-center">
                                      <CheckSquare className="w-4 h-4 mr-2" />
                                      {meeting.actionItems} action items
                                    </div>
                                  )}
                                </div>
                              </div>
                              
                              <div className="flex items-center space-x-3">
                                {meeting.hasSummary && (
                                  <Button variant="glass">
                                    <FileText className="w-4 h-4 mr-2" />
                                    Summary
                                  </Button>
                                )}
                                <Button variant="premium">
                                  <Bot className="w-4 h-4 mr-2" />
                                  AI Insights
                                </Button>
                              </div>
                            </div>
                            
                            <div className="flex items-center justify-between">
                              <div className="flex -space-x-2">
                                {meeting.attendees.map((attendee, idx) => (
                                  <img
                                    key={idx}
                                    src={attendee.avatar}
                                    alt={attendee.name}
                                    className="w-8 h-8 rounded-full border-2 border-background grayscale"
                                    title={attendee.name}
                                  />
                                ))}
                              </div>
                              
                              <div className="flex items-center space-x-3">
                                {meeting.rating && (
                                  <div className="flex items-center space-x-1">
                                    <Star className="w-4 h-4 text-warning fill-current" />
                                    <span className="text-sm font-space-grotesk font-medium">
                                      {meeting.rating}
                                    </span>
                                  </div>
                                )}
                                <Badge className="bg-success/20 text-success border-success/30">
                                  Completed
                                </Badge>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      </motion.div>
                    ))}
                  </div>
                </TabsContent>
              </Tabs>
            </motion.div>
          </div>

          {/* AI Assistant Sidebar */}
          <AnimatePresence>
            {(showAIAssistant || window.innerWidth >= 1280) && (
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                transition={{ duration: 0.3 }}
                className="space-y-6"
              >
                <Card className="glass-card border-primary/20 backdrop-blur-xl">
                  <CardHeader>
                    <div className="flex items-center space-x-3">
                      <div className="p-2 gradient-primary rounded-lg">
                        <Bot className="w-4 h-4 text-white" />
                      </div>
                      <div>
                        <CardTitle className="text-sm font-jakarta">AI Meeting Assistant</CardTitle>
                        <CardDescription className="text-xs">Smart meeting optimization</CardDescription>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-3">
                      <Button variant="glass" className="w-full justify-start text-xs">
                        <FileText className="w-3 h-3 mr-2" />
                        Generate Agenda
                      </Button>
                      <Button variant="glass" className="w-full justify-start text-xs">
                        <Bot className="w-3 h-3 mr-2" />
                        Meeting Prep
                      </Button>
                      <Button variant="glass" className="w-full justify-start text-xs">
                        <Clock className="w-3 h-3 mr-2" />
                        Optimize Schedule
                      </Button>
                    </div>
                  </CardContent>
                </Card>

                <Card className="glass-card border-glass-border/50 backdrop-blur-xl">
                  <CardHeader>
                    <CardTitle className="text-sm font-jakarta">Meeting Analytics</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-3">
                      <div className="flex justify-between items-center">
                        <span className="text-xs text-muted-foreground">This week</span>
                        <span className="text-sm font-space-grotesk font-bold">12.5h</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-xs text-muted-foreground">Avg. rating</span>
                        <div className="flex items-center space-x-1">
                          <Star className="w-3 h-3 text-warning fill-current" />
                          <span className="text-sm font-space-grotesk font-bold">4.7</span>
                        </div>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-xs text-muted-foreground">On-time rate</span>
                        <span className="text-sm font-space-grotesk font-bold text-success">94%</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>
    </div>
  );
}