"use client";

import React, { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Plus,
  Search,
  Trash,
  ArrowRight,
  BarChart3,
  User,
  X,
  Filter,
  Calendar,
  Clock,
  CheckCircle2,
  PlayCircle,
  Eye,
  Circle,
  AlertCircle,
  TrendingUp,
  Users,
  Loader2,
  Sparkles,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

const API_BASE = "http://localhost:3001/api/tasks";
const USERS_API = "http://localhost:3001/api/auth";

export default function TasksPage() {
  const { toast } = useToast();

  const [tasks, setTasks] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [showUserList, setShowUserList] = useState(false);
  const [showTaskModal, setShowTaskModal] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState<any>(null);
  const [taskForm, setTaskForm] = useState({
    title: "",
    description: "",
    status: "todo",
    priority: "medium",
    dueDate: "",
  });

  const [searchQuery, setSearchQuery] = useState("");
  const [selectedTab, setSelectedTab] = useState("kanban");
  const [loading, setLoading] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [filterPriority, setFilterPriority] = useState("all");

  const token =
    typeof window !== "undefined" ? localStorage.getItem("token") : null;

  const headers = {
    "Content-Type": "application/json",
    Authorization: token ? `Bearer ${token}` : "",
  };

  // Map backend statuses to Kanban columns
  const statusMap: Record<string, string> = {
    todo: "todo",
    "in-progress": "in-progress",
    review: "review",
    done: "done",
    pending: "todo",
    cancelled: "done",
  };

  const columns = [
    { id: "todo", title: "To Do", icon: Circle, color: "bg-blue-500/20 border-blue-500/30 text-blue-300" },
    { id: "in-progress", title: "In Progress", icon: PlayCircle, color: "bg-amber-500/20 border-amber-500/30 text-amber-300" },
    { id: "review", title: "Review", icon: Eye, color: "bg-purple-500/20 border-purple-500/30 text-purple-300" },
    { id: "done", title: "Done", icon: CheckCircle2, color: "bg-green-500/20 border-green-500/30 text-green-300" },
  ];

  const priorityConfig = {
    low: { color: "bg-green-500/20 text-green-300 border-green-500/30", label: "Low" },
    medium: { color: "bg-amber-500/20 text-amber-300 border-amber-500/30", label: "Medium" },
    high: { color: "bg-red-500/20 text-red-300 border-red-500/30", label: "High" },
  };

  // ------------------ Fetch Current User ------------------
  const fetchCurrentUser = async () => {
    try {
      const res = await fetch(`${USERS_API}/current-user`, { headers });
      const data = await res.json();
      if (!data.success) throw new Error(data.error || "Unable to fetch user");

      const adminStatus = data.user.role === "admin";
      setIsAdmin(adminStatus);
      setCurrentUserId(data.user.id);
      return { ...data.user, isAdmin: adminStatus };
    } catch (err: any) {
      toast({
        title: "Error fetching current user",
        description: err.message,
        variant: "destructive",
      });
      return null;
    }
  };

  // ------------------ Fetch Users (Admin) ------------------
  const fetchUsers = async () => {
    try {
      const res = await fetch(`${USERS_API}/company/employees`, { headers });
      const data = await res.json();
      if (!data.success) throw new Error(data.error || "Unable to fetch employees");
      setUsers(data.employees || []);
    } catch (err: any) {
      toast({
        title: "Error fetching employees",
        description: err.message,
        variant: "destructive",
      });
    }
  };

  // ------------------ Fetch Tasks ------------------
  const fetchTasks = async (adminStatus?: boolean) => {
    setLoading(true);
    try {
      const userIsAdmin = adminStatus !== undefined ? adminStatus : isAdmin;
      const endpoint = userIsAdmin ? `${API_BASE}/company/all` : `${API_BASE}`;
      const res = await fetch(endpoint, { headers });
      const data = await res.json();
      if (!data.success) throw new Error(data.error || "Unable to fetch tasks");
      setTasks(data.tasks || []);
    } catch (err: any) {
      toast({
        title: "Error loading tasks",
        description: err.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  // ------------------ Open Task Modal ------------------
  const openTaskModal = (employee: any) => {
    setSelectedEmployee(employee);
    setTaskForm({
      title: "",
      description: "",
      status: "todo",
      priority: "medium",
      dueDate: "",
    });
    setShowTaskModal(true);
  };

  // ------------------ Create Task ------------------
  const createTask = async () => {
    if (!currentUserId || !selectedEmployee) return;

    try {
      const res = await fetch(API_BASE, {
        method: "POST",
        headers,
        body: JSON.stringify({
          ...taskForm,
          created_by: currentUserId,
          assigned_to: selectedEmployee.id,
        }),
      });

      const data = await res.json();
      if (!data.success) throw new Error(data.error || "Failed to create task");

      toast({
        title: "✨ Task Created",
        description: "Task assigned successfully.",
      });
      setShowTaskModal(false);
      fetchTasks(isAdmin);
    } catch (err: any) {
      toast({
        title: "Error Creating Task",
        description: err.message,
        variant: "destructive",
      });
    }
  };

  // ------------------ Update Status ------------------
  const updateStatus = async (taskId: string, status: string) => {
    try {
      const res = await fetch(`${API_BASE}/${taskId}/status`, {
        method: "PATCH",
        headers,
        body: JSON.stringify({ status }),
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.error || "Failed to update status");
      toast({ 
        title: "🔄 Status Updated", 
        description: `Task moved to ${status.replace('-', ' ')}` 
      });
      fetchTasks(isAdmin);
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    }
  };

  // ------------------ Delete Task ------------------
  const deleteTask = async (taskId: string) => {
    if (!confirm("Are you sure you want to delete this task?")) return;
    try {
      const res = await fetch(`${API_BASE}/${taskId}`, {
        method: "DELETE",
        headers,
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.error || "Failed to delete task");
      toast({ title: "🗑️ Deleted", description: "Task has been removed." });
      fetchTasks(isAdmin);
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    }
  };

  // ------------------ Initialization ------------------
  useEffect(() => {
    const init = async () => {
      setLoading(true);
      const user = await fetchCurrentUser();
      if (!user) return;
      if (user.isAdmin) await fetchUsers();
      await fetchTasks(user.isAdmin);
      setLoading(false);
    };
    init();
  }, []);

  // ------------------ Task Filtering ------------------
  const getTasksByStatus = (status: string) => {
    return tasks.filter(task => {
      const mappedStatus = statusMap[task.status] || "todo";
      const visibleToUser = isAdmin || task.assigned_to === currentUserId || task.created_by === currentUserId;
      const priorityMatch = filterPriority === "all" || task.priority === filterPriority;
      return mappedStatus === status && visibleToUser && priorityMatch;
    });
  };

  const filteredTasks = tasks.filter(task => {
    const visibleToUser = isAdmin || task.assigned_to === currentUserId || task.created_by === currentUserId;
    const priorityMatch = filterPriority === "all" || task.priority === filterPriority;
    return visibleToUser && priorityMatch && task.title?.toLowerCase().includes(searchQuery.toLowerCase());
  });

  // Get user initials for avatar
  const getUserInitials = (user: any) => {
    return `${user.first_name?.[0] || ''}${user.last_name?.[0] || ''}`.toUpperCase();
  };

  // Stats for dashboard
  const totalTasks = tasks.length;
  const completedTasks = tasks.filter(task => task.status === 'done').length;
  const inProgressTasks = tasks.filter(task => task.status === 'in-progress').length;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
      <motion.div 
        className="p-4 lg:p-6 space-y-6"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5 }}
      >
        {/* Header */}
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div className="space-y-2">
            <motion.h1 
              className="text-3xl lg:text-4xl font-bold bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent"
              initial={{ y: -20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.1 }}
            >
              Task Management
            </motion.h1>
            <p className="text-slate-400">
              {isAdmin ? "👑 Admin dashboard - All company tasks" : "👤 Your assigned tasks"}
            </p>
          </div>

          {isAdmin && (
            <motion.div 
              className="flex flex-wrap gap-2"
              initial={{ y: -20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.2 }}
            >
              <Button 
                onClick={() => toast({ 
                  title: "📊 Analytics Coming Soon",
                  description: "Advanced analytics features are in development" 
                })} 
                variant="outline" 
                className="bg-slate-800/50 border-slate-700 hover:bg-slate-700/50"
              >
                <TrendingUp className="w-4 h-4 mr-2" /> Analytics
              </Button>
              <Button 
                onClick={() => setShowUserList((prev) => !prev)}
                className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
              >
                <Plus className="w-4 h-4 mr-2" /> Create Task
              </Button>
            </motion.div>
          )}
        </div>

        {/* Stats Cards */}
        <motion.div 
          className="grid grid-cols-1 md:grid-cols-3 gap-4"
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.3 }}
        >
          <Card className="bg-slate-800/50 border-slate-700 backdrop-blur-sm">
            <CardContent className="p-4 flex items-center gap-4">
              <div className="p-3 rounded-full bg-blue-500/20">
                <Users className="w-6 h-6 text-blue-400" />
              </div>
              <div>
                <p className="text-2xl font-bold text-white">{totalTasks}</p>
                <p className="text-sm text-slate-400">Total Tasks</p>
              </div>
            </CardContent>
          </Card>
          
          <Card className="bg-slate-800/50 border-slate-700 backdrop-blur-sm">
            <CardContent className="p-4 flex items-center gap-4">
              <div className="p-3 rounded-full bg-amber-500/20">
                <PlayCircle className="w-6 h-6 text-amber-400" />
              </div>
              <div>
                <p className="text-2xl font-bold text-white">{inProgressTasks}</p>
                <p className="text-sm text-slate-400">In Progress</p>
              </div>
            </CardContent>
          </Card>
          
          <Card className="bg-slate-800/50 border-slate-700 backdrop-blur-sm">
            <CardContent className="p-4 flex items-center gap-4">
              <div className="p-3 rounded-full bg-green-500/20">
                <CheckCircle2 className="w-6 h-6 text-green-400" />
              </div>
              <div>
                <p className="text-2xl font-bold text-white">{completedTasks}</p>
                <p className="text-sm text-slate-400">Completed</p>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Employee list */}
        <AnimatePresence>
          {isAdmin && showUserList && (
            <motion.div 
              className="border border-slate-700 rounded-xl p-6 bg-slate-800/30 backdrop-blur-sm"
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.3 }}
            >
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold text-white">Select Employee to Assign Task</h2>
                <Badge variant="secondary" className="bg-slate-700 text-slate-300">
                  <Users className="w-3 h-3 mr-1" /> {users.length} employees
                </Badge>
              </div>
              {users.length === 0 ? (
                <p className="text-slate-400 text-center py-8">No employees found.</p>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
                  {users.map((user) => (
                    <motion.div
                      key={user.id}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      <Card 
                        onClick={() => openTaskModal(user)} 
                        className="cursor-pointer bg-slate-800/50 border-slate-700 hover:bg-slate-700/50 transition-all duration-200 backdrop-blur-sm"
                      >
                        <CardContent className="flex items-center gap-3 p-4">
                          <Avatar className="h-10 w-10 border border-slate-600">
                            <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-600 text-white">
                              {getUserInitials(user)}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-white truncate">{user.first_name} {user.last_name}</p>
                            <p className="text-xs text-slate-400 truncate">{user.email}</p>
                          </div>
                        </CardContent>
                      </Card>
                    </motion.div>
                  ))}
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Search and Filters */}
        <motion.div 
          className="flex flex-col sm:flex-row gap-4"
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.4 }}
        >
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
            <Input 
              className="pl-10 bg-slate-800/50 border-slate-700 text-white placeholder-slate-400 focus:ring-2 focus:ring-blue-500/50"
              placeholder="Search tasks..." 
              value={searchQuery} 
              onChange={(e) => setSearchQuery(e.target.value)} 
            />
          </div>
          <div className="flex gap-2">
            <select 
              className="px-3 py-2 bg-slate-800/50 border border-slate-700 rounded-md text-white text-sm focus:ring-2 focus:ring-blue-500/50"
              value={filterPriority}
              onChange={(e) => setFilterPriority(e.target.value)}
            >
              <option value="all">All Priorities</option>
              <option value="high">High Priority</option>
              <option value="medium">Medium Priority</option>
              <option value="low">Low Priority</option>
            </select>
          </div>
        </motion.div>

        {/* Loading State */}
        {loading ? (
          <div className="flex justify-center items-center p-12">
            <div className="text-center space-y-4">
              <Loader2 className="w-8 h-8 animate-spin text-blue-400 mx-auto" />
              <p className="text-slate-400">Loading tasks...</p>
            </div>
          </div>
        ) : (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
          >
            <Tabs value={selectedTab} onValueChange={setSelectedTab} className="space-y-6">
              <TabsList className="bg-slate-800/50 border border-slate-700 p-1 backdrop-blur-sm">
                <TabsTrigger 
                  value="kanban" 
                  className="data-[state=active]:bg-slate-700 data-[state=active]:text-white"
                >
                  📋 Kanban Board
                </TabsTrigger>
                <TabsTrigger 
                  value="list" 
                  className="data-[state=active]:bg-slate-700 data-[state=active]:text-white"
                >
                  📝 List View
                </TabsTrigger>
              </TabsList>

              {/* Kanban Board */}
              <TabsContent value="kanban" className="space-y-6">
                <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-4 gap-4">
                  {columns.map((col) => {
                    const IconComponent = col.icon;
                    const tasksInColumn = getTasksByStatus(col.id);
                    
                    return (
                      <motion.div
                        key={col.id}
                        layout
                        className="flex flex-col h-full"
                      >
                        <Card className={`border-2 ${col.color} backdrop-blur-sm flex-1 flex flex-col`}>
                          <CardHeader className="pb-3">
                            <div className="flex items-center gap-2">
                              <IconComponent className="w-5 h-5" />
                              <CardTitle className="text-lg font-semibold">{col.title}</CardTitle>
                            </div>
                            <CardDescription className="text-slate-300">
                              {tasksInColumn.length} task{tasksInColumn.length !== 1 ? 's' : ''}
                            </CardDescription>
                          </CardHeader>
                          <CardContent className="flex-1 space-y-3 pb-4">
                            <AnimatePresence>
                              {tasksInColumn.map((task, index) => (
                                <motion.div
                                  key={task.id}
                                  layout
                                  initial={{ opacity: 0, scale: 0.9 }}
                                  animate={{ opacity: 1, scale: 1 }}
                                  exit={{ opacity: 0, scale: 0.9 }}
                                  transition={{ delay: index * 0.1 }}
                                  className="p-4 bg-slate-800/50 border border-slate-700 rounded-lg hover:bg-slate-700/50 transition-all duration-200 group"
                                >
                                  <div className="flex justify-between items-start mb-2">
                                    <h3 className="font-medium text-white text-sm leading-tight pr-2">
                                      {task.title}
                                    </h3>
                                    {isAdmin && (
                                      <Trash 
                                        className="w-4 h-4 text-slate-500 cursor-pointer hover:text-red-400 transition-colors opacity-0 group-hover:opacity-100" 
                                        onClick={() => deleteTask(task.id)} 
                                      />
                                    )}
                                  </div>
                                  
                                  <p className="text-xs text-slate-400 mb-3 line-clamp-2">
                                    {task.description}
                                  </p>
                                  
                                  <div className="flex items-center justify-between">
                                    <Badge 
                                      variant="outline" 
                                      className={`text-xs ${priorityConfig[task.priority as keyof typeof priorityConfig]?.color || 'bg-gray-500/20'}`}
                                    >
                                      {task.priority}
                                    </Badge>
                                    
                                    {col.id !== 'done' && (
                                      <Button 
                                        size="sm" 
                                        variant="ghost" 
                                        className="h-7 text-xs bg-slate-700/50 hover:bg-slate-600/50"
                                        onClick={() => {
                                          const currentIndex = columns.findIndex(c => c.id === statusMap[task.status]);
                                          const nextStatus = columns[Math.min(currentIndex + 1, columns.length - 1)].id;
                                          updateStatus(task.id, nextStatus);
                                        }}
                                      >
                                        Move <ArrowRight className="w-3 h-3 ml-1" />
                                      </Button>
                                    )}
                                  </div>
                                </motion.div>
                              ))}
                            </AnimatePresence>
                            
                            {tasksInColumn.length === 0 && (
                              <motion.div 
                                className="text-center py-8 text-slate-500"
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                              >
                                <div className="text-4xl mb-2">📭</div>
                                <p className="text-sm">No tasks here</p>
                              </motion.div>
                            )}
                          </CardContent>
                        </Card>
                      </motion.div>
                    );
                  })}
                </div>
              </TabsContent>

              {/* List View */}
              <TabsContent value="list">
                {filteredTasks.length === 0 ? (
                  <motion.div 
                    className="text-center py-16"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                  >
                    <div className="text-6xl mb-4">🔍</div>
                    <h3 className="text-xl font-semibold text-white mb-2">No tasks found</h3>
                    <p className="text-slate-400">
                      {searchQuery ? "No tasks match your search criteria." : "Get started by creating your first task!"}
                    </p>
                  </motion.div>
                ) : (
                  <div className="space-y-3">
                    {filteredTasks.map((task, index) => (
                      <motion.div
                        key={task.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.1 }}
                      >
                        <Card className="bg-slate-800/50 border-slate-700 hover:bg-slate-700/50 transition-all duration-200 backdrop-blur-sm">
                          <CardContent className="p-4">
                            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                              <div className="flex-1 space-y-2">
                                <div className="flex items-center gap-3">
                                  <h3 className="font-semibold text-white">{task.title}</h3>
                                  <Badge 
                                    variant="outline" 
                                    className={`${priorityConfig[task.priority as keyof typeof priorityConfig]?.color || 'bg-gray-500/20'}`}
                                  >
                                    {task.priority}
                                  </Badge>
                                </div>
                                <p className="text-sm text-slate-400 line-clamp-2">
                                  {task.description}
                                </p>
                                <div className="flex items-center gap-4 text-xs text-slate-500">
                                  <span className="capitalize">{task.status}</span>
                                  {task.dueDate && (
                                    <span className="flex items-center gap-1">
                                      <Calendar className="w-3 h-3" />
                                      {new Date(task.dueDate).toLocaleDateString()}
                                    </span>
                                  )}
                                </div>
                              </div>
                              
                              <div className="flex gap-2">
                                {task.status !== 'done' && (
                                  <Button 
                                    size="sm" 
                                    onClick={() => updateStatus(task.id, "done")}
                                    className="bg-green-600 hover:bg-green-700"
                                  >
                                    <CheckCircle2 className="w-4 h-4 mr-1" /> Done
                                  </Button>
                                )}
                                {isAdmin && (
                                  <Button 
                                    size="sm" 
                                    variant="destructive" 
                                    onClick={() => deleteTask(task.id)}
                                  >
                                    <Trash className="w-4 h-4" />
                                  </Button>
                                )}
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      </motion.div>
                    ))}
                  </div>
                )}
              </TabsContent>
            </Tabs>
          </motion.div>
        )}

        {/* Task Modal */}
        <AnimatePresence>
          {showTaskModal && selectedEmployee && (
            <motion.div 
              className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <motion.div 
                className="bg-slate-800 border border-slate-700 rounded-xl w-full max-w-md backdrop-blur-sm"
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
              >
                <div className="p-6">
                  <div className="flex items-center justify-between mb-6">
                    <h2 className="text-xl font-semibold text-white">
                      Assign Task to {selectedEmployee.first_name}
                    </h2>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setShowTaskModal(false)}
                      className="text-slate-400 hover:text-white"
                    >
                      <X className="w-5 h-5" />
                    </Button>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <label className="text-sm font-medium text-slate-300 mb-2 block">Title</label>
                      <Input 
                        placeholder="Enter task title" 
                        value={taskForm.title} 
                        onChange={e => setTaskForm({...taskForm, title: e.target.value})}
                        className="bg-slate-700/50 border-slate-600 text-white"
                      />
                    </div>
                    
                    <div>
                      <label className="text-sm font-medium text-slate-300 mb-2 block">Description</label>
                      <Textarea 
                        placeholder="Enter task description" 
                        value={taskForm.description} 
                        onChange={e => setTaskForm({...taskForm, description: e.target.value})}
                        className="bg-slate-700/50 border-slate-600 text-white min-h-[100px]"
                      />
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="text-sm font-medium text-slate-300 mb-2 block">Priority</label>
                        <select 
                          className="w-full p-2 bg-slate-700/50 border border-slate-600 rounded-md text-white text-sm focus:ring-2 focus:ring-blue-500/50"
                          value={taskForm.priority}
                          onChange={e => setTaskForm({...taskForm, priority: e.target.value})}
                        >
                          <option value="low">Low Priority</option>
                          <option value="medium">Medium Priority</option>
                          <option value="high">High Priority</option>
                        </select>
                      </div>
                      
                      <div>
                        <label className="text-sm font-medium text-slate-300 mb-2 block">Status</label>
                        <select 
                          className="w-full p-2 bg-slate-700/50 border border-slate-600 rounded-md text-white text-sm focus:ring-2 focus:ring-blue-500/50"
                          value={taskForm.status}
                          onChange={e => setTaskForm({...taskForm, status: e.target.value})}
                        >
                          <option value="todo">To Do</option>
                          <option value="in-progress">In Progress</option>
                          <option value="review">Review</option>
                          <option value="done">Done</option>
                        </select>
                      </div>
                    </div>
                    
                    <div>
                      <label className="text-sm font-medium text-slate-300 mb-2 block">Due Date</label>
                      <Input 
                        type="date" 
                        value={taskForm.dueDate} 
                        onChange={e => setTaskForm({...taskForm, dueDate: e.target.value})}
                        className="bg-slate-700/50 border-slate-600 text-white"
                      />
                    </div>

                    <Button 
                      className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 mt-4"
                      onClick={createTask}
                    >
                      <Sparkles className="w-4 h-4 mr-2" /> Create Task
                    </Button>
                  </div>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
}