import { motion, AnimatePresence } from 'framer-motion';
import { 
  Search, 
  Bell, 
  Plus, 
  MessageSquare, 
  Zap,
  Calendar,
  Mail,
  CheckSquare,
  Menu
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { useAppStore } from '@/stores/useAppStore';
import { cn } from '@/lib/utils';
import { useState, useEffect } from 'react';

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
  const { user, notifications, setSidebarCollapsed } = useAppStore();
  const unreadCount = notifications.filter(n => !n.read).length;
  const [isMobile, setIsMobile] = useState(false);
  const [showMobileActions, setShowMobileActions] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 1024);
    };

    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  return (
    <motion.header
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="bg-slate-900/95 backdrop-blur-xl border-b border-slate-700/50 sticky top-0 z-40"
    >
      <div className="flex items-center justify-between p-4 lg:px-6">
        {/* Mobile Menu Button */}
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setSidebarCollapsed?.(false)}
          className="lg:hidden mr-2 hover:bg-slate-800/50"
        >
          <Menu className="w-5 h-5 text-slate-300" />
        </Button>

        {/* Search - Full width on mobile, constrained on desktop */}
        <div className={cn(
          "flex-1",
          isMobile ? "max-w-full" : "max-w-md"
        )}>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400" />
            <Input
              placeholder="Search anything..."
              className="pl-10 bg-slate-800/50 border-slate-600/50 focus:border-blue-500 text-white placeholder-slate-400 w-full"
            />
          </div>
        </div>

        {/* Quick Actions - Hidden on mobile, visible on desktop */}
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
                className="group bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white border-0"
              >
                <action.icon className="w-4 h-4 mr-2 group-hover:scale-110 transition-transform duration-200" />
                {action.title}
              </Button>
            </motion.div>
          ))}
        </div>

        {/* Right Section */}
        <div className="flex items-center space-x-2 lg:space-x-4 ml-2 lg:ml-0">
          {/* Mobile Quick Actions Toggle */}
          {isMobile && (
            <Button 
              variant="ghost" 
              size="icon"
              onClick={() => setShowMobileActions(!showMobileActions)}
              className="hover:bg-slate-800/50"
            >
              <Plus className="w-5 h-5 text-slate-300" />
            </Button>
          )}

          {/* AI Chat */}
          <Button 
            variant="ghost" 
            size="icon" 
            className="relative group hover:bg-slate-800/50"
          >
            <MessageSquare className="w-5 h-5 text-slate-300 group-hover:text-blue-400 transition-colors duration-200" />
            <div className="absolute -top-1 -right-1 w-3 h-3 bg-blue-500 rounded-full animate-pulse"></div>
          </Button>

          {/* Notifications */}
          <Button 
            variant="ghost" 
            size="icon" 
            className="relative hover:bg-slate-800/50"
          >
            <Bell className="w-5 h-5 text-slate-300" />
            {unreadCount > 0 && (
              <Badge className="absolute -top-2 -right-2 min-w-[1.25rem] h-5 flex items-center justify-center bg-red-500 text-white text-xs font-bold border-0">
                {unreadCount > 9 ? '9+' : unreadCount}
              </Badge>
            )}
          </Button>

          {/* AI Assistant Indicator - Hidden on mobile */}
          <div className="hidden lg:flex items-center space-x-2 px-3 py-2 bg-slate-800/50 rounded-xl border border-blue-500/20">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
            <span className="text-sm font-medium text-slate-300">
              AI Active
            </span>
            <Zap className="w-4 h-4 text-blue-400" />
          </div>

          {/* User Menu */}
          <Button 
            variant="ghost" 
            className="flex items-center space-x-2 p-1 lg:p-2 hover:bg-slate-800/50 min-w-0"
          >
            <img
              src={user?.avatar || '/default-avatar.png'}
              alt={user?.name}
              className="w-8 h-8 rounded-lg object-cover border border-slate-600"
            />
            <div className="hidden lg:block text-left min-w-0">
              <p className="font-semibold text-sm text-white truncate max-w-[120px]">
                {user?.name?.split(' ')[0] || 'User'}
              </p>
              <p className="text-xs text-slate-400 truncate max-w-[120px]">
                {user?.department || 'Admin'}
              </p>
            </div>
          </Button>
        </div>
      </div>

      {/* Mobile Quick Actions Dropdown */}
      <AnimatePresence>
        {isMobile && showMobileActions && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2 }}
            className="lg:hidden border-t border-slate-700/50 bg-slate-800/95 backdrop-blur-xl"
          >
            <div className="p-3 grid grid-cols-3 gap-2">
              {quickActions.map((action, index) => (
                <motion.div
                  key={action.title}
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.2, delay: index * 0.1 }}
                >
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      action.action();
                      setShowMobileActions(false);
                    }}
                    className="w-full h-12 flex-col space-y-1 bg-slate-700/50 hover:bg-slate-600/50 text-slate-300 hover:text-white border-0"
                  >
                    <action.icon className="w-4 h-4" />
                    <span className="text-xs font-medium">{action.title}</span>
                  </Button>
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Mobile AI Assistant Indicator */}
      {isMobile && (
        <div className="lg:hidden border-t border-slate-700/50 bg-slate-800/95 backdrop-blur-xl">
          <div className="px-4 py-2 flex items-center justify-center space-x-2">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
            <span className="text-sm font-medium text-slate-300">
              AI Assistant Active
            </span>
            <Zap className="w-4 h-4 text-blue-400" />
          </div>
        </div>
      )}
    </motion.header>
  );
};