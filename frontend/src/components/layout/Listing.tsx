"use client";

import React from "react";
import { motion } from "framer-motion";
import { Calendar, Clock4, CheckCircle2, Zap, Trash, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";

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
}

interface TaskListProps {
  tasks: Task[];
  isAdmin: boolean;
  onUpdateStatus: (taskId: string, status: string) => void;
  onDeleteTask: (taskId: string) => void;
  onOptimizeTask: (taskId: string) => void;
  getAssigneeName: (task: Task) => string;
  searchQuery: string;
  filterPriority: string;
}

const REVERSE_STATUS_MAP = {
  "pending": "todo",
  "in_progress": "in-progress",
  "review": "review",
  "completed": "done",
  "blocked": "todo",
  "cancelled": "done"
} as const;

export default function TaskList({
  tasks,
  isAdmin,
  onUpdateStatus,
  onDeleteTask,
  onOptimizeTask,
  getAssigneeName,
  searchQuery,
  filterPriority
}: TaskListProps) {
  const priorityConfig = {
    low: { color: "bg-green-500/20 text-green-300 border-green-500/30", label: "Low" },
    medium: { color: "bg-amber-500/20 text-amber-300 border-amber-500/30", label: "Medium" },
    high: { color: "bg-red-500/20 text-red-300 border-red-500/30", label: "High" },
  };

  const filteredTasks = tasks.filter(task => {
    const priorityMatch = filterPriority === "all" || task.priority === filterPriority;
    const searchMatch = task.title?.toLowerCase().includes(searchQuery.toLowerCase()) || 
                       task.description?.toLowerCase().includes(searchQuery.toLowerCase());
    return priorityMatch && searchMatch;
  });

  if (filteredTasks.length === 0) {
    return (
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
    );
  }

  return (
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
                <div className="flex-1 space-y-2 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="font-semibold text-white truncate flex-1 min-w-0">{task.title}</h3>
                    <div className="flex items-center gap-2 flex-shrink-0">
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
                  <p className="text-sm text-slate-400 line-clamp-2">
                    {task.description}
                  </p>
                  <div className="flex items-center gap-4 text-xs text-slate-500 flex-wrap">
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
                      onClick={() => onOptimizeTask(task.id)}
                      className="border-blue-600 text-blue-400 hover:bg-blue-600/20 text-xs"
                    >
                      <Zap className="w-3 h-3 mr-1" /> Optimize
                    </Button>
                  )}
                  {task.status !== 'completed' && (
                    <Button 
                      size="sm" 
                      onClick={() => onUpdateStatus(task.id, "done")}
                      className="bg-green-600 hover:bg-green-700 text-xs"
                    >
                      <CheckCircle2 className="w-3 h-3 mr-1" /> Complete
                    </Button>
                  )}
                  {isAdmin && (
                    <Button 
                      size="sm" 
                      variant="destructive" 
                      onClick={() => onDeleteTask(task.id)}
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
  );
}