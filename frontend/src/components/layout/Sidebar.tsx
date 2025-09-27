import { motion, AnimatePresence } from 'framer-motion';
import { NavLink, useLocation } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Calendar, 
  Mail, 
  CheckSquare, 
  BarChart3, 
  Heart, 
  Menu,
  Bot,
  Sparkles,
  User,
  Settings,
  LogOut
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAppStore } from '@/stores/useAppStore';
import { cn } from '@/lib/utils';

const navigationItems = [
  {
    title: 'Dashboard',
    url: '/',
    icon: LayoutDashboard,
    description: 'Overview & insights'
  },
  {
    title: 'Meetings',
    url: '/meetings',
    icon: Calendar,
    description: 'Schedule & join'
  },
  {
    title: 'Emails',
    url: '/emails',
    icon: Mail,
    description: 'Smart inbox'
  },
  {
    title: 'Tasks',
    url: '/tasks',
    icon: CheckSquare,
    description: 'Project management'
  },
  {
    title: 'Analytics',
    url: '/analytics',
    icon: BarChart3,
    description: 'Performance metrics'
  },
  {
    title: 'Wellness',
    url: '/wellness',
    icon: Heart,
    description: 'Health & balance'
  }
];

const bottomItems = [
  {
    title: 'Profile',
    url: '/profile',
    icon: User,
    description: 'Your account'
  },
  {
    title: 'Settings',
    url: '/settings',
    icon: Settings,
    description: 'Preferences'
  }
];

export const Sidebar = () => {
  const { sidebarCollapsed, setSidebarCollapsed, user } = useAppStore();
  const location = useLocation();

  const isActive = (path: string) => {
    if (path === '/') return location.pathname === '/';
    return location.pathname.startsWith(path);
  };

  const sidebarVariants = {
    expanded: { width: '280px' },
    collapsed: { width: '80px' }
  };

  const itemVariants = {
    expanded: { 
      opacity: 1, 
      x: 0,
      transition: { duration: 0.2, delay: 0.1 }
    },
    collapsed: { 
      opacity: 0, 
      x: -10,
      transition: { duration: 0.2 }
    }
  };

  return (
    <motion.aside
      initial={false}
      animate={sidebarCollapsed ? 'collapsed' : 'expanded'}
      variants={sidebarVariants}
      transition={{ duration: 0.3, ease: 'easeInOut' }}
      className="relative h-screen glass-card border-r border-glass-border/30 backdrop-blur-xl"
    >
      <div className="flex flex-col h-full p-4">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <AnimatePresence mode="wait">
            {!sidebarCollapsed && (
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.2 }}
                className="flex items-center space-x-3"
              >
                <div className="p-2 gradient-primary rounded-xl">
                  <Bot className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h1 className="font-clash font-bold text-lg gradient-text">
                    AI Assistant
                  </h1>
                  <p className="text-xs text-muted-foreground font-jakarta">
                    Ultimate Edition
                  </p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
          
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
            className="shrink-0"
          >
            <Menu className="w-5 h-5" />
          </Button>
        </div>

        {/* User Profile */}
        <div className="mb-6">
          <div className="flex items-center space-x-3 p-3 glass-card rounded-xl">
            <div className="relative">
              <img
                src={user?.avatar}
                alt={user?.name}
                className="w-10 h-10 rounded-xl object-cover"
              />
              <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-success rounded-full border-2 border-background"></div>
            </div>
            <AnimatePresence mode="wait">
              {!sidebarCollapsed && (
                <motion.div
                  variants={itemVariants}
                  initial="collapsed"
                  animate="expanded"
                  exit="collapsed"
                  className="flex-1 min-w-0"
                >
                  <p className="font-jakarta font-semibold text-sm truncate">
                    {user?.name}
                  </p>
                  <p className="text-xs text-muted-foreground truncate">
                    {user?.role}
                  </p>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 space-y-2">
          {navigationItems.map((item, index) => {
            const active = isActive(item.url);
            return (
              <motion.div
                key={item.url}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: index * 0.05 }}
              >
                <NavLink
                  to={item.url}
                  className={cn(
                    "flex items-center space-x-3 px-3 py-3 rounded-xl transition-all duration-200 group relative overflow-hidden",
                    active
                      ? "gradient-primary text-white shadow-glow"
                      : "hover:bg-glass-hover text-muted-foreground hover:text-foreground"
                  )}
                >
                  {active && (
                    <motion.div
                      layoutId="activeBackground"
                      className="absolute inset-0 gradient-primary rounded-xl"
                      initial={false}
                      transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                    />
                  )}
                  
                  <div className="relative z-10 flex items-center space-x-3 w-full">
                    <item.icon className={cn(
                      "w-5 h-5 shrink-0 transition-transform duration-200",
                      active ? "scale-110" : "group-hover:scale-105"
                    )} />
                    
                    <AnimatePresence mode="wait">
                      {!sidebarCollapsed && (
                        <motion.div
                          variants={itemVariants}
                          initial="collapsed"
                          animate="expanded"
                          exit="collapsed"
                          className="flex-1"
                        >
                          <p className="font-jakarta font-medium text-sm">
                            {item.title}
                          </p>
                          <p className={cn(
                            "text-xs mt-0.5",
                            active ? "text-white/80" : "text-muted-foreground"
                          )}>
                            {item.description}
                          </p>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                </NavLink>
              </motion.div>
            );
          })}
        </nav>

        {/* AI Assistant Quick Actions */}
        <div className="mb-4">
          <AnimatePresence mode="wait">
            {!sidebarCollapsed && (
              <motion.div
                variants={itemVariants}
                initial="collapsed"
                animate="expanded"
                exit="collapsed"
                className="p-4 glass-card rounded-xl border-primary/20"
              >
                <div className="flex items-center space-x-2 mb-3">
                  <Sparkles className="w-4 h-4 text-primary" />
                  <p className="font-jakarta font-semibold text-sm">
                    AI Quick Actions
                  </p>
                </div>
                <div className="space-y-2">
                  <Button variant="ghost" size="sm" className="w-full justify-start text-xs">
                    <Bot className="w-3 h-3 mr-2" />
                    Daily Briefing
                  </Button>
                  <Button variant="ghost" size="sm" className="w-full justify-start text-xs">
                    <Sparkles className="w-3 h-3 mr-2" />
                    Smart Suggestions
                  </Button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Bottom Navigation */}
        <div className="space-y-2">
          {bottomItems.map((item) => {
            const active = isActive(item.url);
            return (
              <NavLink
                key={item.url}
                to={item.url}
                className={cn(
                  "flex items-center space-x-3 px-3 py-2 rounded-xl transition-all duration-200",
                  active
                    ? "bg-glass-hover text-primary"
                    : "hover:bg-glass-hover text-muted-foreground hover:text-foreground"
                )}
              >
                <item.icon className="w-5 h-5 shrink-0" />
                <AnimatePresence mode="wait">
                  {!sidebarCollapsed && (
                    <motion.span
                      variants={itemVariants}
                      initial="collapsed"
                      animate="expanded"
                      exit="collapsed"
                      className="font-jakarta font-medium text-sm"
                    >
                      {item.title}
                    </motion.span>
                  )}
                </AnimatePresence>
              </NavLink>
            );
          })}
          
          <Button
            variant="ghost"
            className={cn(
              "w-full justify-start text-muted-foreground hover:text-foreground",
              sidebarCollapsed ? "px-3" : "px-3"
            )}
          >
            <LogOut className="w-5 h-5 shrink-0" />
            <AnimatePresence mode="wait">
              {!sidebarCollapsed && (
                <motion.span
                  variants={itemVariants}
                  initial="collapsed"
                  animate="expanded"
                  exit="collapsed"
                  className="font-jakarta font-medium text-sm ml-3"
                >
                  Sign Out
                </motion.span>
              )}
            </AnimatePresence>
          </Button>
        </div>
      </div>
    </motion.aside>
  );
};