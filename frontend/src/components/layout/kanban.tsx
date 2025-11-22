"use client";

import React, { useMemo, useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Circle,
  PlayCircle,
  Eye,
  CheckCircle2,
  MoreVertical,
  Calendar,
  ArrowRight,
  Trash,
  Zap,
  Sparkles,
  Loader2,
  Brain,
  Target,
  Users,
  Gem,
  Clock,
  AlertTriangle,
  CheckCircle,
  ArrowUpCircle,
  ArrowDownCircle,
  FileText,
  Lightbulb,
  TrendingUp,
  AlertCircle,
  Rocket,
  BarChart3,
  ChevronRight,
  GripVertical,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from "@/components/ui/dropdown-menu";
import { useToast } from "@/hooks/use-toast";
import { Progress } from "@/components/ui/progress";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";

interface Task {
  id: string;
  title: string;
  description: string;
  status: string;
  priority: string;
  deadline?: string;
  category?: string;
  estimated_hours?: number;
  ai_recommendations?: any;
  assigned_to?: string;
  assignee?: any;
  assigned_to_user?: any;
  ai_optimization?: any;
}

interface KanbanBoardProps {
  tasks: Task[];
  loading: boolean;
  isAdmin: boolean;
  onUpdateStatus: (taskId: string, status: string) => void;
  onDeleteTask: (taskId: string) => void;
  onOptimizeTask: (taskId: string, optimizationType?: string) => void;
  getTasksByStatus: (status: string) => Task[];
  getAssigneeName: (task: Task) => string;
  searchQuery: string;
  filterPriority: string;
  optimizingTasks: Set<string>;
  taskOptimizations: Record<string, any>;
}

const REVERSE_STATUS_MAP = {
  "pending": "todo",
  "in_progress": "in-progress",
  "review": "review",
  "completed": "done",
  "blocked": "todo",
  "cancelled": "done"
} as const;

// Optimization types with icons and descriptions
const OPTIMIZATION_TYPES = [
  { 
    value: "efficiency", 
    label: "Efficiency", 
    icon: Zap, 
    description: "Optimize for time and resource efficiency", 
    color: "text-yellow-400",
    bgColor: "bg-yellow-500/20",
    borderColor: "border-yellow-500/30",
    gradient: "from-yellow-500/10 to-amber-500/10"
  },
  { 
    value: "quality", 
    label: "Quality", 
    icon: Gem, 
    description: "Focus on quality and excellence", 
    color: "text-blue-400",
    bgColor: "bg-blue-500/20",
    borderColor: "border-blue-500/30",
    gradient: "from-blue-500/10 to-cyan-500/10"
  },
  { 
    value: "collaboration", 
    label: "Collaboration", 
    icon: Users, 
    description: "Improve team collaboration", 
    color: "text-green-400",
    bgColor: "bg-green-500/20",
    borderColor: "border-green-500/30",
    gradient: "from-green-500/10 to-emerald-500/10"
  },
  { 
    value: "learning", 
    label: "Learning", 
    icon: Brain, 
    description: "Focus on skill development", 
    color: "text-purple-400",
    bgColor: "bg-purple-500/20",
    borderColor: "border-purple-500/30",
    gradient: "from-purple-500/10 to-pink-500/10"
  },
];

export default function KanbanBoard({
  tasks,
  loading,
  isAdmin,
  onUpdateStatus,
  onDeleteTask,
  onOptimizeTask,
  getTasksByStatus,
  getAssigneeName,
  searchQuery,
  filterPriority,
  optimizingTasks,
  taskOptimizations
}: KanbanBoardProps) {
  const { toast } = useToast();
  const [draggedTask, setDraggedTask] = useState<Task | null>(null);
  const [dragOverColumn, setDragOverColumn] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isTouchDragging, setIsTouchDragging] = useState(false);
  const [showOptimizationModal, setShowOptimizationModal] = useState<string | null>(null);
  const [isMobile, setIsMobile] = useState(false);
  
  const longPressTimer = useRef<NodeJS.Timeout | null>(null);
  const touchStartTime = useRef<number>(0);
  const touchStartY = useRef<number>(0);
  const dragElementRef = useRef<HTMLDivElement | null>(null);
  const scrollInterval = useRef<NodeJS.Timeout | null>(null);

  // Check mobile screen size
  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const columns = useMemo(() => [
    { 
      id: "todo", 
      title: "To Do", 
      icon: Circle, 
      color: "bg-blue-500/20 border-blue-500/30 text-blue-300", 
      gradient: "from-blue-500/5 to-slate-900/50",
      backendStatus: "pending",
      description: "Tasks waiting to be started"
    },
    { 
      id: "in-progress", 
      title: "In Progress", 
      icon: PlayCircle, 
      color: "bg-amber-500/20 border-amber-500/30 text-amber-300", 
      gradient: "from-amber-500/5 to-slate-900/50",
      backendStatus: "in_progress",
      description: "Tasks currently being worked on"
    },
    { 
      id: "review", 
      title: "Review", 
      icon: Eye, 
      color: "bg-purple-500/20 border-purple-500/30 text-purple-300", 
      gradient: "from-purple-500/5 to-slate-900/50",
      backendStatus: "review",
      description: "Tasks awaiting review or approval"
    },
    { 
      id: "done", 
      title: "Done", 
      icon: CheckCircle2, 
      color: "bg-green-500/20 border-green-500/30 text-green-300", 
      gradient: "from-green-500/5 to-slate-900/50",
      backendStatus: "completed",
      description: "Completed tasks"
    },
  ], []);

  const priorityConfig = useMemo(() => ({
    low: { 
      color: "bg-green-500/20 text-green-300 border-green-500/30", 
      label: "Low", 
      icon: ArrowDownCircle,
      textColor: "text-green-400",
      dotColor: "bg-green-400"
    },
    medium: { 
      color: "bg-amber-500/20 text-amber-300 border-amber-500/30", 
      label: "Medium", 
      icon: Circle,
      textColor: "text-amber-400",
      dotColor: "bg-amber-400"
    },
    high: { 
      color: "bg-red-500/20 text-red-300 border-red-500/30", 
      label: "High", 
      icon: ArrowUpCircle,
      textColor: "text-red-400",
      dotColor: "bg-red-400"
    },
  }), []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (longPressTimer.current) {
        clearTimeout(longPressTimer.current);
      }
      if (scrollInterval.current) {
        clearInterval(scrollInterval.current);
      }
    };
  }, []);

  const handleTouchStart = (task: Task, e: React.TouchEvent) => {
    if (!isMobile) return;
    
    touchStartTime.current = Date.now();
    touchStartY.current = e.touches[0].clientY;
    
    longPressTimer.current = setTimeout(() => {
      setIsDragging(true);
      setIsTouchDragging(true);
      setDraggedTask(task);
      
      const touch = e.touches[0];
      createDragPreview(task, touch.clientX, touch.clientY);
      
      toast({
        title: "Drag mode activated",
        description: "Drag the task to move it to another column",
        duration: 2000,
      });
    }, 500);
  };

  const createDragPreview = (task: Task, x: number, y: number) => {
    if (dragElementRef.current) {
      document.body.removeChild(dragElementRef.current);
    }

    const dragElement = document.createElement('div');
    dragElement.className = 'fixed z-50 bg-slate-800/95 border border-slate-600 rounded-xl p-4 shadow-2xl max-w-xs pointer-events-none backdrop-blur-xl';
    dragElement.style.left = `${x}px`;
    dragElement.style.top = `${y}px`;
    dragElement.style.transform = 'translate(-50%, -50%)';
    
    const priorityConfigItem = priorityConfig[task.priority as keyof typeof priorityConfig];
    const optimization = taskOptimizations[task.id];
    
    dragElement.innerHTML = `
      <div class="flex items-center gap-3 mb-2">
        <div class="w-2 h-2 rounded-full ${priorityConfigItem?.dotColor || 'bg-gray-400'}"></div>
        <div class="text-white font-semibold text-sm truncate flex-1">${task.title}</div>
        ${optimization ? '<Sparkles class="w-3 h-3 text-purple-400 flex-shrink-0" />' : ''}
      </div>
      <div class="text-slate-300 text-xs leading-relaxed">${task.description.substring(0, 80)}${task.description.length > 80 ? '...' : ''}</div>
    `;
    
    document.body.appendChild(dragElement);
    dragElementRef.current = dragElement;
  };

  const updateDragPreview = (x: number, y: number) => {
    if (dragElementRef.current) {
      dragElementRef.current.style.left = `${x}px`;
      dragElementRef.current.style.top = `${y}px`;
    }
  };

  const removeDragPreview = () => {
    if (dragElementRef.current) {
      document.body.removeChild(dragElementRef.current);
      dragElementRef.current = null;
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isDragging || !isTouchDragging) return;
    
    e.preventDefault();
    
    const touch = e.touches[0];
    const currentY = touch.clientY;
    
    updateDragPreview(touch.clientX, touch.clientY);
    
    const scrollThreshold = 100;
    const scrollSpeed = 15;
    const viewportHeight = window.innerHeight;
    
    if (scrollInterval.current) {
      clearInterval(scrollInterval.current);
      scrollInterval.current = null;
    }
    
    if (currentY > viewportHeight - scrollThreshold) {
      scrollInterval.current = setInterval(() => {
        window.scrollBy(0, scrollSpeed);
      }, 16);
    } else if (currentY < scrollThreshold) {
      scrollInterval.current = setInterval(() => {
        window.scrollBy(0, -scrollSpeed);
      }, 16);
    }
    
    const elements = document.elementsFromPoint(touch.clientX, touch.clientY);
    const columnElement = elements.find(el => el.getAttribute('data-column-id'));
    
    if (columnElement) {
      const columnId = columnElement.getAttribute('data-column-id');
      setDragOverColumn(columnId);
      
      columnElement.classList.add('ring-2', 'ring-blue-500/50', 'scale-[1.02]', 'shadow-lg');
      
      document.querySelectorAll('[data-column-id]').forEach(el => {
        if (el !== columnElement) {
          el.classList.remove('ring-2', 'ring-blue-500/50', 'scale-[1.02]', 'shadow-lg');
        }
      });
    } else {
      setDragOverColumn(null);
      document.querySelectorAll('[data-column-id]').forEach(el => {
        el.classList.remove('ring-2', 'ring-blue-500/50', 'scale-[1.02]', 'shadow-lg');
      });
    }
  };

  const handleTouchEnd = () => {
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current);
      longPressTimer.current = null;
    }
    
    if (scrollInterval.current) {
      clearInterval(scrollInterval.current);
      scrollInterval.current = null;
    }
    
    removeDragPreview();
    
    document.querySelectorAll('[data-column-id]').forEach(el => {
      el.classList.remove('ring-2', 'ring-blue-500/50', 'scale-[1.02]', 'shadow-lg');
    });
    
    if (isDragging && draggedTask && dragOverColumn) {
      onUpdateStatus(draggedTask.id, dragOverColumn);
    }
    
    setIsDragging(false);
    setIsTouchDragging(false);
    setDraggedTask(null);
    setDragOverColumn(null);
  };

  const handleDragStart = (task: Task) => {
    if (isMobile) return;
    setIsDragging(true);
    setDraggedTask(task);
  };

  const handleDragEnd = () => {
    if (isMobile) return;
    if (draggedTask && dragOverColumn) {
      onUpdateStatus(draggedTask.id, dragOverColumn);
    }
    setIsDragging(false);
    setDragOverColumn(null);
  };

  const handleDragOver = (e: React.DragEvent, columnId: string) => {
    if (isMobile) return;
    e.preventDefault();
    setDragOverColumn(columnId);
  };

  const handleContextMenu = (e: React.MouseEvent) => {
    e.preventDefault();
  };

  const handleOptimizeTask = async (taskId: string, optimizationType: string = 'efficiency') => {
    const result = await onOptimizeTask(taskId, optimizationType);
    if (result) {
      setShowOptimizationModal(taskId);
      toast({
        title: "⚡ Task Optimized",
        description: `AI has provided optimization suggestions for this task`,
      });
    }
  };

  const getOptimizationImprovement = (optimization: any) => {
    if (!optimization) return null;
    
    const improvements = [];
    
    if (optimization.expectedImprovement) {
      improvements.push(`🚀 ${optimization.expectedImprovement}% improvement`);
    }
    
    if (optimization.optimizedTask?.estimated_hours && optimization.originalTask?.estimated_hours) {
      const timeSaved = optimization.originalTask.estimated_hours - optimization.optimizedTask.estimated_hours;
      if (timeSaved > 0) {
        improvements.push(`⏱️ ${timeSaved}h saved`);
      }
    }
    
    if (optimization.optimizedTask?.priority === 'high' && optimization.originalTask?.priority !== 'high') {
      improvements.push(`🎯 Priority increased`);
    }
    
    return improvements.length > 0 ? improvements.join(' • ') : 'AI Enhanced';
  };

  const OptimizationModal = ({ taskId }: { taskId: string }) => {
    const optimization = taskOptimizations[taskId];
    const task = tasks.find(t => t.id === taskId);
    
    if (!optimization || !task) return null;

    const optimizedTask = optimization.optimizedTask || {};
    const originalTask = optimization.originalTask || {};
    const suggestions = optimization.suggestions || [];
    const implementationSteps = optimization.implementationSteps || [];
    const riskFactors = optimization.riskFactors || [];
    const expectedImprovement = optimization.expectedImprovement || '50';
    const optimizationNotes = optimizedTask.optimization_notes || '';

    return (
      <Dialog open={showOptimizationModal === taskId} onOpenChange={(open) => !open && setShowOptimizationModal(null)}>
        <DialogContent className="bg-slate-900/95 border-slate-700 backdrop-blur-xl max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader className="border-b border-slate-700/50 pb-4">
            <DialogTitle className="flex items-center gap-3 text-white text-xl">
              <div className="p-2 bg-gradient-to-r from-purple-500 to-pink-500 rounded-lg">
                <Sparkles className="w-6 h-6 text-white" />
              </div>
              <div>
                <div>AI Task Optimization</div>
                <DialogDescription className="text-slate-400 text-sm mt-1">
                  Intelligent optimizations for: <span className="text-white font-medium">{task.title}</span>
                </DialogDescription>
              </div>
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-6 py-4">
            {/* Optimization Summary */}
            <Card className="bg-gradient-to-br from-slate-800/50 to-slate-900/50 border-slate-700 backdrop-blur-sm">
              <CardHeader className="pb-4">
                <CardTitle className="text-white text-lg flex items-center gap-3">
                  <div className="p-2 bg-green-500/20 rounded-lg">
                    <TrendingUp className="w-5 h-5 text-green-400" />
                  </div>
                  Optimization Summary
                </CardTitle>
                <CardDescription className="text-slate-300 text-base leading-relaxed">
                  {optimizationNotes || "AI has analyzed your task and provided optimized recommendations."}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                  <div className="text-center p-4 bg-gradient-to-br from-green-500/10 to-emerald-500/10 rounded-xl border border-green-500/20">
                    <div className="text-2xl font-bold text-green-400">{expectedImprovement}%</div>
                    <div className="text-sm text-slate-400 mt-1">Expected Improvement</div>
                  </div>
                  
                  {originalTask.estimated_hours && optimizedTask.estimated_hours && (
                    <div className="text-center p-4 bg-gradient-to-br from-blue-500/10 to-cyan-500/10 rounded-xl border border-blue-500/20">
                      <div className="text-2xl font-bold text-blue-400">
                        {originalTask.estimated_hours - optimizedTask.estimated_hours}h
                      </div>
                      <div className="text-sm text-slate-400 mt-1">Time Saved</div>
                    </div>
                  )}
                  
                  {optimizedTask.priority && (
                    <div className="text-center p-4 bg-gradient-to-br from-amber-500/10 to-orange-500/10 rounded-xl border border-amber-500/20">
                      <div className="text-xl font-bold text-amber-400 capitalize">
                        {optimizedTask.priority}
                      </div>
                      <div className="text-sm text-slate-400 mt-1">Priority</div>
                    </div>
                  )}
                  
                  {optimizedTask.suggested_deadline && (
                    <div className="text-center p-4 bg-gradient-to-br from-purple-500/10 to-pink-500/10 rounded-xl border border-purple-500/20">
                      <div className="text-sm font-bold text-purple-400">
                        {new Date(optimizedTask.suggested_deadline).toLocaleDateString()}
                      </div>
                      <div className="text-sm text-slate-400 mt-1">Suggested Deadline</div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Optimized Task Details */}
            <Card className="bg-gradient-to-br from-slate-800/50 to-slate-900/50 border-slate-700 backdrop-blur-sm">
              <CardHeader className="pb-4">
                <CardTitle className="text-white text-lg flex items-center gap-3">
                  <div className="p-2 bg-yellow-500/20 rounded-lg">
                    <Rocket className="w-5 h-5 text-yellow-400" />
                  </div>
                  Optimized Task Details
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <h4 className="font-semibold text-white text-sm uppercase tracking-wider text-slate-400">Original Task</h4>
                    <div className="space-y-3 p-4 bg-slate-800/30 rounded-lg border border-slate-600/50">
                      <div>
                        <div className="text-slate-400 text-sm">Title</div>
                        <div className="text-white font-medium mt-1">{originalTask.title}</div>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <div className="text-slate-400 text-sm">Est. Hours</div>
                          <div className="text-white font-medium mt-1">{originalTask.estimated_hours}h</div>
                        </div>
                        <div>
                          <div className="text-slate-400 text-sm">Priority</div>
                          <div className="text-white font-medium mt-1 capitalize">{originalTask.priority}</div>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="space-y-4">
                    <h4 className="font-semibold text-white text-sm uppercase tracking-wider text-slate-400">Optimized Version</h4>
                    <div className="space-y-3 p-4 bg-gradient-to-br from-green-500/5 to-slate-800/30 rounded-lg border border-green-500/20">
                      <div>
                        <div className="text-slate-400 text-sm">Title</div>
                        <div className="text-white font-medium mt-1">{optimizedTask.title}</div>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <div className="text-slate-400 text-sm">Est. Hours</div>
                          <div className="text-white font-medium mt-1">{optimizedTask.estimated_hours}h</div>
                        </div>
                        <div>
                          <div className="text-slate-400 text-sm">Priority</div>
                          <div className="text-white font-medium mt-1 capitalize">{optimizedTask.priority}</div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
                
                <div>
                  <h4 className="font-semibold text-white text-sm uppercase tracking-wider text-slate-400 mb-3">Optimized Description</h4>
                  <p className="text-slate-300 text-sm leading-relaxed bg-slate-800/30 p-4 rounded-lg border border-green-500/20">
                    {optimizedTask.description}
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Implementation Steps */}
            {implementationSteps.length > 0 && (
              <Card className="bg-gradient-to-br from-slate-800/50 to-slate-900/50 border-slate-700 backdrop-blur-sm">
                <CardHeader className="pb-4">
                  <CardTitle className="text-white text-lg flex items-center gap-3">
                    <div className="p-2 bg-blue-500/20 rounded-lg">
                      <FileText className="w-5 h-5 text-blue-400" />
                    </div>
                    Implementation Steps
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {implementationSteps.map((step: string, index: number) => (
                      <motion.div 
                        key={index}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.1 }}
                        className="flex items-start gap-4 p-4 bg-slate-800/30 rounded-lg border border-slate-600/50 hover:border-blue-500/30 transition-colors group"
                      >
                        <div className="flex-shrink-0 w-8 h-8 bg-blue-500/20 rounded-full flex items-center justify-center group-hover:bg-blue-500/30 transition-colors">
                          <span className="text-blue-400 text-sm font-bold">{index + 1}</span>
                        </div>
                        <p className="text-slate-300 text-sm leading-relaxed flex-1">{step}</p>
                      </motion.div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* AI Suggestions */}
            {suggestions.length > 0 && (
              <Card className="bg-gradient-to-br from-slate-800/50 to-slate-900/50 border-slate-700 backdrop-blur-sm">
                <CardHeader className="pb-4">
                  <CardTitle className="text-white text-lg flex items-center gap-3">
                    <div className="p-2 bg-amber-500/20 rounded-lg">
                      <Lightbulb className="w-5 h-5 text-amber-400" />
                    </div>
                    AI Suggestions
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {suggestions.map((suggestion: string, index: number) => (
                      <motion.div
                        key={index}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.1 }}
                        className="p-4 bg-gradient-to-br from-amber-500/5 to-slate-800/30 rounded-lg border border-amber-500/20 hover:border-amber-500/30 transition-colors"
                      >
                        <div className="flex items-start gap-3">
                          <Lightbulb className="w-5 h-5 text-amber-400 mt-0.5 flex-shrink-0" />
                          <p className="text-slate-300 text-sm leading-relaxed flex-1">{suggestion}</p>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Risk Factors */}
            {riskFactors.length > 0 && (
              <Card className="bg-gradient-to-br from-slate-800/50 to-slate-900/50 border-slate-700 backdrop-blur-sm">
                <CardHeader className="pb-4">
                  <CardTitle className="text-white text-lg flex items-center gap-3">
                    <div className="p-2 bg-red-500/20 rounded-lg">
                      <AlertCircle className="w-5 h-5 text-red-400" />
                    </div>
                    Potential Risks & Considerations
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {riskFactors.map((risk: string, index: number) => (
                      <div key={index} className="flex items-start gap-3 p-3 bg-gradient-to-br from-red-500/5 to-slate-800/30 rounded-lg border border-red-500/20">
                        <AlertCircle className="w-4 h-4 text-red-400 mt-0.5 flex-shrink-0" />
                        <p className="text-slate-300 text-sm leading-relaxed flex-1">{risk}</p>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Usage Statistics */}
            {optimization.usage && (
              <Card className="bg-gradient-to-br from-slate-800/50 to-slate-900/50 border-slate-700 backdrop-blur-sm">
                <CardHeader className="pb-4">
                  <CardTitle className="text-white text-lg flex items-center gap-3">
                    <div className="p-2 bg-purple-500/20 rounded-lg">
                      <BarChart3 className="w-5 h-5 text-purple-400" />
                    </div>
                    AI Usage Analytics
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-center">
                    <div className="p-4 bg-gradient-to-br from-purple-500/10 to-slate-800/30 rounded-xl border border-purple-500/20">
                      <div className="text-2xl font-bold text-purple-400">{optimization.usage.promptTokens}</div>
                      <div className="text-sm text-slate-400 mt-2">Prompt Tokens</div>
                    </div>
                    <div className="p-4 bg-gradient-to-br from-green-500/10 to-slate-800/30 rounded-xl border border-green-500/20">
                      <div className="text-2xl font-bold text-green-400">{optimization.usage.completionTokens}</div>
                      <div className="text-sm text-slate-400 mt-2">Completion Tokens</div>
                    </div>
                    <div className="p-4 bg-gradient-to-br from-blue-500/10 to-slate-800/30 rounded-xl border border-blue-500/20">
                      <div className="text-2xl font-bold text-blue-400">{optimization.usage.totalTokens}</div>
                      <div className="text-sm text-slate-400 mt-2">Total Tokens</div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </DialogContent>
      </Dialog>
    );
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[400px]">
        <div className="text-center space-y-4">
          <Loader2 className="w-12 h-12 animate-spin text-blue-400 mx-auto" />
          <p className="text-slate-400 text-lg">Loading kanban board...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-4 lg:p-6">
      {/* Optimization Modal */}
      {showOptimizationModal && <OptimizationModal taskId={showOptimizationModal} />}

      {/* Drag & Drop Instructions */}
      {isDragging && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-gradient-to-r from-blue-500/20 to-cyan-500/20 border border-blue-500/30 rounded-xl p-4 text-center backdrop-blur-xl mx-auto max-w-md"
        >
          <p className="text-blue-300 text-sm font-medium">
            {isTouchDragging ? "📱 Drag to another column" : "🖱️ Drag to another column"}
          </p>
        </motion.div>
      )}

      {/* AI Optimization Stats */}
      {Object.keys(taskOptimizations).length > 0 && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-gradient-to-r from-purple-500/10 via-pink-500/10 to-slate-900/50 border border-purple-500/30 rounded-2xl p-4 lg:p-6 backdrop-blur-xl"
        >
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-gradient-to-r from-purple-500 to-pink-500 rounded-xl">
                <Sparkles className="w-6 h-6 text-white" />
              </div>
              <div>
                <h3 className="font-bold text-white text-lg">AI Optimizations Applied</h3>
                <p className="text-slate-400 text-sm">
                  {Object.keys(taskOptimizations).length} task{Object.keys(taskOptimizations).length !== 1 ? 's' : ''} enhanced with AI intelligence
                </p>
              </div>
            </div>
            <Badge className="bg-gradient-to-r from-purple-600 to-pink-600 text-white px-4 py-2 text-sm border-0 shadow-lg">
              <Brain className="w-4 h-4 mr-2" /> 
              {Object.keys(taskOptimizations).length} Optimized
            </Badge>
          </div>
        </motion.div>
      )}

      {/* Kanban Board */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4 lg:gap-6 auto-rows-fr">
        {columns.map((col) => {
          const IconComponent = col.icon;
          const tasksInColumn = getTasksByStatus(col.id);
          const isDragOver = dragOverColumn === col.id;
          const optimizedTasksInColumn = tasksInColumn.filter(task => taskOptimizations[task.id]);
          
          return (
            <motion.div
              key={col.id}
              layout
              className="flex flex-col h-full min-h-[500px]"
            >
              <Card 
                className={cn(
                  `border-2 bg-gradient-to-b ${col.gradient} backdrop-blur-xl flex-1 flex flex-col transition-all duration-300 overflow-hidden`,
                  col.color,
                  isDragOver && 'ring-2 ring-blue-500/50 scale-[1.02] shadow-xl'
                )}
                data-column-id={col.id}
                onDragOver={!isMobile ? (e) => handleDragOver(e, col.id) : undefined}
                onTouchMove={isMobile ? handleTouchMove : undefined}
              >
                <CardHeader className="pb-4 sticky top-0 bg-slate-900/80 backdrop-blur-xl z-10 border-b border-slate-700/50 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-lg bg-white/5">
                        <IconComponent className="w-5 h-5" />
                      </div>
                      <CardTitle className="text-lg font-bold text-white">{col.title}</CardTitle>
                    </div>
                    <Badge variant="secondary" className="bg-slate-700/50 text-slate-300 font-medium">
                      {tasksInColumn.length}
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <CardDescription className="text-slate-400 text-sm">
                      {col.description}
                    </CardDescription>
                    {optimizedTasksInColumn.length > 0 && (
                      <Badge className="bg-purple-500/20 text-purple-300 border-purple-500/30 text-xs">
                        <Sparkles className="w-3 h-3 mr-1" /> {optimizedTasksInColumn.length}
                      </Badge>
                    )}
                  </div>
                </CardHeader>
                
                <CardContent className="flex-1 p-4 lg:p-6 space-y-4 overflow-y-auto">
                  <AnimatePresence mode="popLayout">
                    {tasksInColumn.map((task, index) => {
                      const isOptimizing = optimizingTasks.has(task.id);
                      const optimization = taskOptimizations[task.id];
                      const priorityConfigItem = priorityConfig[task.priority as keyof typeof priorityConfig];
                      const PriorityIcon = priorityConfigItem?.icon || Circle;
                      
                      return (
                        <motion.div
                          key={task.id}
                          layout
                          initial={{ opacity: 0, scale: 0.9, y: 20 }}
                          animate={{ 
                            opacity: isDragging && draggedTask?.id === task.id ? 0.3 : 1, 
                            scale: isDragging && draggedTask?.id === task.id ? 0.95 : 1,
                            y: 0
                          }}
                          exit={{ opacity: 0, scale: 0.8, y: -20 }}
                          transition={{ 
                            type: "spring",
                            stiffness: 500,
                            damping: 30,
                            delay: index * 0.05
                          }}
                          className={cn(
                            "group relative p-4 lg:p-5 bg-slate-800/50 border border-slate-700 rounded-xl hover:bg-slate-700/50 transition-all duration-300 cursor-grab active:cursor-grabbing",
                            "backdrop-blur-sm hover:shadow-lg hover:border-slate-600",
                            optimization && "border-l-4 border-l-purple-500 shadow-lg shadow-purple-500/10",
                            isDragging && draggedTask?.id === task.id && "rotate-2 shadow-2xl"
                          )}
                          draggable={!isMobile}
                          onDragStart={!isMobile ? () => handleDragStart(task) : undefined}
                          onDragEnd={!isMobile ? handleDragEnd : undefined}
                          onTouchStart={isMobile ? (e) => handleTouchStart(task, e) : undefined}
                          onTouchEnd={isMobile ? handleTouchEnd : undefined}
                          onTouchMove={isMobile ? handleTouchMove : undefined}
                          onContextMenu={handleContextMenu}
                        >
                          {/* Drag Handle */}
                          {!isMobile && (
                            <div className="absolute -left-2 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity">
                              <GripVertical className="w-4 h-4 text-slate-500" />
                            </div>
                          )}

                          {/* AI Optimization Badge */}
                          {optimization && (
                            <div className="absolute -top-2 -right-2">
                              <Badge className="bg-gradient-to-r from-purple-600 to-pink-600 text-white text-xs px-2 py-1 shadow-lg border-0">
                                <Sparkles className="w-3 h-3 mr-1" /> AI
                              </Badge>
                            </div>
                          )}

                          {/* Loading Overlay */}
                          {isOptimizing && (
                            <div className="absolute inset-0 bg-slate-900/90 rounded-xl flex items-center justify-center z-10 backdrop-blur-md">
                              <div className="text-center">
                                <Loader2 className="w-8 h-8 animate-spin text-purple-400 mx-auto mb-2" />
                                <p className="text-purple-300 text-sm font-medium">AI Optimizing...</p>
                              </div>
                            </div>
                          )}

                          {/* Task Header */}
                          <div className="flex items-start justify-between mb-3">
                            <h3 className="font-semibold text-white leading-tight pr-2 flex-1 text-sm lg:text-base">
                              {task.title}
                            </h3>
                            <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-all duration-300 flex-shrink-0">
                              {isAdmin && (
                                <DropdownMenu>
                                  <DropdownMenuTrigger asChild>
                                    <Button size="sm" variant="ghost" className="h-7 w-7 p-0 bg-slate-700/50 hover:bg-slate-600/50">
                                      <MoreVertical className="w-3 h-3" />
                                    </Button>
                                  </DropdownMenuTrigger>
                                  <DropdownMenuContent align="end" className="w-64 bg-slate-800/95 border-slate-700 backdrop-blur-xl">
                                    <div className="px-3 py-2 text-xs font-semibold text-slate-400 border-b border-slate-600">
                                      AI Optimization
                                    </div>
                                    {OPTIMIZATION_TYPES.map((type) => {
                                      const IconComponent = type.icon;
                                      return (
                                        <DropdownMenuItem 
                                          key={type.value}
                                          onClick={() => handleOptimizeTask(task.id, type.value)} 
                                          className="text-slate-300 hover:bg-slate-700/50 px-3 py-2.5"
                                          disabled={isOptimizing}
                                        >
                                          <IconComponent className={`w-4 h-4 mr-3 ${type.color}`} />
                                          <div className="flex-1">
                                            <div className="font-medium">Optimize for {type.label}</div>
                                            <div className="text-xs text-slate-500 mt-0.5">{type.description}</div>
                                          </div>
                                        </DropdownMenuItem>
                                      );
                                    })}
                                    <DropdownMenuSeparator className="bg-slate-600" />
                                    <DropdownMenuItem 
                                      onClick={() => onDeleteTask(task.id)} 
                                      className="text-red-300 hover:bg-red-500/20 px-3 py-2.5"
                                    >
                                      <Trash className="w-4 h-4 mr-3" /> 
                                      <span className="font-medium">Delete Task</span>
                                    </DropdownMenuItem>
                                  </DropdownMenuContent>
                                </DropdownMenu>
                              )}
                            </div>
                          </div>
                          
                          {/* Task Description */}
                          <p className="text-slate-400 text-sm leading-relaxed mb-3 line-clamp-2">
                            {task.description}
                          </p>

                          {/* Optimization Preview */}
                          {optimization && (
                            <div className="mb-3 p-3 bg-gradient-to-r from-purple-500/10 to-pink-500/10 rounded-lg border border-purple-500/20">
                              <div className="flex items-center justify-between mb-2">
                                <span className="text-purple-300 font-medium text-sm flex items-center gap-2">
                                  <Sparkles className="w-3 h-3" /> AI Optimized
                                </span>
                                <span className="text-slate-400 text-xs font-medium">
                                  {getOptimizationImprovement(optimization)}
                                </span>
                              </div>
                              {optimization.expectedImprovement && (
                                <div className="mt-2">
                                  <div className="flex justify-between text-xs text-slate-400 mb-1">
                                    <span>Improvement Score</span>
                                    <span className="font-semibold">{optimization.expectedImprovement}%</span>
                                  </div>
                                  <Progress 
                                    value={parseInt(optimization.expectedImprovement)} 
                                    className="h-1.5 bg-slate-600/50"
                                  />
                                </div>
                              )}
                            </div>
                          )}

                          {/* Task Metadata */}
                          <div className="flex items-center justify-between mb-3">
                            <div className="flex items-center gap-2 flex-wrap">
                              <Badge 
                                variant="outline" 
                                className={cn(
                                  "text-xs font-medium flex items-center gap-1.5",
                                  priorityConfigItem?.color
                                )}
                              >
                                <PriorityIcon className="w-3 h-3" />
                                {task.priority}
                              </Badge>
                              {task.category && (
                                <Badge variant="secondary" className="text-xs bg-slate-700/50 text-slate-300 font-medium">
                                  {task.category}
                                </Badge>
                              )}
                            </div>
                            <span className="text-xs text-slate-500 truncate ml-2 font-medium">
                              {getAssigneeName(task)}
                            </span>
                          </div>
                          
                          {/* Task Footer */}
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              {task.deadline && (
                                <div className="flex items-center gap-1.5 text-xs text-slate-500 font-medium">
                                  <Calendar className="w-3 h-3" />
                                  {new Date(task.deadline).toLocaleDateString()}
                                </div>
                              )}
                            </div>
                            
                            <div className="flex items-center gap-2">
                              {col.id !== 'done' && !isDragging && (
                                <Button 
                                  size="sm" 
                                  variant="ghost" 
                                  className="h-7 text-xs bg-slate-700/50 hover:bg-slate-600/50 text-slate-300 font-medium"
                                  onClick={() => {
                                    const currentIndex = columns.findIndex(c => c.id === col.id);
                                    const nextStatus = columns[Math.min(currentIndex + 1, columns.length - 1)].id;
                                    onUpdateStatus(task.id, nextStatus);
                                  }}
                                >
                                  Move <ChevronRight className="w-3 h-3 ml-1" />
                                </Button>
                              )}
                              
                              {/* Mobile drag hint */}
                              {isMobile && !isDragging && (
                                <div className="text-xs text-slate-500 flex items-center gap-1">
                                  <span className="text-[10px] font-medium">Hold to drag</span>
                                </div>
                              )}
                            </div>
                          </div>

                          {/* View Optimization Button */}
                          {optimization && (
                            <div className="mt-3">
                              <Button 
                                size="sm" 
                                variant="outline" 
                                className="w-full h-8 text-xs border-purple-500/30 bg-purple-500/10 text-purple-300 hover:bg-purple-500/20 hover:text-white hover:border-purple-500/50 transition-all font-medium"
                                onClick={() => setShowOptimizationModal(task.id)}
                              >
                                <Sparkles className="w-3 h-3 mr-2" /> View AI Analysis
                              </Button>
                            </div>
                          )}
                        </motion.div>
                      );
                    })}
                  </AnimatePresence>
                  
                  {/* Empty State */}
                  {tasksInColumn.length === 0 && (
                    <motion.div 
                      className="text-center py-12 text-slate-500"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: 0.2 }}
                    >
                      <div className="text-5xl mb-3">📭</div>
                      <p className="text-sm font-medium text-slate-400">No tasks here</p>
                      {isDragOver && draggedTask && (
                        <p className="text-xs text-blue-300 mt-2 font-medium">Drop here to move</p>
                      )}
                    </motion.div>
                  )}
                </CardContent>
              </Card>
            </motion.div>
          );
        })}
      </div>

      {/* Mobile Instructions */}
      {isMobile && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-gradient-to-r from-slate-800/50 to-slate-900/50 border border-slate-700 rounded-2xl p-4 text-center backdrop-blur-xl"
        >
          <p className="text-slate-300 text-sm font-medium mb-2">
            👆 Press and hold any task to enable drag & drop
          </p>
          <p className="text-slate-500 text-xs">
            Auto-scrolls when dragging near screen edges
          </p>
        </motion.div>
      )}

      {/* AI Optimization Features */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        className="bg-gradient-to-br from-slate-800/30 to-slate-900/50 border border-slate-700 rounded-2xl p-6 backdrop-blur-xl"
      >
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2 bg-gradient-to-r from-purple-500 to-pink-500 rounded-lg">
            <Brain className="w-6 h-6 text-white" />
          </div>
          <div>
            <h3 className="font-bold text-white text-xl">AI Optimization Features</h3>
            <p className="text-slate-400 text-sm mt-1">Intelligent task optimization powered by AI</p>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {OPTIMIZATION_TYPES.map((type) => {
            const IconComponent = type.icon;
            return (
              <motion.div
                key={type.value}
                whileHover={{ scale: 1.02, y: -2 }}
                className={`p-4 rounded-xl border backdrop-blur-sm transition-all duration-300 hover:shadow-lg ${type.borderColor} bg-gradient-to-br ${type.gradient}`}
              >
                <div className="flex items-center gap-3 mb-3">
                  <div className={`p-2 rounded-lg ${type.bgColor}`}>
                    <IconComponent className={`w-5 h-5 ${type.color}`} />
                  </div>
                  <span className="font-bold text-white text-lg">{type.label}</span>
                </div>
                <p className="text-slate-300 text-sm leading-relaxed">{type.description}</p>
              </motion.div>
            );
          })}
        </div>
      </motion.div>
    </div>
  );
}