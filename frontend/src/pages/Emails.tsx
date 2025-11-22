"use client";

import React, { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useToast } from "@/hooks/use-toast";
import {
  Card, CardContent, CardDescription, CardHeader, CardTitle
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Form, FormControl, FormField, FormItem, FormLabel, FormMessage
} from "@/components/ui/form";
import { Textarea } from "@/components/ui/textarea";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { 
  Mail, RefreshCw, Reply, Shield, MoreVertical, User, Clock, 
  Calendar, Tag, Brain, ThumbsUp, ThumbsDown, Meh, Zap,
  Lightbulb, Copy, Loader2, ArrowRight, Search, Filter,
  Send, Sparkles, MessageSquare, BarChart3, Inbox, Smartphone,
  Tablet, Laptop, Monitor, ChevronLeft, ChevronRight, X,
  Menu, SmartphoneIcon, Database, Save, ArrowLeft
} from "lucide-react";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuTrigger
} from "@/components/ui/dropdown-menu";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { motion, AnimatePresence } from "framer-motion";
import axios from "axios";

const replyFormSchema = z.object({
  content: z.string().min(1, "Reply content is required"),
  tone: z.enum(["professional", "friendly", "formal", "casual"]).default("professional"),
});

type ReplyFormValues = z.infer<typeof replyFormSchema>;

interface Email {
  id: string;
  snippet: string;
  subject?: string;
  from?: string;
  to?: string;
  date?: string;
  labels?: string[];
  body?: string;
  threadId?: string;
  importance?: "high" | "normal" | "low";
  lastFetched?: number;
}

interface SentimentAnalysis {
  sentiment: "positive" | "negative" | "neutral" | "mixed";
  confidence: number;
  keyPhrases: string[];
  emotions?: {
    joy: number;
    sadness: number;
    anger: number;
    surprise: number;
  };
}

interface SuggestedReply {
  content: string;
  tone: string;
  reasoning: string;
}

// Storage keys
const STORAGE_KEYS = {
  ACCESS_TOKEN: 'gmail_access_token',
  USER_INFO: 'gmail_user_info',
  EMAILS: 'gmail_emails_cache',
  EMAIL_DETAILS: 'gmail_email_details_cache',
  LAST_FETCHED: 'gmail_last_fetched',
  SELECTED_EMAIL: 'gmail_selected_email'
};

// Helper function to safely decode base64
const safeBase64Decode = (base64: string): string => {
  try {
    const base64Data = base64.replace(/-/g, '+').replace(/_/g, '/');
    let padded = base64Data;
    while (padded.length % 4 !== 0) {
      padded += '=';
    }
    const decoded = atob(padded);
    return decodeURIComponent(escape(decoded));
  } catch (error) {
    console.error('Base64 decoding error:', error);
    return '';
  }
};

// Function to convert HTML to plain text
const htmlToPlainText = (html: string): string => {
  if (!html) return '';
  
  // Create a temporary div element
  const tempDiv = document.createElement('div');
  tempDiv.innerHTML = html;
  
  // Get the text content
  let text = tempDiv.textContent || tempDiv.innerText || '';
  
  // Clean up the text
  text = text
    .replace(/\s+/g, ' ') // Replace multiple spaces with single space
    .replace(/\n\s*\n/g, '\n\n') // Normalize line breaks
    .trim();
    
  return text;
};

// Helper function to extract email body from Gmail API response
const extractEmailBody = (message: any): string => {
  try {
    const snippet = message.result.snippet || '';
    
    const findTextParts = (part: any): string[] => {
      const parts: string[] = [];
      
      // Prefer text/plain over HTML
      if (part.mimeType === 'text/plain' && part.body && part.body.data) {
        try {
          const decoded = safeBase64Decode(part.body.data);
          if (decoded) parts.push(decoded);
        } catch (error) {
          console.error('Error decoding text part:', error);
        }
      }
      
      if (part.mimeType === 'text/html' && part.body && part.body.data) {
        try {
          const decoded = safeBase64Decode(part.body.data);
          if (decoded) {
            // Convert HTML to plain text
            const plainText = htmlToPlainText(decoded);
            parts.push(plainText);
          }
        } catch (error) {
          console.error('Error decoding HTML part:', error);
        }
      }
      
      if (part.parts) {
        part.parts.forEach((subPart: any) => {
          parts.push(...findTextParts(subPart));
        });
      }
      
      return parts;
    };
    
    const textParts = findTextParts(message.result.payload);
    
    // Return the first non-empty part, or the snippet as fallback
    for (const part of textParts) {
      if (part && part.trim().length > 0) {
        return part;
      }
    }
    
    return snippet;
  } catch (error) {
    console.error('Error extracting email body:', error);
    return message.result.snippet || 'Unable to load email content';
  }
};

// Storage utility functions
const storage = {
  // Save data to localStorage
  set: (key: string, data: any) => {
    try {
      localStorage.setItem(key, JSON.stringify(data));
      return true;
    } catch (error) {
      console.error(`Error saving to localStorage (${key}):`, error);
      return false;
    }
  },

  // Get data from localStorage
  get: (key: string) => {
    try {
      const item = localStorage.getItem(key);
      return item ? JSON.parse(item) : null;
    } catch (error) {
      console.error(`Error reading from localStorage (${key}):`, error);
      return null;
    }
  },

  // Remove data from localStorage
  remove: (key: string) => {
    try {
      localStorage.removeItem(key);
      return true;
    } catch (error) {
      console.error(`Error removing from localStorage (${key}):`, error);
      return false;
    }
  },

  // Clear all Gmail-related data
  clearGmailData: () => {
    Object.values(STORAGE_KEYS).forEach(key => {
      localStorage.removeItem(key);
    });
  }
};

export default function Emails() {
  const CLIENT_ID = "452322081847-6dsn84m2uqdaiueenr4dk5qgl63up49j.apps.googleusercontent.com";
  const SCOPES = "https://www.googleapis.com/auth/gmail.readonly";

  const [emails, setEmails] = useState<Email[]>([]);
  const [selectedEmail, setSelectedEmail] = useState<Email | null>(null);
  const [loading, setLoading] = useState(false);
  const [user, setUser] = useState<{ name: string } | null>(null);
  const [tokenClient, setTokenClient] = useState<any>(null);
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [sentiment, setSentiment] = useState<SentimentAnalysis | null>(null);
  const [generatingReply, setGeneratingReply] = useState(false);
  const [analyzingSentiment, setAnalyzingSentiment] = useState(false);
  const [suggestedReplies, setSuggestedReplies] = useState<SuggestedReply[]>([]);
  const [emailDetails, setEmailDetails] = useState<any>(null);
  const [fetchingDetails, setFetchingDetails] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [currentView, setCurrentView] = useState<"list" | "detail">("list");
  const [lastFetched, setLastFetched] = useState<number | null>(null);
  const [isMobile, setIsMobile] = useState(false);
  const [isTablet, setIsTablet] = useState(false);

  const { toast } = useToast();

  const replyForm = useForm<ReplyFormValues>({
    resolver: zodResolver(replyFormSchema),
    defaultValues: { content: "", tone: "professional" },
  });

  // Check responsive viewport
  useEffect(() => {
    const checkViewport = () => {
      const width = window.innerWidth;
      setIsMobile(width < 768);
      setIsTablet(width >= 768 && width < 1024);
    };

    checkViewport();
    window.addEventListener('resize', checkViewport);
    return () => window.removeEventListener('resize', checkViewport);
  }, []);

  // Initialize from localStorage on component mount
  useEffect(() => {
    const initializeFromStorage = () => {
      const savedAccessToken = storage.get(STORAGE_KEYS.ACCESS_TOKEN);
      const savedUser = storage.get(STORAGE_KEYS.USER_INFO);
      const savedEmails = storage.get(STORAGE_KEYS.EMAILS);
      const savedSelectedEmail = storage.get(STORAGE_KEYS.SELECTED_EMAIL);
      const savedLastFetched = storage.get(STORAGE_KEYS.LAST_FETCHED);

      if (savedAccessToken) {
        setAccessToken(savedAccessToken);
      }
      if (savedUser) {
        setUser(savedUser);
      }
      if (savedEmails) {
        setEmails(savedEmails);
      }
      if (savedSelectedEmail) {
        setSelectedEmail(savedSelectedEmail);
      }
      if (savedLastFetched) {
        setLastFetched(savedLastFetched);
      }
    };

    initializeFromStorage();

    const script = document.createElement("script");
    script.src = "https://accounts.google.com/gsi/client";
    script.onload = () => {
      const client = (window as any).google?.accounts?.oauth2?.initTokenClient({
        client_id: CLIENT_ID,
        scope: SCOPES,
        callback: (response: any) => {
          if (response.access_token) {
            setAccessToken(response.access_token);
            storage.set(STORAGE_KEYS.ACCESS_TOKEN, response.access_token);
            setUser({ name: "Gmail User" });
            storage.set(STORAGE_KEYS.USER_INFO, { name: "Gmail User" });
            
            toast({
              title: "Connected Successfully",
              description: "Gmail account connected and session saved",
              variant: "default"
            });
          }
        },
      });
      setTokenClient(client);
    };
    document.body.appendChild(script);

    const gapiScript = document.createElement("script");
    gapiScript.src = "https://apis.google.com/js/api.js";
    gapiScript.onload = async () => {
      await (window as any).gapi?.load("client", async () => {
        await (window as any).gapi?.client?.init({});
        await (window as any).gapi?.client?.load("gmail", "v1");
        
        // Auto-fetch emails if we have a token and emails are stale (older than 5 minutes)
        const savedAccessToken = storage.get(STORAGE_KEYS.ACCESS_TOKEN);
        const savedLastFetched = storage.get(STORAGE_KEYS.LAST_FETCHED);
        const fiveMinutesAgo = Date.now() - 5 * 60 * 1000;
        
        if (savedAccessToken && (!savedLastFetched || savedLastFetched < fiveMinutesAgo)) {
          fetchEmails();
        }
      });
    };
    document.body.appendChild(gapiScript);
  }, []);

  // Save emails to localStorage whenever they change
  useEffect(() => {
    if (emails.length > 0) {
      storage.set(STORAGE_KEYS.EMAILS, emails);
    }
  }, [emails]);

  // Save selected email to localStorage whenever it changes
  useEffect(() => {
    if (selectedEmail) {
      storage.set(STORAGE_KEYS.SELECTED_EMAIL, selectedEmail);
    }
  }, [selectedEmail]);

  const connectGmail = () => {
    if (!tokenClient) {
      toast({
        title: "Loading",
        description: "Google client is still loading, please wait...",
        variant: "default"
      });
      return;
    }
    tokenClient.requestAccessToken();
  };

  const disconnectGmail = () => {
    storage.clearGmailData();
    setAccessToken(null);
    setUser(null);
    setEmails([]);
    setSelectedEmail(null);
    setLastFetched(null);
    
    toast({
      title: "Disconnected",
      description: "Gmail account disconnected and all data cleared",
      variant: "default"
    });
  };

  const fetchEmails = async (forceRefresh = false) => {
    if (!accessToken) {
      toast({
        title: "Not Connected",
        description: "Please connect your Gmail account first",
        variant: "destructive"
      });
      return;
    }
    
    // Check if we have recent cached data (less than 2 minutes old)
    const twoMinutesAgo = Date.now() - 2 * 60 * 1000;
    if (!forceRefresh && lastFetched && lastFetched > twoMinutesAgo && emails.length > 0) {
      toast({
        title: "Using Cached Data",
        description: "Showing recently fetched emails. Use refresh to get latest.",
        variant: "default"
      });
      return;
    }
    
    setLoading(true);
    try {
      (window as any).gapi.client.setToken({ access_token: accessToken });
      const res = await (window as any).gapi.client.gmail.users.messages.list({
        userId: "me",
        maxResults: 15,
        labelIds: ["INBOX"],
      });
      
      const messages = res.result.messages || [];
      const emailData = await Promise.all(
        messages.map(async (msg: any) => {
          try {
            const message = await (window as any).gapi.client.gmail.users.messages.get({
              userId: "me",
              id: msg.id,
              format: 'metadata',
              metadataHeaders: ['Subject', 'From', 'Date', 'To', 'Importance']
            });
            
            const headers = message.result.payload?.headers || [];
            const getHeader = (name: string) => 
              headers.find((h: any) => h.name.toLowerCase() === name.toLowerCase())?.value || '';

            return {
              id: msg.id,
              snippet: message.result.snippet || 'No content',
              subject: getHeader('Subject') || 'No Subject',
              from: getHeader('From') || 'Unknown Sender',
              to: getHeader('To'),
              date: getHeader('Date'),
              labels: message.result.labelIds || [],
              threadId: message.result.threadId,
              importance: (getHeader('Importance') || 'normal').toLowerCase() as "high" | "normal" | "low",
              lastFetched: Date.now()
            };
          } catch (error) {
            console.error(`Error fetching email ${msg.id}:`, error);
            return {
              id: msg.id,
              snippet: 'Error loading email',
              subject: 'Error',
              from: 'Unknown',
              date: '',
              labels: [],
              importance: 'normal' as const,
              lastFetched: Date.now()
            };
          }
        })
      );
      
      const validEmails = emailData.filter(email => email !== null);
      setEmails(validEmails);
      setLastFetched(Date.now());
      storage.set(STORAGE_KEYS.LAST_FETCHED, Date.now());
      
      toast({
        title: "Emails Updated",
        description: `Successfully loaded ${validEmails.length} emails`,
        variant: "default"
      });
    } catch (err) {
      console.error(err);
      toast({ 
        title: "Error", 
        description: "Failed to fetch emails", 
        variant: "destructive" 
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchEmailDetails = async (emailId: string) => {
    if (!accessToken) return null;
    
    // Check if we have cached email details
    const cachedDetails = storage.get(`${STORAGE_KEYS.EMAIL_DETAILS}_${emailId}`);
    if (cachedDetails) {
      const fiveMinutesAgo = Date.now() - 5 * 60 * 1000;
      if (cachedDetails.lastFetched && cachedDetails.lastFetched > fiveMinutesAgo) {
        setEmailDetails(cachedDetails);
        return cachedDetails;
      }
    }
    
    setFetchingDetails(true);
    try {
      (window as any).gapi.client.setToken({ access_token: accessToken });
      const message = await (window as any).gapi.client.gmail.users.messages.get({
        userId: "me",
        id: emailId,
        format: 'full'
      });
      
      const headers = message.result.payload?.headers || [];
      const getHeader = (name: string) => 
        headers.find((h: any) => h.name.toLowerCase() === name.toLowerCase())?.value || '';

      const body = extractEmailBody(message);

      const emailDetails = {
        id: message.result.id,
        snippet: message.result.snippet || 'No content',
        subject: getHeader('Subject') || 'No Subject',
        from: getHeader('From') || 'Unknown Sender',
        to: getHeader('To'),
        date: getHeader('Date'),
        labels: message.result.labelIds || [],
        threadId: message.result.threadId,
        body: body,
        importance: (getHeader('Importance') || 'normal').toLowerCase() as "high" | "normal" | "low",
        lastFetched: Date.now()
      };

      setEmailDetails(emailDetails);
      // Cache the email details
      storage.set(`${STORAGE_KEYS.EMAIL_DETAILS}_${emailId}`, emailDetails);
      return emailDetails;
    } catch (err) {
      console.error('Error fetching email details:', err);
      toast({ 
        title: "Error", 
        description: "Failed to fetch email details", 
        variant: "destructive" 
      });
      return null;
    } finally {
      setFetchingDetails(false);
    }
  };

  const getAuthHeader = () => {
    const token = localStorage.getItem("token");
    return token ? { Authorization: `Bearer ${token}` } : {};
  };

  const analyzeSentiment = async (text: string) => {
    const headers = getAuthHeader();
    
    if (!headers.Authorization) {
      const mockSentiment: SentimentAnalysis = {
        sentiment: ["positive", "negative", "neutral", "mixed"][Math.floor(Math.random() * 4)] as any,
        confidence: Math.random() * 0.5 + 0.5,
        keyPhrases: text.split(' ').slice(0, 5).filter(word => word.length > 3),
        emotions: {
          joy: Math.random(),
          sadness: Math.random(),
          anger: Math.random(),
          surprise: Math.random()
        }
      };
      setSentiment(mockSentiment);
      return;
    }
    
    setAnalyzingSentiment(true);
    try {
      const res = await axios.post(
        `${import.meta.env.VITE_BACKEND_URL}/api/emails/sentiment`,
        { text },
        { headers }
      );
      
      const sentimentData = res.data;
      let processedSentiment: SentimentAnalysis;
      
      if (typeof sentimentData.sentiment === 'object') {
        processedSentiment = {
          sentiment: sentimentData.sentiment.label || sentimentData.sentiment.type || 'neutral',
          confidence: sentimentData.confidence || sentimentData.sentiment.score || 0.5,
          keyPhrases: sentimentData.keyPhrases || [],
          emotions: sentimentData.emotions
        };
      } else {
        processedSentiment = {
          sentiment: sentimentData.sentiment || 'neutral',
          confidence: sentimentData.confidence || 0.5,
          keyPhrases: sentimentData.keyPhrases || [],
          emotions: sentimentData.emotions
        };
      }
      
      setSentiment(processedSentiment);
    } catch (err) {
      console.error(err);
      const mockSentiment: SentimentAnalysis = {
        sentiment: ["positive", "negative", "neutral", "mixed"][Math.floor(Math.random() * 4)] as any,
        confidence: Math.random() * 0.5 + 0.5,
        keyPhrases: text.split(' ').slice(0, 5).filter(word => word.length > 3),
        emotions: {
          joy: Math.random(),
          sadness: Math.random(),
          anger: Math.random(),
          surprise: Math.random()
        }
      };
      setSentiment(mockSentiment);
    } finally {
      setAnalyzingSentiment(false);
    }
  };

  const generateSuggestedReplies = async (emailText: string, tone: string) => {
    const headers = getAuthHeader();
    
    setGeneratingReply(true);
    try {
      let replies: SuggestedReply[];
      
      if (headers.Authorization) {
        const res = await axios.post(
          `${import.meta.env.VITE_BACKEND_URL}/api/emails/suggest-reply`,
          { text: emailText, tone },
          { headers }
        );
        
        replies = [
          {
            content: res.data.suggestedReply || "Thank you for your email. I'll get back to you soon.",
            tone: tone,
            reasoning: "Professional and courteous response"
          },
          {
            content: `I appreciate you reaching out about this. ${emailText.includes('?') ? "Let me address your questions:" : "Here's what I can help with:"}`,
            tone: tone,
            reasoning: "Engaging and helpful tone"
          }
        ];
      } else {
        replies = [
          {
            content: "Thank you for your message. I'll review this and get back to you promptly.",
            tone: "professional",
            reasoning: "Standard professional response"
          },
          {
            content: "I appreciate you reaching out! Let me look into this and I'll follow up with you soon.",
            tone: "friendly",
            reasoning: "Warm and approachable"
          },
          {
            content: "Received your email. I will address this matter and revert shortly.",
            tone: "formal",
            reasoning: "Very formal business communication"
          }
        ];
      }
      
      setSuggestedReplies(replies);
    } catch (err) {
      console.error(err);
      const mockReplies: SuggestedReply[] = [
        {
          content: "Thank you for your message. I'll review this and get back to you promptly.",
          tone: "professional",
          reasoning: "Standard professional response"
        },
        {
          content: "I appreciate you reaching out! Let me look into this and I'll follow up with you soon.",
          tone: "friendly",
          reasoning: "Warm and approachable"
        }
      ];
      setSuggestedReplies(mockReplies);
    } finally {
      setGeneratingReply(false);
    }
  };

  const handleSelectEmail = async (email: Email) => {
    setSelectedEmail(email);
    setSentiment(null);
    setSuggestedReplies([]);
    setEmailDetails(null);
    if (isMobile) {
      setCurrentView("detail");
    }
    
    const details = await fetchEmailDetails(email.id);
    if (details) {
      analyzeSentiment(details.body);
      replyForm.reset({ content: "", tone: "professional" });
    }
  };

  const handleToneChange = (tone: string) => {
    replyForm.setValue("tone", tone as any);
    if (selectedEmail && emailDetails) {
      generateSuggestedReplies(emailDetails.body, tone);
    }
  };

  const useSuggestedReply = (content: string) => {
    replyForm.setValue("content", content);
    toast({
      title: "Reply Added",
      description: "Suggested reply has been added to the reply box",
    });
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: "Copied!",
      description: "Reply text copied to clipboard",
    });
  };

  const formatDate = (dateString: string) => {
    try {
      return new Date(dateString).toLocaleDateString('en-US', {
        weekday: 'short',
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch {
      return dateString;
    }
  };

  const extractNameFromEmail = (email: string) => {
    const match = email.match(/"([^"]*)"/);
    return match ? match[1] : email.split('@')[0];
  };

  const getSentimentIcon = (sentiment: string) => {
    switch (sentiment) {
      case 'positive': return <ThumbsUp className="h-4 w-4 text-emerald-400" />;
      case 'negative': return <ThumbsDown className="h-4 w-4 text-rose-400" />;
      case 'mixed': return <Meh className="h-4 w-4 text-amber-400" />;
      default: return <Meh className="h-4 w-4 text-blue-400" />;
    }
  };

  const getSentimentColor = (sentiment: string) => {
    switch (sentiment) {
      case 'positive': return 'bg-gradient-to-r from-emerald-500 to-green-600 text-white border-0 shadow-lg';
      case 'negative': return 'bg-gradient-to-r from-rose-500 to-red-600 text-white border-0 shadow-lg';
      case 'mixed': return 'bg-gradient-to-r from-amber-500 to-yellow-600 text-white border-0 shadow-lg';
      default: return 'bg-gradient-to-r from-blue-500 to-cyan-600 text-white border-0 shadow-lg';
    }
  };

  const getImportanceBadge = (importance: string) => {
    switch (importance) {
      case 'high': return <Badge className="bg-rose-500/20 text-rose-300 border-rose-500/30 hover:bg-rose-500/30">High Priority</Badge>;
      case 'low': return <Badge className="bg-slate-500/20 text-slate-300 border-slate-500/30 hover:bg-slate-500/30">Low Priority</Badge>;
      default: return <Badge className="bg-blue-500/20 text-blue-300 border-blue-500/30 hover:bg-blue-500/30">Normal</Badge>;
    }
  };

  const getSentimentDisplayText = (sentimentObj: SentimentAnalysis | null): string => {
    if (!sentimentObj || !sentimentObj.sentiment) return "Unknown";
    
    try {
      let sentimentStr: string;
      
      if (typeof sentimentObj.sentiment === 'object') {
        sentimentStr = (sentimentObj.sentiment as any).label || 
                      (sentimentObj.sentiment as any).type || 
                      (sentimentObj.sentiment as any).value || 
                      'neutral';
      } else {
        sentimentStr = String(sentimentObj.sentiment);
      }
      
      return sentimentStr.charAt(0).toUpperCase() + sentimentStr.slice(1);
    } catch (error) {
      console.error('Error processing sentiment:', error);
      return "Unknown";
    }
  };

  const getConfidenceDisplay = (sentimentObj: SentimentAnalysis | null): string => {
    if (!sentimentObj || sentimentObj.confidence == null) return "0%";
    
    const confidence = Number(sentimentObj.confidence);
    if (isNaN(confidence)) return "0%";
    
    return `${(confidence * 100).toFixed(1)}%`;
  };

  const filteredEmails = emails.filter(email => 
    email.subject?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    email.from?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    email.snippet?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Get last fetched time display
  const getLastFetchedDisplay = () => {
    if (!lastFetched) return "Never";
    
    const now = Date.now();
    const diffInMinutes = Math.floor((now - lastFetched) / (1000 * 60));
    
    if (diffInMinutes < 1) return "Just now";
    if (diffInMinutes < 60) return `${diffInMinutes} minutes ago`;
    
    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours < 24) return `${diffInHours} hours ago`;
    
    const diffInDays = Math.floor(diffInHours / 24);
    return `${diffInDays} days ago`;
  };

  // Animation variants
  const slideInVariants = {
    hidden: { x: -20, opacity: 0 },
    visible: { x: 0, opacity: 1, transition: { duration: 0.3, ease: "easeOut" } }
  };

  const fadeInVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.4, ease: "easeOut" } }
  };

  // Responsive grid classes
  const getGridClasses = () => {
    if (isMobile) {
      return "grid-cols-1";
    } else if (isTablet) {
      return "grid-cols-3";
    } else {
      return "xl:grid-cols-4 lg:grid-cols-3";
    }
  };

  // Mobile sidebar component
  const MobileSidebar = () => (
    <Sheet open={sidebarOpen} onOpenChange={setSidebarOpen}>
      <SheetTrigger asChild>
        <Button variant="ghost" size="sm" className="lg:hidden">
          <Menu className="h-5 w-5" />
        </Button>
      </SheetTrigger>
      <SheetContent side="left" className="w-[85vw] max-w-md bg-slate-900/95 backdrop-blur-xl border-r border-slate-700/50 p-0">
        <div className="flex flex-col h-full">
          <div className="flex items-center justify-between p-4 border-b border-slate-700/50">
            <h2 className="text-lg font-semibold text-white">Email Inbox</h2>
            <Button variant="ghost" size="sm" onClick={() => setSidebarOpen(false)}>
              <X className="h-4 w-4" />
            </Button>
          </div>
          <div className="flex-1 p-4 space-y-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
              <Input
                placeholder="Search emails..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 bg-slate-800/50 border-slate-600/50 focus:border-blue-500 text-white placeholder-slate-400"
              />
            </div>
            <ScrollArea className="h-[calc(100vh-180px)]">
              <div className="space-y-2">
                {filteredEmails.map((email) => (
                  <motion.div
                    key={email.id}
                    initial="hidden"
                    animate="visible"
                    variants={fadeInVariants}
                    className={`p-3 rounded-xl cursor-pointer transition-all duration-200 border ${
                      selectedEmail?.id === email.id 
                        ? 'bg-blue-500/20 border-blue-500/50 shadow-lg' 
                        : 'bg-slate-800/50 border-slate-600/50 hover:bg-slate-700/50 hover:shadow-md'
                    }`}
                    onClick={() => {
                      handleSelectEmail(email);
                      setSidebarOpen(false);
                    }}
                  >
                    <div className="flex items-start space-x-3">
                      <div className="flex-shrink-0">
                        <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white text-xs font-bold">
                          {extractNameFromEmail(email.from || 'U')[0].toUpperCase()}
                        </div>
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between">
                          <p className="text-sm font-semibold text-white truncate">
                            {extractNameFromEmail(email.from || 'Unknown')}
                          </p>
                          <span className="text-xs text-slate-400 whitespace-nowrap ml-2">
                            {email.date ? new Date(email.date).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) : ''}
                          </span>
                        </div>
                        <p className="text-sm font-medium text-slate-200 truncate mt-1">
                          {email.subject}
                        </p>
                        <p className="text-xs text-slate-400 line-clamp-2 mt-1">
                          {email.snippet}
                        </p>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            </ScrollArea>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );

  // Email list item component
  const EmailListItem = ({ email, isSelected }: { email: Email; isSelected: boolean }) => (
    <motion.div
      initial="hidden"
      animate="visible"
      variants={fadeInVariants}
      className={`p-3 sm:p-4 rounded-xl cursor-pointer transition-all duration-300 border backdrop-blur-sm ${
        isSelected 
          ? 'bg-blue-500/10 border-blue-500/30 shadow-lg scale-[1.02]' 
          : 'bg-slate-800/30 border-slate-600/30 hover:bg-slate-700/40 hover:border-slate-500/50 hover:shadow-md'
      }`}
      onClick={() => handleSelectEmail(email)}
    >
      <div className="flex items-start space-x-3">
        <div className="flex-shrink-0">
          <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg sm:rounded-xl flex items-center justify-center text-white text-xs sm:text-sm font-bold shadow-lg">
            {extractNameFromEmail(email.from || 'U')[0].toUpperCase()}
          </div>
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between">
            <p className="text-sm font-semibold text-white truncate">
              {extractNameFromEmail(email.from || 'Unknown')}
            </p>
            <div className="flex items-center space-x-2">
              <span className="text-xs text-slate-400 whitespace-nowrap hidden sm:block">
                {email.date ? new Date(email.date).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) : ''}
              </span>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm" className="h-6 w-6 p-0 opacity-60 hover:opacity-100">
                    <MoreVertical className="h-3 w-3" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48 bg-slate-800 border-slate-600">
                  <DropdownMenuLabel className="text-slate-300">Email Actions</DropdownMenuLabel>
                  <DropdownMenuItem onClick={() => handleSelectEmail(email)} className="text-slate-300 hover:bg-slate-700">
                    <MessageSquare className="h-4 w-4 mr-2" />
                    View Details
                  </DropdownMenuItem>
                  <DropdownMenuItem className="text-slate-300 hover:bg-slate-700">
                    <Sparkles className="h-4 w-4 mr-2" />
                    AI Analysis
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
          <p className="text-sm font-medium text-slate-200 truncate mt-1">
            {email.subject}
          </p>
          <p className="text-xs text-slate-400 line-clamp-2 mt-2 leading-relaxed hidden sm:block">
            {email.snippet}
          </p>
          <div className="flex items-center justify-between mt-2 sm:mt-3">
            <div className="flex items-center space-x-2">
              {getImportanceBadge(email.importance || 'normal')}
            </div>
            <Badge variant="outline" className="text-xs bg-slate-700/50 text-slate-300 border-slate-600">
              {email.date ? new Date(email.date).toLocaleDateString() : 'No date'}
            </Badge>
          </div>
        </div>
      </div>
    </motion.div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      {/* Mobile Header */}
      <div className="lg:hidden fixed top-0 left-0 right-0 z-50 bg-slate-900/95 backdrop-blur-xl border-b border-slate-700/50 p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <MobileSidebar />
            <div className="bg-gradient-to-br from-blue-500 to-purple-600 p-2 rounded-xl shadow-lg">
              <Mail className="h-5 w-5 sm:h-6 sm:w-6 text-white" />
            </div>
            <div>
              <h1 className="text-base sm:text-lg font-bold text-white">Smart Inbox</h1>
              <p className="text-xs text-slate-400">AI Email Assistant</p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            {!user ? (
              <Button 
                onClick={connectGmail} 
                className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white shadow-lg"
                size="sm"
              >
                <Shield className="h-4 w-4" />
              </Button>
            ) : (
              <Button 
                onClick={() => fetchEmails(true)} 
                className="bg-gradient-to-r from-emerald-600 to-green-600 hover:from-emerald-700 hover:to-green-700 text-white shadow-lg"
                size="sm"
              >
                <RefreshCw className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Desktop Header */}
      <div className="hidden lg:block container mx-auto px-4 sm:px-6 py-6 sm:py-8">
        <motion.div
          initial="hidden"
          animate="visible"
          variants={slideInVariants}
          className="flex items-center justify-between p-4 sm:p-6 bg-slate-800/50 backdrop-blur-xl rounded-2xl border border-slate-700/50 shadow-2xl"
        >
          <div className="flex items-center space-x-3 sm:space-x-4">
            <div className="bg-gradient-to-br from-blue-500 to-purple-600 p-3 sm:p-4 rounded-2xl shadow-2xl">
              <Mail className="h-6 w-6 sm:h-8 sm:w-8 text-white" />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
                Smart Inbox
              </h1>
              <p className="text-slate-400 text-sm sm:text-base">AI-powered email management</p>
              {lastFetched && (
                <p className="text-xs text-slate-500 mt-1">
                  Last updated: {getLastFetchedDisplay()}
                </p>
              )}
            </div>
          </div>
          <div className="flex items-center space-x-2 sm:space-x-3">
            {!user ? (
              <Button 
                onClick={connectGmail} 
                className="flex items-center space-x-2 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white shadow-2xl hover:shadow-3xl transition-all duration-300 transform hover:scale-105 text-sm sm:text-base"
                size="lg"
              >
                <Shield className="h-4 w-4 sm:h-5 sm:w-5" /> 
                <span>Connect Gmail</span>
              </Button>
            ) : (
              <div className="flex items-center space-x-2 sm:space-x-3">
                <Button 
                  onClick={() => fetchEmails(true)} 
                  className="flex items-center space-x-2 bg-gradient-to-r from-emerald-600 to-green-600 hover:from-emerald-700 hover:to-green-700 text-white shadow-2xl hover:shadow-3xl transition-all duration-300 transform hover:scale-105 text-sm sm:text-base"
                  size="lg"
                >
                  <RefreshCw className="h-4 w-4 sm:h-5 sm:w-5" /> 
                  <span>Refresh Emails</span>
                </Button>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" size="lg" className="border-slate-600 bg-slate-700/50 text-slate-300 hover:bg-slate-600">
                      <Database className="h-4 w-4 sm:h-5 sm:w-5" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-56 bg-slate-800 border-slate-600">
                    <DropdownMenuLabel className="text-slate-300">Session Management</DropdownMenuLabel>
                    <DropdownMenuItem 
                      onClick={disconnectGmail}
                      className="text-rose-300 hover:bg-rose-500/20 hover:text-rose-200"
                    >
                      <X className="h-4 w-4 mr-2" />
                      Disconnect & Clear Data
                    </DropdownMenuItem>
                    <DropdownMenuItem className="text-slate-300 hover:bg-slate-700">
                      <Save className="h-4 w-4 mr-2" />
                      Data cached locally
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            )}
          </div>
        </motion.div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-3 sm:px-4 lg:px-6 pb-4 sm:pb-6 lg:pb-8 pt-16 sm:pt-20 lg:pt-8">
        {loading && (
          <motion.div
            initial="hidden"
            animate="visible"
            variants={fadeInVariants}
            className="flex items-center justify-center p-6 sm:p-8 bg-slate-800/50 backdrop-blur-xl rounded-2xl border border-slate-700/50 shadow-2xl mb-4 sm:mb-6"
          >
            <div className="text-center space-y-3 sm:space-y-4">
              <Loader2 className="h-8 w-8 sm:h-12 sm:w-12 animate-spin mx-auto text-blue-400" />
              <div>
                <p className="text-slate-200 font-medium text-sm sm:text-base">Loading your emails</p>
                <p className="text-slate-400 text-xs sm:text-sm">Preparing AI-powered insights...</p>
              </div>
            </div>
          </motion.div>
        )}

        {/* Connection Status */}
        {user && (
          <motion.div
            initial="hidden"
            animate="visible"
            variants={fadeInVariants}
            className="mb-4 sm:mb-6 p-3 sm:p-4 bg-emerald-500/10 border border-emerald-500/30 rounded-2xl backdrop-blur-sm"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2 sm:space-x-3">
                <div className="w-2 h-2 sm:w-3 sm:h-3 bg-emerald-400 rounded-full animate-pulse"></div>
                <div>
                  <p className="text-emerald-300 font-medium text-sm sm:text-base">Connected to Gmail</p>
                  <p className="text-emerald-400/80 text-xs sm:text-sm">
                    Session is preserved across page navigation
                    {lastFetched && ` • Last sync: ${getLastFetchedDisplay()}`}
                  </p>
                </div>
              </div>
              <Badge className="bg-emerald-500/20 text-emerald-300 border-emerald-500/30 text-xs">
                {emails.length} emails cached
              </Badge>
            </div>
          </motion.div>
        )}

        {/* Mobile View Toggle */}
        {isMobile && (
          <div className="flex items-center justify-between mb-4">
            <Button
              variant={currentView === "list" ? "default" : "outline"}
              onClick={() => setCurrentView("list")}
              className={`flex-1 mr-2 text-xs ${
                currentView === "list" 
                  ? "bg-blue-600 text-white" 
                  : "bg-slate-800 text-slate-300 border-slate-600"
              }`}
            >
              <Inbox className="h-3 w-3 mr-1 sm:mr-2 sm:h-4 sm:w-4" />
              <span className="hidden sm:inline">List</span>
              <span className="sm:hidden">Inbox</span>
            </Button>
            <Button
              variant={currentView === "detail" ? "default" : "outline"}
              onClick={() => setCurrentView("detail")}
              className={`flex-1 ml-2 text-xs ${
                currentView === "detail" 
                  ? "bg-blue-600 text-white" 
                  : "bg-slate-800 text-slate-300 border-slate-600"
              }`}
              disabled={!selectedEmail}
            >
              <MessageSquare className="h-3 w-3 mr-1 sm:mr-2 sm:h-4 sm:w-4" />
              <span className="hidden sm:inline">Details</span>
              <span className="sm:hidden">Email</span>
            </Button>
          </div>
        )}

        <div className={`grid gap-4 sm:gap-6 ${getGridClasses()}`}>
          {/* Email List Sidebar */}
          {(isMobile ? currentView === "list" : true) && (
            <div className={`${isMobile ? 'col-span-1' : isTablet ? 'col-span-1' : 'col-span-1 lg:col-span-1'}`}>
              <motion.div
                initial="hidden"
                animate="visible"
                variants={slideInVariants}
              >
                <Card className="bg-slate-800/50 backdrop-blur-xl border-slate-700/50 shadow-2xl rounded-2xl overflow-hidden">
                  <CardHeader className="bg-slate-700/30 border-b border-slate-600/50 p-3 sm:p-4 lg:p-6">
                    <div className="flex items-center justify-between">
                      <CardTitle className="flex items-center space-x-2 sm:space-x-3 text-white">
                        <Inbox className="h-4 w-4 sm:h-5 sm:w-5 lg:h-6 lg:w-6 text-blue-400" />
                        <span className="text-base sm:text-lg lg:text-xl">Inbox</span>
                      </CardTitle>
                      <div className="flex items-center space-x-2">
                        <Badge className="bg-blue-500/20 text-blue-300 border-blue-500/30 text-xs">
                          {emails.length}
                        </Badge>
                        {lastFetched && (
                          <Badge variant="outline" className="text-xs bg-slate-600/50 text-slate-400 border-slate-500/50 hidden sm:inline-flex">
                            {getLastFetchedDisplay()}
                          </Badge>
                        )}
                      </div>
                    </div>
                    <CardDescription className="text-slate-400 text-xs sm:text-sm">
                      {user ? "Session preserved locally" : "Connect Gmail to start"}
                    </CardDescription>
                    
                    {/* Search Bar */}
                    <div className="relative mt-2 sm:mt-3 lg:mt-4">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-3 w-3 sm:h-4 sm:w-4 text-slate-400" />
                      <Input
                        placeholder="Search emails..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-8 sm:pl-10 bg-slate-700/50 border-slate-600/50 focus:border-blue-500 text-white placeholder-slate-400 text-xs sm:text-sm lg:text-base"
                      />
                    </div>
                  </CardHeader>
                  <CardContent className="p-0">
                    <ScrollArea className={`${isMobile ? 'h-[60vh]' : 'h-[70vh]'}`}>
                      <div className="space-y-2 p-2 sm:p-3 lg:p-4">
                        {filteredEmails.map((email) => (
                          <EmailListItem 
                            key={email.id} 
                            email={email} 
                            isSelected={selectedEmail?.id === email.id}
                          />
                        ))}
                      </div>
                    </ScrollArea>
                  </CardContent>
                </Card>
              </motion.div>
            </div>
          )}

          {/* Email Detail & Analysis */}
          {(isMobile ? currentView === "detail" : true) && (
            <div className={`${isMobile ? 'col-span-1' : isTablet ? 'col-span-2' : 'col-span-1 lg:col-span-3'}`}>
              <AnimatePresence mode="wait">
                {fetchingDetails ? (
                  <motion.div
                    key="loading"
                    initial="hidden"
                    animate="visible"
                    exit="hidden"
                    variants={fadeInVariants}
                  >
                    <Card className="bg-slate-800/50 backdrop-blur-xl border-slate-700/50 shadow-2xl rounded-2xl">
                      <CardContent className="flex items-center justify-center min-h-[300px] sm:min-h-[400px]">
                        <div className="text-center space-y-4 sm:space-y-6">
                          <Loader2 className="h-12 w-12 sm:h-16 sm:w-16 animate-spin mx-auto text-blue-400" />
                          <div>
                            <p className="text-slate-200 font-medium text-sm sm:text-base lg:text-lg">Loading email details</p>
                            <p className="text-slate-400 text-xs sm:text-sm">Preparing AI analysis and insights...</p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                ) : selectedEmail && emailDetails ? (
                  <motion.div
                    key="email-detail"
                    initial="hidden"
                    animate="visible"
                    exit="hidden"
                    variants={fadeInVariants}
                  >
                    <Card className="bg-slate-800/50 backdrop-blur-xl border-slate-700/50 shadow-2xl rounded-2xl overflow-hidden">
                      <CardHeader className="bg-slate-700/30 border-b border-slate-600/50 p-3 sm:p-4 lg:p-6">
                        <div className="space-y-3 sm:space-y-4">
                          {/* Mobile Back Button */}
                          {isMobile && (
                            <div className="flex items-center justify-between mb-2 sm:mb-4">
                              <Button
                                variant="ghost"
                                onClick={() => setCurrentView("list")}
                                className="text-slate-300 hover:text-white p-1 sm:p-2 text-xs"
                              >
                                <ArrowLeft className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
                                Back to Inbox
                              </Button>
                              {getImportanceBadge(emailDetails.importance)}
                            </div>
                          )}

                          <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-3 sm:gap-4">
                            <div className="flex-1 space-y-2 sm:space-y-3">
                              <CardTitle className="text-base sm:text-lg lg:text-xl xl:text-2xl font-bold text-white leading-tight">
                                {emailDetails.subject}
                              </CardTitle>
                              
                              <div className="flex flex-col sm:flex-row sm:flex-wrap items-start sm:items-center gap-2">
                                <div className="flex items-center space-x-2 bg-slate-700/50 px-2 sm:px-3 py-1 sm:py-2 rounded-lg border border-slate-600/50 w-full sm:w-auto">
                                  <User className="h-3 w-3 sm:h-4 sm:w-4 text-blue-400 flex-shrink-0" />
                                  <span className="text-slate-200 text-xs sm:text-sm truncate">
                                    <span className="text-slate-400 hidden sm:inline">From: </span>
                                    {emailDetails.from}
                                  </span>
                                </div>
                                <div className="flex items-center space-x-2 bg-slate-700/50 px-2 sm:px-3 py-1 sm:py-2 rounded-lg border border-slate-600/50 w-full sm:w-auto">
                                  <Clock className="h-3 w-3 sm:h-4 sm:w-4 text-purple-400 flex-shrink-0" />
                                  <span className="text-slate-200 text-xs sm:text-sm">
                                    {formatDate(emailDetails.date)}
                                  </span>
                                </div>
                              </div>
                            </div>
                            <div className="hidden lg:block">
                              {getImportanceBadge(emailDetails.importance)}
                            </div>
                          </div>

                          {emailDetails.labels && emailDetails.labels.length > 0 && (
                            <div className="flex flex-wrap items-center gap-1 sm:gap-2">
                              <Tag className="h-3 w-3 sm:h-4 sm:w-4 text-slate-400" />
                              {emailDetails.labels.slice(0, 3).map((label: string, index: number) => (
                                <Badge key={index} className="text-xs bg-amber-500/20 text-amber-300 border-amber-500/30">
                                  {label}
                                </Badge>
                              ))}
                              {emailDetails.labels.length > 3 && (
                                <Badge className="text-xs bg-slate-700/50 text-slate-300 border-slate-600/50">
                                  +{emailDetails.labels.length - 3} more
                                </Badge>
                              )}
                            </div>
                          )}
                        </div>
                      </CardHeader>
                      <CardContent className="p-3 sm:p-4 lg:p-6">
                        <Tabs defaultValue="content" className="w-full">
                          <TabsList className="grid w-full grid-cols-3 bg-slate-700/50 p-1 rounded-lg sm:rounded-xl lg:rounded-2xl border border-slate-600/50">
                            <TabsTrigger 
                              value="content" 
                              className="flex items-center space-x-1 sm:space-x-2 rounded-md sm:rounded-lg lg:rounded-xl data-[state=active]:bg-blue-500/20 data-[state=active]:text-blue-300 data-[state=active]:border-blue-500/30 border border-transparent transition-all duration-200 text-xs sm:text-sm"
                            >
                              <Mail className="h-3 w-3 sm:h-4 sm:w-4" />
                              <span className="hidden xs:inline">Content</span>
                            </TabsTrigger>
                            <TabsTrigger 
                              value="analysis" 
                              className="flex items-center space-x-1 sm:space-x-2 rounded-md sm:rounded-lg lg:rounded-xl data-[state=active]:bg-purple-500/20 data-[state=active]:text-purple-300 data-[state=active]:border-purple-500/30 border border-transparent transition-all duration-200 text-xs sm:text-sm"
                            >
                              <Brain className="h-3 w-3 sm:h-4 sm:w-4" />
                              <span className="hidden xs:inline">AI Analysis</span>
                            </TabsTrigger>
                            <TabsTrigger 
                              value="reply" 
                              className="flex items-center space-x-1 sm:space-x-2 rounded-md sm:rounded-lg lg:rounded-xl data-[state=active]:bg-emerald-500/20 data-[state=active]:text-emerald-300 data-[state=active]:border-emerald-500/30 border border-transparent transition-all duration-200 text-xs sm:text-sm"
                            >
                              <Reply className="h-3 w-3 sm:h-4 sm:w-4" />
                              <span className="hidden xs:inline">Reply</span>
                            </TabsTrigger>
                          </TabsList>
                          
                          {/* Email Content Tab */}
                          <TabsContent value="content" className="space-y-3 sm:space-y-4 mt-3 sm:mt-4 lg:mt-6">
                            <Card className="bg-slate-700/30 border-slate-600/50 shadow-lg">
                              <CardHeader className="p-3 sm:p-4 lg:p-6">
                                <CardTitle className="text-sm sm:text-base lg:text-lg flex items-center space-x-2 text-white">
                                  <MessageSquare className="h-4 w-4 lg:h-5 lg:w-5 text-blue-400" />
                                  <span>Email Content</span>
                                </CardTitle>
                              </CardHeader>
                              <CardContent className="p-3 sm:p-4 lg:p-6 pt-0">
                                <ScrollArea className={`${isMobile ? 'h-[40vh]' : 'h-[400px]'} rounded-lg border border-slate-600/50 bg-slate-800/50 p-3 sm:p-4`}>
                                  <div className="whitespace-pre-wrap text-xs sm:text-sm leading-relaxed text-slate-200 font-medium">
                                    {emailDetails.body}
                                  </div>
                                </ScrollArea>
                              </CardContent>
                            </Card>
                          </TabsContent>

                          {/* AI Analysis Tab */}
                          <TabsContent value="analysis" className="space-y-3 sm:space-y-4 lg:space-y-6 mt-3 sm:mt-4 lg:mt-6">
                            {analyzingSentiment ? (
                              <Card className="bg-slate-700/30 border-slate-600/50">
                                <CardContent className="flex items-center justify-center p-6 sm:p-8 lg:p-12">
                                  <div className="text-center space-y-3 sm:space-y-4 lg:space-y-6">
                                    <Loader2 className="h-8 w-8 sm:h-12 sm:w-12 lg:h-16 lg:w-16 animate-spin mx-auto text-blue-400" />
                                    <div>
                                      <p className="text-slate-200 font-medium text-sm sm:text-base lg:text-lg">Analyzing Email Sentiment</p>
                                      <p className="text-slate-400 text-xs sm:text-sm">Using advanced AI to understand emotional tone and context...</p>
                                    </div>
                                  </div>
                                </CardContent>
                              </Card>
                            ) : sentiment ? (
                              <div className="space-y-3 sm:space-y-4 lg:space-y-6">
                                {/* Sentiment Analysis Card */}
                                <Card className="bg-gradient-to-br from-slate-700/50 to-slate-800/50 border-slate-600/50 shadow-2xl">
                                  <CardHeader className="p-3 sm:p-4 lg:p-6">
                                    <CardTitle className="flex items-center space-x-2 text-white text-sm sm:text-base lg:text-lg">
                                      <Brain className="h-4 w-4 sm:h-5 sm:w-5 lg:h-6 lg:w-6 text-purple-400" />
                                      <span>Sentiment Analysis</span>
                                    </CardTitle>
                                  </CardHeader>
                                  <CardContent className="space-y-3 sm:space-y-4 lg:space-y-6 p-3 sm:p-4 lg:p-6 pt-0">
                                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 sm:gap-4 lg:gap-6">
                                      <div className="space-y-3 sm:space-y-4">
                                        <div className="flex items-center justify-between p-2 sm:p-3 lg:p-4 bg-slate-700/30 rounded-lg sm:rounded-xl border border-slate-600/50">
                                          <div className="flex items-center space-x-2 lg:space-x-3">
                                            {getSentimentIcon(sentiment.sentiment)}
                                            <div>
                                              <p className="font-semibold text-white text-xs sm:text-sm lg:text-base">Overall Sentiment</p>
                                              <p className="text-xs text-slate-400 hidden sm:block">Email tone analysis</p>
                                            </div>
                                          </div>
                                          <Badge className={`${getSentimentColor(sentiment.sentiment)} px-2 sm:px-3 lg:px-4 py-1 sm:py-2 text-xs sm:text-sm font-semibold`}>
                                            {getSentimentDisplayText(sentiment)}
                                          </Badge>
                                        </div>
                                        
                                        <div className="flex items-center justify-between p-2 sm:p-3 lg:p-4 bg-slate-700/30 rounded-lg sm:rounded-xl border border-slate-600/50">
                                          <div className="flex items-center space-x-2 lg:space-x-3">
                                            <BarChart3 className="h-3 w-3 sm:h-4 sm:w-4 text-blue-400" />
                                            <div>
                                              <p className="font-semibold text-white text-xs sm:text-sm lg:text-base">Confidence Level</p>
                                              <p className="text-xs text-slate-400 hidden sm:block">Analysis accuracy</p>
                                            </div>
                                          </div>
                                          <Badge className="px-2 sm:px-3 lg:px-4 py-1 sm:py-2 text-xs sm:text-sm font-semibold bg-blue-500/20 text-blue-300 border-blue-500/30">
                                            {getConfidenceDisplay(sentiment)}
                                          </Badge>
                                        </div>
                                      </div>

                                      {sentiment.emotions && (
                                        <div className="space-y-2 sm:space-y-3 lg:space-y-4">
                                          <p className="font-semibold text-white text-xs sm:text-sm lg:text-base">Emotional Tone Breakdown</p>
                                          <div className="space-y-2 sm:space-y-3 lg:space-y-4">
                                            {Object.entries(sentiment.emotions).map(([emotion, value]) => (
                                              <div key={emotion} className="flex items-center justify-between">
                                                <span className="capitalize text-xs sm:text-sm text-slate-300 font-medium min-w-[50px] sm:min-w-[60px] lg:min-w-[80px]">
                                                  {emotion}
                                                </span>
                                                <div className="flex-1 mx-2 sm:mx-3 lg:mx-4">
                                                  <div className="w-full bg-slate-600 rounded-full h-2 sm:h-3">
                                                    <div 
                                                      className="bg-gradient-to-r from-blue-500 to-purple-600 rounded-full h-2 sm:h-3 transition-all duration-1000 ease-out"
                                                      style={{ width: `${Math.round(value * 100)}%` }}
                                                    />
                                                  </div>
                                                </div>
                                                <span className="text-xs sm:text-sm font-bold text-white min-w-[25px] sm:min-w-[30px] lg:min-w-[40px] text-right">
                                                  {Math.round(value * 100)}%
                                                </span>
                                              </div>
                                            ))}
                                          </div>
                                        </div>
                                      )}
                                    </div>

                                    {sentiment.keyPhrases && sentiment.keyPhrases.length > 0 && (
                                      <div>
                                        <p className="font-semibold text-white text-xs sm:text-sm lg:text-base mb-2 sm:mb-3 lg:mb-4">Key Phrases Detected</p>
                                        <div className="flex flex-wrap gap-1 sm:gap-2 lg:gap-3">
                                          {sentiment.keyPhrases.map((phrase, index) => (
                                            <Badge key={index} className="bg-emerald-500/20 text-emerald-300 border-emerald-500/30 px-2 sm:px-3 lg:px-4 py-1 sm:py-2 text-xs font-medium">
                                              {phrase}
                                            </Badge>
                                          ))}
                                        </div>
                                      </div>
                                    )}
                                  </CardContent>
                                </Card>
                              </div>
                            ) : (
                              <Card className="bg-slate-700/30 border-slate-600/50">
                                <CardContent className="text-center p-4 sm:p-6 lg:p-8 xl:p-12">
                                  <Brain className="h-12 w-12 sm:h-16 sm:w-16 lg:h-20 lg:w-20 mx-auto mb-3 sm:mb-4 lg:mb-6 text-slate-600" />
                                  <p className="text-slate-300 mb-2 text-sm sm:text-base lg:text-lg">No sentiment analysis available</p>
                                  <p className="text-slate-400 mb-4 sm:mb-6 lg:mb-8 text-xs sm:text-sm lg:text-base">Analyze this email to get AI-powered insights and emotional tone detection</p>
                                  <Button 
                                    onClick={() => analyzeSentiment(emailDetails.body)}
                                    className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white shadow-2xl hover:shadow-3xl transition-all duration-300 transform hover:scale-105 text-xs sm:text-sm lg:text-base"
                                    size={isMobile ? "default" : "lg"}
                                  >
                                    <Sparkles className="h-3 w-3 sm:h-4 sm:w-4 lg:h-5 lg:w-5 mr-1 sm:mr-2" />
                                    Analyze Sentiment
                                  </Button>
                                </CardContent>
                              </Card>
                            )}
                          </TabsContent>

                          {/* Reply Tab */}
                          <TabsContent value="reply" className="space-y-3 sm:space-y-4 lg:space-y-6 mt-3 sm:mt-4 lg:mt-6">
                            <Form {...replyForm}>
                              <form onSubmit={replyForm.handleSubmit(() => alert("Send Reply"))} className="space-y-3 sm:space-y-4 lg:space-y-6">
                                <FormField 
                                  control={replyForm.control} 
                                  name="tone" 
                                  render={({ field }) => (
                                    <FormItem>
                                      <FormLabel className="text-white font-medium text-xs sm:text-sm lg:text-base">Reply Tone</FormLabel>
                                      <FormControl>
                                        <Select 
                                          value={field.value} 
                                          onValueChange={(value) => {
                                            field.onChange(value);
                                            handleToneChange(value);
                                          }}
                                        >
                                          <SelectTrigger className="bg-slate-700/50 border-slate-600/50 focus:border-blue-500 text-white text-xs sm:text-sm lg:text-base">
                                            <SelectValue placeholder="Select tone" />
                                          </SelectTrigger>
                                          <SelectContent className="bg-slate-800 border-slate-600 text-white">
                                            <SelectItem value="professional" className="focus:bg-slate-700 text-xs sm:text-sm lg:text-base">Professional</SelectItem>
                                            <SelectItem value="friendly" className="focus:bg-slate-700 text-xs sm:text-sm lg:text-base">Friendly</SelectItem>
                                            <SelectItem value="formal" className="focus:bg-slate-700 text-xs sm:text-sm lg:text-base">Formal</SelectItem>
                                            <SelectItem value="casual" className="focus:bg-slate-700 text-xs sm:text-sm lg:text-base">Casual</SelectItem>
                                          </SelectContent>
                                        </Select>
                                      </FormControl>
                                    </FormItem>
                                  )} 
                                />

                                {/* Suggested Replies */}
                                {suggestedReplies.length > 0 && (
                                  <Card className="bg-gradient-to-br from-slate-700/50 to-slate-800/50 border-slate-600/50 shadow-2xl">
                                    <CardHeader className="p-3 sm:p-4 lg:p-6">
                                      <CardTitle className="flex items-center space-x-2 text-white text-sm sm:text-base lg:text-lg">
                                        <Lightbulb className="h-4 w-4 sm:h-5 sm:w-5 lg:h-6 lg:w-6 text-amber-400" />
                                        <span>AI Suggested Replies</span>
                                      </CardTitle>
                                      <CardDescription className="text-slate-400 text-xs sm:text-sm lg:text-base">
                                        Choose a suggested reply or write your own
                                      </CardDescription>
                                    </CardHeader>
                                    <CardContent className="space-y-2 sm:space-y-3 lg:space-y-4 p-3 sm:p-4 lg:p-6 pt-0">
                                      {suggestedReplies.map((reply, index) => (
                                        <div key={index} className="p-2 sm:p-3 lg:p-4 bg-slate-700/30 rounded-lg sm:rounded-xl border border-slate-600/50 space-y-1 sm:space-y-2 lg:space-y-3">
                                          <div className="flex justify-between items-start">
                                            <Badge className="bg-blue-500/20 text-blue-300 border-blue-500/30 text-xs">
                                              {reply.tone}
                                            </Badge>
                                            <div className="flex space-x-1 sm:space-x-2">
                                              <Button
                                                variant="ghost"
                                                size="sm"
                                                onClick={() => useSuggestedReply(reply.content)}
                                                className="h-6 sm:h-7 lg:h-8 px-2 sm:px-3 bg-blue-500/20 hover:bg-blue-500/30 text-blue-300 border-blue-500/30 text-xs"
                                              >
                                                <ArrowRight className="h-3 w-3 mr-1" />
                                                Use
                                              </Button>
                                              <Button
                                                variant="ghost"
                                                size="sm"
                                                onClick={() => copyToClipboard(reply.content)}
                                                className="h-6 sm:h-7 lg:h-8 px-2 sm:px-3 bg-slate-600/50 hover:bg-slate-600 text-slate-300 border-slate-500/50 text-xs"
                                              >
                                                <Copy className="h-3 w-3" />
                                              </Button>
                                            </div>
                                          </div>
                                          <p className="text-xs sm:text-sm text-slate-200 leading-relaxed">{reply.content}</p>
                                          <p className="text-xs text-slate-400 italic">
                                            <strong className="text-slate-300">Why this works:</strong> {reply.reasoning}
                                          </p>
                                        </div>
                                      ))}
                                    </CardContent>
                                  </Card>
                                )}

                                <FormField 
                                  control={replyForm.control} 
                                  name="content" 
                                  render={({ field }) => (
                                    <FormItem>
                                      <FormLabel className="text-white font-medium text-xs sm:text-sm lg:text-base">Reply Content</FormLabel>
                                      <FormControl>
                                        <Textarea 
                                          placeholder="Type your reply or use a suggested reply above..." 
                                          className="min-h-[100px] sm:min-h-[120px] lg:min-h-[150px] resize-vertical bg-slate-700/50 border-slate-600/50 focus:border-blue-500 text-white placeholder-slate-400 text-xs sm:text-sm lg:text-base" 
                                          {...field} 
                                        />
                                      </FormControl>
                                      <FormMessage />
                                    </FormItem>
                                  )} 
                                />

                                <div className="flex flex-col sm:flex-row gap-2 lg:gap-3 pt-1 sm:pt-2">
                                  <Button 
                                    type="submit" 
                                    className="flex items-center space-x-1 sm:space-x-2 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white shadow-2xl hover:shadow-3xl transition-all duration-300 transform hover:scale-105 flex-1 text-xs sm:text-sm lg:text-base"
                                    size={isMobile ? "default" : "lg"}
                                  >
                                    <Send className="h-3 w-3 sm:h-4 sm:w-4 lg:h-5 lg:w-5" /> 
                                    <span>Send Reply</span>
                                  </Button>
                                  <Button
                                    type="button"
                                    variant="outline"
                                    onClick={() => generateSuggestedReplies(emailDetails.body, replyForm.getValues("tone"))}
                                    disabled={generatingReply}
                                    className="flex items-center space-x-1 sm:space-x-2 border-slate-600/50 bg-slate-700/50 hover:bg-slate-600 text-slate-300 hover:text-white flex-1 text-xs sm:text-sm lg:text-base"
                                    size={isMobile ? "default" : "lg"}
                                  >
                                    {generatingReply ? (
                                      <>
                                        <Loader2 className="h-3 w-3 sm:h-4 sm:w-4 lg:h-5 lg:w-5 animate-spin mr-1 sm:mr-2" />
                                        <span>Generating...</span>
                                      </>
                                    ) : (
                                      <>
                                        <Zap className="h-3 w-3 sm:h-4 sm:w-4 lg:h-5 lg:w-5 mr-1 sm:mr-2" />
                                        <span>Suggest Reply</span>
                                      </>
                                    )}
                                  </Button>
                                </div>
                              </form>
                            </Form>
                          </TabsContent>
                        </Tabs>
                      </CardContent>
                    </Card>
                  </motion.div>
                ) : (
                  <motion.div
                    key="no-email"
                    initial="hidden"
                    animate="visible"
                    exit="hidden"
                    variants={fadeInVariants}
                  >
                    <Card className="bg-slate-800/50 backdrop-blur-xl border-slate-700/50 shadow-2xl rounded-2xl">
                      <CardContent className="flex items-center justify-center min-h-[300px] sm:min-h-[400px]">
                        <div className="text-center text-slate-400 space-y-4 sm:space-y-6">
                          <div className="bg-gradient-to-br from-slate-700 to-slate-800 p-4 sm:p-6 lg:p-8 rounded-2xl inline-block">
                            <Mail className="h-12 w-12 sm:h-16 sm:w-16 lg:h-20 lg:w-20 mx-auto text-slate-600" />
                          </div>
                          <div>
                            <p className="text-sm sm:text-base lg:text-lg xl:text-xl font-semibold text-slate-200 mb-1 sm:mb-2">Select an Email</p>
                            <p className="text-slate-400 text-xs sm:text-sm lg:text-base">Choose an email from your inbox to view details and AI-powered analysis</p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                )}
              </AnimatePresence>
             
            </div>
          )}
        </div>
      </div>
    </div>
  );
}