"use client";

import React, { useEffect, useState, useCallback, useMemo } from "react";
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
  Brain,
  Zap,
  Target,
  Lightbulb,
  Rocket,
  Crown,
  Star,
  Gem,
  Award,
  Clock4,
  BrainCircuit,
  LineChart,
  Bot,
  Shield,
  Lock,
  Unlock,
  Download,
  Upload,
  Settings,
  RefreshCw,
  Menu,
  MoreVertical,
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const API_BASE = "http://localhost:3001/api/tasks";
const USERS_API = "http://localhost:3001/api/auth";

// Storage keys
const STORAGE_KEYS = {
  AI_PREDICTIONS: 'ai_predictions',
  AI_RECOMMENDATIONS: 'ai_recommendations',
  USER_PREFERENCES: 'user_preferences',
  TASKS_CACHE: 'tasks_cache',
  DASHBOARD_DATA: 'dashboard_data'
};

// Status mapping - Fixed to match backend
const STATUS_MAP = {
  todo: "pending",
  "in-progress": "in_progress",
  "review": "review",
  "done": "completed"
} as const;

const REVERSE_STATUS_MAP = {
  "pending": "todo",
  "in_progress": "in-progress",
  "review": "review",
  "completed": "done",
  "blocked": "todo",
  "cancelled": "done"
} as const;

// Valid backend statuses
const VALID_BACKEND_STATUSES = ["pending", "in_progress", "completed", "blocked", "cancelled", "review"];

export default function TasksPage() {
  const { toast } = useToast();

  const [tasks, setTasks] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [showUserList, setShowUserList] = useState(false);
  const [showTaskModal, setShowTaskModal] = useState(false);
  const [showAIModal, setShowAIModal] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState<any>(null);
  const [taskForm, setTaskForm] = useState({
    title: "",
    description: "",
    status: "pending",
    priority: "medium",
    deadline: "",
    category: "",
    estimatedHours: null as number | null,
    generateAIInsights: false,
    autoOptimize: false,
  });

  const [aiForm, setAiForm] = useState({
    description: "",
    intelligenceType: "strategic",
    complexity: "medium",
    context: "",
  });

  const [searchQuery, setSearchQuery] = useState("");
  const [selectedTab, setSelectedTab] = useState("kanban");
  const [loading, setLoading] = useState(false);
  const [aiLoading, setAiLoading] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [filterPriority, setFilterPriority] = useState("all");
  const [aiGeneratedTask, setAiGeneratedTask] = useState<any>(null);
  const [aiPredictions, setAiPredictions] = useState<any>(null);
  const [aiRecommendations, setAiRecommendations] = useState<any>(null);
  const [showAIPredictions, setShowAIPredictions] = useState(false);
  const [showAIRecommendations, setShowAIRecommendations] = useState(false);
  const [aiDashboard, setAiDashboard] = useState<any>(null);
  const [showAIDashboard, setShowAIDashboard] = useState(false);
  const [userPreferences, setUserPreferences] = useState({
    autoSave: true,
    aiSuggestions: true,
    darkMode: true,
    notifications: true
  });
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Initialize storage
  useEffect(() => {
    loadFromStorage();
  }, []);

  const loadFromStorage = useCallback(() => {
    try {
      const savedPredictions = sessionStorage.getItem(STORAGE_KEYS.AI_PREDICTIONS);
      const savedRecommendations = sessionStorage.getItem(STORAGE_KEYS.AI_RECOMMENDATIONS);
      const savedPreferences = localStorage.getItem(STORAGE_KEYS.USER_PREFERENCES);
      const savedDashboard = sessionStorage.getItem(STORAGE_KEYS.DASHBOARD_DATA);

      if (savedPredictions) setAiPredictions(JSON.parse(savedPredictions));
      if (savedRecommendations) setAiRecommendations(JSON.parse(savedRecommendations));
      if (savedPreferences) setUserPreferences(JSON.parse(savedPreferences));
      if (savedDashboard) setAiDashboard(JSON.parse(savedDashboard));
    } catch (error) {
      console.error('Error loading from storage:', error);
    }
  }, []);

  const saveToStorage = useCallback((key: string, data: any) => {
    try {
      if (key.includes('session')) {
        sessionStorage.setItem(key, JSON.stringify(data));
      } else {
        localStorage.setItem(key, JSON.stringify(data));
      }
    } catch (error) {
      console.error('Error saving to storage:', error);
    }
  }, []);

  const getAuthHeaders = useCallback(() => {
    const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
    return {
      "Content-Type": "application/json",
      Authorization: token ? `Bearer ${token}` : "",
    };
  }, []);

  // Columns configuration
  const columns = useMemo(() => [
    { id: "todo", title: "To Do", icon: Circle, color: "bg-blue-500/20 border-blue-500/30 text-blue-300", backendStatus: "pending" },
    { id: "in-progress", title: "In Progress", icon: PlayCircle, color: "bg-amber-500/20 border-amber-500/30 text-amber-300", backendStatus: "in_progress" },
    { id: "review", title: "Review", icon: Eye, color: "bg-purple-500/20 border-purple-500/30 text-purple-300", backendStatus: "review" },
    { id: "done", title: "Done", icon: CheckCircle2, color: "bg-green-500/20 border-green-500/30 text-green-300", backendStatus: "completed" },
  ], []);

  const priorityConfig = useMemo(() => ({
    low: { color: "bg-green-500/20 text-green-300 border-green-500/30", label: "Low", icon: Circle },
    medium: { color: "bg-amber-500/20 text-amber-300 border-amber-500/30", label: "Medium", icon: AlertCircle },
    high: { color: "bg-red-500/20 text-red-300 border-red-500/30", label: "High", icon: Shield },
  }), []);

  const intelligenceTypes = useMemo(() => [
    { value: "strategic", label: "Strategic", icon: Target, description: "Long-term planning and vision", premium: true },
    { value: "creative", label: "Creative", icon: Lightbulb, description: "Innovative and out-of-the-box thinking", premium: false },
    { value: "analytical", label: "Analytical", icon: BarChart3, description: "Data-driven and systematic approach", premium: true },
    { value: "technical", label: "Technical", icon: Zap, description: "Technical implementation focused", premium: false },
    { value: "collaborative", label: "Collaborative", icon: Users, description: "Team coordination and communication", premium: true },
  ], []);

  // ------------------ Fetch Current User ------------------
  const fetchCurrentUser = useCallback(async () => {
    try {
      const res = await fetch(`${USERS_API}/current-user`, { 
        headers: getAuthHeaders() 
      });
      
      if (!res.ok) {
        throw new Error(`HTTP error! status: ${res.status}`);
      }
      
      const data = await res.json();
      if (!data.success) throw new Error(data.error || "Unable to fetch user");

      const adminStatus = data.user.role === "admin";
      setIsAdmin(adminStatus);
      setCurrentUserId(data.user.id);
      return { ...data.user, isAdmin: adminStatus };
    } catch (err: any) {
      console.error("Error fetching current user:", err);
      toast({
        title: "Error fetching current user",
        description: err.message,
        variant: "destructive",
      });
      return null;
    }
  }, [getAuthHeaders, toast]);

  // ------------------ Fetch Users (Admin) ------------------
  const fetchUsers = useCallback(async () => {
    try {
      const res = await fetch(`${USERS_API}/company/employees`, { 
        headers: getAuthHeaders() 
      });
      
      if (!res.ok) {
        throw new Error(`HTTP error! status: ${res.status}`);
      }
      
      const data = await res.json();
      if (!data.success) throw new Error(data.error || "Unable to fetch employees");
      setUsers(data.employees || []);
    } catch (err: any) {
      console.error("Error fetching users:", err);
      toast({
        title: "Error fetching employees",
        description: err.message,
        variant: "destructive",
      });
    }
  }, [getAuthHeaders, toast]);

  // ------------------ Fetch Tasks ------------------
  const fetchTasks = useCallback(async (adminStatus?: boolean) => {
    setLoading(true);
    try {
      const userIsAdmin = adminStatus !== undefined ? adminStatus : isAdmin;
      const endpoint = userIsAdmin && selectedEmployee ? 
        `${API_BASE}/employee/${selectedEmployee.id}` : 
        `${API_BASE}`;
      
      const res = await fetch(endpoint, { 
        headers: getAuthHeaders() 
      });
      
      if (!res.ok) {
        throw new Error(`HTTP error! status: ${res.status}`);
      }
      
      const data = await res.json();
      if (!data.success) throw new Error(data.error || "Unable to fetch tasks");
      
      const tasksData = data.tasks || [];
      setTasks(tasksData);
      
      // Save to cache
      if (userPreferences.autoSave) {
        saveToStorage(STORAGE_KEYS.TASKS_CACHE, tasksData);
      }
    } catch (err: any) {
      console.error("Error fetching tasks:", err);
      // Try to load from cache
      const cachedTasks = localStorage.getItem(STORAGE_KEYS.TASKS_CACHE);
      if (cachedTasks) {
        setTasks(JSON.parse(cachedTasks));
        toast({
          title: "Using cached data",
          description: "Loaded tasks from local storage",
          variant: "default",
        });
      } else {
        toast({
          title: "Error loading tasks",
          description: err.message,
          variant: "destructive",
        });
      }
    } finally {
      setLoading(false);
    }
  }, [isAdmin, selectedEmployee, getAuthHeaders, userPreferences.autoSave, saveToStorage, toast]);

  // ------------------ AI Task Generation ------------------
  const generateAITask = useCallback(async () => {
    if (!aiForm.description.trim()) {
      toast({
        title: "Description required",
        description: "Please provide a task description for AI generation",
        variant: "destructive",
      });
      return;
    }

    setAiLoading(true);
    try {
      const res = await fetch(`${API_BASE}/ai/generate`, {
        method: "POST",
        headers: getAuthHeaders(),
        body: JSON.stringify(aiForm),
      });

      if (!res.ok) {
        throw new Error(`HTTP error! status: ${res.status}`);
      }

      const data = await res.json();
      if (!data.success) throw new Error(data.error || "AI generation failed");

      setAiGeneratedTask(data.task);
      toast({
        title: "✨ AI Task Generated",
        description: "Your intelligent task has been created successfully!",
      });
    } catch (err: any) {
      console.error("Error generating AI task:", err);
      toast({
        title: "AI Generation Failed",
        description: err.message,
        variant: "destructive",
      });
    } finally {
      setAiLoading(false);
    }
  }, [aiForm, getAuthHeaders, toast]);

  // ------------------ AI Predictions ------------------
  const fetchAIPredictions = useCallback(async () => {
    try {
      // Try cache first
      const cached = sessionStorage.getItem(STORAGE_KEYS.AI_PREDICTIONS);
      if (cached && userPreferences.autoSave) {
        setAiPredictions(JSON.parse(cached));
        setShowAIPredictions(true);
        toast({
          title: "📊 Cached Predictions",
          description: "Loaded predictions from session storage",
        });
        return;
      }

      const res = await fetch(`${API_BASE}/ai/predictions?timeframe=30d&predictionType=completion`, {
        headers: getAuthHeaders(),
      });

      if (!res.ok) {
        throw new Error(`HTTP error! status: ${res.status}`);
      }

      const data = await res.json();
      if (!data.success) throw new Error(data.error || "Failed to fetch predictions");

      setAiPredictions(data.predictions);
      setShowAIPredictions(true);
      
      // Save to session storage
      saveToStorage(STORAGE_KEYS.AI_PREDICTIONS, data.predictions);
      
      toast({
        title: "📊 AI Predictions",
        description: "Task completion predictions generated",
      });
    } catch (err: any) {
      console.error("Error fetching AI predictions:", err);
      toast({
        title: "Predictions Failed",
        description: err.message,
        variant: "destructive",
      });
    }
  }, [getAuthHeaders, userPreferences.autoSave, saveToStorage, toast]);

  // ------------------ AI Recommendations ------------------
  const fetchAIRecommendations = useCallback(async () => {
    try {
      // Try cache first
      const cached = sessionStorage.getItem(STORAGE_KEYS.AI_RECOMMENDATIONS);
      if (cached && userPreferences.autoSave) {
        setAiRecommendations(JSON.parse(cached));
        setShowAIRecommendations(true);
        toast({
          title: "💡 Cached Recommendations",
          description: "Loaded recommendations from session storage",
        });
        return;
      }

      const res = await fetch(`${API_BASE}/ai/recommendations?type=similar&limit=5`, {
        headers: getAuthHeaders(),
      });

      if (!res.ok) {
        throw new Error(`HTTP error! status: ${res.status}`);
      }

      const data = await res.json();
      if (!data.success) throw new Error(data.error || "Failed to fetch recommendations");

      setAiRecommendations(data.recommendations);
      setShowAIRecommendations(true);
      
      // Save to session storage
      saveToStorage(STORAGE_KEYS.AI_RECOMMENDATIONS, data.recommendations);
      
      toast({
        title: "💡 AI Recommendations",
        description: "Personalized task recommendations generated",
      });
    } catch (err: any) {
      console.error("Error fetching AI recommendations:", err);
      toast({
        title: "Recommendations Failed",
        description: err.message,
        variant: "destructive",
      });
    }
  }, [getAuthHeaders, userPreferences.autoSave, saveToStorage, toast]);

  // ------------------ AI Dashboard ------------------
  const fetchAIDashboard = useCallback(async () => {
    try {
      const res = await fetch(`${API_BASE}`, {
        headers: getAuthHeaders(),
      });

      if (!res.ok) {
        throw new Error(`HTTP error! status: ${res.status}`);
      }

      const data = await res.json();
      if (!data.success) throw new Error(data.error || "Failed to fetch dashboard");

      setAiDashboard(data.aiDashboard);
      setShowAIDashboard(true);
      
      // Save to session storage
      saveToStorage(STORAGE_KEYS.DASHBOARD_DATA, data.aiDashboard);
      
      toast({
        title: "📈 AI Dashboard",
        description: "Personal productivity insights generated",
      });
    } catch (err: any) {
      console.error("Error fetching AI dashboard:", err);
      toast({
        title: "Dashboard Failed",
        description: err.message,
        variant: "destructive",
      });
    }
  }, [getAuthHeaders, saveToStorage, toast]);

  // ------------------ Open Task Modal ------------------
  const openTaskModal = useCallback((employee: any) => {
    setSelectedEmployee(employee);
    setTaskForm({
      title: "",
      description: "",
      status: "pending",
      priority: "medium",
      deadline: "",
      category: "",
      estimatedHours: null,
      generateAIInsights: false,
      autoOptimize: false,
    });
    setShowTaskModal(true);
    setMobileMenuOpen(false);
  }, []);

  // ------------------ Create Task ------------------
  const createTask = useCallback(async () => {
    if (!currentUserId || !selectedEmployee) return;

    try {
      const taskData = {
        title: taskForm.title,
        description: taskForm.description,
        assigned_to: selectedEmployee.id,
        priority: taskForm.priority,
        deadline: taskForm.deadline,
        category: taskForm.category,
        estimatedHours: taskForm.estimatedHours,
        generateAIInsights: taskForm.generateAIInsights,
        autoOptimize: taskForm.autoOptimize,
      };

      const res = await fetch(API_BASE, {
        method: "POST",
        headers: getAuthHeaders(),
        body: JSON.stringify(taskData),
      });

      if (!res.ok) {
        throw new Error(`HTTP error! status: ${res.status}`);
      }

      const data = await res.json();
      if (!data.success) throw new Error(data.error || "Failed to create task");

      toast({
        title: "✨ Task Created",
        description: `Task assigned to ${selectedEmployee.first_name} successfully.`,
      });
      setShowTaskModal(false);
      setShowUserList(false);
      fetchTasks(isAdmin);
    } catch (err: any) {
      console.error("Error creating task:", err);
      toast({
        title: "Error Creating Task",
        description: err.message,
        variant: "destructive",
      });
    }
  }, [currentUserId, selectedEmployee, taskForm, getAuthHeaders, toast, isAdmin, fetchTasks]);

  // ------------------ Use AI Generated Task ------------------
  const useAIGeneratedTask = useCallback(() => {
    if (aiGeneratedTask && selectedEmployee) {
      setTaskForm({
        title: aiGeneratedTask.title,
        description: aiGeneratedTask.description,
        status: "pending",
        priority: "medium",
        deadline: "",
        category: "",
        estimatedHours: aiGeneratedTask.estimated_timeline ? 
          (aiGeneratedTask.estimated_timeline.research + aiGeneratedTask.estimated_timeline.execution + aiGeneratedTask.estimated_timeline.review) : 
          null,
        generateAIInsights: true,
        autoOptimize: true,
      });
      setShowAIModal(false);
      setShowTaskModal(true);
    }
  }, [aiGeneratedTask, selectedEmployee]);

  // ------------------ Update Status ------------------
  const updateStatus = useCallback(async (taskId: string, frontendStatus: string) => {
    try {
      const backendStatus = STATUS_MAP[frontendStatus as keyof typeof STATUS_MAP];
      
      if (!backendStatus || !VALID_BACKEND_STATUSES.includes(backendStatus)) {
        throw new Error(`Invalid status: ${frontendStatus}. Must be one of: ${Object.keys(STATUS_MAP).join(', ')}`);
      }

      const res = await fetch(`${API_BASE}/${taskId}/status`, {
        method: "PATCH",
        headers: getAuthHeaders(),
        body: JSON.stringify({ status: backendStatus }),
      });

      if (!res.ok) {
        throw new Error(`HTTP error! status: ${res.status}`);
      }

      const data = await res.json();
      if (!data.success) throw new Error(data.error || "Failed to update status");
      
      toast({ 
        title: "🔄 Status Updated", 
        description: `Task moved to ${frontendStatus.replace('-', ' ')}` 
      });
      fetchTasks(isAdmin);
    } catch (err: any) {
      console.error("Error updating status:", err);
      toast({ 
        title: "Error Updating Status", 
        description: err.message, 
        variant: "destructive" 
      });
    }
  }, [getAuthHeaders, toast, isAdmin, fetchTasks]);

  // ------------------ Delete Task ------------------
  const deleteTask = useCallback(async (taskId: string) => {
    if (!confirm("Are you sure you want to delete this task?")) return;
    try {
      const res = await fetch(`${API_BASE}/${taskId}`, {
        method: "DELETE",
        headers: getAuthHeaders(),
      });

      if (!res.ok) {
        throw new Error(`HTTP error! status: ${res.status}`);
      }

      const data = await res.json();
      if (!data.success) throw new Error(data.error || "Failed to delete task");
      
      toast({ 
        title: "🗑️ Task Deleted", 
        description: "Task has been removed successfully." 
      });
      fetchTasks(isAdmin);
    } catch (err: any) {
      console.error("Error deleting task:", err);
      toast({ 
        title: "Error Deleting Task", 
        description: err.message, 
        variant: "destructive" 
      });
    }
  }, [getAuthHeaders, toast, isAdmin, fetchTasks]);

  // ------------------ AI Task Optimization ------------------
  const optimizeTask = useCallback(async (taskId: string) => {
    try {
      const res = await fetch(`${API_BASE}/${taskId}/ai/optimize`, {
        method: "POST",
        headers: getAuthHeaders(),
        body: JSON.stringify({ optimizationType: "efficiency" }),
      });

      if (!res.ok) {
        throw new Error(`HTTP error! status: ${res.status}`);
      }

      const data = await res.json();
      if (!data.success) throw new Error(data.error || "Failed to optimize task");

      toast({
        title: "⚡ Task Optimized",
        description: "AI has provided optimization suggestions",
      });
      fetchTasks(isAdmin);
    } catch (err: any) {
      console.error("Error optimizing task:", err);
      toast({
        title: "Optimization Failed",
        description: err.message,
        variant: "destructive",
      });
    }
  }, [getAuthHeaders, toast, isAdmin, fetchTasks]);

  // ------------------ Clear Cache ------------------
  const clearCache = useCallback(() => {
    sessionStorage.clear();
    localStorage.removeItem(STORAGE_KEYS.TASKS_CACHE);
    localStorage.removeItem(STORAGE_KEYS.USER_PREFERENCES);
    toast({
      title: "🔄 Cache Cleared",
      description: "All cached data has been cleared",
    });
  }, [toast]);

  // ------------------ Export Data ------------------
  const exportData = useCallback(() => {
    const data = {
      tasks,
      predictions: aiPredictions,
      recommendations: aiRecommendations,
      dashboard: aiDashboard,
      exportedAt: new Date().toISOString()
    };
    
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `tasks-export-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    toast({
      title: "📤 Data Exported",
      description: "All task data has been exported",
    });
  }, [tasks, aiPredictions, aiRecommendations, aiDashboard, toast]);

  // ------------------ Initialization ------------------
  useEffect(() => {
    const init = async () => {
      setLoading(true);
      try {
        const user = await fetchCurrentUser();
        if (!user) return;
        
        if (user.isAdmin) {
          await fetchUsers();
        }
        await fetchTasks(user.isAdmin);
      } catch (error) {
        console.error("Initialization error:", error);
      } finally {
        setLoading(false);
      }
    };
    init();
  }, [fetchCurrentUser, fetchUsers, fetchTasks]);

  // ------------------ Task Filtering ------------------
  const getTasksByStatus = useCallback((status: string) => {
    return tasks.filter(task => {
      const mappedStatus = REVERSE_STATUS_MAP[task.status as keyof typeof REVERSE_STATUS_MAP] || "todo";
      const visibleToUser = isAdmin || task.assigned_to === currentUserId || task.created_by === currentUserId;
      const priorityMatch = filterPriority === "all" || task.priority === filterPriority;
      const searchMatch = task.title?.toLowerCase().includes(searchQuery.toLowerCase()) || 
                         task.description?.toLowerCase().includes(searchQuery.toLowerCase());
      return mappedStatus === status && visibleToUser && priorityMatch && searchMatch;
    });
  }, [tasks, isAdmin, currentUserId, filterPriority, searchQuery]);

  const filteredTasks = useMemo(() => {
    return tasks.filter(task => {
      const visibleToUser = isAdmin || task.assigned_to === currentUserId || task.created_by === currentUserId;
      const priorityMatch = filterPriority === "all" || task.priority === filterPriority;
      const searchMatch = task.title?.toLowerCase().includes(searchQuery.toLowerCase()) || 
                       task.description?.toLowerCase().includes(searchQuery.toLowerCase());
      return visibleToUser && priorityMatch && searchMatch;
    });
  }, [tasks, isAdmin, currentUserId, filterPriority, searchQuery]);

  // Get user initials for avatar
  const getUserInitials = useCallback((user: any) => {
    return `${user.first_name?.[0] || ''}${user.last_name?.[0] || ''}`.toUpperCase();
  }, []);

  // Get assignee name for task display
  const getAssigneeName = useCallback((task: any) => {
    if (task.assignee) {
      return `${task.assignee.first_name} ${task.assignee.last_name}`;
    }
    return "Unassigned";
  }, []);

  // Stats for dashboard
  const stats = useMemo(() => {
    const totalTasks = tasks.length;
    const completedTasks = tasks.filter(task => task.status === 'completed').length;
    const inProgressTasks = tasks.filter(task => task.status === 'in_progress').length;
    const aiEnhancedTasks = tasks.filter(t => t.ai_recommendations || t.ai_optimization).length;

    return { totalTasks, completedTasks, inProgressTasks, aiEnhancedTasks };
  }, [tasks]);

  // Mobile menu actions
  const MobileActionsMenu = () => (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm" className="lg:hidden">
          <Menu className="w-4 h-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56 bg-slate-800 border-slate-700">
        {isAdmin && (
          <>
            <DropdownMenuItem onClick={fetchAIPredictions} className="text-slate-300">
              <TrendingUp className="w-4 h-4 mr-2" /> AI Predictions
            </DropdownMenuItem>
            <DropdownMenuItem onClick={fetchAIRecommendations} className="text-slate-300">
              <Lightbulb className="w-4 h-4 mr-2" /> AI Recommendations
            </DropdownMenuItem>
            <DropdownMenuItem onClick={fetchAIDashboard} className="text-slate-300">
              <LineChart className="w-4 h-4 mr-2" /> AI Dashboard
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => setShowAIModal(true)} className="text-slate-300">
              <Sparkles className="w-4 h-4 mr-2" /> AI Task Generator
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => setShowUserList(true)} className="text-slate-300">
              <Plus className="w-4 h-4 mr-2" /> Create Task
            </DropdownMenuItem>
          </>
        )}
        <DropdownMenuItem onClick={exportData} className="text-slate-300">
          <Download className="w-4 h-4 mr-2" /> Export Data
        </DropdownMenuItem>
        <DropdownMenuItem onClick={clearCache} className="text-slate-300">
          <RefreshCw className="w-4 h-4 mr-2" /> Clear Cache
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
      <motion.div 
        className="p-3 sm:p-4 lg:p-6 space-y-4 sm:space-y-6"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5 }}
      >
        {/* Header */}
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3 sm:gap-4">
          <div className="space-y-1 sm:space-y-2 flex-1 min-w-0">
            <motion.h1 
              className="text-2xl sm:text-3xl lg:text-4xl font-bold bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent flex items-center gap-2 sm:gap-3 flex-wrap"
              initial={{ y: -20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.1 }}
            >
              <BrainCircuit className="w-6 h-6 sm:w-8 sm:h-8 text-purple-400" />
              Task Management
              {isAdmin && (
                <Badge className="bg-gradient-to-r from-purple-600 to-pink-600 text-xs sm:text-sm">
                  <Crown className="w-3 h-3 mr-1" /> Admin
                </Badge>
              )}
            </motion.h1>
            <p className="text-slate-400 text-sm sm:text-base">
              {isAdmin ? "👑 Admin dashboard - All company tasks" : "👤 Your assigned tasks"}
            </p>
          </div>

          <div className="flex items-center gap-2">
            <MobileActionsMenu />
            
            {isAdmin && (
              <motion.div 
                className="hidden lg:flex flex-wrap gap-2"
                initial={{ y: -20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.2 }}
              >
                <Button 
                  onClick={fetchAIPredictions}
                  variant="outline" 
                  size="sm"
                  className="bg-slate-800/50 border-slate-700 hover:bg-slate-700/50"
                >
                  <TrendingUp className="w-4 h-4 mr-2" /> Predictions
                </Button>
                <Button 
                  onClick={fetchAIRecommendations}
                  variant="outline" 
                  size="sm"
                  className="bg-slate-800/50 border-slate-700 hover:bg-slate-700/50"
                >
                  <Lightbulb className="w-4 h-4 mr-2" /> Recommendations
                </Button>
                <Button 
                  onClick={fetchAIDashboard}
                  variant="outline" 
                  size="sm"
                  className="bg-slate-800/50 border-slate-700 hover:bg-slate-700/50"
                >
                  <LineChart className="w-4 h-4 mr-2" /> Dashboard
                </Button>
                <Dialog open={showAIModal} onOpenChange={setShowAIModal}>
                  <DialogTrigger asChild>
                    <Button variant="outline" size="sm" className="bg-gradient-to-r from-purple-600/20 to-pink-600/20 border-purple-500/30 text-purple-300 hover:from-purple-600/30 hover:to-pink-600/30">
                      <Sparkles className="w-4 h-4 mr-2" /> AI Generator
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="bg-slate-800 border-slate-700 max-w-2xl w-[95vw] sm:w-full">
                    <DialogHeader>
                      <DialogTitle className="flex items-center gap-2 text-white">
                        <Sparkles className="w-5 h-5 text-purple-400" /> AI Task Generator
                      </DialogTitle>
                      <DialogDescription className="text-slate-400">
                        Generate intelligent tasks using AI with different intelligence types
                      </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4">
                      <div>
                        <label className="text-sm font-medium text-slate-300 mb-2 block">Task Description</label>
                        <Textarea 
                          placeholder="Describe what you want to accomplish..."
                          value={aiForm.description}
                          onChange={e => setAiForm({...aiForm, description: e.target.value})}
                          className="bg-slate-700/50 border-slate-600 text-white min-h-[100px]"
                        />
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                          <label className="text-sm font-medium text-slate-300 mb-2 block">Intelligence Type</label>
                          <Select value={aiForm.intelligenceType} onValueChange={value => setAiForm({...aiForm, intelligenceType: value})}>
                            <SelectTrigger className="bg-slate-700/50 border-slate-600 text-white">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {intelligenceTypes.map(type => (
                                <SelectItem key={type.value} value={type.value}>
                                  <div className="flex items-center gap-2 justify-between w-full">
                                    <div className="flex items-center gap-2">
                                      <type.icon className="w-4 h-4" />
                                      {type.label}
                                    </div>
                                    {type.premium && <Crown className="w-3 h-3 text-amber-400" />}
                                  </div>
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        <div>
                          <label className="text-sm font-medium text-slate-300 mb-2 block">Complexity</label>
                          <Select value={aiForm.complexity} onValueChange={value => setAiForm({...aiForm, complexity: value})}>
                            <SelectTrigger className="bg-slate-700/50 border-slate-600 text-white">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="low">
                                <div className="flex items-center gap-2">
                                  <Circle className="w-3 h-3 text-green-400" /> Low Complexity
                                </div>
                              </SelectItem>
                              <SelectItem value="medium">
                                <div className="flex items-center gap-2">
                                  <AlertCircle className="w-3 h-3 text-amber-400" /> Medium Complexity
                                </div>
                              </SelectItem>
                              <SelectItem value="high">
                                <div className="flex items-center gap-2">
                                  <Shield className="w-3 h-3 text-red-400" /> High Complexity
                                </div>
                              </SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-slate-300 mb-2 block">Additional Context</label>
                        <Input 
                          placeholder="Any specific requirements or constraints..."
                          value={aiForm.context}
                          onChange={e => setAiForm({...aiForm, context: e.target.value})}
                          className="bg-slate-700/50 border-slate-600 text-white"
                        />
                      </div>
                      <Button 
                        onClick={generateAITask}
                        disabled={aiLoading || !aiForm.description.trim()}
                        className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
                      >
                        {aiLoading ? (
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        ) : (
                          <Sparkles className="w-4 h-4 mr-2" />
                        )}
                        {aiLoading ? "Generating..." : "Generate AI Task"}
                      </Button>
                    </div>
                  </DialogContent>
                </Dialog>
                <Button 
                  onClick={() => setShowUserList((prev) => !prev)}
                  size="sm"
                  className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
                >
                  <Plus className="w-4 h-4 mr-2" /> Create Task
                </Button>
              </motion.div>
            )}
          </div>
        </div>

        {/* AI Dialogs - Same as before but with responsive classes */}
        <Dialog open={showAIPredictions} onOpenChange={setShowAIPredictions}>
          <DialogContent className="bg-slate-800 border-slate-700 max-w-2xl w-[95vw] sm:w-full">
            {/* ... AI Predictions Content ... */}
          </DialogContent>
        </Dialog>

        <Dialog open={showAIRecommendations} onOpenChange={setShowAIRecommendations}>
          <DialogContent className="bg-slate-800 border-slate-700 max-w-2xl w-[95vw] sm:w-full">
            {/* ... AI Recommendations Content ... */}
          </DialogContent>
        </Dialog>

        <Dialog open={showAIDashboard} onOpenChange={setShowAIDashboard}>
          <DialogContent className="bg-slate-800 border-slate-700 max-w-4xl w-[95vw] sm:w-full">
            {/* ... AI Dashboard Content ... */}
          </DialogContent>
        </Dialog>

        {/* Stats Cards */}
        <motion.div 
          className="grid grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-4"
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.3 }}
        >
          <Card className="bg-slate-800/50 border-slate-700 backdrop-blur-sm">
            <CardContent className="p-3 sm:p-4 flex items-center gap-3 sm:gap-4">
              <div className="p-2 sm:p-3 rounded-full bg-blue-500/20">
                <Users className="w-4 h-4 sm:w-6 sm:h-6 text-blue-400" />
              </div>
              <div className="min-w-0">
                <p className="text-lg sm:text-2xl font-bold text-white truncate">{stats.totalTasks}</p>
                <p className="text-xs sm:text-sm text-slate-400 truncate">Total Tasks</p>
              </div>
            </CardContent>
          </Card>
          
          <Card className="bg-slate-800/50 border-slate-700 backdrop-blur-sm">
            <CardContent className="p-3 sm:p-4 flex items-center gap-3 sm:gap-4">
              <div className="p-2 sm:p-3 rounded-full bg-amber-500/20">
                <PlayCircle className="w-4 h-4 sm:w-6 sm:h-6 text-amber-400" />
              </div>
              <div className="min-w-0">
                <p className="text-lg sm:text-2xl font-bold text-white truncate">{stats.inProgressTasks}</p>
                <p className="text-xs sm:text-sm text-slate-400 truncate">In Progress</p>
              </div>
            </CardContent>
          </Card>
          
          <Card className="bg-slate-800/50 border-slate-700 backdrop-blur-sm">
            <CardContent className="p-3 sm:p-4 flex items-center gap-3 sm:gap-4">
              <div className="p-2 sm:p-3 rounded-full bg-green-500/20">
                <CheckCircle2 className="w-4 h-4 sm:w-6 sm:h-6 text-green-400" />
              </div>
              <div className="min-w-0">
                <p className="text-lg sm:text-2xl font-bold text-white truncate">{stats.completedTasks}</p>
                <p className="text-xs sm:text-sm text-slate-400 truncate">Completed</p>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-slate-800/50 border-slate-700 backdrop-blur-sm">
            <CardContent className="p-3 sm:p-4 flex items-center gap-3 sm:gap-4">
              <div className="p-2 sm:p-3 rounded-full bg-purple-500/20">
                <Brain className="w-4 h-4 sm:w-6 sm:h-6 text-purple-400" />
              </div>
              <div className="min-w-0">
                <p className="text-lg sm:text-2xl font-bold text-white truncate">{stats.aiEnhancedTasks}</p>
                <p className="text-xs sm:text-sm text-slate-400 truncate">AI Enhanced</p>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* AI Generated Task Preview */}
        {aiGeneratedTask && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="border border-purple-500/30 rounded-xl p-4 sm:p-6 bg-purple-500/10 backdrop-blur-sm"
          >
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
              <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-purple-400" /> AI Generated Task
              </h3>
              <div className="flex items-center gap-2 flex-wrap">
                <Badge variant="secondary" className="bg-purple-500/20 text-purple-300 text-xs">
                  {aiForm.intelligenceType}
                </Badge>
                <Badge className="bg-gradient-to-r from-amber-500 to-orange-500 text-xs">
                  <Crown className="w-3 h-3 mr-1" /> Premium
                </Badge>
              </div>
            </div>
            <div className="space-y-3">
              <div>
                <h4 className="font-medium text-white text-sm sm:text-base">{aiGeneratedTask.title}</h4>
                <p className="text-xs sm:text-sm text-slate-300 mt-1">{aiGeneratedTask.description}</p>
              </div>
              {aiGeneratedTask.objectives && (
                <div>
                  <p className="text-xs sm:text-sm font-medium text-slate-400 mb-1">Objectives:</p>
                  <ul className="text-xs sm:text-sm text-slate-300 space-y-1">
                    {aiGeneratedTask.objectives.map((obj: string, index: number) => (
                      <li key={index} className="flex items-center gap-2">
                        <Target className="w-3 h-3 text-green-400 flex-shrink-0" />
                        <span className="flex-1">{obj}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              {aiGeneratedTask.ai_insights && (
                <div className="bg-slate-800/50 rounded-lg p-3">
                  <p className="text-xs sm:text-sm font-medium text-slate-400 mb-2">AI Insights:</p>
                  <div className="grid grid-cols-2 gap-3 text-xs">
                    <div>
                      <span className="text-slate-500">Complexity: </span>
                      <span className="text-white">{aiGeneratedTask.ai_insights.complexity_score}/10</span>
                    </div>
                    <div>
                      <span className="text-slate-500">Innovation: </span>
                      <span className="text-white">{aiGeneratedTask.ai_insights.innovation_potential}/10</span>
                    </div>
                  </div>
                </div>
              )}
              <div className="flex flex-col sm:flex-row gap-2 sm:gap-4">
                <Button onClick={useAIGeneratedTask} size="sm" className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700">
                  <Rocket className="w-4 h-4 mr-2" /> Use This Task
                </Button>
                <Button 
                  onClick={() => setAiGeneratedTask(null)} 
                  size="sm" 
                  variant="outline"
                  className="border-slate-600 text-slate-300 hover:bg-slate-700/50"
                >
                  <RefreshCw className="w-4 h-4 mr-2" /> Generate Another
                </Button>
              </div>
            </div>
          </motion.div>
        )}

        {/* Employee list */}
        <AnimatePresence>
          {isAdmin && showUserList && (
            <motion.div 
              className="border border-slate-700 rounded-xl p-4 sm:p-6 bg-slate-800/30 backdrop-blur-sm"
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.3 }}
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
                <h2 className="text-lg sm:text-xl font-semibold text-white">Select Employee to Assign Task</h2>
                <div className="flex items-center gap-2 sm:gap-3">
                  <Badge variant="secondary" className="bg-slate-700 text-slate-300 text-xs">
                    <Users className="w-3 h-3 mr-1" /> {users.length} employees
                  </Badge>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={exportData}
                    className="border-green-600 text-green-400 hover:bg-green-600/20 text-xs"
                  >
                    <Download className="w-3 h-3 mr-1 sm:mr-2" /> Export
                  </Button>
                </div>
              </div>
              {users.length === 0 ? (
                <p className="text-slate-400 text-center py-6 sm:py-8">No employees found.</p>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-2 sm:gap-3">
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
                        <CardContent className="flex items-center gap-2 sm:gap-3 p-3 sm:p-4">
                          <Avatar className="h-8 w-8 sm:h-10 sm:w-10 border border-slate-600">
                            <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-600 text-white text-xs sm:text-sm">
                              {getUserInitials(user)}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-white text-sm truncate">{user.first_name} {user.last_name}</p>
                            <p className="text-xs text-slate-400 truncate">{user.email}</p>
                            {user.department && (
                              <p className="text-xs text-slate-500 truncate">{user.department}</p>
                            )}
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
          className="flex flex-col sm:flex-row gap-3"
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.4 }}
        >
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
            <Input 
              className="pl-10 bg-slate-800/50 border-slate-700 text-white placeholder-slate-400 focus:ring-2 focus:ring-blue-500/50 text-sm sm:text-base"
              placeholder="Search tasks..." 
              value={searchQuery} 
              onChange={(e) => setSearchQuery(e.target.value)} 
            />
          </div>
          <div className="flex gap-2">
            <select 
              className="px-3 py-2 bg-slate-800/50 border border-slate-700 rounded-md text-white text-sm focus:ring-2 focus:ring-blue-500/50 flex-1 sm:flex-none"
              value={filterPriority}
              onChange={(e) => setFilterPriority(e.target.value)}
            >
              <option value="all">All Priorities</option>
              <option value="high">High Priority</option>
              <option value="medium">Medium Priority</option>
              <option value="low">Low Priority</option>
            </select>
            <Button
              variant="outline"
              size="sm"
              onClick={clearCache}
              className="border-slate-600 text-slate-300 hover:bg-slate-700/50 hidden sm:flex"
            >
              <RefreshCw className="w-4 h-4 mr-2" /> Clear Cache
            </Button>
          </div>
        </motion.div>

        {/* Loading State */}
        {loading ? (
          <div className="flex justify-center items-center p-8 sm:p-12">
            <div className="text-center space-y-3 sm:space-y-4">
              <Loader2 className="w-6 h-6 sm:w-8 sm:h-8 animate-spin text-blue-400 mx-auto" />
              <p className="text-slate-400 text-sm sm:text-base">Loading tasks...</p>
            </div>
          </div>
        ) : (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
          >
            <Tabs value={selectedTab} onValueChange={setSelectedTab} className="space-y-4 sm:space-y-6">
              <TabsList className="bg-slate-800/50 border border-slate-700 p-1 backdrop-blur-sm w-full sm:w-auto">
                <TabsTrigger 
                  value="kanban" 
                  className="data-[state=active]:bg-slate-700 data-[state=active]:text-white flex-1 sm:flex-none text-xs sm:text-sm"
                >
                  📋 Kanban
                </TabsTrigger>
                <TabsTrigger 
                  value="list" 
                  className="data-[state=active]:bg-slate-700 data-[state=active]:text-white flex-1 sm:flex-none text-xs sm:text-sm"
                >
                  📝 List
                </TabsTrigger>
              </TabsList>

              {/* Kanban Board */}
              <TabsContent value="kanban" className="space-y-4 sm:space-y-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3 sm:gap-4">
                  {columns.map((col) => {
                    const IconComponent = col.icon;
                    const tasksInColumn = getTasksByStatus(col.id);
                    
                    return (
                      <motion.div
                        key={col.id}
                        layout
                        className="flex flex-col h-full"
                      >
                        <Card className={`border-2 ${col.color} backdrop-blur-sm flex-1 flex flex-col min-h-[400px] sm:min-h-[500px]`}>
                          <CardHeader className="pb-3">
                            <div className="flex items-center gap-2">
                              <IconComponent className="w-4 h-4 sm:w-5 sm:h-5" />
                              <CardTitle className="text-base sm:text-lg font-semibold">{col.title}</CardTitle>
                            </div>
                            <CardDescription className="text-slate-300 text-xs sm:text-sm">
                              {tasksInColumn.length} task{tasksInColumn.length !== 1 ? 's' : ''}
                            </CardDescription>
                          </CardHeader>
                          <CardContent className="flex-1 space-y-2 sm:space-y-3 pb-3 sm:pb-4 overflow-y-auto">
                            <AnimatePresence>
                              {tasksInColumn.map((task, index) => (
                                <motion.div
                                  key={task.id}
                                  layout
                                  initial={{ opacity: 0, scale: 0.9 }}
                                  animate={{ opacity: 1, scale: 1 }}
                                  exit={{ opacity: 0, scale: 0.9 }}
                                  transition={{ delay: index * 0.1 }}
                                  className="p-3 sm:p-4 bg-slate-800/50 border border-slate-700 rounded-lg hover:bg-slate-700/50 transition-all duration-200 group"
                                >
                                  <div className="flex justify-between items-start mb-2">
                                    <h3 className="font-medium text-white text-sm leading-tight pr-2 flex-1">
                                      {task.title}
                                    </h3>
                                    <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0">
                                      {task.ai_recommendations && (
                                        <Badge className="bg-gradient-to-r from-purple-500 to-pink-500 text-xs">
                                          <Sparkles className="w-3 h-3 mr-1" /> AI
                                        </Badge>
                                      )}
                                      {isAdmin && (
                                        <DropdownMenu>
                                          <DropdownMenuTrigger asChild>
                                            <Button size="sm" variant="ghost" className="h-6 w-6 p-0">
                                              <MoreVertical className="w-3 h-3" />
                                            </Button>
                                          </DropdownMenuTrigger>
                                          <DropdownMenuContent align="end" className="w-48 bg-slate-800 border-slate-700">
                                            <DropdownMenuItem onClick={() => optimizeTask(task.id)} className="text-slate-300">
                                              <Zap className="w-4 h-4 mr-2" /> AI Optimize
                                            </DropdownMenuItem>
                                            <DropdownMenuItem onClick={() => deleteTask(task.id)} className="text-red-300">
                                              <Trash className="w-4 h-4 mr-2" /> Delete
                                            </DropdownMenuItem>
                                          </DropdownMenuContent>
                                        </DropdownMenu>
                                      )}
                                    </div>
                                  </div>
                                  
                                  <p className="text-xs text-slate-400 mb-2 line-clamp-2">
                                    {task.description}
                                  </p>

                                  <div className="flex items-center justify-between mb-2">
                                    <Badge 
                                      variant="outline" 
                                      className={`text-xs ${priorityConfig[task.priority as keyof typeof priorityConfig]?.color || 'bg-gray-500/20'} flex items-center gap-1`}
                                    >
                                      {task.priority}
                                    </Badge>
                                    <span className="text-xs text-slate-500 truncate ml-2 max-w-[80px] sm:max-w-none">
                                      {getAssigneeName(task)}
                                    </span>
                                  </div>
                                  
                                  <div className="flex items-center justify-between">
                                    {task.deadline && (
                                      <div className="flex items-center gap-1 text-xs text-slate-500">
                                        <Calendar className="w-3 h-3 flex-shrink-0" />
                                        <span className="truncate">{new Date(task.deadline).toLocaleDateString()}</span>
                                      </div>
                                    )}
                                    
                                    {col.id !== 'done' && (
                                      <Button 
                                        size="sm" 
                                        variant="ghost" 
                                        className="h-6 text-xs bg-slate-700/50 hover:bg-slate-600/50 flex-shrink-0 ml-2"
                                        onClick={() => {
                                          const currentIndex = columns.findIndex(c => c.id === col.id);
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
                                <div className="text-3xl sm:text-4xl mb-2">📭</div>
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
                    className="text-center py-12 sm:py-16"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                  >
                    <div className="text-4xl sm:text-6xl mb-4">🔍</div>
                    <h3 className="text-lg sm:text-xl font-semibold text-white mb-2">No tasks found</h3>
                    <p className="text-slate-400 text-sm sm:text-base">
                      {searchQuery ? "No tasks match your search criteria." : "Get started by creating your first task!"}
                    </p>
                  </motion.div>
                ) : (
                  <div className="space-y-2 sm:space-y-3">
                    {filteredTasks.map((task, index) => (
                      <motion.div
                        key={task.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.1 }}
                      >
                        <Card className="bg-slate-800/50 border-slate-700 hover:bg-slate-700/50 transition-all duration-200 backdrop-blur-sm">
                          <CardContent className="p-3 sm:p-4">
                            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4">
                              <div className="flex-1 space-y-2 min-w-0">
                                <div className="flex items-center gap-2 flex-wrap">
                                  <h3 className="font-semibold text-white text-sm sm:text-base truncate flex-1 min-w-0">{task.title}</h3>
                                  <div className="flex items-center gap-1 sm:gap-2 flex-shrink-0">
                                    <Badge 
                                      variant="outline" 
                                      className={`${priorityConfig[task.priority as keyof typeof priorityConfig]?.color || 'bg-gray-500/20'} text-xs`}
                                    >
                                      {task.priority}
                                    </Badge>
                                    <Badge variant="secondary" className="text-xs capitalize">
                                      {REVERSE_STATUS_MAP[task.status as keyof typeof REVERSE_STATUS_MAP] || task.status}
                                    </Badge>
                                    {task.ai_recommendations && (
                                      <Badge className="bg-gradient-to-r from-purple-500 to-pink-500 text-xs">
                                        <Sparkles className="w-3 h-3 mr-1" /> AI
                                      </Badge>
                                    )}
                                  </div>
                                </div>
                                <p className="text-xs sm:text-sm text-slate-400 line-clamp-2">
                                  {task.description}
                                </p>
                                <div className="flex items-center gap-3 sm:gap-4 text-xs text-slate-500 flex-wrap">
                                  <span className="truncate">Assigned to: {getAssigneeName(task)}</span>
                                  {task.deadline && (
                                    <span className="flex items-center gap-1 flex-shrink-0">
                                      <Calendar className="w-3 h-3" />
                                      {new Date(task.deadline).toLocaleDateString()}
                                    </span>
                                  )}
                                  {task.category && (
                                    <span className="truncate">Category: {task.category}</span>
                                  )}
                                  {task.estimated_hours && (
                                    <span className="flex items-center gap-1 flex-shrink-0">
                                      <Clock4 className="w-3 h-3" />
                                      {task.estimated_hours}h
                                    </span>
                                  )}
                                </div>
                              </div>
                              
                              <div className="flex gap-2 justify-end sm:justify-start">
                                {isAdmin && (
                                  <Button 
                                    size="sm" 
                                    variant="outline"
                                    onClick={() => optimizeTask(task.id)}
                                    className="border-blue-600 text-blue-400 hover:bg-blue-600/20 text-xs"
                                  >
                                    <Zap className="w-3 h-3 mr-1" /> Optimize
                                  </Button>
                                )}
                                {task.status !== 'completed' && (
                                  <Button 
                                    size="sm" 
                                    onClick={() => updateStatus(task.id, "done")}
                                    className="bg-green-600 hover:bg-green-700 text-xs"
                                  >
                                    <CheckCircle2 className="w-3 h-3 mr-1" /> Complete
                                  </Button>
                                )}
                                {isAdmin && (
                                  <Button 
                                    size="sm" 
                                    variant="destructive" 
                                    onClick={() => deleteTask(task.id)}
                                    className="text-xs"
                                  >
                                    <Trash className="w-3 h-3" />
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
              className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-3 sm:p-4"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <motion.div 
                className="bg-slate-800 border border-slate-700 rounded-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto backdrop-blur-sm"
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
              >
                <div className="p-4 sm:p-6">
                  <div className="flex items-center justify-between mb-4 sm:mb-6">
                    <h2 className="text-lg sm:text-xl font-semibold text-white">
                      Assign Task to {selectedEmployee.first_name}
                    </h2>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setShowTaskModal(false)}
                      className="text-slate-400 hover:text-white"
                    >
                      <X className="w-4 h-4 sm:w-5 sm:h-5" />
                    </Button>
                  </div>

                  <div className="space-y-3 sm:space-y-4">
                    <div>
                      <label className="text-sm font-medium text-slate-300 mb-2 block">Title</label>
                      <Input 
                        placeholder="Enter task title" 
                        value={taskForm.title} 
                        onChange={e => setTaskForm({...taskForm, title: e.target.value})}
                        className="bg-slate-700/50 border-slate-600 text-white text-sm sm:text-base"
                      />
                    </div>
                    
                    <div>
                      <label className="text-sm font-medium text-slate-300 mb-2 block">Description</label>
                      <Textarea 
                        placeholder="Enter task description" 
                        value={taskForm.description} 
                        onChange={e => setTaskForm({...taskForm, description: e.target.value})}
                        className="bg-slate-700/50 border-slate-600 text-white min-h-[80px] sm:min-h-[100px] text-sm sm:text-base"
                      />
                    </div>
                    
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
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
                          <option value="pending">To Do</option>
                          <option value="in_progress">In Progress</option>
                          <option value="review">Review</option>
                          <option value="completed">Completed</option>
                        </select>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                      <div>
                        <label className="text-sm font-medium text-slate-300 mb-2 block">Category</label>
                        <Input 
                          placeholder="e.g., Development, Design"
                          value={taskForm.category} 
                          onChange={e => setTaskForm({...taskForm, category: e.target.value})}
                          className="bg-slate-700/50 border-slate-600 text-white text-sm sm:text-base"
                        />
                      </div>
                      
                      <div>
                        <label className="text-sm font-medium text-slate-300 mb-2 block">Est. Hours</label>
                        <Input 
                          type="number"
                          placeholder="0"
                          value={taskForm.estimatedHours || ''} 
                          onChange={e => setTaskForm({...taskForm, estimatedHours: e.target.value ? parseInt(e.target.value) : null})}
                          className="bg-slate-700/50 border-slate-600 text-white text-sm sm:text-base"
                        />
                      </div>
                    </div>
                    
                    <div>
                      <label className="text-sm font-medium text-slate-300 mb-2 block">Deadline</label>
                      <Input 
                        type="date" 
                        value={taskForm.deadline} 
                        onChange={e => setTaskForm({...taskForm, deadline: e.target.value})}
                        className="bg-slate-700/50 border-slate-600 text-white text-sm sm:text-base"
                      />
                    </div>

                    <div className="space-y-2 sm:space-y-3">
                      <div className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          id="ai-insights"
                          checked={taskForm.generateAIInsights}
                          onChange={e => setTaskForm({...taskForm, generateAIInsights: e.target.checked})}
                          className="rounded border-slate-600 bg-slate-700/50 text-blue-500 focus:ring-blue-500/50 w-4 h-4"
                        />
                        <label htmlFor="ai-insights" className="text-sm font-medium text-slate-300 flex items-center gap-2">
                          <Brain className="w-4 h-4 text-purple-400" /> Generate AI Insights
                        </label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          id="auto-optimize"
                          checked={taskForm.autoOptimize}
                          onChange={e => setTaskForm({...taskForm, autoOptimize: e.target.checked})}
                          className="rounded border-slate-600 bg-slate-700/50 text-blue-500 focus:ring-blue-500/50 w-4 h-4"
                        />
                        <label htmlFor="auto-optimize" className="text-sm font-medium text-slate-300 flex items-center gap-2">
                          <Zap className="w-4 h-4 text-amber-400" /> Auto-Optimize with AI
                        </label>
                      </div>
                    </div>

                    <Button 
                      className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 mt-3 sm:mt-4 text-sm sm:text-base"
                      onClick={createTask}
                      disabled={!taskForm.title.trim()}
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