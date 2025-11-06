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
  LogOut,
  X,
  ChevronLeft,
  Zap,
  Target,
  Coffee
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAppStore } from '@/stores/useAppStore';
import { cn } from '@/lib/utils';
import { useEffect, useState } from 'react';

const navigationItems = [
  {
    title: 'Dashboard',
    url: '/',
    icon: LayoutDashboard,
    description: 'Overview & insights',
    gradient: 'from-blue-500 to-cyan-500'
  },
  {
    title: 'Meetings',
    url: '/meetings',
    icon: Calendar,
    description: 'Schedule & join',
    gradient: 'from-green-500 to-emerald-500'
  },
  {
    title: 'Emails',
    url: '/emails',
    icon: Mail,
    description: 'Smart inbox',
    gradient: 'from-purple-500 to-pink-500'
  },
  {
    title: 'Tasks',
    url: '/tasks',
    icon: CheckSquare,
    description: 'Project management',
    gradient: 'from-orange-500 to-red-500'
  },
  {
    title: 'Analytics',
    url: '/analytics',
    icon: BarChart3,
    description: 'Performance metrics',
    gradient: 'from-indigo-500 to-blue-500'
  },
  {
    title: 'Wellness',
    url: '/wellness',
    icon: Heart,
    description: 'Health & balance',
    gradient: 'from-rose-500 to-pink-500'
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

const quickActions = [
  {
    title: 'Daily Briefing',
    icon: Bot,
    description: 'AI-powered insights',
    color: 'text-blue-400'
  },
  {
    title: 'Smart Suggestions',
    icon: Sparkles,
    description: 'Optimized workflows',
    color: 'text-purple-400'
  },
  {
    title: 'Quick Tasks',
    icon: Zap,
    description: 'Priority actions',
    color: 'text-amber-400'
  }
];

export const Sidebar = () => {
  const { sidebarCollapsed, setSidebarCollapsed, user } = useAppStore();
  const location = useLocation();
  const [isMobile, setIsMobile] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [hoveredItem, setHoveredItem] = useState<string | null>(null);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
      if (window.innerWidth >= 768) {
        setMobileMenuOpen(false);
      }
    };

    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const isActive = (path: string) => {
    if (path === '/') return location.pathname === '/';
    return location.pathname.startsWith(path);
  };

  // Animation variants
  const sidebarVariants = {
    expanded: { 
      width: '280px',
      transition: { 
        type: "spring", 
        bounce: 0.1,
        duration: 0.5
      }
    },
    collapsed: { 
      width: '80px',
      transition: { 
        type: "spring", 
        bounce: 0.1,
        duration: 0.5
      }
    },
    mobileHidden: { 
      x: '-100%',
      opacity: 0,
      transition: { 
        type: "spring", 
        bounce: 0.1,
        duration: 0.4
      }
    },
    mobileVisible: { 
      x: 0,
      opacity: 1,
      transition: { 
        type: "spring", 
        bounce: 0.1,
        duration: 0.4
      }
    }
  };

  const mobileBottomBarVariants = {
    hidden: { 
      y: 100, 
      opacity: 0,
      transition: { duration: 0.3, ease: "easeInOut" }
    },
    visible: { 
      y: 0, 
      opacity: 1,
      transition: { duration: 0.3, ease: "easeOut" }
    }
  };

  const itemContentVariants = {
    expanded: { 
      opacity: 1, 
      x: 0,
      transition: { duration: 0.2, ease: "easeOut" }
    },
    collapsed: { 
      opacity: 0, 
      x: -10,
      transition: { duration: 0.15, ease: "easeIn" }
    }
  };

  const mobileMenuVariants = {
    closed: {
      height: 0,
      opacity: 0,
      transition: {
        duration: 0.25,
        ease: "easeInOut"
      }
    },
    open: {
      height: "auto",
      opacity: 1,
      transition: {
        duration: 0.3,
        ease: "easeOut"
      }
    }
  };

  const staggerVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: (i: number) => ({
      opacity: 1,
      y: 0,
      transition: {
        delay: i * 0.05,
        duration: 0.4,
        ease: "easeOut"
      }
    })
  };

  const hoverGlowVariants = {
    rest: {
      scale: 1,
      opacity: 0,
      transition: { duration: 0.2 }
    },
    hover: {
      scale: 1.02,
      opacity: 1,
      transition: { duration: 0.2 }
    }
  };

  // Mobile Bottom Navigation Item
  const MobileNavItem = ({ item }: { item: any }) => {
    const active = isActive(item.url);
    return (
      <motion.div
        whileTap={{ scale: 0.95 }}
        transition={{ duration: 0.1 }}
      >
        <NavLink
          to={item.url}
          onClick={() => setMobileMenuOpen(false)}
          className={cn(
            "flex flex-col items-center space-y-1 p-2 rounded-xl transition-all duration-200 flex-1 min-w-0 relative overflow-hidden group",
            active
              ? "bg-gradient-to-br from-blue-600 to-purple-600 text-white shadow-lg"
              : "text-slate-400 hover:text-white hover:bg-slate-800/50"
          )}
        >
          {active && (
            <motion.div
              layoutId="mobileActiveGlow"
              className="absolute inset-0 bg-gradient-to-br from-blue-600 to-purple-600 rounded-xl"
              initial={false}
              transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
            />
          )}
          
          <item.icon className={cn(
            "w-5 h-5 relative z-10 transition-transform duration-200",
            active ? "scale-110" : "group-hover:scale-105"
          )} />
          <span className="text-xs font-medium truncate max-w-[60px] relative z-10">
            {item.title}
          </span>
        </NavLink>
      </motion.div>
    );
  };

  // Desktop Sidebar
  if (!isMobile) {
    return (
      <motion.aside
        initial={false}
        animate={sidebarCollapsed ? 'collapsed' : 'expanded'}
        variants={sidebarVariants}
        className="relative h-screen bg-slate-900/95 backdrop-blur-xl border-r border-slate-700/50 shadow-2xl"
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
                  transition={{ duration: 0.3, ease: "easeOut" }}
                  className="flex items-center space-x-3"
                >
                  <motion.div 
                    className="p-2 bg-gradient-to-br from-blue-600 to-purple-600 rounded-xl shadow-lg"
                    whileHover={{ scale: 1.05, rotate: 5 }}
                    transition={{ type: "spring", stiffness: 400, damping: 10 }}
                  >
                    <Bot className="w-6 h-6 text-white" />
                  </motion.div>
                  <div>
                    <motion.h1 
                      className="font-bold text-lg bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent"
                      whileHover={{ scale: 1.02 }}
                    >
                      AI Assistant
                    </motion.h1>
                    <p className="text-xs text-slate-400">
                      Ultimate Edition
                    </p>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
            
            <motion.div
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
            >
              <Button
                variant="ghost"
                size="icon-sm"
                onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
                className="shrink-0 hover:bg-slate-800/50 border border-slate-700/50"
              >
                <motion.div
                  animate={{ rotate: sidebarCollapsed ? 180 : 0 }}
                  transition={{ duration: 0.3, ease: "easeInOut" }}
                >
                  <ChevronLeft className="w-4 h-4 text-slate-300" />
                </motion.div>
              </Button>
            </motion.div>
          </div>

          {/* User Profile */}
          <motion.div 
            className="mb-6"
            layout
            transition={{ duration: 0.3 }}
          >
            <div className="flex items-center space-x-3 p-3 bg-slate-800/50 rounded-xl border border-slate-700/50 backdrop-blur-sm">
              <motion.div 
                className="relative"
                whileHover={{ scale: 1.05 }}
                transition={{ type: "spring", stiffness: 400, damping: 10 }}
              >
                <img
                  src={user?.avatar || '/default-avatar.png'}
                  alt={user?.name}
                  className="w-10 h-10 rounded-xl object-cover border-2 border-slate-600"
                />
                <motion.div 
                  className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 rounded-full border-2 border-slate-900"
                  animate={{ scale: [1, 1.2, 1] }}
                  transition={{ duration: 2, repeat: Infinity }}
                />
              </motion.div>
              <AnimatePresence mode="wait">
                {!sidebarCollapsed && (
                  <motion.div
                    variants={itemContentVariants}
                    initial="collapsed"
                    animate="expanded"
                    exit="collapsed"
                    className="flex-1 min-w-0"
                  >
                    <p className="font-semibold text-sm text-white truncate">
                      {user?.name || 'User'}
                    </p>
                    <p className="text-xs text-slate-400 truncate">
                      {user?.role || 'Admin'}
                    </p>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </motion.div>

          {/* Navigation */}
          <nav className="flex-1 space-y-1">
            {navigationItems.map((item, index) => {
              const active = isActive(item.url);
              return (
                <motion.div
                  key={item.url}
                  custom={index}
                  variants={staggerVariants}
                  initial="hidden"
                  animate="visible"
                  onHoverStart={() => setHoveredItem(item.url)}
                  onHoverEnd={() => setHoveredItem(null)}
                >
                  <NavLink
                    to={item.url}
                    className={cn(
                      "flex items-center space-x-3 px-3 py-3 rounded-xl transition-all duration-200 group relative overflow-hidden",
                      active
                        ? "text-white shadow-lg"
                        : "text-slate-400 hover:text-white hover:bg-slate-800/50"
                    )}
                  >
                    {/* Animated Background */}
                    {active && (
                      <motion.div
                        layoutId="activeBackground"
                        className={cn(
                          "absolute inset-0 rounded-xl bg-gradient-to-r",
                          item.gradient
                        )}
                        initial={false}
                        transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                      />
                    )}

                    {/* Hover Glow Effect */}
                    {hoveredItem === item.url && !active && (
                      <motion.div
                        variants={hoverGlowVariants}
                        initial="rest"
                        animate="hover"
                        className={cn(
                          "absolute inset-0 rounded-xl bg-gradient-to-r opacity-50",
                          item.gradient
                        )}
                      />
                    )}
                    
                    <div className="relative z-10 flex items-center space-x-3 w-full">
                      <motion.div
                        animate={{ 
                          scale: active ? 1.1 : 1,
                          rotate: active ? 5 : 0
                        }}
                        transition={{ type: "spring", stiffness: 400, damping: 10 }}
                      >
                        <item.icon className="w-5 h-5 shrink-0" />
                      </motion.div>
                      
                      <AnimatePresence mode="wait">
                        {!sidebarCollapsed && (
                          <motion.div
                            variants={itemContentVariants}
                            initial="collapsed"
                            animate="expanded"
                            exit="collapsed"
                            className="flex-1"
                          >
                            <p className="font-medium text-sm">
                              {item.title}
                            </p>
                            <motion.p 
                              className={cn(
                                "text-xs mt-0.5",
                                active ? "text-white/80" : "text-slate-500"
                              )}
                              initial={{ opacity: 0, y: 10 }}
                              animate={{ opacity: 1, y: 0 }}
                              transition={{ delay: 0.1 }}
                            >
                              {item.description}
                            </motion.p>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>

                    {/* Active Indicator */}
                    {active && (
                      <motion.div
                        className="absolute right-3 w-2 h-2 bg-white rounded-full"
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ delay: 0.2, type: "spring" }}
                      />
                    )}
                  </NavLink>
                </motion.div>
              );
            })}
          </nav>

          {/* AI Assistant Quick Actions */}
          <motion.div 
            className="mb-4"
            layout
            transition={{ duration: 0.3 }}
          >
            <AnimatePresence mode="wait">
              {!sidebarCollapsed && (
                <motion.div
                  variants={itemContentVariants}
                  initial="collapsed"
                  animate="expanded"
                  exit="collapsed"
                  className="p-4 bg-slate-800/50 rounded-xl border border-blue-500/20 backdrop-blur-sm"
                >
                  <div className="flex items-center space-x-2 mb-3">
                    <motion.div
                      animate={{ rotate: [0, 10, 0] }}
                      transition={{ duration: 2, repeat: Infinity }}
                    >
                      <Sparkles className="w-4 h-4 text-blue-400" />
                    </motion.div>
                    <p className="font-semibold text-sm text-white">
                      AI Quick Actions
                    </p>
                  </div>
                  <div className="space-y-2">
                    {quickActions.map((action, index) => (
                      <motion.button
                        key={action.title}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.1 }}
                        whileHover={{ scale: 1.02, x: 5 }}
                        whileTap={{ scale: 0.98 }}
                        className="flex items-center space-x-2 w-full p-2 rounded-lg text-slate-300 hover:text-white hover:bg-slate-700/50 transition-all duration-200 text-xs group"
                      >
                        <action.icon className={cn("w-3 h-3", action.color)} />
                        <span className="text-left flex-1">{action.title}</span>
                        <motion.div
                          initial={{ opacity: 0, scale: 0 }}
                          whileHover={{ opacity: 1, scale: 1 }}
                          className="opacity-0 group-hover:opacity-100"
                        >
                          <Zap className="w-3 h-3 text-amber-400" />
                        </motion.div>
                      </motion.button>
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>

          {/* Bottom Navigation */}
          <motion.div 
            className="space-y-1"
            layout
            transition={{ duration: 0.3 }}
          >
            {bottomItems.map((item, index) => {
              const active = isActive(item.url);
              return (
                <motion.div
                  key={item.url}
                  custom={index}
                  variants={staggerVariants}
                  initial="hidden"
                  animate="visible"
                >
                  <NavLink
                    to={item.url}
                    className={cn(
                      "flex items-center space-x-3 px-3 py-2 rounded-xl transition-all duration-200 group",
                      active
                        ? "bg-slate-800/50 text-blue-400"
                        : "hover:bg-slate-800/50 text-slate-400 hover:text-white"
                    )}
                  >
                    <item.icon className="w-5 h-5 shrink-0" />
                    <AnimatePresence mode="wait">
                      {!sidebarCollapsed && (
                        <motion.span
                          variants={itemContentVariants}
                          initial="collapsed"
                          animate="expanded"
                          exit="collapsed"
                          className="font-medium text-sm"
                        >
                          {item.title}
                        </motion.span>
                      )}
                    </AnimatePresence>
                  </NavLink>
                </motion.div>
              );
            })}
            
            <motion.div
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <Button
                variant="ghost"
                className={cn(
                  "w-full justify-start text-slate-400 hover:text-rose-400 hover:bg-slate-800/50 transition-all duration-200",
                  sidebarCollapsed ? "px-3" : "px-3"
                )}
              >
                <LogOut className="w-5 h-5 shrink-0" />
                <AnimatePresence mode="wait">
                  {!sidebarCollapsed && (
                    <motion.span
                      variants={itemContentVariants}
                      initial="collapsed"
                      animate="expanded"
                      exit="collapsed"
                      className="font-medium text-sm ml-3"
                    >
                      Sign Out
                    </motion.span>
                  )}
                </AnimatePresence>
              </Button>
            </motion.div>
          </motion.div>
        </div>
      </motion.aside>
    );
  }

  // Mobile Bottom Navigation
  return (
    <>
      {/* Mobile Bottom Bar */}
      <motion.div
        initial="hidden"
        animate="visible"
        variants={mobileBottomBarVariants}
        className="fixed bottom-0 left-0 right-0 z-50 md:hidden bg-slate-900/95 backdrop-blur-xl border-t border-slate-700/50 shadow-2xl"
      >
        <div className="p-2">
          <div className="flex items-center justify-between space-x-1">
            {/* Main Navigation Items */}
            {navigationItems.slice(0, 4).map((item, index) => (
              <motion.div
                key={item.url}
                custom={index}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
              >
                <MobileNavItem item={item} />
              </motion.div>
            ))}
            
            {/* More Menu Button */}
            <motion.div
              whileTap={{ scale: 0.95 }}
              transition={{ duration: 0.1 }}
            >
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className={cn(
                  "flex flex-col items-center space-y-1 p-2 rounded-xl transition-all duration-200 flex-1 min-w-0 relative overflow-hidden",
                  mobileMenuOpen 
                    ? "bg-gradient-to-br from-blue-600 to-purple-600 text-white shadow-lg"
                    : "text-slate-400 hover:text-white hover:bg-slate-800/50"
                )}
              >
                {mobileMenuOpen && (
                  <motion.div
                    layoutId="mobileMenuGlow"
                    className="absolute inset-0 bg-gradient-to-br from-blue-600 to-purple-600 rounded-xl"
                    initial={false}
                    transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                  />
                )}
                
                <motion.div
                  animate={{ rotate: mobileMenuOpen ? 180 : 0 }}
                  transition={{ duration: 0.3 }}
                  className="relative z-10"
                >
                  {mobileMenuOpen ? (
                    <X className="w-5 h-5" />
                  ) : (
                    <Menu className="w-5 h-5" />
                  )}
                </motion.div>
                <span className="text-xs font-medium relative z-10">More</span>
              </button>
            </motion.div>
          </div>

          {/* Expanded Mobile Menu */}
          <AnimatePresence>
            {mobileMenuOpen && (
              <motion.div
                variants={mobileMenuVariants}
                initial="closed"
                animate="open"
                exit="closed"
                className="mt-2 bg-slate-800/95 backdrop-blur-xl rounded-xl border border-slate-700/50 overflow-hidden shadow-2xl"
              >
                <div className="p-3 space-y-1">
                  {/* Remaining Navigation Items */}
                  {navigationItems.slice(4).map((item, index) => {
                    const active = isActive(item.url);
                    return (
                      <motion.div
                        key={item.url}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.1 }}
                      >
                        <NavLink
                          to={item.url}
                          onClick={() => setMobileMenuOpen(false)}
                          className={cn(
                            "flex items-center space-x-3 px-3 py-3 rounded-lg transition-all duration-200 group relative overflow-hidden",
                            active
                              ? "text-white shadow-lg"
                              : "text-slate-400 hover:text-white hover:bg-slate-700/50"
                          )}
                        >
                          {active && (
                            <motion.div
                              layoutId="mobileActiveBackground"
                              className={cn(
                                "absolute inset-0 rounded-lg bg-gradient-to-r",
                                item.gradient
                              )}
                              initial={false}
                              transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                            />
                          )}
                          
                          <item.icon className={cn(
                            "w-5 h-5 relative z-10 transition-transform duration-200",
                            active ? "scale-110" : "group-hover:scale-105"
                          )} />
                          <span className="font-medium text-sm relative z-10 flex-1">
                            {item.title}
                          </span>
                          <span className="text-xs text-slate-500 relative z-10">
                            {item.description}
                          </span>
                        </NavLink>
                      </motion.div>
                    );
                  })}

                  {/* Bottom Items */}
                  <motion.div 
                    className="border-t border-slate-700/50 pt-2 space-y-1"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.3 }}
                  >
                    {bottomItems.map((item, index) => {
                      const active = isActive(item.url);
                      return (
                        <motion.div
                          key={item.url}
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: index * 0.1 + 0.3 }}
                        >
                          <NavLink
                            to={item.url}
                            onClick={() => setMobileMenuOpen(false)}
                            className={cn(
                              "flex items-center space-x-3 px-3 py-2 rounded-lg transition-all duration-200",
                              active
                                ? "bg-slate-700/50 text-blue-400"
                                : "text-slate-400 hover:text-white hover:bg-slate-700/50"
                            )}
                          >
                            <item.icon className="w-5 h-5" />
                            <span className="font-medium text-sm">{item.title}</span>
                          </NavLink>
                        </motion.div>
                      );
                    })}
                    
                    <motion.button 
                      className="flex items-center space-x-3 px-3 py-2 rounded-lg transition-all duration-200 text-slate-400 hover:text-rose-400 hover:bg-slate-700/50 w-full"
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.5 }}
                      whileTap={{ scale: 0.95 }}
                    >
                      <LogOut className="w-5 h-5" />
                      <span className="font-medium text-sm">Sign Out</span>
                    </motion.button>
                  </motion.div>

                  {/* Quick Actions */}
                  <motion.div 
                    className="border-t border-slate-700/50 pt-2"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.4 }}
                  >
                    <div className="flex items-center space-x-2 mb-2 px-3">
                      <motion.div
                        animate={{ rotate: [0, 10, 0] }}
                        transition={{ duration: 2, repeat: Infinity }}
                      >
                        <Sparkles className="w-4 h-4 text-blue-400" />
                      </motion.div>
                      <span className="font-semibold text-sm text-white">Quick Actions</span>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      {quickActions.map((action, index) => (
                        <motion.button
                          key={action.title}
                          initial={{ opacity: 0, scale: 0.8 }}
                          animate={{ opacity: 1, scale: 1 }}
                          transition={{ delay: index * 0.1 + 0.5 }}
                          whileTap={{ scale: 0.95 }}
                          className="flex items-center space-x-2 px-3 py-2 rounded-lg bg-slate-700/50 text-slate-300 hover:text-white transition-all duration-200 text-xs group"
                        >
                          <action.icon className={cn("w-3 h-3", action.color)} />
                          <span className="truncate">{action.title}</span>
                        </motion.button>
                      ))}
                    </div>
                  </motion.div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>

      {/* Add padding to main content for mobile bottom bar */}
      <div className="pb-20 md:pb-0" />
    </>
  );
};