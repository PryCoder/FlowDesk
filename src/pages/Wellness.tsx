import { useState } from "react";
import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Slider } from "@/components/ui/slider";
import { 
  Heart, 
  Coffee, 
  Leaf, 
  Moon, 
  Target,
  TrendingUp,
  Zap,
  Brain,
  Clock,
  Award,
  Smile,
  Meh,
  Frown,
  Sparkles,
  Activity
} from "lucide-react";

const Wellness = () => {
  const [todayMood, setTodayMood] = useState(7);
  const [selectedActivity, setSelectedActivity] = useState<string | null>(null);

  const wellnessScore = 78;
  
  const moodEmojis = [
    { value: 1, emoji: "😢", label: "Terrible" },
    { value: 2, emoji: "😞", label: "Bad" },
    { value: 3, emoji: "😕", label: "Poor" },
    { value: 4, emoji: "😐", label: "Okay" },
    { value: 5, emoji: "🙂", label: "Good" },
    { value: 6, emoji: "😊", label: "Great" },
    { value: 7, emoji: "😄", label: "Excellent" },
    { value: 8, emoji: "🤩", label: "Amazing" },
    { value: 9, emoji: "😍", label: "Fantastic" },
    { value: 10, emoji: "🥳", label: "Perfect" }
  ];

  const activities = [
    {
      id: 'water',
      title: 'Hydration Break',
      subtitle: 'Drink 250ml of water',
      icon: Coffee,
      duration: '30 sec',
      benefit: '+5 Energy',
      gradient: 'from-accent-cyan to-secondary',
      completed: false
    },
    {
      id: 'stretch',
      title: 'Quick Stretch',
      subtitle: 'Neck & shoulder relief',
      icon: Activity,
      duration: '3 min',
      benefit: '+8 Wellness',
      gradient: 'from-secondary to-success',
      completed: true
    },
    {
      id: 'breathe',
      title: 'Deep Breathing',
      subtitle: '4-7-8 breathing technique',
      icon: Leaf,
      duration: '5 min',
      benefit: '+12 Focus',
      gradient: 'from-primary to-primary-glow',
      completed: false
    },
    {
      id: 'walk',
      title: 'Mindful Walk',
      subtitle: 'Step outside for fresh air',
      icon: Heart,
      duration: '10 min',
      benefit: '+15 Mood',
      gradient: 'from-primary-pink to-accent-orange',
      completed: false
    }
  ];

  const streaks = [
    { activity: 'Daily Hydration', current: 12, target: 30, icon: Coffee },
    { activity: 'Mindful Breaks', current: 8, target: 21, icon: Brain },
    { activity: 'Sleep Schedule', current: 5, target: 14, icon: Moon },
    { activity: 'Exercise', current: 3, target: 7, icon: Activity }
  ];

  const weeklyMood = [
    { day: 'Mon', mood: 6, stress: 4 },
    { day: 'Tue', mood: 7, stress: 3 },
    { day: 'Wed', mood: 5, stress: 6 },
    { day: 'Thu', mood: 8, stress: 2 },
    { day: 'Fri', mood: 9, stress: 1 },
    { day: 'Sat', mood: 8, stress: 2 },
    { day: 'Sun', mood: 7, stress: 3 }
  ];

  const aiTips = [
    {
      title: "Peak Energy Window",
      message: "Your energy levels are highest at 10 AM. Schedule important tasks then!",
      type: "insight"
    },
    {
      title: "Stress Alert",
      message: "You've been stressed for 3 days. Try the breathing exercise now.",
      type: "warning"
    },
    {
      title: "Great Progress!",
      message: "Your sleep consistency improved 40% this week. Keep it up!",
      type: "celebration"
    }
  ];

  const getCurrentMoodEmoji = () => {
    return moodEmojis.find(m => m.value === todayMood) || moodEmojis[6];
  };

  return (
    <motion.div 
      className="p-6 space-y-6"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, ease: "easeOut" }}
    >
      {/* Header with Wellness Score */}
      <motion.div
        className="relative overflow-hidden rounded-3xl"
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.2 }}
      >
        <Card className="glass-card border-0 bg-gradient-to-br from-primary/10 via-primary-glow/5 to-primary-pink/10">
          <CardContent className="p-8">
            <div className="flex items-center justify-between">
              <div className="space-y-2">
                <motion.h1 
                  className="text-4xl font-clash font-bold gradient-text"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.3 }}
                >
                  Wellness Center
                </motion.h1>
                <p className="text-muted-foreground font-dm-sans">
                  Your AI-powered wellness companion for better work-life balance
                </p>
              </div>
              <div className="text-center">
                <div className="relative">
                  <div className="w-24 h-24 rounded-full bg-gradient-primary flex items-center justify-center text-white text-3xl font-space-grotesk font-bold animate-glow">
                    {wellnessScore}
                  </div>
                  <Badge className="absolute -top-2 -right-2 bg-success text-white">
                    <TrendingUp className="h-3 w-3 mr-1" />
                    +8
                  </Badge>
                </div>
                <p className="text-sm font-jakarta font-medium mt-2">Wellness Score</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Wellness Activities */}
        <motion.div
          className="lg:col-span-2 space-y-6"
          initial={{ opacity: 0, x: -30 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.4 }}
        >
          {/* Daily Mood Tracker */}
          <Card className="glass-card">
            <CardHeader>
              <CardTitle className="font-dm-sans flex items-center space-x-2">
                <Sparkles className="h-5 w-5 text-primary" />
                <span>How are you feeling today?</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <div className="text-center">
                  <div className="text-6xl mb-2">{getCurrentMoodEmoji().emoji}</div>
                  <p className="font-jakarta font-medium text-lg">{getCurrentMoodEmoji().label}</p>
                </div>
                
                <div className="px-4">
                  <Slider
                    value={[todayMood]}
                    onValueChange={(value) => setTodayMood(value[0])}
                    max={10}
                    min={1}
                    step={1}
                    className="w-full"
                  />
                  <div className="flex justify-between text-xs text-muted-foreground mt-2">
                    <span>1 (Terrible)</span>
                    <span>10 (Perfect)</span>
                  </div>
                </div>

                <Button className="w-full" variant="premium">
                  <Heart className="h-4 w-4 mr-2" />
                  Save Today's Mood
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Wellness Activities Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {activities.map((activity, index) => (
              <motion.div
                key={activity.id}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.5 + index * 0.1 }}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <Card 
                  className={`glass-card glass-hover cursor-pointer transition-all duration-300 ${
                    activity.completed ? 'opacity-60' : ''
                  } ${selectedActivity === activity.id ? 'ring-2 ring-primary' : ''}`}
                  onClick={() => setSelectedActivity(activity.id)}
                >
                  <CardContent className="p-6">
                    <div className="flex items-start space-x-4">
                      <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${activity.gradient} flex items-center justify-center text-white`}>
                        <activity.icon className="h-6 w-6" />
                      </div>
                      <div className="flex-1">
                        <h3 className="font-jakarta font-semibold">{activity.title}</h3>
                        <p className="text-sm text-muted-foreground">{activity.subtitle}</p>
                        <div className="flex items-center space-x-4 mt-3">
                          <Badge variant="outline" className="text-xs">
                            <Clock className="h-3 w-3 mr-1" />
                            {activity.duration}
                          </Badge>
                          <Badge variant="outline" className="text-xs">
                            <Zap className="h-3 w-3 mr-1" />
                            {activity.benefit}
                          </Badge>
                        </div>
                      </div>
                      {activity.completed && (
                        <div className="text-success">
                          <Award className="h-5 w-5" />
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* Sidebar Content */}
        <motion.div
          className="space-y-6"
          initial={{ opacity: 0, x: 30 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.6 }}
        >
          {/* Habit Streaks */}
          <Card className="glass-card">
            <CardHeader>
              <CardTitle className="font-dm-sans flex items-center space-x-2">
                <Target className="h-5 w-5" />
                <span>Habit Streaks</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {streaks.map((streak, index) => (
                  <motion.div
                    key={streak.activity}
                    className="space-y-2"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.7 + index * 0.1 }}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <streak.icon className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm font-jakarta">{streak.activity}</span>
                      </div>
                      <span className="text-xs text-muted-foreground">
                        {streak.current}/{streak.target}
                      </span>
                    </div>
                    <Progress 
                      value={(streak.current / streak.target) * 100} 
                      className="h-2"
                    />
                  </motion.div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Weekly Mood Chart */}
          <Card className="glass-card">
            <CardHeader>
              <CardTitle className="font-dm-sans">Weekly Mood Trend</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {weeklyMood.map((day, index) => (
                  <motion.div
                    key={day.day}
                    className="flex items-center space-x-3"
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.8 + index * 0.05 }}
                  >
                    <span className="w-8 text-xs font-jakarta text-muted-foreground">
                      {day.day}
                    </span>
                    <div className="flex-1 flex items-center space-x-2">
                      <Progress value={day.mood * 10} className="h-2 flex-1" />
                      <span className="text-xs font-space-grotesk w-6">{day.mood}</span>
                    </div>
                  </motion.div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* AI Coach Tips */}
          <Card className="glass-card">
            <CardHeader>
              <CardTitle className="font-dm-sans flex items-center space-x-2">
                <Brain className="h-5 w-5 text-primary" />
                <span>AI Wellness Coach</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {aiTips.map((tip, index) => (
                  <motion.div
                    key={tip.title}
                    className={`p-3 rounded-lg border-l-4 transition-all duration-300 hover:scale-105 ${
                      tip.type === 'insight' 
                        ? 'border-l-primary bg-primary/5'
                        : tip.type === 'warning'
                        ? 'border-l-warning bg-warning/5'
                        : 'border-l-success bg-success/5'
                    }`}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.9 + index * 0.1 }}
                  >
                    <h4 className="font-jakarta font-semibold text-sm">
                      {tip.title}
                    </h4>
                    <p className="text-xs text-muted-foreground mt-1">
                      {tip.message}
                    </p>
                  </motion.div>
                ))}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </motion.div>
  );
};

export default Wellness;