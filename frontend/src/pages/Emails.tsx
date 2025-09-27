import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Mail, 
  Search, 
  Filter, 
  Star, 
  Archive, 
  Trash2, 
  Reply, 
  Forward, 
  MoreHorizontal,
  Paperclip,
  Flag,
  Clock,
  User,
  Bot,
  Sparkles,
  Send,
  Plus,
  RefreshCw,
  AlertCircle,
  CheckCircle2,
  Smile,
  Frown,
  Meh
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { useAppStore } from '@/stores/useAppStore';
import { cn } from '@/lib/utils';

const priorityColors = {
  urgent: 'bg-destructive/20 text-destructive border-destructive/30',
  high: 'bg-warning/20 text-warning border-warning/30',
  medium: 'bg-primary/20 text-primary border-primary/30',
  low: 'bg-muted/40 text-muted-foreground border-muted/60'
};

const sentimentIcons = {
  positive: { icon: Smile, color: 'text-success' },
  neutral: { icon: Meh, color: 'text-muted-foreground' },
  negative: { icon: Frown, color: 'text-destructive' }
};

export default function Emails() {
  const { emails, updateEmail } = useAppStore();
  const [selectedTab, setSelectedTab] = useState('inbox');
  const [selectedEmail, setSelectedEmail] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [showCompose, setShowCompose] = useState(false);
  const [replyText, setReplyText] = useState('');

  const getEmailsByStatus = (status: string) => {
    switch (status) {
      case 'inbox':
        return emails.filter(email => email.status !== 'archived');
      case 'urgent':
        return emails.filter(email => email.priority === 'urgent');
      case 'followup':
        return emails.filter(email => email.priority === 'high' || email.priority === 'medium');
      case 'archived':
        return emails.filter(email => email.status === 'archived');
      default:
        return emails;
    }
  };

  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 3600));
    
    if (diffHours < 1) {
      return 'Just now';
    } else if (diffHours < 24) {
      return `${diffHours}h ago`;
    } else if (diffHours < 48) {
      return 'Yesterday';
    } else {
      return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    }
  };

  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase();
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.05
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 }
  };

  const tabCounts = {
    inbox: getEmailsByStatus('inbox').length,
    urgent: getEmailsByStatus('urgent').length,
    followup: getEmailsByStatus('followup').length,
    archived: getEmailsByStatus('archived').length
  };

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
                Emails
              </h1>
              <p className="text-muted-foreground font-satoshi mt-2">
                AI-powered smart inbox with priority sorting
              </p>
            </div>
            <div className="flex items-center space-x-3">
              <Button variant="glass">
                <RefreshCw className="w-4 h-4 mr-2" />
                Sync
              </Button>
              <Button variant="premium" onClick={() => setShowCompose(!showCompose)}>
                <Plus className="w-4 h-4 mr-2" />
                Compose
              </Button>
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { label: 'Unread', value: emails.filter(e => e.status === 'unread').length, color: 'text-primary' },
              { label: 'Urgent', value: tabCounts.urgent, color: 'text-destructive' },
              { label: 'This Week', value: emails.filter(e => new Date(e.timestamp) > new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)).length, color: 'text-success' },
              { label: 'Response Rate', value: '94%', color: 'text-accent-orange' }
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

          {/* Search */}
          <div className="flex flex-col lg:flex-row gap-4">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search emails..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 glass-card border-glass-border/50 focus:border-primary/50"
              />
            </div>
            <Button variant="glass" size="icon">
              <Filter className="w-4 h-4" />
            </Button>
          </div>
        </motion.div>

        <div className="grid grid-cols-1 xl:grid-cols-4 gap-8">
          {/* Main Content */}
          <div className="xl:col-span-3">
            <Tabs value={selectedTab} onValueChange={setSelectedTab}>
              <TabsList className="glass-card border-glass-border/50 mb-6">
                <TabsTrigger value="inbox" className="font-jakarta">
                  Inbox ({tabCounts.inbox})
                </TabsTrigger>
                <TabsTrigger value="urgent" className="font-jakarta">
                  Urgent ({tabCounts.urgent})
                </TabsTrigger>
                <TabsTrigger value="followup" className="font-jakarta">
                  Follow-up ({tabCounts.followup})
                </TabsTrigger>
                <TabsTrigger value="archived" className="font-jakarta">
                  Archived ({tabCounts.archived})
                </TabsTrigger>
              </TabsList>

              {/* Email List */}
              <div className="space-y-2">
                <AnimatePresence>
                  {getEmailsByStatus(selectedTab).map((email, index) => {
                    const SentimentIcon = sentimentIcons[email.sentiment]?.icon || Meh;
                    const sentimentColor = sentimentIcons[email.sentiment]?.color || 'text-muted-foreground';
                    
                    return (
                      <motion.div
                        key={email.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        transition={{ duration: 0.3, delay: index * 0.05 }}
                        whileHover={{ scale: 1.01 }}
                        className="cursor-pointer"
                        onClick={() => setSelectedEmail(selectedEmail === email.id ? null : email.id)}
                      >
                        <Card className={cn(
                          "glass-card glass-hover border-glass-border/50 transition-all duration-200",
                          email.status === 'unread' && "border-primary/30",
                          selectedEmail === email.id && "border-primary/50 shadow-glow"
                        )}>
                          <CardContent className="p-4">
                            <div className="flex items-center space-x-4">
                              {/* Avatar */}
                              <div className="w-10 h-10 rounded-xl bg-primary/20 flex items-center justify-center shrink-0">
                                <span className="text-sm font-jakarta font-semibold text-primary">
                                  {getInitials(email.from.split('@')[0])}
                                </span>
                              </div>

                              {/* Email Preview */}
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center justify-between mb-1">
                                  <div className="flex items-center space-x-2">
                                    <p className={cn(
                                      "font-jakarta font-semibold truncate",
                                      email.status === 'unread' ? "text-foreground" : "text-muted-foreground"
                                    )}>
                                      {email.from.split('@')[0]}
                                    </p>
                                    <Badge className={cn("text-xs", priorityColors[email.priority])}>
                                      {email.priority}
                                    </Badge>
                                    {email.sentiment && (
                                      <SentimentIcon className={cn("w-4 h-4", sentimentColor)} />
                                    )}
                                  </div>
                                  <div className="flex items-center space-x-2">
                                    <span className="text-xs text-muted-foreground font-jakarta">
                                      {formatTime(email.timestamp)}
                                    </span>
                                    {email.status === 'unread' && (
                                      <div className="w-2 h-2 bg-primary rounded-full"></div>
                                    )}
                                  </div>
                                </div>
                                
                                <h4 className={cn(
                                  "font-jakarta mb-1 truncate",
                                  email.status === 'unread' ? "font-semibold" : "font-medium text-muted-foreground"
                                )}>
                                  {email.subject}
                                </h4>
                                
                                <p className="text-sm text-muted-foreground line-clamp-2">
                                  {email.body}
                                </p>

                                {/* Attachments & Actions */}
                                <div className="flex items-center justify-between mt-3">
                                  <div className="flex items-center space-x-2">
                                    {email.attachments && email.attachments.length > 0 && (
                                      <div className="flex items-center space-x-1 text-xs text-muted-foreground">
                                        <Paperclip className="w-3 h-3" />
                                        <span>{email.attachments.length}</span>
                                      </div>
                                    )}
                                    {email.priority === 'urgent' && (
                                      <AlertCircle className="w-4 h-4 text-destructive" />
                                    )}
                                  </div>
                                  
                                  <div className="flex items-center space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <Button variant="ghost" size="icon-sm">
                                      <Star className="w-3 h-3" />
                                    </Button>
                                    <Button variant="ghost" size="icon-sm">
                                      <Archive className="w-3 h-3" />
                                    </Button>
                                    <Button variant="ghost" size="icon-sm">
                                      <Trash2 className="w-3 h-3" />
                                    </Button>
                                  </div>
                                </div>
                              </div>
                            </div>

                            {/* Expanded Email View */}
                            <AnimatePresence>
                              {selectedEmail === email.id && (
                                <motion.div
                                  initial={{ opacity: 0, height: 0 }}
                                  animate={{ opacity: 1, height: 'auto' }}
                                  exit={{ opacity: 0, height: 0 }}
                                  transition={{ duration: 0.3 }}
                                  className="mt-4 pt-4 border-t border-glass-border/30"
                                >
                                  <div className="space-y-4">
                                    {/* Email Body */}
                                    <div className="p-4 glass-card rounded-xl">
                                      <p className="text-sm leading-relaxed whitespace-pre-wrap">
                                        {email.body}
                                      </p>
                                    </div>

                                    {/* Action Buttons */}
                                    <div className="flex items-center space-x-3">
                                      <Button variant="premium" size="sm">
                                        <Reply className="w-3 h-3 mr-2" />
                                        Reply
                                      </Button>
                                      <Button variant="glass" size="sm">
                                        <Forward className="w-3 h-3 mr-2" />
                                        Forward
                                      </Button>
                                      <Button variant="glass" size="sm">
                                        <Bot className="w-3 h-3 mr-2" />
                                        AI Reply
                                      </Button>
                                    </div>

                                    {/* Quick Reply */}
                                    <div className="space-y-3">
                                      <Textarea
                                        placeholder="Type your reply..."
                                        value={replyText}
                                        onChange={(e) => setReplyText(e.target.value)}
                                        className="glass-card border-glass-border/50 focus:border-primary/50 min-h-[100px]"
                                      />
                                      <div className="flex items-center justify-between">
                                        <div className="flex items-center space-x-2">
                                          <Button variant="glass" size="sm">
                                            <Bot className="w-3 h-3 mr-2" />
                                            AI Suggest
                                          </Button>
                                          <Button variant="glass" size="sm">
                                            <Paperclip className="w-3 h-3" />
                                          </Button>
                                        </div>
                                        <Button variant="premium" size="sm">
                                          <Send className="w-3 h-3 mr-2" />
                                          Send Reply
                                        </Button>
                                      </div>
                                    </div>
                                  </div>
                                </motion.div>
                              )}
                            </AnimatePresence>
                          </CardContent>
                        </Card>
                      </motion.div>
                    );
                  })}
                </AnimatePresence>
              </div>
            </Tabs>
          </div>

          {/* AI Assistant Sidebar */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
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
                    <CardTitle className="text-sm font-jakarta">AI Email Assistant</CardTitle>
                    <CardDescription className="text-xs">Smart email management</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <Button variant="glass" className="w-full justify-start text-xs">
                    <Sparkles className="w-3 h-3 mr-2" />
                    Smart Compose
                  </Button>
                  <Button variant="glass" className="w-full justify-start text-xs">
                    <Bot className="w-3 h-3 mr-2" />
                    Auto Reply
                  </Button>
                  <Button variant="glass" className="w-full justify-start text-xs">
                    <Flag className="w-3 h-3 mr-2" />
                    Priority Sort
                  </Button>
                </div>
              </CardContent>
            </Card>

            <Card className="glass-card border-glass-border/50 backdrop-blur-xl">
              <CardHeader>
                <CardTitle className="text-sm font-jakarta">Email Analytics</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-xs text-muted-foreground">Response Time</span>
                    <span className="text-sm font-space-grotesk font-bold text-success">2.3h</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-xs text-muted-foreground">Open Rate</span>
                    <span className="text-sm font-space-grotesk font-bold">87%</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-xs text-muted-foreground">Sentiment</span>
                    <div className="flex items-center space-x-1">
                      <Smile className="w-3 h-3 text-success" />
                      <span className="text-sm font-space-grotesk font-bold">Positive</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Quick Templates */}
            <Card className="glass-card border-glass-border/50 backdrop-blur-xl">
              <CardHeader>
                <CardTitle className="text-sm font-jakarta">Quick Templates</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {[
                  'Meeting Follow-up',
                  'Thank You Note',
                  'Status Update',
                  'Project Proposal'
                ].map((template) => (
                  <Button key={template} variant="glass" size="sm" className="w-full justify-start text-xs">
                    {template}
                  </Button>
                ))}
              </CardContent>
            </Card>
          </motion.div>
        </div>

        {/* Compose Modal */}
        <AnimatePresence>
          {showCompose && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center p-4"
              onClick={() => setShowCompose(false)}
            >
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                onClick={(e) => e.stopPropagation()}
                className="w-full max-w-2xl"
              >
                <Card className="glass-card border-glass-border/50 backdrop-blur-xl">
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle className="font-jakarta">Compose Email</CardTitle>
                      <Button variant="ghost" size="icon-sm" onClick={() => setShowCompose(false)}>
                        ✕
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <Input placeholder="To:" className="glass-card border-glass-border/50" />
                    <Input placeholder="Subject:" className="glass-card border-glass-border/50" />
                    <Textarea 
                      placeholder="Your message..." 
                      className="glass-card border-glass-border/50 min-h-[200px]"
                    />
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <Button variant="glass" size="sm">
                          <Bot className="w-3 h-3 mr-2" />
                          AI Assist
                        </Button>
                        <Button variant="glass" size="sm">
                          <Paperclip className="w-3 h-3" />
                        </Button>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Button variant="glass">Cancel</Button>
                        <Button variant="premium">
                          <Send className="w-4 h-4 mr-2" />
                          Send
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
}