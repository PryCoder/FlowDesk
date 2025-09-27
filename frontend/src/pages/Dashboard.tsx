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
  Play,
  MessageCircle,
  BarChart3
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useAppStore } from '@/stores/useAppStore';
import { cn } from '@/lib/utils';

const stats = [
  {
    title: 'Meetings Today',
    value: '4',
    change: '+2 from yesterday',
    icon: Calendar,
    color: 'text-primary',
    bgColor: 'bg-primary/10'
  },
  {
    title: 'Unread Emails',
    value: '12',
    change: '3 high priority',
    icon: Mail,
    color: 'text-accent-orange',
    bgColor: 'bg-accent-orange/10'
  },
  {
    title: 'Active Tasks',
    value: '8',
    change: '2 due today',
    icon: CheckSquare,
    color: 'text-secondary',
    bgColor: 'bg-secondary/10'
  },
  {
    title: 'Productivity Score',
    value: '87%',
    change: '+5% this week',
    icon: TrendingUp,
    color: 'text-success',
    bgColor: 'bg-success/10'
  }
];

const quickActions = [
  {
    title: 'Start Focus Session',
    description: 'Block distractions for deep work',
    icon: Zap,
    variant: 'premium' as const,
    time: '25 min'
  },
  {
    title: 'Join Next Meeting',
    description: 'Weekly Product Sync in 15 mins',
    icon: Play,
    variant: 'glass' as const,
    time: '15 min'
  },
  {
    title: 'Review Urgent Emails',
    description: '3 emails need immediate attention',
    icon: Mail,
    variant: 'warning' as const,
    badge: '3'
  },
  {
    title: 'AI Daily Briefing',
    description: 'Get personalized insights & suggestions',
    icon: Bot,
    variant: 'glass' as const,
    isNew: true
  }
];

const recentActivity = [
  {
    type: 'meeting',
    title: 'Completed "User Research Review"',
    time: '2 hours ago',
    icon: Calendar,
    color: 'text-primary'
  },
  {
    type: 'email',
    title: 'Replied to Sarah Chen about Q4 roadmap',
    time: '3 hours ago',
    icon: Mail,
    color: 'text-accent-orange'
  },
  {
    type: 'task',
    title: 'Updated task "Code Review - Auth Module"',
    time: '4 hours ago',
    icon: CheckSquare,
    color: 'text-secondary'
  },
  {
    type: 'wellness',
    title: 'Completed mindfulness break',
    time: '5 hours ago',
    icon: Heart,
    color: 'text-success'
  }
];

const aiInsights = [
  {
    title: 'Meeting Optimization',
    insight: 'You have 3 back-to-back meetings today. Consider adding 5-minute buffers.',
    action: 'Reschedule',
    priority: 'medium'
  },
  {
    title: 'Email Efficiency',
    insight: 'Your email response time has improved by 40% this week!',
    action: 'View Stats',
    priority: 'positive'
  },
  {
    title: 'Wellness Alert',
    insight: 'You haven\'t taken a break in 3 hours. Time for a quick walk?',
    action: 'Take Break',
    priority: 'high'
  }
];

export default function Dashboard() {
  const { user, tasks, meetings, emails } = useAppStore();

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
        {/* Welcome Header */}
        <motion.div variants={itemVariants} className="space-y-2">
          <div className="flex items-center space-x-3">
            <h1 className="text-3xl lg:text-4xl font-clash font-bold gradient-text">
              Good morning, {user?.name.split(' ')[0]}! 
            </h1>
            <motion.div
              animate={{ rotate: [0, 15, 0] }}
              transition={{ duration: 1, repeat: Infinity, repeatDelay: 3 }}
            >
              👋
            </motion.div>
          </div>
          <p className="text-lg text-muted-foreground font-satoshi">
            Here's your personalized AI-powered dashboard for {new Date().toLocaleDateString('en-US', { 
              weekday: 'long', 
              year: 'numeric', 
              month: 'long', 
              day: 'numeric' 
            })}
          </p>
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
              <Card className="glass-card glass-hover border-glass-border/50 backdrop-blur-xl">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div className="space-y-2">
                      <p className="text-sm font-jakarta text-muted-foreground">
                        {stat.title}
                      </p>
                      <p className="text-3xl font-space-grotesk font-bold">
                        {stat.value}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {stat.change}
                      </p>
                    </div>
                    <div className={cn("p-3 rounded-xl", stat.bgColor)}>
                      <stat.icon className={cn("w-6 h-6", stat.color)} />
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
              <h2 className="text-xl font-clash font-semibold">Quick Actions</h2>
              <Button variant="ghost" size="sm">
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
                  <Card className="glass-card glass-hover border-glass-border/50 backdrop-blur-xl cursor-pointer group">
                    <CardContent className="p-6">
                      <div className="flex items-start justify-between mb-4">
                        <div className={cn(
                          "p-3 rounded-xl transition-all duration-200",
                          action.variant === 'premium' ? 'gradient-primary' :
                          action.variant === 'warning' ? 'bg-warning/10' :
                          'bg-glass'
                        )}>
                          <action.icon className={cn(
                            "w-5 h-5 group-hover:scale-110 transition-transform duration-200",
                            action.variant === 'premium' ? 'text-white' :
                            action.variant === 'warning' ? 'text-warning' :
                            'text-primary'
                          )} />
                        </div>
                        
                        {action.isNew && (
                          <Badge className="bg-primary/20 text-primary border-primary/30">
                            New
                          </Badge>
                        )}
                        
                        {action.badge && (
                          <Badge variant="destructive">
                            {action.badge}
                          </Badge>
                        )}
                        
                        {action.time && (
                          <div className="flex items-center space-x-1 text-muted-foreground">
                            <Clock className="w-3 h-3" />
                            <span className="text-xs font-jakarta">{action.time}</span>
                          </div>
                        )}
                      </div>
                      
                      <h3 className="font-jakarta font-semibold mb-2">
                        {action.title}
                      </h3>
                      <p className="text-sm text-muted-foreground">
                        {action.description}
                      </p>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
          </motion.div>

          {/* AI Insights */}
          <motion.div variants={itemVariants} className="space-y-6">
            <div className="flex items-center space-x-2">
              <Sparkles className="w-5 h-5 text-primary" />
              <h2 className="text-xl font-clash font-semibold">AI Insights</h2>
            </div>
            
            <div className="space-y-4">
              {aiInsights.map((insight, index) => (
                <motion.div
                  key={insight.title}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.3, delay: index * 0.1 }}
                >
                  <Card className={cn(
                    "glass-card border-l-4 backdrop-blur-xl",
                    insight.priority === 'high' ? 'border-l-destructive' :
                    insight.priority === 'positive' ? 'border-l-success' :
                    'border-l-primary'
                  )}>
                    <CardContent className="p-4">
                      <h4 className="font-jakarta font-semibold text-sm mb-2">
                        {insight.title}
                      </h4>
                      <p className="text-sm text-muted-foreground mb-3">
                        {insight.insight}
                      </p>
                      <Button variant="ghost" size="sm" className="text-xs">
                        {insight.action}
                        <ArrowRight className="w-3 h-3 ml-1" />
                      </Button>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>

            {/* AI Chat Widget */}
            <Card className="glass-card border-primary/20 backdrop-blur-xl">
              <CardContent className="p-6">
                <div className="flex items-center space-x-3 mb-4">
                  <div className="p-2 gradient-primary rounded-lg">
                    <Bot className="w-4 h-4 text-white" />
                  </div>
                  <div>
                    <h4 className="font-jakarta font-semibold text-sm">
                      AI Assistant
                    </h4>
                    <p className="text-xs text-muted-foreground">
                      Always here to help
                    </p>
                  </div>
                </div>
                
                <div className="space-y-3">
                  <div className="p-3 bg-glass rounded-lg">
                    <p className="text-sm">
                      "Would you like me to reschedule your 3 PM meeting to create a buffer before your 4 PM call?"
                    </p>
                  </div>
                  
                  <div className="flex space-x-2">
                    <Button variant="premium" size="sm" className="flex-1">
                      <MessageCircle className="w-3 h-3 mr-2" />
                      Chat Now
                    </Button>
                    <Button variant="ghost" size="sm">
                      Later
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>

        {/* Recent Activity */}
        <motion.div variants={itemVariants} className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-clash font-semibold">Recent Activity</h2>
            <Button variant="ghost" size="sm">
              View All
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </div>
          
          <Card className="glass-card border-glass-border/50 backdrop-blur-xl">
            <CardContent className="p-6">
              <div className="space-y-4">
                {recentActivity.map((activity, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.3, delay: index * 0.1 }}
                    className="flex items-center space-x-4 p-3 rounded-lg hover:bg-glass-hover transition-all duration-200"
                  >
                    <div className="p-2 bg-glass rounded-lg">
                      <activity.icon className={cn("w-4 h-4", activity.color)} />
                    </div>
                    <div className="flex-1">
                      <p className="font-jakarta font-medium text-sm">
                        {activity.title}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {activity.time}
                      </p>
                    </div>
                  </motion.div>
                ))}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </motion.div>
    </div>
  );
}