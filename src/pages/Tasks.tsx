import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  CheckSquare, 
  Plus, 
  Filter, 
  Search, 
  Clock, 
  User, 
  Tag,
  ChevronRight,
  Calendar,
  AlertCircle,
  Flag,
  MoreHorizontal,
  Play,
  Pause,
  CheckCircle2,
  Circle,
  ArrowRight,
  Bot,
  Sparkles
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAppStore } from '@/stores/useAppStore';
import { cn } from '@/lib/utils';

const priorityColors = {
  urgent: 'bg-destructive/20 text-destructive border-destructive/30',
  high: 'bg-warning/20 text-warning border-warning/30',
  medium: 'bg-primary/20 text-primary border-primary/30',
  low: 'bg-muted/40 text-muted-foreground border-muted/60'
};

const statusColors = {
  'todo': 'bg-glass text-muted-foreground',
  'in-progress': 'bg-primary/20 text-primary border-primary/30',
  'review': 'bg-warning/20 text-warning border-warning/30',
  'done': 'bg-success/20 text-success border-success/30'
};

export default function Tasks() {
  const { tasks, updateTask } = useAppStore();
  const [selectedTab, setSelectedTab] = useState('kanban');
  const [searchQuery, setSearchQuery] = useState('');
  const [showAIAssistant, setShowAIAssistant] = useState(false);

  const getTasksByStatus = (status: string) => {
    return tasks.filter(task => task.status === status);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric'
    });
  };

  const isOverdue = (dueDate: string) => {
    return new Date(dueDate) < new Date();
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

  const columns = [
    { 
      id: 'todo', 
      title: 'To Do', 
      count: getTasksByStatus('todo').length,
      color: 'border-muted/60'
    },
    { 
      id: 'in-progress', 
      title: 'In Progress', 
      count: getTasksByStatus('in-progress').length,
      color: 'border-primary/30'
    },
    { 
      id: 'review', 
      title: 'Review', 
      count: getTasksByStatus('review').length,
      color: 'border-warning/30'
    },
    { 
      id: 'done', 
      title: 'Done', 
      count: getTasksByStatus('done').length,
      color: 'border-success/30'
    }
  ];

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
                Tasks
              </h1>
              <p className="text-muted-foreground font-satoshi mt-2">
                Organize and track your work with AI-powered insights
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
                New Task
              </Button>
            </div>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { label: 'Total Tasks', value: tasks.length, color: 'text-primary' },
              { label: 'In Progress', value: getTasksByStatus('in-progress').length, color: 'text-warning' },
              { label: 'Completed', value: getTasksByStatus('done').length, color: 'text-success' },
              { label: 'Overdue', value: tasks.filter(t => isOverdue(t.dueDate)).length, color: 'text-destructive' }
            ].map((stat, index) => (
              <motion.div
                key={stat.label}
                whileHover={{ scale: 1.02 }}
                transition={{ type: "spring", stiffness: 300 }}
              >
                <Card className="glass-card glass-hover border-glass-border/50">
                  <CardContent className="p-4">
                    <div className="text-center">
                      <p className={`text-2xl font-space-grotesk font-bold ${stat.color}`}>
                        {stat.value}
                      </p>
                      <p className="text-sm text-muted-foreground font-jakarta">
                        {stat.label}
                      </p>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>

          {/* Search and Filters */}
          <div className="flex flex-col lg:flex-row gap-4">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search tasks..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 glass-card border-glass-border/50 focus:border-primary/50"
              />
            </div>
            <div className="flex items-center space-x-2">
              <Button variant="glass" size="icon">
                <Filter className="w-4 h-4" />
              </Button>
              <Button variant="glass">
                Priority
              </Button>
              <Button variant="glass">
                Assignee
              </Button>
            </div>
          </div>
        </motion.div>

        <div className="grid grid-cols-1 xl:grid-cols-4 gap-8">
          {/* Main Content */}
          <div className="xl:col-span-3">
            <Tabs value={selectedTab} onValueChange={setSelectedTab}>
              <TabsList className="glass-card border-glass-border/50 mb-6">
                <TabsTrigger value="kanban" className="font-jakarta">
                  Kanban Board
                </TabsTrigger>
                <TabsTrigger value="list" className="font-jakarta">
                  List View
                </TabsTrigger>
              </TabsList>

              <TabsContent value="kanban">
                <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                  {columns.map((column, columnIndex) => (
                    <motion.div
                      key={column.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.3, delay: columnIndex * 0.1 }}
                      className="space-y-4"
                    >
                      {/* Column Header */}
                      <div className={cn(
                        "p-4 glass-card rounded-xl border-l-4",
                        column.color
                      )}>
                        <div className="flex items-center justify-between">
                          <h3 className="font-jakarta font-semibold">
                            {column.title}
                          </h3>
                          <Badge className="bg-glass text-muted-foreground">
                            {column.count}
                          </Badge>
                        </div>
                      </div>

                      {/* Tasks */}
                      <div className="space-y-3 min-h-[400px]">
                        <AnimatePresence>
                          {getTasksByStatus(column.id).map((task, taskIndex) => (
                            <motion.div
                              key={task.id}
                              initial={{ opacity: 0, scale: 0.9 }}
                              animate={{ opacity: 1, scale: 1 }}
                              exit={{ opacity: 0, scale: 0.9 }}
                              whileHover={{ scale: 1.02 }}
                              transition={{ 
                                type: "spring", 
                                stiffness: 300, 
                                damping: 20,
                                delay: taskIndex * 0.05 
                              }}
                              className="cursor-pointer"
                            >
                              <Card className="glass-card glass-hover border-glass-border/50 backdrop-blur-xl group">
                                <CardContent className="p-4 space-y-3">
                                  {/* Task Header */}
                                  <div className="flex items-start justify-between">
                                    <h4 className="font-jakarta font-semibold text-sm leading-tight flex-1 pr-2">
                                      {task.title}
                                    </h4>
                                    <Button 
                                      variant="ghost" 
                                      size="icon-sm"
                                      className="opacity-0 group-hover:opacity-100 transition-opacity"
                                    >
                                      <MoreHorizontal className="w-3 h-3" />
                                    </Button>
                                  </div>

                                  {/* Task Description */}
                                  <p className="text-xs text-muted-foreground line-clamp-2">
                                    {task.description}
                                  </p>

                                  {/* Priority & Due Date */}
                                  <div className="flex items-center justify-between">
                                    <Badge className={cn("text-xs", priorityColors[task.priority])}>
                                      <Flag className="w-2 h-2 mr-1" />
                                      {task.priority}
                                    </Badge>
                                    
                                    <div className={cn(
                                      "flex items-center space-x-1 text-xs",
                                      isOverdue(task.dueDate) ? "text-destructive" : "text-muted-foreground"
                                    )}>
                                      <Calendar className="w-3 h-3" />
                                      <span>{formatDate(task.dueDate)}</span>
                                      {isOverdue(task.dueDate) && (
                                        <AlertCircle className="w-3 h-3" />
                                      )}
                                    </div>
                                  </div>

                                  {/* Tags */}
                                  {task.tags.length > 0 && (
                                    <div className="flex flex-wrap gap-1">
                                      {task.tags.slice(0, 2).map((tag) => (
                                        <Badge key={tag} variant="outline" className="text-xs">
                                          {tag}
                                        </Badge>
                                      ))}
                                      {task.tags.length > 2 && (
                                        <Badge variant="outline" className="text-xs">
                                          +{task.tags.length - 2}
                                        </Badge>
                                      )}
                                    </div>
                                  )}

                                  {/* Assignee */}
                                  <div className="flex items-center justify-between pt-2 border-t border-glass-border/30">
                                    <div className="flex items-center space-x-2">
                                      <div className="w-5 h-5 rounded-full bg-primary/20 flex items-center justify-center">
                                        <User className="w-3 h-3 text-primary" />
                                      </div>
                                      <span className="text-xs text-muted-foreground">
                                        {task.assignee.split(' ')[0]}
                                      </span>
                                    </div>
                                    
                                    <div className="flex items-center space-x-1">
                                      {task.status === 'in-progress' && (
                                        <Button 
                                          variant="ghost" 
                                          size="icon-sm"
                                          onClick={() => updateTask(task.id, { status: 'review' })}
                                        >
                                          <Pause className="w-3 h-3" />
                                        </Button>
                                      )}
                                      {task.status === 'todo' && (
                                        <Button 
                                          variant="ghost" 
                                          size="icon-sm"
                                          onClick={() => updateTask(task.id, { status: 'in-progress' })}
                                        >
                                          <Play className="w-3 h-3" />
                                        </Button>
                                      )}
                                      {(task.status === 'review' || task.status === 'in-progress') && (
                                        <Button 
                                          variant="ghost" 
                                          size="icon-sm"
                                          onClick={() => updateTask(task.id, { status: 'done' })}
                                        >
                                          <CheckCircle2 className="w-3 h-3" />
                                        </Button>
                                      )}
                                    </div>
                                  </div>
                                </CardContent>
                              </Card>
                            </motion.div>
                          ))}
                        </AnimatePresence>

                        {/* Add Task Button */}
                        <motion.div
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                          className="cursor-pointer"
                        >
                          <Card className="glass-card glass-hover border-glass-border/50 border-dashed">
                            <CardContent className="p-6 flex items-center justify-center">
                              <div className="text-center space-y-2">
                                <Plus className="w-5 h-5 text-muted-foreground mx-auto" />
                                <p className="text-sm text-muted-foreground font-jakarta">
                                  Add Task
                                </p>
                              </div>
                            </CardContent>
                          </Card>
                        </motion.div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </TabsContent>

              <TabsContent value="list">
                <div className="space-y-3">
                  {tasks.map((task, index) => (
                    <motion.div
                      key={task.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ duration: 0.3, delay: index * 0.05 }}
                      whileHover={{ scale: 1.01 }}
                    >
                      <Card className="glass-card glass-hover border-glass-border/50 backdrop-blur-xl">
                        <CardContent className="p-4">
                          <div className="flex items-center space-x-4">
                            <Button
                              variant="ghost"
                              size="icon-sm"
                              onClick={() => updateTask(task.id, { 
                                status: task.status === 'done' ? 'todo' : 'done' 
                              })}
                            >
                              {task.status === 'done' ? (
                                <CheckCircle2 className="w-5 h-5 text-success" />
                              ) : (
                                <Circle className="w-5 h-5 text-muted-foreground" />
                              )}
                            </Button>
                            
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center space-x-3 mb-1">
                                <h4 className={cn(
                                  "font-jakarta font-semibold",
                                  task.status === 'done' && "line-through text-muted-foreground"
                                )}>
                                  {task.title}
                                </h4>
                                <Badge className={cn("text-xs", priorityColors[task.priority])}>
                                  {task.priority}
                                </Badge>
                                <Badge className={cn("text-xs", statusColors[task.status])}>
                                  {task.status.replace('-', ' ')}
                                </Badge>
                              </div>
                              <p className="text-sm text-muted-foreground mb-2">
                                {task.description}
                              </p>
                              <div className="flex items-center space-x-4 text-xs text-muted-foreground">
                                <div className="flex items-center">
                                  <Calendar className="w-3 h-3 mr-1" />
                                  {formatDate(task.dueDate)}
                                </div>
                                <div className="flex items-center">
                                  <User className="w-3 h-3 mr-1" />
                                  {task.assignee}
                                </div>
                                <div className="flex space-x-1">
                                  {task.tags.slice(0, 3).map((tag) => (
                                    <Badge key={tag} variant="outline" className="text-xs">
                                      {tag}
                                    </Badge>
                                  ))}
                                </div>
                              </div>
                            </div>
                            
                            <ChevronRight className="w-4 h-4 text-muted-foreground" />
                          </div>
                        </CardContent>
                      </Card>
                    </motion.div>
                  ))}
                </div>
              </TabsContent>
            </Tabs>
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
                        <CardTitle className="text-sm font-jakarta">AI Task Assistant</CardTitle>
                        <CardDescription className="text-xs">Smart task management</CardDescription>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-3">
                      <Button variant="glass" className="w-full justify-start text-xs">
                        <Sparkles className="w-3 h-3 mr-2" />
                        Smart Prioritization
                      </Button>
                      <Button variant="glass" className="w-full justify-start text-xs">
                        <Bot className="w-3 h-3 mr-2" />
                        Break Down Tasks
                      </Button>
                      <Button variant="glass" className="w-full justify-start text-xs">
                        <Clock className="w-3 h-3 mr-2" />
                        Time Estimation
                      </Button>
                    </div>
                  </CardContent>
                </Card>

                <Card className="glass-card border-glass-border/50 backdrop-blur-xl">
                  <CardHeader>
                    <CardTitle className="text-sm font-jakarta">Productivity Insights</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-3">
                      <div className="flex justify-between items-center">
                        <span className="text-xs text-muted-foreground">Completion Rate</span>
                        <span className="text-sm font-space-grotesk font-bold text-success">
                          {Math.round((getTasksByStatus('done').length / tasks.length) * 100)}%
                        </span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-xs text-muted-foreground">Avg. Task Time</span>
                        <span className="text-sm font-space-grotesk font-bold">2.3 days</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-xs text-muted-foreground">Focus Score</span>
                        <span className="text-sm font-space-grotesk font-bold text-primary">87%</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="glass-card border-glass-border/50 backdrop-blur-xl">
                  <CardHeader>
                    <CardTitle className="text-sm font-jakarta">Quick Actions</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <Button variant="premium" size="sm" className="w-full">
                      <Plus className="w-3 h-3 mr-2" />
                      Create Template
                    </Button>
                    <Button variant="glass" size="sm" className="w-full">
                      <ArrowRight className="w-3 h-3 mr-2" />
                      Bulk Actions
                    </Button>
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