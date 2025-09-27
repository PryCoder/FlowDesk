import { motion } from 'framer-motion';
import { 
  Search, 
  Bell, 
  Plus, 
  MessageSquare, 
  Zap,
  Calendar,
  Mail,
  CheckSquare
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { useAppStore } from '@/stores/useAppStore';
import { cn } from '@/lib/utils';

const quickActions = [
  {
    title: 'New Task',
    icon: CheckSquare,
    variant: 'premium' as const,
    action: () => console.log('New Task')
  },
  {
    title: 'Schedule Meeting',
    icon: Calendar,
    variant: 'glass' as const,
    action: () => console.log('Schedule Meeting')
  },
  {
    title: 'Compose Email',
    icon: Mail,
    variant: 'glass' as const,
    action: () => console.log('Compose Email')
  }
];

export const Header = () => {
  const { user, notifications } = useAppStore();
  const unreadCount = notifications.filter(n => !n.read).length;

  return (
    <motion.header
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="glass-card border-b border-glass-border/30 backdrop-blur-xl"
    >
      <div className="flex items-center justify-between p-4 lg:px-6">
        {/* Search */}
        <div className="flex-1 max-w-md">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search anything..."
              className="pl-10 glass-card border-glass-border/50 focus:border-primary/50 focus:ring-primary/20 font-jakarta"
            />
          </div>
        </div>

        {/* Quick Actions */}
        <div className="hidden lg:flex items-center space-x-3 mx-6">
          {quickActions.map((action, index) => (
            <motion.div
              key={action.title}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.3, delay: index * 0.1 }}
            >
              <Button
                variant={action.variant}
                size="sm"
                onClick={action.action}
                className="group"
              >
                <action.icon className="w-4 h-4 mr-2 group-hover:scale-110 transition-transform duration-200" />
                {action.title}
              </Button>
            </motion.div>
          ))}
        </div>

        {/* Right Section */}
        <div className="flex items-center space-x-4">
          {/* AI Chat */}
          <Button variant="glass" size="icon" className="relative group">
            <MessageSquare className="w-5 h-5 group-hover:scale-110 transition-transform duration-200" />
            <div className="absolute -top-1 -right-1 w-3 h-3 bg-primary rounded-full animate-pulse"></div>
          </Button>

          {/* Notifications */}
          <Button variant="glass" size="icon" className="relative">
            <Bell className="w-5 h-5" />
            {unreadCount > 0 && (
              <Badge className="absolute -top-2 -right-2 min-w-[1.25rem] h-5 flex items-center justify-center bg-destructive text-destructive-foreground text-xs font-bold">
                {unreadCount > 9 ? '9+' : unreadCount}
              </Badge>
            )}
          </Button>

          {/* Quick Add */}
          <Button variant="premium" size="icon" className="lg:hidden">
            <Plus className="w-5 h-5" />
          </Button>

          {/* AI Assistant Indicator */}
          <div className="hidden lg:flex items-center space-x-2 px-3 py-2 glass-card rounded-xl border-primary/20">
            <div className="w-2 h-2 bg-success rounded-full animate-pulse"></div>
            <span className="text-sm font-jakarta font-medium text-muted-foreground">
              AI Active
            </span>
            <Zap className="w-4 h-4 text-primary" />
          </div>

          {/* User Menu */}
          <Button variant="ghost" className="flex items-center space-x-2 p-2">
            <img
              src={user?.avatar}
              alt={user?.name}
              className="w-8 h-8 rounded-lg object-cover"
            />
            <div className="hidden lg:block text-left">
              <p className="font-jakarta font-semibold text-sm">
                {user?.name.split(' ')[0]}
              </p>
              <p className="text-xs text-muted-foreground">
                {user?.department}
              </p>
            </div>
          </Button>
        </div>
      </div>
    </motion.header>
  );
};