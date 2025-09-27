import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { 
  TrendingUp, 
  TrendingDown, 
  Clock, 
  Target, 
  Users, 
  Calendar,
  Brain,
  Zap,
  Award,
  Activity
} from "lucide-react";

const Analytics = () => {
  const metrics = [
    { 
      title: "Productivity Score", 
      value: 87, 
      change: +12, 
      icon: Brain,
      gradient: "from-primary to-primary-glow"
    },
    { 
      title: "Tasks Completed", 
      value: 142, 
      change: +23, 
      icon: Target,
      gradient: "from-secondary to-accent-cyan"
    },
    { 
      title: "Focus Time", 
      value: "6.2h", 
      change: +8, 
      icon: Clock,
      gradient: "from-accent-orange to-warning"
    },
    { 
      title: "Team Collaboration", 
      value: 94, 
      change: -3, 
      icon: Users,
      gradient: "from-primary-pink to-destructive"
    }
  ];

  const weeklyData = [
    { day: "Mon", productivity: 85, focus: 6.5, tasks: 12 },
    { day: "Tue", productivity: 92, focus: 7.2, tasks: 15 },
    { day: "Wed", productivity: 78, focus: 5.8, tasks: 9 },
    { day: "Thu", productivity: 89, focus: 6.9, tasks: 13 },
    { day: "Fri", productivity: 95, focus: 8.1, tasks: 18 },
    { day: "Sat", productivity: 67, focus: 4.2, tasks: 6 },
    { day: "Sun", productivity: 45, focus: 2.1, tasks: 3 }
  ];

  const leaderboard = [
    { name: "Sarah Chen", avatar: "SC", score: 94, badge: "🏆" },
    { name: "Mike Johnson", avatar: "MJ", score: 91, badge: "🥈" },
    { name: "You", avatar: "AL", score: 87, badge: "🥉" },
    { name: "Lisa Park", avatar: "LP", score: 84, badge: "" },
    { name: "David Kim", avatar: "DK", score: 81, badge: "" }
  ];

  const insights = [
    {
      type: "positive",
      title: "Peak Performance Window",
      description: "You're most productive between 9-11 AM. Consider scheduling important tasks during this time.",
      icon: TrendingUp
    },
    {
      type: "warning", 
      title: "Meeting Overload",
      description: "31% of your time spent in meetings this week. Try blocking focus time.",
      icon: Calendar
    },
    {
      type: "suggestion",
      title: "Break Optimization",
      description: "Taking 5-minute breaks every hour could boost productivity by 15%.",
      icon: Zap
    }
  ];

  return (
    <motion.div 
      className="p-6 space-y-6"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, ease: "easeOut" }}
    >
      {/* Header */}
      <div className="flex flex-col space-y-2">
        <motion.h1 
          className="text-4xl font-clash font-bold gradient-text"
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.2 }}
        >
          Performance Analytics
        </motion.h1>
        <p className="text-muted-foreground font-dm-sans">
          AI-powered insights into your productivity patterns and performance trends
        </p>
      </div>

      {/* Key Metrics Grid */}
      <motion.div 
        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6"
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3, staggerChildren: 0.1 }}
      >
        {metrics.map((metric, index) => (
          <motion.div
            key={metric.title}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.4 + index * 0.1 }}
          >
            <Card className="glass-card glass-hover group relative overflow-hidden">
              <div className={`absolute inset-0 bg-gradient-to-br ${metric.gradient} opacity-5 group-hover:opacity-10 transition-opacity duration-300`} />
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-jakarta font-medium">
                  {metric.title}
                </CardTitle>
                <metric.icon className="h-5 w-5 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="flex items-center space-x-2">
                  <div className="text-3xl font-space-grotesk font-bold">
                    {metric.value}
                  </div>
                  <Badge 
                    variant={metric.change > 0 ? "default" : "destructive"}
                    className="text-xs"
                  >
                    {metric.change > 0 ? <TrendingUp className="h-3 w-3 mr-1" /> : <TrendingDown className="h-3 w-3 mr-1" />}
                    {Math.abs(metric.change)}%
                  </Badge>
                </div>
                {typeof metric.value === 'number' && (
                  <Progress 
                    value={metric.value} 
                    className="mt-3 h-2"
                  />
                )}
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </motion.div>

      {/* Charts and Detailed Analytics */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Weekly Productivity Chart */}
        <motion.div
          className="lg:col-span-2"
          initial={{ opacity: 0, x: -30 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.6 }}
        >
          <Card className="glass-card">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="font-dm-sans">Weekly Performance</CardTitle>
                <Tabs defaultValue="productivity" className="w-[400px]">
                  <TabsList className="grid w-full grid-cols-3">
                    <TabsTrigger value="productivity">Productivity</TabsTrigger>
                    <TabsTrigger value="focus">Focus Time</TabsTrigger>
                    <TabsTrigger value="tasks">Tasks</TabsTrigger>
                  </TabsList>
                </Tabs>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {weeklyData.map((day, index) => (
                  <motion.div
                    key={day.day}
                    className="flex items-center space-x-4"
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.7 + index * 0.1 }}
                  >
                    <div className="w-12 text-sm font-jakarta font-medium text-muted-foreground">
                      {day.day}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center space-x-2">
                        <Progress value={day.productivity} className="flex-1 h-3" />
                        <span className="text-sm font-space-grotesk font-medium w-8">
                          {day.productivity}%
                        </span>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Team Leaderboard */}
        <motion.div
          initial={{ opacity: 0, x: 30 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.7 }}
        >
          <Card className="glass-card">
            <CardHeader>
              <CardTitle className="font-dm-sans flex items-center space-x-2">
                <Award className="h-5 w-5" />
                <span>Team Leaderboard</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {leaderboard.map((member, index) => (
                  <motion.div
                    key={member.name}
                    className={`flex items-center space-x-3 p-3 rounded-xl transition-colors duration-200 ${
                      member.name === "You" ? "bg-primary/10 border border-primary/20" : "hover:bg-muted/50"
                    }`}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.8 + index * 0.1 }}
                    whileHover={{ scale: 1.02 }}
                  >
                    <div className="flex items-center space-x-3 flex-1">
                      <div className="w-8 h-8 rounded-full bg-gradient-primary flex items-center justify-center text-white text-sm font-semibold">
                        {member.avatar}
                      </div>
                      <div>
                        <div className="font-jakarta font-medium">{member.name}</div>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      {member.badge && <span className="text-lg">{member.badge}</span>}
                      <span className="font-space-grotesk font-bold">{member.score}</span>
                    </div>
                  </motion.div>
                ))}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* AI Insights Panel */}
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.9 }}
      >
        <Card className="glass-card">
          <CardHeader>
            <CardTitle className="font-dm-sans flex items-center space-x-2">
              <Brain className="h-5 w-5 text-primary" />
              <span>AI Performance Insights</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {insights.map((insight, index) => (
                <motion.div
                  key={insight.title}
                  className={`p-4 rounded-xl border-2 border-dashed transition-all duration-300 hover:scale-105 ${
                    insight.type === 'positive' 
                      ? 'border-success/30 bg-success/5 hover:border-success/50' 
                      : insight.type === 'warning'
                      ? 'border-warning/30 bg-warning/5 hover:border-warning/50'
                      : 'border-primary/30 bg-primary/5 hover:border-primary/50'
                  }`}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 1 + index * 0.1 }}
                >
                  <div className="flex items-start space-x-3">
                    <insight.icon className="h-5 w-5 mt-1 text-primary" />
                    <div>
                      <h4 className="font-jakarta font-semibold text-sm mb-1">
                        {insight.title}
                      </h4>
                      <p className="text-xs text-muted-foreground leading-relaxed">
                        {insight.description}
                      </p>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </motion.div>
  );
};

export default Analytics;