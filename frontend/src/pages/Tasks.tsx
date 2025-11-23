"use client";

import React, { useEffect, useState, useCallback, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Plus,
  Search,
  BarChart3,
  User,
  X,
  Calendar,
  CheckCircle2,
  PlayCircle,
  Brain,
  Users,
  Loader2,
  Sparkles,
  BrainCircuit,
  Crown,
  TrendingUp,
  Lightbulb,
  LineChart,
  Download,
  RefreshCw,
  Menu,
  MoreVertical,
  Target,
  Shield,
  Circle,
  AlertCircle,
  Rocket,
  Gem,
  Star,
  Zap,
  Bot,
  Lock,
  Unlock,
  Upload,
  Settings,
  Filter,
  Clock,
  Eye,
  Trash,
  ArrowRight,
  Gauge,
  TrendingDown,
  Activity,
  TargetIcon,
  BarChart,
  PieChart,
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
  CardFooter,
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
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";

// Import the new components
import KanbanBoard from "../components/layout/kanban";
import TaskList from "../components/layout/Listing";

const API_BASE = `${import.meta.env.VITE_BACKEND_URL}/api/tasks`;
const USERS_API = `${import.meta.env.VITE_BACKEND_URL}/api/auth`;

// Storage keys
const STORAGE_KEYS = {
  AI_PREDICTIONS: 'ai_predictions',
  AI_RECOMMENDATIONS: 'ai_recommendations',
  USER_PREFERENCES: 'user_preferences',
  TASKS_CACHE: 'tasks_cache',
  DASHBOARD_DATA: 'dashboard_data',
  AI_OPTIMIZATIONS: 'ai_optimizations'
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

// AI Intelligence Types
const INTELLIGENCE_TYPES = [
  { value: "strategic", label: "Strategic", icon: Target, description: "Long-term planning and vision", premium: true },
  { value: "creative", label: "Creative", icon: Lightbulb, description: "Innovative and out-of-the-box thinking", premium: false },
  { value: "analytical", label: "Analytical", icon: BarChart3, description: "Data-driven and systematic approach", premium: true },
  { value: "technical", label: "Technical", icon: Zap, description: "Technical implementation focused", premium: false },
  { value: "collaborative", label: "Collaborative", icon: Users, description: "Team coordination and communication", premium: true },
];

// Optimization Types
const OPTIMIZATION_TYPES = [
  { value: "efficiency", label: "Efficiency", icon: Zap, description: "Optimize for time and resource efficiency" },
  { value: "quality", label: "Quality", icon: Gem, description: "Focus on quality and excellence" },
  { value: "collaboration", label: "Collaboration", icon: Users, description: "Improve team collaboration" },
  { value: "learning", label: "Learning", icon: Brain, description: "Focus on skill development" },
];

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
  const [optimizingTasks, setOptimizingTasks] = useState<Set<string>>(new Set());
  const [taskOptimizations, setTaskOptimizations] = useState<Record<string, any>>({});

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
      const savedOptimizations = sessionStorage.getItem(STORAGE_KEYS.AI_OPTIMIZATIONS);

      if (savedPredictions) setAiPredictions(JSON.parse(savedPredictions));
      if (savedRecommendations) setAiRecommendations(JSON.parse(savedRecommendations));
      if (savedPreferences) setUserPreferences(JSON.parse(savedPreferences));
      if (savedDashboard) setAiDashboard(JSON.parse(savedDashboard));
      if (savedOptimizations) setTaskOptimizations(JSON.parse(savedOptimizations));
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

  // ------------------ NEW AI API INTEGRATIONS ------------------

  // AI Task Optimization
  const optimizeTask = useCallback(async (taskId: string, optimizationType = 'efficiency') => {
    setOptimizingTasks(prev => new Set(prev).add(taskId));
    
    try {
      const res = await fetch(`${API_BASE}/${taskId}/ai/optimize`, {
        method: "POST",
        headers: getAuthHeaders(),
        body: JSON.stringify({ optimizationType }),
      });

      if (!res.ok) {
        throw new Error(`HTTP error! status: ${res.status}`);
      }

      const data = await res.json();
      if (!data.success) throw new Error(data.error || "Failed to optimize task");

      // Store optimization results
      setTaskOptimizations(prev => ({
        ...prev,
        [taskId]: data.optimization
      }));

      saveToStorage(STORAGE_KEYS.AI_OPTIMIZATIONS, {
        ...taskOptimizations,
        [taskId]: data.optimization
      });

      toast({
        title: "⚡ Task Optimized",
        description: `AI has optimized this task for ${optimizationType}`,
      });

      return data.optimization;
    } catch (err: any) {
      console.error("Error optimizing task:", err);
      toast({
        title: "Optimization Failed",
        description: err.message,
        variant: "destructive",
      });
      return null;
    } finally {
      setOptimizingTasks(prev => {
        const newSet = new Set(prev);
        newSet.delete(taskId);
        return newSet;
      });
    }
  }, [getAuthHeaders, toast, saveToStorage, taskOptimizations]);

  // Dynamic AI Predictions
  const fetchAIPredictions = useCallback(async (timeframe = '30d', predictionType = 'completion') => {
    try {
      setLoading(true);
      
      const res = await fetch(
        `${API_BASE}/ai/predictions/dynamic?timeframe=${timeframe}&predictionType=${predictionType}&includePatterns=true`,
        { headers: getAuthHeaders() }
      );

      if (!res.ok) {
        throw new Error(`HTTP error! status: ${res.status}`);
      }

      const data = await res.json();
      if (!data.success) throw new Error(data.error || "Failed to fetch predictions");

      setAiPredictions(data);
      setShowAIPredictions(true);
      
      saveToStorage(STORAGE_KEYS.AI_PREDICTIONS, data);
      
      toast({
        title: "📊 AI Predictions Generated",
        description: "Dynamic predictions based on your work patterns",
      });
    } catch (err: any) {
      console.error("Error fetching AI predictions:", err);
      toast({
        title: "Predictions Failed",
        description: err.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [getAuthHeaders, saveToStorage, toast]);
  console.log("Backend URL:", import.meta.env.VITE_BACKEND_URL);

  // Personalized Recommendations
  const fetchAIRecommendations = useCallback(async (type = 'adaptive', limit = 5) => {
    try {
      setLoading(true);
      
      const res = await fetch(
        `${API_BASE}/ai/recommendations/personalized?type=${type}&limit=${limit}&includeSkills=true`,
        { headers: getAuthHeaders() }
      );

      if (!res.ok) {
        throw new Error(`HTTP error! status: ${res.status}`);
      }

      const data = await res.json();
      if (!data.success) throw new Error(data.error || "Failed to fetch recommendations");

      setAiRecommendations(data);
      setShowAIRecommendations(true);
      
      saveToStorage(STORAGE_KEYS.AI_RECOMMENDATIONS, data);
      
      toast({
        title: "💡 AI Recommendations",
        description: "Personalized suggestions based on your profile",
      });
    } catch (err: any) {
      console.error("Error fetching AI recommendations:", err);
      toast({
        title: "Recommendations Failed",
        description: err.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [getAuthHeaders, saveToStorage, toast]);

  // Intelligent Dashboard
  const fetchAIDashboard = useCallback(async (timeframe = '30d') => {
    try {
      setLoading(true);
      
      const res = await fetch(
        `${API_BASE}/ai/dashboard/intelligent?timeframe=${timeframe}&includeTrends=true&includeBenchmarks=true`,
        { headers: getAuthHeaders() }
      );

      if (!res.ok) {
        throw new Error(`HTTP error! status: ${res.status}`);
      }

      const data = await res.json();
      if (!data.success) throw new Error(data.error || "Failed to fetch dashboard");

      setAiDashboard(data);
      setShowAIDashboard(true);
      
      saveToStorage(STORAGE_KEYS.DASHBOARD_DATA, data);
      
      toast({
        title: "📈 AI Dashboard Generated",
        description: "Intelligent insights into your productivity",
      });
    } catch (err: any) {
      console.error("Error fetching AI dashboard:", err);
      toast({
        title: "Dashboard Failed",
        description: err.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [getAuthHeaders, saveToStorage, toast]);

  // ------------------ EXISTING FUNCTIONS (Updated) ------------------

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

  const fetchTasks = useCallback(async (adminStatus?: boolean) => {
    setLoading(true);
    try {
      const userIsAdmin = adminStatus !== undefined ? adminStatus : isAdmin;
      
      const endpoint = userIsAdmin ? `${API_BASE}` : `${API_BASE}`;
      
      const res = await fetch(endpoint, { 
        headers: getAuthHeaders() 
      });
      
      if (!res.ok) {
        throw new Error(`HTTP error! status: ${res.status}`);
      }
      
      const data = await res.json();
      if (!data.success) throw new Error(data.error || "Unable to fetch tasks");
      
      const tasksData = data.tasks || [];
      
      let filteredTasks = tasksData;
      if (!userIsAdmin) {
        filteredTasks = tasksData.filter((task: any) => 
          task.assigned_to === currentUserId
        );
      }
      
      setTasks(filteredTasks);
      
      if (userPreferences.autoSave) {
        saveToStorage(STORAGE_KEYS.TASKS_CACHE, filteredTasks);
      }
    } catch (err: any) {
      console.error("Error fetching tasks:", err);
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
  }, [isAdmin, currentUserId, getAuthHeaders, userPreferences.autoSave, saveToStorage, toast]);

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
    setShowUserList(false);
    setMobileMenuOpen(false);
  }, []);

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

  const clearCache = useCallback(() => {
    sessionStorage.clear();
    localStorage.removeItem(STORAGE_KEYS.TASKS_CACHE);
    localStorage.removeItem(STORAGE_KEYS.USER_PREFERENCES);
    setTaskOptimizations({});
    toast({
      title: "🔄 Cache Cleared",
      description: "All cached data has been cleared",
    });
  }, [toast]);

  const exportData = useCallback(() => {
    const data = {
      tasks,
      predictions: aiPredictions,
      recommendations: aiRecommendations,
      dashboard: aiDashboard,
      optimizations: taskOptimizations,
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
  }, [tasks, aiPredictions, aiRecommendations, aiDashboard, taskOptimizations, toast]);

  // ------------------ INITIALIZATION ------------------

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

  // ------------------ UTILITY FUNCTIONS ------------------

  const getTasksByStatus = useCallback((status: string) => {
    return tasks.filter(task => {
      const mappedStatus = REVERSE_STATUS_MAP[task.status as keyof typeof REVERSE_STATUS_MAP] || "todo";
      const priorityMatch = filterPriority === "all" || task.priority === filterPriority;
      const searchMatch = task.title?.toLowerCase().includes(searchQuery.toLowerCase()) || 
                         task.description?.toLowerCase().includes(searchQuery.toLowerCase());
      return mappedStatus === status && priorityMatch && searchMatch;
    });
  }, [tasks, filterPriority, searchQuery]);

  const getUserInitials = useCallback((user: any) => {
    return `${user.first_name?.[0] || ''}${user.last_name?.[0] || ''}`.toUpperCase();
  }, []);

  const getAssigneeName = useCallback((task: any) => {
    if (task.assignee) {
      return `${task.assignee.first_name} ${task.assignee.last_name}`;
    }
    if (task.assigned_to_user) {
      return `${task.assigned_to_user.first_name} ${task.assigned_to_user.last_name}`;
    }
    return "Unassigned";
  }, []);

  const stats = useMemo(() => {
    const totalTasks = tasks.length;
    const completedTasks = tasks.filter(task => task.status === 'completed').length;
    const inProgressTasks = tasks.filter(task => task.status === 'in_progress').length;
    const aiEnhancedTasks = tasks.filter(t => t.ai_recommendations || t.ai_optimization).length;

    return { totalTasks, completedTasks, inProgressTasks, aiEnhancedTasks };
  }, [tasks]);

  // ------------------ AI MODALS COMPONENTS ------------------

  const AIPredictionsModal = () => (
    <Dialog open={showAIPredictions} onOpenChange={setShowAIPredictions}>
      <DialogContent className="bg-slate-800 border-slate-700 max-w-4xl w-[95vw] sm:w-full max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-white">
            <TrendingUp className="w-5 h-5 text-blue-400" /> AI Predictions & Analytics
          </DialogTitle>
          <DialogDescription className="text-slate-400">
            Intelligent predictions based on your work patterns and task history
          </DialogDescription>
        </DialogHeader>
        
        {aiPredictions ? (
          <div className="space-y-6">
            {/* Prediction Overview */}
            <Card className="bg-slate-700/50 border-slate-600">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <Activity className="w-5 h-5 text-green-400" />
                  Prediction Overview
                </CardTitle>
                <CardDescription>
                  Confidence Score: {aiPredictions.confidence || '85%'} • Dynamic: {aiPredictions.dynamic ? 'Yes' : 'No'}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="text-center p-4 bg-slate-600/30 rounded-lg">
                    <div className="text-2xl font-bold text-white">{aiPredictions.predictedCompletionRate || '78%'}</div>
                    <div className="text-sm text-slate-400">Completion Rate</div>
                  </div>
                  <div className="text-center p-4 bg-slate-600/30 rounded-lg">
                    <div className="text-2xl font-bold text-white">{aiPredictions.estimatedProductivity || '+12%'}</div>
                    <div className="text-sm text-slate-400">Productivity Gain</div>
                  </div>
                  <div className="text-center p-4 bg-slate-600/30 rounded-lg">
                    <div className="text-2xl font-bold text-white">{aiPredictions.riskTasks || '2'}</div>
                    <div className="text-sm text-slate-400">At-Risk Tasks</div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Timeline Predictions */}
            <Card className="bg-slate-700/50 border-slate-600">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <Calendar className="w-5 h-5 text-purple-400" />
                  Timeline Forecast
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {aiPredictions.timelinePredictions?.map((prediction: any, index: number) => (
                    <div key={index} className="flex items-center justify-between p-3 bg-slate-600/30 rounded-lg">
                      <div>
                        <div className="font-medium text-white">{prediction.period}</div>
                        <div className="text-sm text-slate-400">{prediction.description}</div>
                      </div>
                      <Badge variant={prediction.confidence > 70 ? "default" : "secondary"}>
                        {prediction.confidence}% confidence
                      </Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Actionable Insights */}
            <Card className="bg-slate-700/50 border-slate-600">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <Lightbulb className="w-5 h-5 text-amber-400" />
                  Actionable Insights
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {aiPredictions.insights?.map((insight: any, index: number) => (
                    <div key={index} className="flex items-start gap-3 p-3 bg-slate-600/30 rounded-lg">
                      <TargetIcon className="w-4 h-4 text-green-400 mt-1 flex-shrink-0" />
                      <div>
                        <div className="font-medium text-white">{insight.title}</div>
                        <div className="text-sm text-slate-400 mt-1">{insight.description}</div>
                        {insight.impact && (
                          <Badge variant="outline" className="mt-2">
                            Impact: {insight.impact}
                          </Badge>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        ) : (
          <div className="text-center py-8">
            <Loader2 className="w-8 h-8 animate-spin text-blue-400 mx-auto mb-4" />
            <p className="text-slate-400">Loading predictions...</p>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );

  const AIRecommendationsModal = () => (
    <Dialog open={showAIRecommendations} onOpenChange={setShowAIRecommendations}>
      <DialogContent className="bg-slate-800 border-slate-700 max-w-4xl w-[95vw] sm:w-full max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-white">
            <Lightbulb className="w-5 h-5 text-amber-400" /> Personalized AI Recommendations
          </DialogTitle>
          <DialogDescription className="text-slate-400">
            Smart suggestions tailored to your work style and preferences
          </DialogDescription>
        </DialogHeader>
        
        {aiRecommendations ? (
          <div className="space-y-6">
            {/* Recommendation Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Card className="bg-slate-700/50 border-slate-600">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-2xl font-bold text-white">{aiRecommendations.relevanceScore || '92%'}</div>
                      <div className="text-sm text-slate-400">Relevance Score</div>
                    </div>
                    <TrendingUp className="w-8 h-8 text-green-400" />
                  </div>
                </CardContent>
              </Card>
              <Card className="bg-slate-700/50 border-slate-600">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-2xl font-bold text-white">{aiRecommendations.personalizationLevel || 'High'}</div>
                      <div className="text-sm text-slate-400">Personalization</div>
                    </div>
                    <User className="w-8 h-8 text-blue-400" />
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Task Recommendations */}
            <Card className="bg-slate-700/50 border-slate-600">
              <CardHeader>
                <CardTitle className="text-white">Recommended Tasks</CardTitle>
                <CardDescription>Based on your skills and work patterns</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {aiRecommendations.recommendations?.taskSuggestions?.map((suggestion: any, index: number) => (
                    <div key={index} className="p-4 bg-slate-600/30 rounded-lg border border-slate-500/30">
                      <div className="flex items-start justify-between mb-2">
                        <h4 className="font-semibold text-white">{suggestion.title}</h4>
                        <Badge variant={suggestion.priority === 'high' ? 'destructive' : 'secondary'}>
                          {suggestion.priority}
                        </Badge>
                      </div>
                      <p className="text-sm text-slate-300 mb-3">{suggestion.description}</p>
                      <div className="flex items-center justify-between text-xs text-slate-400">
                        <span>Estimated: {suggestion.estimatedHours}h</span>
                        <span>Skill Match: {suggestion.skillMatch}%</span>
                        <Button size="sm" variant="outline" className="h-7 text-xs">
                          <Plus className="w-3 h-3 mr-1" /> Create
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Skill Development */}
            <Card className="bg-slate-700/50 border-slate-600">
              <CardHeader>
                <CardTitle className="text-white">Skill Development</CardTitle>
                <CardDescription>Recommended skills to enhance your productivity</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {aiRecommendations.recommendations?.skillDevelopment?.map((skill: any, index: number) => (
                    <div key={index} className="flex items-center justify-between p-3 bg-slate-600/30 rounded-lg">
                      <div>
                        <div className="font-medium text-white">{skill.name}</div>
                        <div className="text-sm text-slate-400">{skill.reason}</div>
                      </div>
                      <Badge variant="outline">{skill.level}</Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        ) : (
          <div className="text-center py-8">
            <Loader2 className="w-8 h-8 animate-spin text-amber-400 mx-auto mb-4" />
            <p className="text-slate-400">Loading recommendations...</p>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );

  const AIDashboardModal = () => (
    <Dialog open={showAIDashboard} onOpenChange={setShowAIDashboard}>
      <DialogContent className="bg-slate-800 border-slate-700 max-w-6xl w-[95vw] sm:w-full max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-white">
            <LineChart className="w-5 h-5 text-green-400" /> Intelligent Productivity Dashboard
          </DialogTitle>
          <DialogDescription className="text-slate-400">
            Comprehensive AI-powered insights into your work patterns and productivity
          </DialogDescription>
        </DialogHeader>
        
        {aiDashboard ? (
          <div className="space-y-6">
            {/* Key Metrics */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <Card className="bg-slate-700/50 border-slate-600">
                <CardContent className="p-4">
                  <div className="text-2xl font-bold text-white">{aiDashboard.metrics?.efficiency || '87%'}</div>
                  <div className="text-sm text-slate-400">Efficiency Score</div>
                  <TrendingUp className="w-4 h-4 text-green-400 mt-1" />
                </CardContent>
              </Card>
              <Card className="bg-slate-700/50 border-slate-600">
                <CardContent className="p-4">
                  <div className="text-2xl font-bold text-white">{aiDashboard.metrics?.focusTime || '6.2h'}</div>
                  <div className="text-sm text-slate-400">Avg Focus Time</div>
                  <Clock className="w-4 h-4 text-blue-400 mt-1" />
                </CardContent>
              </Card>
              <Card className="bg-slate-700/50 border-slate-600">
                <CardContent className="p-4">
                  <div className="text-2xl font-bold text-white">{aiDashboard.metrics?.completionRate || '94%'}</div>
                  <div className="text-sm text-slate-400">Completion Rate</div>
                  <CheckCircle2 className="w-4 h-4 text-green-400 mt-1" />
                </CardContent>
              </Card>
              <Card className="bg-slate-700/50 border-slate-600">
                <CardContent className="p-4">
                  <div className="text-2xl font-bold text-white">{aiDashboard.metrics?.aiAdoption || '78%'}</div>
                  <div className="text-sm text-slate-400">AI Adoption</div>
                  <Brain className="w-4 h-4 text-purple-400 mt-1" />
                </CardContent>
              </Card>
            </div>

            {/* Productivity Trends */}
            <Card className="bg-slate-700/50 border-slate-600">
              <CardHeader>
                <CardTitle className="text-white">Productivity Trends</CardTitle>
                <CardDescription>Your performance over the last 30 days</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {aiDashboard.trends?.map((trend: any, index: number) => (
                    <div key={index} className="flex items-center justify-between">
                      <span className="text-slate-300">{trend.period}</span>
                      <div className="flex items-center gap-4">
                        <Progress value={trend.value} className="w-32" />
                        <span className="text-white font-medium">{trend.value}%</span>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Work Pattern Analysis */}
            <Card className="bg-slate-700/50 border-slate-600">
              <CardHeader>
                <CardTitle className="text-white">Work Pattern Analysis</CardTitle>
                <CardDescription>AI insights into your working habits</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {aiDashboard.patterns?.map((pattern: any, index: number) => (
                    <div key={index} className="p-4 bg-slate-600/30 rounded-lg">
                      <div className="flex items-center gap-3 mb-2">
                        <pattern.icon className="w-5 h-5 text-blue-400" />
                        <h4 className="font-semibold text-white">{pattern.title}</h4>
                      </div>
                      <p className="text-sm text-slate-300">{pattern.insight}</p>
                      <div className="mt-2">
                        <Badge variant={pattern.impact === 'positive' ? 'default' : 'secondary'}>
                          {pattern.impact}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Optimization Opportunities */}
            <Card className="bg-slate-700/50 border-slate-600">
              <CardHeader>
                <CardTitle className="text-white">Optimization Opportunities</CardTitle>
                <CardDescription>Areas where AI can help improve your workflow</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {aiDashboard.optimizations?.map((optimization: any, index: number) => (
                    <div key={index} className="flex items-center justify-between p-3 bg-slate-600/30 rounded-lg">
                      <div>
                        <div className="font-medium text-white">{optimization.area}</div>
                        <div className="text-sm text-slate-400">{optimization.suggestion}</div>
                      </div>
                      <Badge variant="outline" className="bg-green-500/20 text-green-300">
                        +{optimization.potentialGain}%
                      </Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        ) : (
          <div className="text-center py-8">
            <Loader2 className="w-8 h-8 animate-spin text-green-400 mx-auto mb-4" />
            <p className="text-slate-400">Loading dashboard data...</p>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );

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
            <DropdownMenuItem onClick={() => fetchAIPredictions()} className="text-slate-300">
              <TrendingUp className="w-4 h-4 mr-2" /> AI Predictions
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => fetchAIRecommendations()} className="text-slate-300">
              <Lightbulb className="w-4 h-4 mr-2" /> AI Recommendations
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => fetchAIDashboard()} className="text-slate-300">
              <LineChart className="w-4 h-4 mr-2" /> AI Dashboard
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => setShowAIModal(true)} className="text-slate-300">
              <Sparkles className="w-4 h-4 mr-2" /> AI Task Generator
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => setShowUserList(true)} className="text-slate-300">
              <Plus className="w-4 h-4 mr-2" /> Create Task
            </DropdownMenuItem>
            <DropdownMenuSeparator className="bg-slate-600" />
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
        className="p-4 sm:p-6 space-y-6"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5 }}
      >
        {/* Header */}
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div className="space-y-2 flex-1 min-w-0">
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
                  onClick={() => fetchAIPredictions()}
                  variant="outline" 
                  size="sm"
                  className="bg-slate-800/50 border-slate-700 hover:bg-slate-700/50"
                >
                  <TrendingUp className="w-4 h-4 mr-2" /> Predictions
                </Button>
                <Button 
                  onClick={() => fetchAIRecommendations()}
                  variant="outline" 
                  size="sm"
                  className="bg-slate-800/50 border-slate-700 hover:bg-slate-700/50"
                >
                  <Lightbulb className="w-4 h-4 mr-2" /> Recommendations
                </Button>
                <Button 
                  onClick={() => fetchAIDashboard()}
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
                              {INTELLIGENCE_TYPES.map(type => (
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

        {/* Stats Cards */}
        <motion.div 
          className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4"
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.3 }}
        >
          <Card className="bg-slate-800/50 border-slate-700 backdrop-blur-sm">
            <CardContent className="p-3 sm:p-4 flex items-center gap-3 sm:gap-4">
              <div className="p-2 sm:p-3 rounded-full bg-blue-500/20">
                <Users className="w-4 h-4 sm:w-6 sm:h-6 text-blue-400" />
              </div>
              <div>
                <p className="text-xl sm:text-2xl font-bold text-white">{stats.totalTasks}</p>
                <p className="text-xs sm:text-sm text-slate-400">Total Tasks</p>
              </div>
            </CardContent>
          </Card>
          
          <Card className="bg-slate-800/50 border-slate-700 backdrop-blur-sm">
            <CardContent className="p-3 sm:p-4 flex items-center gap-3 sm:gap-4">
              <div className="p-2 sm:p-3 rounded-full bg-amber-500/20">
                <PlayCircle className="w-4 h-4 sm:w-6 sm:h-6 text-amber-400" />
              </div>
              <div>
                <p className="text-xl sm:text-2xl font-bold text-white">{stats.inProgressTasks}</p>
                <p className="text-xs sm:text-sm text-slate-400">In Progress</p>
              </div>
            </CardContent>
          </Card>
          
          <Card className="bg-slate-800/50 border-slate-700 backdrop-blur-sm">
            <CardContent className="p-3 sm:p-4 flex items-center gap-3 sm:gap-4">
              <div className="p-2 sm:p-3 rounded-full bg-green-500/20">
                <CheckCircle2 className="w-4 h-4 sm:w-6 sm:h-6 text-green-400" />
              </div>
              <div>
                <p className="text-xl sm:text-2xl font-bold text-white">{stats.completedTasks}</p>
                <p className="text-xs sm:text-sm text-slate-400">Completed</p>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-slate-800/50 border-slate-700 backdrop-blur-sm">
            <CardContent className="p-3 sm:p-4 flex items-center gap-3 sm:gap-4">
              <div className="p-2 sm:p-3 rounded-full bg-purple-500/20">
                <Brain className="w-4 h-4 sm:w-6 sm:h-6 text-purple-400" />
              </div>
              <div>
                <p className="text-xl sm:text-2xl font-bold text-white">{stats.aiEnhancedTasks}</p>
                <p className="text-xs sm:text-sm text-slate-400">AI Enhanced</p>
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
              <div className="flex items-center gap-2">
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
                        <Target className="w-3 h-3 text-green-400" />
                        {obj}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              {aiGeneratedTask.ai_insights && (
                <div className="bg-slate-800/50 rounded-lg p-3">
                  <p className="text-xs sm:text-sm font-medium text-slate-400 mb-2">AI Insights:</p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-3 text-xs sm:text-sm">
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
              <div className="flex flex-col sm:flex-row gap-3">
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
                <div className="flex items-center gap-3">
                  <Badge variant="secondary" className="bg-slate-700 text-slate-300 text-xs">
                    <Users className="w-3 h-3 mr-1" /> {users.length} employees
                  </Badge>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={exportData}
                    className="border-green-600 text-green-400 hover:bg-green-600/20 text-xs"
                  >
                    <Download className="w-3 h-3 mr-1" /> Export
                  </Button>
                </div>
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
                        <CardContent className="flex items-center gap-3 p-3 sm:p-4">
                          <Avatar className="h-8 w-8 sm:h-10 sm:w-10 border border-slate-600">
                            <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-600 text-white text-xs sm:text-sm">
                              {getUserInitials(user)}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-white text-sm sm:text-base truncate">{user.first_name} {user.last_name}</p>
                            <p className="text-xs sm:text-sm text-slate-400 truncate">{user.email}</p>
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
          <div className="relative flex-1">
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
              className="px-3 py-2 bg-slate-800/50 border border-slate-700 rounded-md text-white focus:ring-2 focus:ring-blue-500/50 text-sm sm:text-base flex-1 sm:flex-none"
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
              className="border-slate-600 text-slate-300 hover:bg-slate-700/50 text-xs sm:text-sm"
            >
              <RefreshCw className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" /> Clear Cache
            </Button>
          </div>
        </motion.div>

        {/* Loading State */}
        {loading ? (
          <div className="flex justify-center items-center p-8 sm:p-12">
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
              <TabsContent value="kanban" className="space-y-6">
                <KanbanBoard
                  tasks={tasks}
                  loading={loading}
                  isAdmin={isAdmin}
                  onUpdateStatus={updateStatus}
                  onDeleteTask={deleteTask}
                  onOptimizeTask={optimizeTask}
                  getTasksByStatus={getTasksByStatus}
                  getAssigneeName={getAssigneeName}
                  searchQuery={searchQuery}
                  filterPriority={filterPriority}
                  optimizingTasks={optimizingTasks}
                  taskOptimizations={taskOptimizations}
                />
              </TabsContent>

              {/* List View */}
              <TabsContent value="list">
                <TaskList
                  tasks={tasks}
                  isAdmin={isAdmin}
                  onUpdateStatus={updateStatus}
                  onDeleteTask={deleteTask}
                  onOptimizeTask={optimizeTask}
                  getAssigneeName={getAssigneeName}
                  searchQuery={searchQuery}
                  filterPriority={filterPriority}
                  optimizingTasks={optimizingTasks}
                  taskOptimizations={taskOptimizations}
                />
              </TabsContent>
            </Tabs>
          </motion.div>
        )}

        {/* Task Creation Modal */}
        <Dialog open={showTaskModal} onOpenChange={setShowTaskModal}>
          <DialogContent className="bg-slate-800 border-slate-700 max-w-2xl w-[95vw] sm:w-full max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 text-white">
                <Plus className="w-5 h-5 text-blue-400" /> Create New Task
                {selectedEmployee && (
                  <Badge variant="secondary" className="bg-blue-500/20 text-blue-300">
                    For: {selectedEmployee.first_name} {selectedEmployee.last_name}
                  </Badge>
                )}
              </DialogTitle>
              <DialogDescription className="text-slate-400">
                Create a new task and assign it to the selected employee
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium text-slate-300 mb-2 block">Task Title *</label>
                <Input
                  placeholder="Enter task title..."
                  value={taskForm.title}
                  onChange={(e) => setTaskForm({...taskForm, title: e.target.value})}
                  className="bg-slate-700/50 border-slate-600 text-white"
                />
              </div>

              <div>
                <label className="text-sm font-medium text-slate-300 mb-2 block">Description *</label>
                <Textarea
                  placeholder="Describe the task in detail..."
                  value={taskForm.description}
                  onChange={(e) => setTaskForm({...taskForm, description: e.target.value})}
                  className="bg-slate-700/50 border-slate-600 text-white min-h-[100px]"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-slate-300 mb-2 block">Priority</label>
                  <Select value={taskForm.priority} onValueChange={(value) => setTaskForm({...taskForm, priority: value})}>
                    <SelectTrigger className="bg-slate-700/50 border-slate-600 text-white">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="low">Low Priority</SelectItem>
                      <SelectItem value="medium">Medium Priority</SelectItem>
                      <SelectItem value="high">High Priority</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <label className="text-sm font-medium text-slate-300 mb-2 block">Deadline</label>
                  <Input
                    type="date"
                    value={taskForm.deadline}
                    onChange={(e) => setTaskForm({...taskForm, deadline: e.target.value})}
                    className="bg-slate-700/50 border-slate-600 text-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-slate-300 mb-2 block">Category</label>
                  <Input
                    placeholder="e.g., Development, Design, Marketing"
                    value={taskForm.category}
                    onChange={(e) => setTaskForm({...taskForm, category: e.target.value})}
                    className="bg-slate-700/50 border-slate-600 text-white"
                  />
                </div>

                <div>
                  <label className="text-sm font-medium text-slate-300 mb-2 block">Estimated Hours</label>
                  <Input
                    type="number"
                    placeholder="e.g., 8"
                    value={taskForm.estimatedHours || ''}
                    onChange={(e) => setTaskForm({...taskForm, estimatedHours: e.target.value ? parseInt(e.target.value) : null})}
                    className="bg-slate-700/50 border-slate-600 text-white"
                  />
                </div>
              </div>

              <div className="flex items-center gap-4 p-4 bg-slate-700/30 rounded-lg">
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="generateAIInsights"
                    checked={taskForm.generateAIInsights}
                    onChange={(e) => setTaskForm({...taskForm, generateAIInsights: e.target.checked})}
                    className="w-4 h-4 text-blue-600 bg-slate-600 border-slate-500 rounded focus:ring-blue-500 focus:ring-2"
                  />
                  <label htmlFor="generateAIInsights" className="text-sm text-slate-300">
                    Generate AI Insights
                  </label>
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="autoOptimize"
                    checked={taskForm.autoOptimize}
                    onChange={(e) => setTaskForm({...taskForm, autoOptimize: e.target.checked})}
                    className="w-4 h-4 text-purple-600 bg-slate-600 border-slate-500 rounded focus:ring-purple-500 focus:ring-2"
                  />
                  <label htmlFor="autoOptimize" className="text-sm text-slate-300">
                    Auto-Optimize Task
                  </label>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-3 pt-4">
                <Button 
                  onClick={createTask}
                  disabled={!taskForm.title.trim() || !taskForm.description.trim()}
                  className="flex-1 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
                >
                  <Plus className="w-4 h-4 mr-2" /> Create Task
                </Button>
                <Button 
                  variant="outline"
                  onClick={() => setShowTaskModal(false)}
                  className="flex-1 border-slate-600 text-slate-300 hover:bg-slate-700/50"
                >
                  Cancel
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* AI Modals */}
        <AIPredictionsModal />
        <AIRecommendationsModal />
        <AIDashboardModal />
      </motion.div>
    </div>
  );
}