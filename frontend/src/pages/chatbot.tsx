import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Bot, MessageSquare, Brain, FileText, Upload, X, Plus, Trash2,
  Search, Filter, Download, Eye, Copy, Check, ChevronRight,
  Zap, Sparkles, Loader2, Clock, User, Settings,
  BookOpen, BarChart, Calendar, Users, Shield, Database,
  ArrowRight, MoreVertical, Star, Lightbulb, Paperclip,
  Send, History, FolderOpen, Briefcase, Target, FileCheck,
  FileX, FileSearch, FilePlus, FileQuestion, FileBarChart,
  CheckSquare, TrendingUp, Mail, Inbox, Server, Cpu,
  Menu, Grid, Home, LogOut, Sun, Moon, HelpCircle,
  Book, Terminal, Code, Cloud, Layers, Workflow,
  MessageCircle, FileSpreadsheet, FileArchive, FileCode,
  Image, Video, Music, Map, Heart, Globe, ShieldCheck,
  Bell, Bookmark, Share2, Mic, Video as VideoIcon,
  Command, Hash, Key, Lock, Unlock, AlertCircle,
  ExternalLink, Maximize2, Minimize2, Play, Pause,
  SkipBack, SkipForward, Volume2, VolumeX,
  Grid as GridIcon, List, Columns, Sidebar,
  ChevronLeft, ChevronDown, ChevronUp, ChevronsLeft,
  ChevronsRight, ChevronsUp, ChevronsDown,
  RotateCcw, RefreshCw, Repeat, Shuffle,
  TrendingDown, DollarSign, PieChart, Target as TargetIcon,
  Rocket, Coffee, Crown, Award, Trophy, Medal,
  Gift, Package, ShoppingCart, CreditCard,
  Phone, Mail as MailIcon, MapPin, Navigation,
  Wifi, Bluetooth, Battery, BatteryCharging,
  Thermometer, Droplets, Wind, CloudRain,
  CloudSnow, CloudLightning, Sunrise, Sunset,
  Camera, CameraOff, Headphones, MicOff,
  PhoneOff, VideoOff, Airplay, Cast,
  Smartphone, Tablet, Monitor, Laptop,
  Printer, Scanner, HardDrive, Save,
  Folder, FolderPlus, FolderMinus, FolderOpen as FolderOpenIcon,
  File, FilePlus as FilePlusIcon, FileMinus, FileEdit,
  Scissors, Crop, Edit, Edit2, Edit3,
  Type, Bold, Italic, Underline, Strikethrough,
  AlignLeft, AlignCenter, AlignRight, AlignJustify,
  List as ListIcon, ListOrdered, Link, Unlink,
  Image as ImageIcon, Film, Music as MusicIcon,
  Volume, Volume1, Mic as MicIcon,
  PhoneCall, PhoneIncoming, PhoneOutgoing,
  PhoneMissed, PhoneForwarded, PhoneOff as PhoneOffIcon,
  Mail as MailIcon2, MailOpen, MailCheck,
  Send as SendIcon, Inbox as InboxIcon,
  Archive, ArchiveRestore, BellOff,
  BookmarkPlus, BookmarkCheck, BookmarkMinus,
  BookOpen as BookOpenIcon, BookOpenCheck,
  Calendar as CalendarIcon, CalendarDays,
  Clock as ClockIcon, Timer, AlarmClock,
  Watch, Hourglass, StopCircle, PlayCircle,
  PauseCircle, SkipBackCircle, SkipForwardCircle,
  Repeat as RepeatIcon, Shuffle as ShuffleIcon,
  FastForward, Rewind, PlaySquare,
  PauseSquare, SkipBackSquare, SkipForwardSquare
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from '@/components/ui/dropdown-menu';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: Date;
  metadata?: {
    suggestions?: Suggestion[];
    documentIds?: string[];
    conversationId?: string;
    messageId?: string;
    relevantSources?: Array<{ source: string; relevance: number }>;
  };
}

interface Suggestion {
  id: string;
  type: 'question' | 'action' | 'exploration';
  text: string;
  reason: string;
  confidence: number;
}

interface Document {
  id: string;
  filename: string;
  fileType: string;
  fileSize: number;
  summary: string;
  isProcessed: boolean;
  uploadedAt: string;
  metadata: any;
}

interface Conversation {
  conversationId: string;
  sessionId: string;
  messageCount: number;
  lastUpdated: string;
  tags: string[];
  summary: string;
}

interface SystemStats {
  activeSessions: number;
  activeConversations: number;
  vectorStores: Array<{
    storeId: string;
    documentCount: number;
    storeType: string;
    createdAt: string;
  }>;
  timestamp: string;
}

interface User {
  id: number;
  email: string;
  first_name: string;
  last_name: string;
  full_name?: string;
  department?: string;
  avatar?: string;
}

const ChatbotPage = () => {
  const [user, setUser] = useState<User | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [conversationId, setConversationId] = useState<string>('');
  const [activeTab, setActiveTab] = useState('chat');
  const [documents, setDocuments] = useState<Document[]>([]);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [uploading, setUploading] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [knowledgeBaseId, setKnowledgeBaseId] = useState<string>('default');
  const [systemStats, setSystemStats] = useState<SystemStats | null>(null);
  const [documentSearch, setDocumentSearch] = useState('');
  const [useRAG, setUseRAG] = useState(true);
  const [streaming, setStreaming] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [darkMode, setDarkMode] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const chatContainerRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();
  
  const API_BASE_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:3001';

  // Clean markdown formatting from text
  const cleanMarkdown = (text: string): string => {
    if (!text) return '';
    return text
      .replace(/\*\*(.*?)\*\*/g, '$1') // Remove **bold**
      .replace(/\*(.*?)\*/g, '$1')     // Remove *italic*
      .replace(/\n\s*\n\s*\n/g, '\n\n') // Normalize multiple newlines
      .replace(/```[\s\S]*?```/g, '')   // Remove code blocks
      .replace(/`(.*?)`/g, '$1')        // Remove inline code
      .trim();
  };

  // Initialize
  useEffect(() => {
    const savedUser = localStorage.getItem('current_user');
    if (savedUser) {
      try {
        setUser(JSON.parse(savedUser));
      } catch (e) {
        console.error('Failed to parse user from localStorage:', e);
      }
    }
    
    // Load initial data
    fetchSystemStats();
    loadUserDocuments();
    loadConversations();
    
    // Load saved messages from localStorage
    const savedMessages = localStorage.getItem('chat_messages');
    if (savedMessages) {
      try {
        const parsedMessages = JSON.parse(savedMessages);
        setMessages(parsedMessages.map((msg: any) => ({
          ...msg,
          timestamp: new Date(msg.timestamp)
        })));
      } catch (e) {
        console.error('Failed to load saved messages:', e);
      }
    } else {
      // Add welcome message
      const welcomeMessage = {
        id: 'welcome',
        role: 'assistant' as const,
        content: `Hello ${JSON.parse(savedUser || '{}')?.first_name || 'there'}! 👋 I'm your AI assistant powered by LangChain and RAG. I can help you with:\n\n📄 Document Analysis - Upload PDF/PPTX files\n📝 Summarization - Generate concise summaries\n❓ Q&A - Ask questions about your documents\n✅ Task Extraction - Identify action items\n🧠 Knowledge Base - Search across your documents\n\nTry uploading a document or ask me anything!`,
        timestamp: new Date(),
        metadata: {
          suggestions: [
            {
              id: 's1',
              type: 'question',
              text: 'What types of documents can you process?',
              reason: 'Learn about supported formats',
              confidence: 0.95
            },
            {
              id: 's2',
              type: 'action',
              text: 'Upload a document for analysis',
              reason: 'Start analyzing your files',
              confidence: 0.9
            },
            {
              id: 's3',
              type: 'exploration',
              text: 'Show me the knowledge base features',
              reason: 'Explore advanced capabilities',
              confidence: 0.85
            }
          ]
        }
      };
      setMessages([welcomeMessage]);
      saveMessagesToStorage([welcomeMessage]);
    }

    // Load saved conversation ID
    const savedConversationId = localStorage.getItem('current_conversation_id');
    if (savedConversationId) {
      setConversationId(savedConversationId);
    }
  }, []);

  // Save messages to localStorage
  const saveMessagesToStorage = useCallback((msgs: ChatMessage[]) => {
    try {
      localStorage.setItem('chat_messages', JSON.stringify(msgs));
    } catch (e) {
      console.error('Failed to save messages to localStorage:', e);
    }
  }, []);

  // Save conversation ID to localStorage
  const saveConversationIdToStorage = useCallback((id: string) => {
    try {
      localStorage.setItem('current_conversation_id', id);
    } catch (e) {
      console.error('Failed to save conversation ID to localStorage:', e);
    }
  }, []);

  // Scroll to bottom on new messages
  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    // Save messages whenever they change
    saveMessagesToStorage(messages);
  }, [messages, saveMessagesToStorage]);

  useEffect(() => {
    // Save conversation ID whenever it changes
    if (conversationId) {
      saveConversationIdToStorage(conversationId);
    }
  }, [conversationId, saveConversationIdToStorage]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  // Toggle fullscreen
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(console.error);
    } else {
      document.exitFullscreen().catch(console.error);
    }
  };

  // API Service Functions
  const getAuthHeaders = () => {
    const token = localStorage.getItem('token');
    return {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    };
  };

  // 1. Chat API
  const sendChatMessage = async (message: string) => {
    if (!message.trim() || !user) return null;

    setIsLoading(true);
    
    // Add user message to UI
    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      content: message,
      timestamp: new Date()
    };
    const updatedMessages = [...messages, userMessage];
    setMessages(updatedMessages);
    saveMessagesToStorage(updatedMessages);

    try {
      const response = await fetch(`${API_BASE_URL}/api/chatbot/chat`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({
          message,
          userId: user.id.toString(),
          conversationId: conversationId || undefined,
          useRAG,
          stream: streaming
        })
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      
      if (data.success) {
        const assistantMessage: ChatMessage = {
          id: data.messageId || Date.now().toString(),
          role: 'assistant',
          content: cleanMarkdown(data.response),
          timestamp: new Date(),
          metadata: {
            suggestions: data.suggestions,
            conversationId: data.conversationId,
            messageId: data.messageId,
            relevantSources: data.metadata?.relevantSources
          }
        };
        
        const finalMessages = [...updatedMessages, assistantMessage];
        setMessages(finalMessages);
        saveMessagesToStorage(finalMessages);
        
        setSuggestions(data.suggestions || []);
        if (data.conversationId) {
          setConversationId(data.conversationId);
          saveConversationIdToStorage(data.conversationId);
        }
        
        toast({
          title: "Response received",
          description: "AI has processed your request"
        });
        
        return data;
      } else {
        throw new Error(data.error || 'Failed to get response');
      }
    } catch (error: any) {
      console.error('Chat error:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to send message",
        variant: "destructive"
      });
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  // 2. Document Upload API
  const uploadDocuments = async (files: File[]) => {
    if (!files.length || !user) return;

    setUploading(true);
    const formData = new FormData();
    files.forEach(file => {
      formData.append('files', file);
    });
    formData.append('userId', user.id.toString());
    formData.append('knowledgeBaseId', knowledgeBaseId);

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_BASE_URL}/api/chatbot/upload-multiple`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData
      });

      const data = await response.json();
      
      if (data.success) {
        toast({
          title: "Upload successful",
          description: `Uploaded ${data.data.successfulCount} of ${data.data.total} files`
        });
        
        // Refresh documents list
        loadUserDocuments();
        
        // Send message about uploaded files
        const fileList = files.map(f => f.name).join(', ');
        await sendChatMessage(`I just uploaded these files: ${fileList}. Can you help me analyze them?`);
      } else {
        throw new Error(data.error || 'Upload failed');
      }
    } catch (error: any) {
      toast({
        title: "Upload failed",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setUploading(false);
      setSelectedFiles([]);
    }
  };

  // 3. Summarize API
  const summarizeDocument = async (content: string, documentType: string) => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/chatbot/summarize`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({
          content,
          documentType,
          documentName: 'Document',
          userId: user?.id
        })
      });

      const data = await response.json();
      
      if (data.success) {
        toast({
          title: "Document summarized",
          description: "Summary generated successfully"
        });
        return cleanMarkdown(data.summary);
      }
    } catch (error) {
      toast({
        title: "Summarization failed",
        variant: "destructive"
      });
    }
  };

  // 4. Document Q&A API
  const askDocumentQuestion = async (documentId: string, question: string) => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/chatbot/document-qa`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({
          documentId,
          question,
          userId: user?.id
        })
      });

      const data = await response.json();
      
      if (data.success) {
        toast({
          title: "Document Q&A",
          description: "Answer generated from document"
        });
        return cleanMarkdown(data.answer);
      }
    } catch (error) {
      toast({
        title: "Document Q&A failed",
        variant: "destructive"
      });
    }
  };

  // 5. Extract Tasks API
  const extractTasksFromText = async (text: string) => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/chatbot/extract-tasks`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({
          text,
          userId: user?.id
        })
      });

      const data = await response.json();
      
      if (data.success) {
        toast({
          title: "Tasks extracted",
          description: `Found ${data.tasks?.length || 0} tasks`
        });
        return data;
      }
    } catch (error) {
      toast({
        title: "Task extraction failed",
        variant: "destructive"
      });
    }
  };

  // 6. Get Chat History API
  const loadConversations = async () => {
    if (!user) return;

    try {
      const response = await fetch(`${API_BASE_URL}/api/chatbot/history/${user.id}?limit=20&includeMessages=false`, {
        headers: getAuthHeaders()
      });

      const data = await response.json();
      
      if (data.success) {
        setConversations(data.data.conversations || []);
      }
    } catch (error) {
      console.error('Failed to load conversations:', error);
    }
  };

  // 7. Get Conversation Details API
  const loadConversation = async (conversationId: string) => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/chatbot/conversation/${conversationId}?includeAnalysis=true`, {
        headers: getAuthHeaders()
      });

      const data = await response.json();
      
      if (data.success) {
        const messages = data.data.messages.map((msg: any) => ({
          id: msg.id,
          role: msg.role,
          content: cleanMarkdown(msg.content),
          timestamp: new Date(msg.timestamp),
          metadata: msg.metadata
        }));
        setMessages(messages);
        saveMessagesToStorage(messages);
        setConversationId(conversationId);
        saveConversationIdToStorage(conversationId);
        setActiveTab('chat');
        
        toast({
          title: "Conversation loaded",
          description: `Loaded ${messages.length} messages`
        });
      }
    } catch (error) {
      toast({
        title: "Failed to load conversation",
        variant: "destructive"
      });
    }
  };

  // 8. Delete Conversation API
  const deleteConversation = async (conversationId: string) => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/chatbot/conversation/${conversationId}`, {
        method: 'DELETE',
        headers: getAuthHeaders(),
        body: JSON.stringify({ userId: user?.id })
      });

      const data = await response.json();
      
      if (data.success) {
        setConversations(prev => prev.filter(c => c.conversationId !== conversationId));
        
        if (conversationId === conversationId) {
          setMessages([]);
          setConversationId('');
          localStorage.removeItem('chat_messages');
          localStorage.removeItem('current_conversation_id');
        }
        
        toast({
          title: "Conversation deleted",
          description: "Conversation has been removed"
        });
      }
    } catch (error) {
      toast({
        title: "Delete failed",
        variant: "destructive"
      });
    }
  };

  // 9. Get Suggestions API
  const loadSuggestions = async (conversationId: string) => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/chatbot/suggestions/${conversationId}`, {
        headers: getAuthHeaders()
      });

      const data = await response.json();
      
      if (data.success) {
        setSuggestions(data.data.suggestions || []);
      }
    } catch (error) {
      console.error('Failed to load suggestions:', error);
    }
  };

  // 10. Get User Documents API
  const loadUserDocuments = async () => {
    if (!user) return;

    try {
      const response = await fetch(`${API_BASE_URL}/api/chatbot/documents/${user.id}?limit=50&processedOnly=true`, {
        headers: getAuthHeaders()
      });

      const data = await response.json();
      
      if (data.success) {
        setDocuments(data.data.documents || []);
      }
    } catch (error) {
      console.error('Failed to load documents:', error);
    }
  };

  // 11. Get System Stats API
  const fetchSystemStats = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/chatbot/system/stats`, {
        headers: getAuthHeaders()
      });

      const data = await response.json();
      
      if (data.success) {
        setSystemStats(data.data);
        toast({
          title: "System stats updated",
          description: "Latest statistics loaded"
        });
      }
    } catch (error) {
      console.error('Failed to load system stats:', error);
    }
  };

  // 12. Knowledge Base Upload API
  const uploadToKnowledgeBase = async (files: File[]) => {
    if (!files.length || !user) return;

    const formData = new FormData();
    files.forEach(file => {
      formData.append('files', file);
    });
    formData.append('userId', user.id.toString());
    formData.append('knowledgeBaseId', knowledgeBaseId);

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_BASE_URL}/api/knowledge-base/upload`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData
      });

      const data = await response.json();
      
      if (data.success) {
        toast({
          title: "Knowledge base updated",
          description: `Added ${data.results.filter((r: any) => r.success).length} files to knowledge base`
        });
        loadUserDocuments();
      }
    } catch (error: any) {
      toast({
        title: "Knowledge base upload failed",
        description: error.message,
        variant: "destructive"
      });
    }
  };

  // Event Handlers
  const handleSendMessage = async () => {
    if (!inputMessage.trim() || isLoading) return;
    
    const message = inputMessage;
    setInputMessage('');
    await sendChatMessage(message);
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    const validFiles = files.filter(file => 
      ['application/pdf', 'application/vnd.openxmlformats-officedocument.presentationml.presentation'].includes(file.type)
    );
    
    if (validFiles.length > 0) {
      setSelectedFiles(validFiles);
      uploadDocuments(validFiles);
    } else {
      toast({
        title: "Invalid file type",
        description: "Please select PDF or PPTX files only",
        variant: "destructive"
      });
    }
  };

  const handleSuggestionClick = (suggestion: Suggestion) => {
    setInputMessage(suggestion.text);
    setTimeout(() => {
      handleSendMessage();
    }, 100);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleCopyMessage = (content: string) => {
    navigator.clipboard.writeText(content);
    toast({
      title: "Copied to clipboard",
      description: "Message content copied"
    });
  };

  const filteredDocuments = documents.filter(doc =>
    doc.filename.toLowerCase().includes(documentSearch.toLowerCase()) ||
    doc.summary.toLowerCase().includes(documentSearch.toLowerCase())
  );

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getFileIcon = (fileType: string) => {
    if (fileType.includes('pdf')) return <FileText className="w-5 h-5" />;
    if (fileType.includes('presentation') || fileType.includes('powerpoint')) 
      return <FileBarChart className="w-5 h-5" />;
    if (fileType.includes('word')) return <FileText className="w-5 h-5" />;
    if (fileType.includes('excel') || fileType.includes('spreadsheet')) 
      return <FileSpreadsheet className="w-5 h-5" />;
    if (fileType.includes('text')) return <FileText className="w-5 h-5" />;
    return <FileText className="w-5 h-5" />;
  };

  const getFileColor = (fileType: string) => {
    if (fileType.includes('pdf')) return 'text-red-500 bg-red-500/10';
    if (fileType.includes('presentation')) return 'text-orange-500 bg-orange-500/10';
    if (fileType.includes('word')) return 'text-blue-500 bg-blue-500/10';
    if (fileType.includes('excel')) return 'text-green-500 bg-green-500/10';
    return 'text-gray-500 bg-gray-500/10';
  };

  // Sidebar Component
  const Sidebar = () => (
    <motion.div
      initial={{ x: -300 }}
      animate={{ x: isSidebarOpen ? 0 : -300 }}
      transition={{ type: "spring", stiffness: 300, damping: 30 }}
      className={cn(
        "fixed left-0 top-0 h-screen w-64 bg-gradient-to-b from-slate-900 to-slate-800 text-white z-50",
        "border-r border-slate-700/50 shadow-2xl",
        "lg:relative lg:left-0 lg:w-72 lg:flex-shrink-0"
      )}
    >
      <div className="flex flex-col h-full">
        {/* Sidebar Header */}
        <div className="p-6 border-b border-slate-700/50">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-gradient-to-r from-purple-500 to-pink-500 rounded-xl">
              <Bot className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-white">FlowDesk AI</h1>
              <p className="text-sm text-slate-300">Chat & Document Analysis</p>
            </div>
          </div>
        </div>

        {/* User Profile */}
        <div className="p-6 border-b border-slate-700/50">
          <div className="flex items-center space-x-3">
            <Avatar className="h-12 w-12 border-2 border-purple-500/30">
              <AvatarFallback className="bg-gradient-to-r from-purple-600 to-pink-600 text-white">
                {user?.first_name?.[0]}{user?.last_name?.[0]}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <p className="font-medium text-white truncate">
                {user?.first_name} {user?.last_name}
              </p>
              <p className="text-sm text-slate-300 truncate">{user?.email}</p>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <ScrollArea className="flex-1 p-4">
          <nav className="space-y-1">
            <Button
              variant={activeTab === 'chat' ? 'secondary' : 'ghost'}
              className="w-full justify-start h-12 text-base text-white hover:text-white"
              onClick={() => setActiveTab('chat')}
            >
              <MessageSquare className="mr-3 h-5 w-5" />
              Chat
              {messages.length > 0 && (
                <Badge className="ml-auto bg-purple-500 text-white">{messages.length}</Badge>
              )}
            </Button>

            <Button
              variant={activeTab === 'documents' ? 'secondary' : 'ghost'}
              className="w-full justify-start h-12 text-base text-white hover:text-white"
              onClick={() => setActiveTab('documents')}
            >
              <FolderOpen className="mr-3 h-5 w-5" />
              Documents
              {documents.length > 0 && (
                <Badge className="ml-auto bg-blue-500 text-white">{documents.length}</Badge>
              )}
            </Button>

            <Button
              variant={activeTab === 'history' ? 'secondary' : 'ghost'}
              className="w-full justify-start h-12 text-base text-white hover:text-white"
              onClick={() => setActiveTab('history')}
            >
              <History className="mr-3 h-5 w-5" />
              History
              {conversations.length > 0 && (
                <Badge className="ml-auto bg-green-500 text-white">{conversations.length}</Badge>
              )}
            </Button>

            <Button
              variant={activeTab === 'knowledge' ? 'secondary' : 'ghost'}
              className="w-full justify-start h-12 text-base text-white hover:text-white"
              onClick={() => setActiveTab('knowledge')}
            >
              <Brain className="mr-3 h-5 w-5" />
              Knowledge Base
            </Button>

            <Button
              variant={activeTab === 'system' ? 'secondary' : 'ghost'}
              className="w-full justify-start h-12 text-base text-white hover:text-white"
              onClick={() => setActiveTab('system')}
            >
              <Server className="mr-3 h-5 w-5" />
              System
              {systemStats && (
                <Badge variant="outline" className="ml-auto text-white border-white/30">
                  {systemStats.activeSessions} online
                </Badge>
              )}
            </Button>
          </nav>

          {/* Quick Stats */}
          <div className="mt-8 p-4 bg-slate-800/50 rounded-xl border border-slate-700/50">
            <h3 className="text-sm font-medium text-slate-200 mb-3">Quick Stats</h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-slate-300">Documents</span>
                <span className="font-semibold text-white">{documents.length}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-slate-300">Conversations</span>
                <span className="font-semibold text-white">{conversations.length}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-slate-300">Messages</span>
                <span className="font-semibold text-white">{messages.length}</span>
              </div>
            </div>
          </div>
        </ScrollArea>

        {/* Sidebar Footer */}
        <div className="p-4 border-t border-slate-700/50">
          <div className="flex items-center justify-between">
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setDarkMode(!darkMode)}
                    className="text-slate-300 hover:text-white hover:bg-white/10"
                  >
                    {darkMode ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Toggle theme</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>

            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={toggleFullscreen}
                    className="text-slate-300 hover:text-white hover:bg-white/10"
                  >
                    {isFullscreen ? <Minimize2 className="h-5 w-5" /> : <Maximize2 className="h-5 w-5" />}
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>{isFullscreen ? 'Exit fullscreen' : 'Enter fullscreen'}</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>

            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsSidebarOpen(false)}
              className="lg:hidden text-slate-300 hover:text-white"
            >
              <ChevronLeft className="h-5 w-5" />
            </Button>
          </div>
        </div>
      </div>
    </motion.div>
  );

  // Main Content
  const MainContent = () => (
    <div className="flex-1 flex flex-col h-screen bg-white dark:bg-slate-900">
      {/* Top Bar */}
      <header className={cn(
        "h-16 border-b bg-white/80 backdrop-blur-sm z-40",
        "dark:bg-slate-900/80 dark:border-slate-700/50"
      )}>
        <div className="h-full px-4 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setIsSidebarOpen(!isSidebarOpen)}
              className="lg:hidden text-slate-700 dark:text-slate-300"
            >
              <Menu className="h-5 w-5" />
            </Button>
            
            <div className="flex items-center space-x-2">
              <div className={cn(
                "w-2 h-2 rounded-full animate-pulse",
                useRAG ? "bg-green-500" : "bg-gray-400"
              )} />
              <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
                {useRAG ? "RAG Enabled" : "RAG Disabled"}
              </span>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <div className="hidden md:flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <Database className="h-4 w-4 text-purple-500" />
                <span className="text-sm text-slate-700 dark:text-slate-300">KB: {knowledgeBaseId}</span>
              </div>
              <Separator orientation="vertical" className="h-6" />
              <div className="flex items-center space-x-2">
                <Clock className="h-4 w-4 text-blue-500" />
                <span className="text-sm text-slate-700 dark:text-slate-300">
                  {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
            </div>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="text-slate-700 dark:text-slate-300">
                  <Settings className="h-5 w-5" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56 bg-white dark:bg-slate-800">
                <DropdownMenuItem 
                  onClick={() => setUseRAG(!useRAG)}
                  className="text-slate-700 dark:text-slate-300"
                >
                  <Brain className="mr-2 h-4 w-4" />
                  <span>RAG: {useRAG ? 'On' : 'Off'}</span>
                  <div className="ml-auto">
                    <Switch checked={useRAG} onCheckedChange={setUseRAG} />
                  </div>
                </DropdownMenuItem>
                <DropdownMenuItem 
                  onClick={() => setStreaming(!streaming)}
                  className="text-slate-700 dark:text-slate-300"
                >
                  <Zap className="mr-2 h-4 w-4" />
                  <span>Streaming: {streaming ? 'On' : 'Off'}</span>
                  <div className="ml-auto">
                    <Switch checked={streaming} onCheckedChange={setStreaming} />
                  </div>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem 
                  onClick={fetchSystemStats}
                  className="text-slate-700 dark:text-slate-300"
                >
                  <RefreshCw className="mr-2 h-4 w-4" />
                  Refresh Stats
                </DropdownMenuItem>
                <DropdownMenuItem 
                  onClick={loadUserDocuments}
                  className="text-slate-700 dark:text-slate-300"
                >
                  <FolderOpen className="mr-2 h-4 w-4" />
                  Refresh Documents
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem 
                  onClick={() => {
                    localStorage.clear();
                    window.location.href = '/login';
                  }}
                  className="text-slate-700 dark:text-slate-300"
                >
                  <LogOut className="mr-2 h-4 w-4" />
                  Logout
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </header>

      {/* Tab Content */}
      <main className="flex-1 overflow-hidden">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.2 }}
            className="h-full"
          >
            {activeTab === 'chat' && <ChatInterface />}
            {activeTab === 'documents' && <DocumentsInterface />}
            {activeTab === 'history' && <HistoryInterface />}
            {activeTab === 'knowledge' && <KnowledgeBaseInterface />}
            {activeTab === 'system' && <SystemInterface />}
          </motion.div>
        </AnimatePresence>
      </main>
    </div>
  );

  // Chat Interface
  const ChatInterface = () => (
    <div className="flex flex-col h-full">
      {/* Messages Container */}
      <ScrollArea 
        ref={chatContainerRef}
        className="flex-1 p-4 md:p-6"
      >
        <div className="max-w-3xl mx-auto space-y-6">
          <AnimatePresence>
            {messages.map((message, index) => (
              <motion.div
                key={message.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ delay: index * 0.1 }}
                className={cn(
                  "group flex gap-4",
                  message.role === 'user' ? 'flex-row-reverse' : 'flex-row'
                )}
              >
                {/* Avatar */}
                <div className="flex-shrink-0">
                  <Avatar className={cn(
                    "h-8 w-8",
                    message.role === 'user' 
                      ? 'bg-gradient-to-r from-blue-500 to-cyan-500' 
                      : 'bg-gradient-to-r from-purple-500 to-pink-500'
                  )}>
                    <AvatarFallback className="text-white">
                      {message.role === 'user' ? (
                        <User className="h-4 w-4" />
                      ) : (
                        <Bot className="h-4 w-4" />
                      )}
                    </AvatarFallback>
                  </Avatar>
                </div>

                {/* Message Content */}
                <div className={cn(
                  "flex-1 space-y-2",
                  message.role === 'user' ? 'items-end' : 'items-start'
                )}>
                  <div className={cn(
                    "rounded-2xl px-4 py-3 max-w-[85%]",
                    message.role === 'user'
                      ? 'bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-br-none'
                      : 'bg-gradient-to-r from-slate-100 to-white dark:from-slate-800 dark:to-slate-900 rounded-bl-none shadow-sm dark:shadow-slate-900/50'
                  )}>
                    {/* Message Actions */}
                    <div className={cn(
                      "flex items-center gap-2 mb-2",
                      message.role === 'user' ? 'justify-end' : 'justify-start'
                    )}>
                      <span className={cn(
                        "text-xs",
                        message.role === 'user' ? 'text-white/70' : 'text-slate-500 dark:text-slate-400'
                      )}>
                        {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                      <Button
                        variant="ghost"
                        size="icon"
                        className={cn(
                          "h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity",
                          message.role === 'user' 
                            ? 'text-white/70 hover:text-white hover:bg-white/20' 
                            : 'text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200'
                        )}
                        onClick={() => handleCopyMessage(message.content)}
                      >
                        <Copy className="h-3 w-3" />
                      </Button>
                    </div>

                    {/* Message Text */}
                    <div className={cn(
                      "prose prose-sm dark:prose-invert max-w-none",
                      message.role === 'user' 
                        ? 'text-white' 
                        : 'text-slate-800 dark:text-slate-200'
                    )}>
                      {message.content.split('\n').map((line, i) => (
                        <p key={i} className={i > 0 ? 'mt-2' : ''}>
                          {line}
                        </p>
                      ))}
                    </div>

                    {/* Relevant Sources */}
                    {message.metadata?.relevantSources && message.metadata.relevantSources.length > 0 && (
                      <div className={cn(
                        "mt-3 pt-3",
                        message.role === 'user' 
                          ? 'border-t border-white/20' 
                          : 'border-t border-slate-200 dark:border-slate-700'
                      )}>
                        <div className="flex items-center gap-2 mb-2">
                          <BookOpen className={cn(
                            "h-3 w-3",
                            message.role === 'user' ? 'text-white/70' : 'text-slate-500 dark:text-slate-400'
                          )} />
                          <span className={cn(
                            "text-xs font-medium",
                            message.role === 'user' ? 'text-white/70' : 'text-slate-600 dark:text-slate-300'
                          )}>Sources</span>
                        </div>
                        <div className="flex flex-wrap gap-1">
                          {message.metadata.relevantSources.map((source, idx) => (
                            <Badge
                              key={idx}
                              variant="outline"
                              className={cn(
                                "text-xs cursor-pointer",
                                message.role === 'user'
                                  ? 'bg-white/10 hover:bg-white/20 text-white border-white/30'
                                  : 'bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 border-slate-300 dark:border-slate-600'
                              )}
                              onClick={() => {
                                const doc = documents.find(d => d.filename.includes(source.source));
                                if (doc) {
                                  setInputMessage(`Tell me more about ${source.source}`);
                                }
                              }}
                            >
                              {source.source}
                              <span className="ml-1 text-xs opacity-70">
                                {Math.round(source.relevance * 100)}%
                              </span>
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
          <div ref={messagesEndRef} />
        </div>
      </ScrollArea>

      {/* Suggestions */}
      {suggestions.length > 0 && (
        <div className="border-t bg-gradient-to-r from-slate-50 to-white dark:from-slate-900 dark:to-slate-800">
          <div className="max-w-3xl mx-auto p-4">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-purple-500" />
                <span className="text-sm font-medium text-slate-700 dark:text-slate-300">Suggestions</span>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setSuggestions([])}
                className="h-8 w-8 text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
              {suggestions.map((suggestion) => (
                <motion.div
                  key={suggestion.id}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <Button
                    variant="outline"
                    className="w-full h-auto py-3 px-4 justify-start hover:border-purple-300 hover:bg-purple-50 dark:hover:bg-purple-950/20 border-slate-200 dark:border-slate-700"
                    onClick={() => handleSuggestionClick(suggestion)}
                  >
                    <div className="flex items-start gap-3 text-left">
                      <div className={cn(
                        "p-2 rounded-lg",
                        suggestion.type === 'question' && "bg-blue-100 dark:bg-blue-900/30",
                        suggestion.type === 'action' && "bg-green-100 dark:bg-green-900/30",
                        suggestion.type === 'exploration' && "bg-purple-100 dark:bg-purple-900/30"
                      )}>
                        {suggestion.type === 'question' && <FileQuestion className="h-4 w-4 text-blue-600 dark:text-blue-400" />}
                        {suggestion.type === 'action' && <Zap className="h-4 w-4 text-green-600 dark:text-green-400" />}
                        {suggestion.type === 'exploration' && <Search className="h-4 w-4 text-purple-600 dark:text-purple-400" />}
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">{suggestion.text}</p>
                        <p className="text-xs text-slate-500 dark:text-slate-400">{suggestion.reason}</p>
                      </div>
                    </div>
                  </Button>
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Input Area */}
      <div className="border-t bg-white dark:bg-slate-900">
        <div className="max-w-3xl mx-auto p-4 md:p-6">
          <div className="relative">
            {/* File Upload Area */}
            {selectedFiles.length > 0 && (
              <div className="mb-4 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <Upload className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                    <span className="text-sm font-medium text-slate-700 dark:text-slate-300">Uploading {selectedFiles.length} file(s)</span>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setSelectedFiles([])}
                    className="h-6 w-6 text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200"
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </div>
                <div className="space-y-2">
                  {selectedFiles.map((file, index) => (
                    <div key={index} className="flex items-center gap-2 text-sm text-slate-700 dark:text-slate-300">
                      <FileText className="h-3 w-3" />
                      <span className="truncate flex-1">{file.name}</span>
                      <span className="text-xs text-slate-500 dark:text-slate-400">
                        {(file.size / 1024).toFixed(1)} KB
                      </span>
                      {uploading && (
                        <Loader2 className="h-3 w-3 animate-spin text-slate-500" />
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Input Container */}
            <div className="relative rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 shadow-lg">
              <Textarea
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                onKeyDown={handleKeyPress}
                placeholder="Message FlowDesk AI..."
                className={cn(
                  "min-h-[56px] max-h-[200px] border-0 focus-visible:ring-0 focus-visible:ring-offset-0 resize-none py-4 pr-24 pl-4",
                  "text-slate-900 dark:text-slate-100 placeholder:text-slate-500 dark:placeholder:text-slate-400",
                  "bg-transparent"
                )}
                disabled={isLoading}
              />
              
              {/* Action Buttons */}
              <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => fileInputRef.current?.click()}
                        disabled={uploading}
                        className="h-9 w-9 text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200"
                      >
                        {uploading ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <Paperclip className="h-4 w-4" />
                        )}
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Attach files</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>

                <input
                  ref={fileInputRef}
                  type="file"
                  multiple
                  accept=".pdf,.pptx,.docx,.txt"
                  onChange={handleFileSelect}
                  className="hidden"
                />

                <Button
                  size="default"
                  onClick={handleSendMessage}
                  disabled={isLoading || !inputMessage.trim()}
                  className={cn(
                    "h-9 px-4 rounded-xl",
                    "bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700",
                    "text-white shadow-lg"
                  )}
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Thinking...
                    </>
                  ) : (
                    <>
                      <Send className="h-4 w-4 mr-2" />
                      Send
                    </>
                  )}
                </Button>
              </div>
            </div>

            {/* Input Helper Text */}
            <div className="mt-2 flex items-center justify-between px-1">
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Press <kbd className="px-1.5 py-0.5 text-xs bg-slate-100 dark:bg-slate-800 rounded border border-slate-300 dark:border-slate-700">Enter</kbd> to send
              </p>
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <Switch
                    checked={useRAG}
                    onCheckedChange={setUseRAG}
                    className="h-4 w-8"
                  />
                  <span className="text-xs text-slate-700 dark:text-slate-300">RAG</span>
                </div>
                <div className="flex items-center gap-2">
                  <Switch
                    checked={streaming}
                    onCheckedChange={setStreaming}
                    className="h-4 w-8"
                  />
                  <span className="text-xs text-slate-700 dark:text-slate-300">Stream</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  // Documents Interface
  const DocumentsInterface = () => (
    <div className="h-full overflow-y-auto p-4 md:p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl md:text-3xl font-bold flex items-center gap-3 text-slate-900 dark:text-white">
                <FolderOpen className="h-8 w-8 text-purple-600" />
                Documents
              </h1>
              <p className="text-slate-600 dark:text-slate-300 mt-2">
                Upload and manage your documents for AI analysis
              </p>
            </div>
            <div className="flex items-center gap-3">
              <div className="relative flex-1 md:w-64">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <Input
                  placeholder="Search documents..."
                  value={documentSearch}
                  onChange={(e) => setDocumentSearch(e.target.value)}
                  className="pl-10 bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white"
                />
              </div>
              <Button
                onClick={() => fileInputRef.current?.click()}
                className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
              >
                <Upload className="h-4 w-4 mr-2" />
                Upload
              </Button>
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-6">
            <Card className="bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-slate-600 dark:text-slate-400">Total Documents</p>
                    <p className="text-2xl font-bold text-slate-900 dark:text-white">{documents.length}</p>
                  </div>
                  <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                    <FileText className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-slate-600 dark:text-slate-400">Processed</p>
                    <p className="text-2xl font-bold text-slate-900 dark:text-white">
                      {documents.filter(d => d.isProcessed).length}
                    </p>
                  </div>
                  <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-lg">
                    <FileCheck className="h-5 w-5 text-green-600 dark:text-green-400" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-slate-600 dark:text-slate-400">Total Size</p>
                    <p className="text-2xl font-bold text-slate-900 dark:text-white">
                      {formatFileSize(documents.reduce((acc, doc) => acc + doc.fileSize, 0))}
                    </p>
                  </div>
                  <div className="p-2 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
                    <Database className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-slate-600 dark:text-slate-400">Knowledge Base</p>
                    <p className="text-2xl font-bold text-slate-900 dark:text-white">{knowledgeBaseId}</p>
                  </div>
                  <div className="p-2 bg-pink-100 dark:bg-pink-900/30 rounded-lg">
                    <Brain className="h-5 w-5 text-pink-600 dark:text-pink-400" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Documents Grid */}
        {filteredDocuments.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredDocuments.map((doc) => (
              <motion.div
                key={doc.id}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                whileHover={{ y: -5 }}
              >
                <Card className="h-full hover:shadow-xl transition-all duration-300 border-2 border-slate-200 dark:border-slate-700 hover:border-purple-300 dark:hover:border-purple-500 bg-white dark:bg-slate-800">
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <div className={cn(
                          "p-2 rounded-lg",
                          getFileColor(doc.fileType)
                        )}>
                          {getFileIcon(doc.fileType)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <CardTitle className="text-base font-semibold truncate text-slate-900 dark:text-white">
                            {doc.filename}
                          </CardTitle>
                          <p className="text-xs text-slate-500 dark:text-slate-400">
                            {doc.fileType.split('/')[1]?.toUpperCase() || 'FILE'}
                          </p>
                        </div>
                      </div>
                      <Badge variant={doc.isProcessed ? "default" : "secondary"} className="ml-2">
                        {doc.isProcessed ? (
                          <FileCheck className="h-3 w-3 mr-1" />
                        ) : (
                          <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                        )}
                        {doc.isProcessed ? "Processed" : "Processing"}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-slate-600 dark:text-slate-300 line-clamp-3 mb-4">
                      {doc.summary || 'No summary available for this document.'}
                    </p>
                    <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
                      <span>{formatFileSize(doc.fileSize)}</span>
                      <span>{new Date(doc.uploadedAt).toLocaleDateString()}</span>
                    </div>
                  </CardContent>
                  <CardFooter className="pt-0">
                    <div className="flex gap-2 w-full">
                      <Button
                        variant="outline"
                        size="sm"
                        className="flex-1 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700"
                        onClick={() => askDocumentQuestion(doc.id, "Summarize this document")}
                      >
                        <FileText className="h-3 w-3 mr-2" />
                        Summarize
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className="flex-1 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700"
                        onClick={() => {
                          setInputMessage(`Analyze the document: ${doc.filename}`);
                          setActiveTab('chat');
                        }}
                      >
                        <MessageSquare className="h-3 w-3 mr-2" />
                        Ask AI
                      </Button>
                    </div>
                  </CardFooter>
                </Card>
              </motion.div>
            ))}
          </div>
        ) : (
          <Card className="text-center py-16 bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700">
            <CardContent>
              <div className="max-w-md mx-auto">
                <div className="p-4 bg-gradient-to-r from-purple-100 to-pink-100 dark:from-purple-900/30 dark:to-pink-900/30 rounded-2xl inline-block mb-6">
                  <FolderOpen className="h-16 w-16 text-purple-600 dark:text-purple-400" />
                </div>
                <h3 className="text-2xl font-bold mb-3 text-slate-900 dark:text-white">No documents yet</h3>
                <p className="text-slate-600 dark:text-slate-300 mb-6">
                  {documents.length === 0 
                    ? "Upload your first document to start analyzing with AI"
                    : "No documents match your search criteria"}
                </p>
                <div className="flex gap-3 justify-center">
                  <Button
                    size="lg"
                    onClick={() => fileInputRef.current?.click()}
                    className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
                  >
                    <Upload className="h-5 w-5 mr-2" />
                    Upload Documents
                  </Button>
                  <Button
                    variant="outline"
                    size="lg"
                    onClick={() => setActiveTab('chat')}
                    className="border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700"
                  >
                    <MessageSquare className="h-5 w-5 mr-2" />
                    Ask AI First
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );

  // History Interface
  const HistoryInterface = () => (
    <div className="h-full overflow-y-auto p-4 md:p-6">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl md:text-3xl font-bold flex items-center gap-3 text-slate-900 dark:text-white">
                <History className="h-8 w-8 text-blue-600" />
                Conversation History
              </h1>
              <p className="text-slate-600 dark:text-slate-300 mt-2">
                Review and manage your past conversations
              </p>
            </div>
            <div className="flex items-center gap-3">
              <Button
                variant="outline"
                onClick={loadConversations}
                className="gap-2 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700"
              >
                <RefreshCw className="h-4 w-4" />
                Refresh
              </Button>
              <Button
                variant="outline"
                onClick={() => {
                  if (conversations.length > 0) {
                    if (window.confirm('Delete all conversations?')) {
                      conversations.forEach(conv => deleteConversation(conv.conversationId));
                    }
                  }
                }}
                disabled={conversations.length === 0}
                className="gap-2 text-red-600 hover:text-red-700 hover:bg-red-50 border-red-200 dark:border-red-800 dark:text-red-400 dark:hover:text-red-300 dark:hover:bg-red-900/30"
              >
                <Trash2 className="h-4 w-4" />
                Clear All
              </Button>
            </div>
          </div>
        </div>

        {conversations.length > 0 ? (
          <div className="space-y-4">
            {conversations.map((conv, index) => (
              <motion.div
                key={conv.conversationId}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
              >
                <Card className="hover:shadow-lg transition-shadow cursor-pointer group border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800"
                  onClick={() => loadConversation(conv.conversationId)}>
                  <CardContent className="p-6">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-3">
                          <div className="p-2 bg-gradient-to-r from-blue-100 to-cyan-100 dark:from-blue-900/30 dark:to-cyan-900/30 rounded-lg">
                            <MessageSquare className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                          </div>
                          <div>
                            <h3 className="font-semibold text-lg text-slate-900 dark:text-white">
                              {conv.summary || `Conversation ${index + 1}`}
                            </h3>
                            <p className="text-sm text-slate-500 dark:text-slate-400">
                              {new Date(conv.lastUpdated).toLocaleDateString()} • {new Date(conv.lastUpdated).toLocaleTimeString()}
                            </p>
                          </div>
                        </div>
                        
                        <div className="flex flex-wrap gap-2 mb-4">
                          <Badge variant="outline" className="gap-1 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300">
                            <MessageSquare className="h-3 w-3" />
                            {conv.messageCount} messages
                          </Badge>
                          {conv.tags.map((tag, idx) => (
                            <Badge key={idx} variant="secondary" className="capitalize bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300">
                              {tag}
                            </Badge>
                          ))}
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            loadConversation(conv.conversationId);
                          }}
                          className="gap-2 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700"
                        >
                          <Eye className="h-4 w-4" />
                          Open
                        </Button>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                            <Button variant="ghost" size="icon" className="text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200">
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="bg-white dark:bg-slate-800">
                            <DropdownMenuItem 
                              onClick={() => loadConversation(conv.conversationId)}
                              className="text-slate-700 dark:text-slate-300"
                            >
                              <Eye className="mr-2 h-4 w-4" />
                              View Conversation
                            </DropdownMenuItem>
                            <DropdownMenuItem 
                              onClick={() => loadSuggestions(conv.conversationId)}
                              className="text-slate-700 dark:text-slate-300"
                            >
                              <Lightbulb className="mr-2 h-4 w-4" />
                              Load Suggestions
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem 
                              onClick={() => deleteConversation(conv.conversationId)}
                              className="text-red-600 dark:text-red-400 focus:text-red-600 dark:focus:text-red-400"
                            >
                              <Trash2 className="mr-2 h-4 w-4" />
                              Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        ) : (
          <Card className="text-center py-16 bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700">
            <CardContent>
              <div className="max-w-md mx-auto">
                <div className="p-4 bg-gradient-to-r from-blue-100 to-cyan-100 dark:from-blue-900/30 dark:to-cyan-900/30 rounded-2xl inline-block mb-6">
                  <History className="h-16 w-16 text-blue-600 dark:text-blue-400" />
                </div>
                <h3 className="text-2xl font-bold mb-3 text-slate-900 dark:text-white">No conversations yet</h3>
                <p className="text-slate-600 dark:text-slate-300 mb-6">
                  Start a conversation in the chat tab to see your history here
                </p>
                <Button
                  size="lg"
                  onClick={() => setActiveTab('chat')}
                  className="bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700"
                >
                  <MessageSquare className="h-5 w-5 mr-2" />
                  Start Chatting
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );

  // Knowledge Base Interface
  const KnowledgeBaseInterface = () => (
    <div className="h-full overflow-y-auto p-4 md:p-6">
      <div className="max-w-6xl mx-auto">
        <div className="mb-8">
          <h1 className="text-2xl md:text-3xl font-bold flex items-center gap-3 mb-2 text-slate-900 dark:text-white">
            <Brain className="h-8 w-8 text-purple-600" />
            Knowledge Base
          </h1>
          <p className="text-slate-600 dark:text-slate-300">
            Central repository for all your documents and AI knowledge
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Stats & Info */}
          <div className="lg:col-span-2 space-y-6">
            {/* Upload Section */}
            <Card className="bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 border-2 border-purple-200 dark:border-purple-800">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-slate-900 dark:text-white">
                  <Upload className="h-5 w-5" />
                  Add to Knowledge Base
                </CardTitle>
                <CardDescription className="text-slate-600 dark:text-slate-300">
                  Upload documents to enrich your AI knowledge base
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label className="text-slate-700 dark:text-slate-300">Knowledge Base ID</Label>
                    <div className="flex gap-2">
                      <Input
                        value={knowledgeBaseId}
                        onChange={(e) => setKnowledgeBaseId(e.target.value)}
                        placeholder="Enter knowledge base ID"
                        className="flex-1 bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white"
                      />
                      <Button variant="outline" className="border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300">Save</Button>
                    </div>
                  </div>
                  
                  <div className="border-2 border-dashed border-purple-300 dark:border-purple-700 rounded-xl p-8 text-center hover:border-purple-400 dark:hover:border-purple-600 transition-colors bg-white/50 dark:bg-slate-800/50">
                    <div className="max-w-sm mx-auto">
                      <Upload className="h-12 w-12 mx-auto text-purple-500 mb-4" />
                      <h4 className="font-semibold mb-2 text-slate-900 dark:text-white">Drag & drop files here</h4>
                      <p className="text-sm text-slate-600 dark:text-slate-300 mb-4">
                        Supports PDF, PPTX, DOCX, TXT files up to 50MB each
                      </p>
                      <input
                        type="file"
                        multiple
                        accept=".pdf,.pptx,.docx,.txt"
                        onChange={(e) => {
                          const files = Array.from(e.target.files || []);
                          if (files.length > 0) {
                            uploadToKnowledgeBase(files);
                          }
                        }}
                        className="hidden"
                        id="kb-upload"
                      />
                      <Button asChild>
                        <label htmlFor="kb-upload" className="cursor-pointer">
                          <Upload className="h-4 w-4 mr-2" />
                          Browse Files
                        </label>
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Quick Actions */}
            <Card className="bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700">
              <CardHeader>
                <CardTitle className="text-slate-900 dark:text-white">Quick Actions</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <Button
                    variant="outline"
                    className="h-auto py-4 hover:border-purple-300 hover:bg-purple-50 dark:hover:bg-purple-950/20 border-slate-200 dark:border-slate-700"
                    onClick={() => {
                      setInputMessage("Search my knowledge base for information about");
                      setActiveTab('chat');
                    }}
                  >
                    <div className="flex items-center gap-3 text-left">
                      <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                        <Search className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                      </div>
                      <div>
                        <p className="font-medium text-slate-700 dark:text-slate-300">Search KB</p>
                        <p className="text-xs text-slate-500 dark:text-slate-400">Find information</p>
                      </div>
                    </div>
                  </Button>

                  <Button
                    variant="outline"
                    className="h-auto py-4 hover:border-green-300 hover:bg-green-50 dark:hover:bg-green-950/20 border-slate-200 dark:border-slate-700"
                    onClick={() => extractTasksFromText("Review meeting notes and extract action items")}
                  >
                    <div className="flex items-center gap-3 text-left">
                      <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-lg">
                        <CheckSquare className="h-5 w-5 text-green-600 dark:text-green-400" />
                      </div>
                      <div>
                        <p className="font-medium text-slate-700 dark:text-slate-300">Extract Tasks</p>
                        <p className="text-xs text-slate-500 dark:text-slate-400">From documents</p>
                      </div>
                    </div>
                  </Button>

                  <Button
                    variant="outline"
                    className="h-auto py-4 hover:border-orange-300 hover:bg-orange-50 dark:hover:bg-orange-950/20 border-slate-200 dark:border-slate-700"
                    onClick={fetchSystemStats}
                  >
                    <div className="flex items-center gap-3 text-left">
                      <div className="p-2 bg-orange-100 dark:bg-orange-900/30 rounded-lg">
                        <BarChart className="h-5 w-5 text-orange-600 dark:text-orange-400" />
                      </div>
                      <div>
                        <p className="font-medium text-slate-700 dark:text-slate-300">Refresh Stats</p>
                        <p className="text-xs text-slate-500 dark:text-slate-400">Update metrics</p>
                      </div>
                    </div>
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Right Column - Stats */}
          <div className="space-y-6">
            {/* Knowledge Base Stats */}
            <Card className="bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700">
              <CardHeader>
                <CardTitle className="text-lg text-slate-900 dark:text-white">Knowledge Base Stats</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-slate-600 dark:text-slate-400">Total Documents</span>
                    <span className="font-semibold text-slate-900 dark:text-white">{documents.length}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-slate-600 dark:text-slate-400">Processed</span>
                    <span className="font-semibold text-green-600 dark:text-green-400">
                      {documents.filter(d => d.isProcessed).length}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-slate-600 dark:text-slate-400">Total Size</span>
                    <span className="font-semibold text-slate-900 dark:text-white">
                      {formatFileSize(documents.reduce((acc, doc) => acc + doc.fileSize, 0))}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-slate-600 dark:text-slate-400">Current KB ID</span>
                    <code className="text-sm bg-slate-100 dark:bg-slate-700 px-2 py-1 rounded text-slate-800 dark:text-slate-300">
                      {knowledgeBaseId}
                    </code>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* System Status */}
            <Card className="bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2 text-slate-900 dark:text-white">
                  <Server className="h-5 w-5 text-green-500" />
                  System Status
                </CardTitle>
              </CardHeader>
              <CardContent>
                {systemStats ? (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-slate-700 dark:text-slate-300">Active Sessions</span>
                      <Badge variant="outline" className="border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300">
                        {systemStats.activeSessions}
                      </Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-slate-700 dark:text-slate-300">Conversations</span>
                      <Badge variant="outline" className="border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300">
                        {systemStats.activeConversations}
                      </Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-slate-700 dark:text-slate-300">Vector Stores</span>
                      <Badge variant="outline" className="border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300">
                        {systemStats.vectorStores.length}
                      </Badge>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full mt-2 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700"
                      onClick={fetchSystemStats}
                    >
                      <RefreshCw className="h-4 w-4 mr-2" />
                      Refresh Status
                    </Button>
                  </div>
                ) : (
                  <div className="flex items-center justify-center py-4">
                    <Loader2 className="h-6 w-6 animate-spin text-slate-400" />
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Help Card */}
            <Card className="bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700">
              <CardHeader className="pb-3">
                <CardTitle className="text-lg flex items-center gap-2 text-slate-900 dark:text-white">
                  <HelpCircle className="h-5 w-5 text-blue-500" />
                  Need Help?
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-slate-600 dark:text-slate-300 mb-4">
                  Get the most out of your knowledge base
                </p>
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full mb-2 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700"
                  onClick={() => setInputMessage("How do I optimize my knowledge base?")}
                >
                  Ask AI for Tips
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700"
                  onClick={() => loadUserDocuments()}
                >
                  Refresh Documents List
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );

  // System Interface
  const SystemInterface = () => (
    <div className="h-full overflow-y-auto p-4 md:p-6">
      <div className="max-w-6xl mx-auto">
        <div className="mb-8">
          <h1 className="text-2xl md:text-3xl font-bold flex items-center gap-3 mb-2 text-slate-900 dark:text-white">
            <Server className="h-8 w-8 text-green-600" />
            System Status
          </h1>
          <p className="text-slate-600 dark:text-slate-300">
            Monitor your AI assistant's performance and health
          </p>
        </div>

        {systemStats ? (
          <>
            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
              <Card className="bg-gradient-to-br from-blue-50 to-cyan-50 dark:from-blue-900/20 dark:to-cyan-900/20 border-blue-200 dark:border-blue-800">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-slate-600 dark:text-slate-400">Active Sessions</p>
                      <p className="text-3xl font-bold mt-2 text-slate-900 dark:text-white">{systemStats.activeSessions}</p>
                    </div>
                    <div className="p-3 bg-blue-100 dark:bg-blue-900/30 rounded-xl">
                      <Users className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 border-purple-200 dark:border-purple-800">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-slate-600 dark:text-slate-400">Conversations</p>
                      <p className="text-3xl font-bold mt-2 text-slate-900 dark:text-white">{systemStats.activeConversations}</p>
                    </div>
                    <div className="p-3 bg-purple-100 dark:bg-purple-900/30 rounded-xl">
                      <MessageSquare className="h-6 w-6 text-purple-600 dark:text-purple-400" />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 border-green-200 dark:border-green-800">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-slate-600 dark:text-slate-400">Vector Stores</p>
                      <p className="text-3xl font-bold mt-2 text-slate-900 dark:text-white">{systemStats.vectorStores.length}</p>
                    </div>
                    <div className="p-3 bg-green-100 dark:bg-green-900/30 rounded-xl">
                      <Database className="h-6 w-6 text-green-600 dark:text-green-400" />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-br from-orange-50 to-amber-50 dark:from-orange-900/20 dark:to-amber-900/20 border-orange-200 dark:border-orange-800">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-slate-600 dark:text-slate-400">Total Documents</p>
                      <p className="text-3xl font-bold mt-2 text-slate-900 dark:text-white">{documents.length}</p>
                    </div>
                    <div className="p-3 bg-orange-100 dark:bg-orange-900/30 rounded-xl">
                      <FileText className="h-6 w-6 text-orange-600 dark:text-orange-400" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Vector Store Details */}
            <Card className="mb-8 bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-slate-900 dark:text-white">
                  <Database className="h-5 w-5" />
                  Vector Store Details
                </CardTitle>
                <CardDescription className="text-slate-600 dark:text-slate-300">
                  Knowledge bases and their document counts
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {systemStats.vectorStores.map((store, index) => (
                    <motion.div
                      key={store.storeId}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.1 }}
                    >
                      <div className="flex items-center justify-between p-4 border rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors border-slate-200 dark:border-slate-700">
                        <div className="flex items-center gap-4">
                          <div className="p-2 bg-gradient-to-r from-purple-100 to-pink-100 dark:from-purple-900/30 dark:to-pink-900/30 rounded-lg">
                            <Database className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                          </div>
                          <div>
                            <p className="font-medium text-slate-900 dark:text-white">{store.storeId}</p>
                            <p className="text-sm text-slate-600 dark:text-slate-400">
                              {store.documentCount} documents • {store.storeType}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-4">
                          <Badge variant="outline" className="border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300">
                            Created: {new Date(store.createdAt).toLocaleDateString()}
                          </Badge>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => {
                              setKnowledgeBaseId(store.storeId);
                              setActiveTab('knowledge');
                            }}
                            className="text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200"
                          >
                            <ArrowRight className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </CardContent>
              <CardFooter className="flex justify-between border-t border-slate-200 dark:border-slate-700 pt-6">
                <div className="text-sm text-slate-600 dark:text-slate-400">
                  Last updated: {new Date(systemStats.timestamp).toLocaleTimeString()}
                </div>
                <Button 
                  onClick={fetchSystemStats} 
                  variant="outline"
                  className="border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700"
                >
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Refresh Data
                </Button>
              </CardFooter>
            </Card>

            {/* System Health */}
            <Card className="bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-slate-900 dark:text-white">
                  <Cpu className="h-5 w-5" />
                  System Health
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium text-slate-700 dark:text-slate-300">API Response Time</span>
                        <span className="text-sm text-green-600 dark:text-green-400">Optimal</span>
                      </div>
                      <Progress value={85} className="h-2" />
                    </div>
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium text-slate-700 dark:text-slate-300">Document Processing</span>
                        <span className="text-sm text-green-600 dark:text-green-400">Active</span>
                      </div>
                      <Progress value={92} className="h-2" />
                    </div>
                  </div>
                  <div className="space-y-4">
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium text-slate-700 dark:text-slate-300">Memory Usage</span>
                        <span className="text-sm text-green-600 dark:text-green-400">64%</span>
                      </div>
                      <Progress value={64} className="h-2" />
                    </div>
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium text-slate-700 dark:text-slate-300">AI Model Load</span>
                        <span className="text-sm text-yellow-600 dark:text-yellow-400">Medium</span>
                      </div>
                      <Progress value={72} className="h-2" />
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </>
        ) : (
          <Card className="text-center py-16 bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700">
            <CardContent>
              <div className="max-w-md mx-auto">
                <Loader2 className="h-16 w-16 mx-auto animate-spin text-purple-600 mb-6" />
                <h3 className="text-2xl font-bold mb-3 text-slate-900 dark:text-white">Loading System Stats</h3>
                <p className="text-slate-600 dark:text-slate-300 mb-6">
                  Fetching real-time system statistics and health data...
                </p>
                <Button 
                  onClick={fetchSystemStats} 
                  variant="outline"
                  className="border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700"
                >
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Retry Loading
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );

  return (
    <div className={cn(
      "h-screen overflow-hidden",
      darkMode ? "dark bg-slate-900" : "bg-slate-50"
    )}>
      <TooltipProvider>
        <div className="flex h-screen">
          {/* Sidebar */}
          <Sidebar />

          {/* Main Content */}
          <MainContent />
        </div>
      </TooltipProvider>

      {/* Mobile Sidebar Overlay */}
      {isSidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}
    </div>
  );
};

export default ChatbotPage;