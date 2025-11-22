import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Loader2, Building, User, Mail, Shield, CheckCircle, 
  ArrowLeft, ArrowRight, Eye, EyeOff, Lock, Phone,
  Users, Briefcase, Calendar, Hash, Smartphone, Search,
  X, ChevronDown, Globe, Sparkles, Zap, Crown, Rocket,
  Target, ArrowUpRight, Star, Clock, ShieldCheck
} from 'lucide-react';

// Font classes
const fontClasses = {
  heading: "font-clash-display",
  body: "font-satoshi",
  mono: "font-satoshi-mono"
};

const AuthPage = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('login');
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });
  const API_BASE = import.meta.env.VITE_BACKEND_URL;
  return (
    <div className={`min-h-screen bg-gradient-to-br from-gray-900 via-slate-900 to-indigo-950 flex items-center justify-center p-3 sm:p-4 md:p-6 ${fontClasses.body} relative overflow-hidden`}>
      {/* Enhanced Animated Background */}
      <div className="absolute inset-0 overflow-hidden">
        {/* Animated Gradient Orbs */}
        <div className="absolute -top-20 -right-20 sm:-top-40 sm:-right-40 w-48 h-48 sm:w-96 sm:h-96 bg-gradient-to-r from-blue-500/20 to-purple-600/20 rounded-full blur-2xl sm:blur-3xl animate-orbital-1"></div>
        <div className="absolute -bottom-20 -left-20 sm:-bottom-40 sm:-left-40 w-48 h-48 sm:w-96 sm:h-96 bg-gradient-to-r from-purple-500/20 to-pink-600/20 rounded-full blur-2xl sm:blur-3xl animate-orbital-2"></div>
        <div className="absolute top-1/3 -left-10 sm:-left-20 w-40 h-40 sm:w-80 sm:h-80 bg-gradient-to-r from-cyan-500/15 to-blue-600/15 rounded-full blur-2xl sm:blur-3xl animate-orbital-3"></div>
        
        {/* Grid Pattern with Animation */}
        <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.03)_1px,transparent_1px)] bg-[size:40px_40px] sm:bg-[size:60px_60px] lg:bg-[size:80px_80px] [mask-image:radial-gradient(ellipse_80%_50%_at_50%_50%,black,transparent)] animate-grid-flow"></div>
        
        {/* Floating Particles */}
        <div className="absolute inset-0">
          {[...Array(15)].map((_, i) => (
            <motion.div
              key={i}
              className="absolute w-1 h-1 sm:w-1.5 sm:h-1.5 bg-gradient-to-r from-blue-400/40 to-purple-400/40 rounded-full"
              initial={{
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
                scale: 0,
              }}
              animate={{
                scale: [0, 1, 0],
                opacity: [0, 1, 0],
              }}
              transition={{
                duration: 3 + Math.random() * 4,
                repeat: Infinity,
                delay: Math.random() * 5,
              }}
            />
          ))}
        </div>
      </div>

      <div className="w-full max-w-7xl z-10">
        {/* Enhanced Header - Responsive */}
        <div className="text-center mb-8 sm:mb-12 lg:mb-16 px-2">
          <motion.div
            initial={{ opacity: 0, y: -30 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col sm:flex-row items-center justify-center mb-6 sm:mb-8 space-y-4 sm:space-y-0"
          >
            <div className="relative">
              <motion.div
                animate={{ 
                  rotate: 360,
                  scale: [1, 1.1, 1]
                }}
                transition={{ 
                  rotate: { duration: 20, repeat: Infinity, ease: "linear" },
                  scale: { duration: 2, repeat: Infinity }
                }}
                className="w-16 h-16 sm:w-20 sm:h-20 bg-gradient-to-br from-blue-500 via-purple-600 to-pink-500 rounded-2xl sm:rounded-3xl flex items-center justify-center shadow-xl sm:shadow-2xl shadow-blue-500/30 relative overflow-hidden"
              >
                <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent"></div>
                <Rocket className="h-6 w-6 sm:h-8 sm:w-8 lg:h-10 lg:w-10 text-white relative z-10" />
                <Sparkles className="absolute -top-1 -right-1 h-3 w-3 sm:h-4 sm:w-4 text-yellow-400 animate-ping" />
              </motion.div>
              <motion.div
                animate={{ 
                  scale: [1, 1.2, 1],
                  rotate: [0, 180, 360]
                }}
                transition={{ 
                  duration: 3,
                  repeat: Infinity,
                  ease: "linear"
                }}
                className="absolute -bottom-2 -right-2 w-6 h-6 sm:w-8 sm:h-8 bg-gradient-to-br from-green-400 to-emerald-600 rounded-full border-2 sm:border-4 border-slate-900 shadow-lg shadow-green-400/40 flex items-center justify-center"
              >
                <Zap className="h-2 w-2 sm:h-3 sm:w-3 text-white" />
              </motion.div>
            </div>
            <div className="sm:ml-4 lg:ml-6 text-center sm:text-left">
              <motion.h1 
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.2 }}
                className={`text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold bg-gradient-to-r from-white via-blue-200 to-purple-200 bg-clip-text text-transparent ${fontClasses.heading} mb-1 sm:mb-2`}
              >
                NexusFlow
              </motion.h1>
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.3 }}
                className="flex items-center justify-center sm:justify-start space-x-2"
              >
                <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-green-400 rounded-full animate-pulse"></div>
                <p className="text-sm sm:text-base lg:text-lg text-gray-300 font-light">Enterprise Intelligence Platform</p>
              </motion.div>
            </div>
          </motion.div>
          
          <motion.p 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="text-base sm:text-lg lg:text-xl text-gray-400 max-w-3xl mx-auto leading-relaxed font-light px-2 sm:px-0"
          >
            Transform your enterprise with AI-powered collaboration. Secure, scalable, and built for the future of work.
          </motion.p>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-2 gap-8 sm:gap-12 lg:gap-16 items-start px-2 sm:px-0">
          {/* Enhanced Features Side - Hidden on mobile, visible on xl */}
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6 }}
            className="hidden xl:block space-y-6 lg:space-y-8"
          >
            <div className="space-y-4 lg:space-y-6">
              <FeatureCard
                icon={<ShieldCheck className="h-5 w-5 sm:h-6 sm:w-6 lg:h-7 lg:w-7" />}
                title="Quantum Security"
                description="Military-grade encryption with zero-trust architecture and real-time threat detection"
                gradient="from-blue-500/20 to-cyan-500/10"
                delay={0.1}
                features={["256-bit Encryption", "Zero-Trust", "AI Threat Detection"]}
              />
              <FeatureCard
                icon={<Users className="h-5 w-5 sm:h-6 sm:w-6 lg:h-7 lg:w-7" />}
                title="Smart Teams"
                description="AI-powered team management with predictive analytics and automated workflows"
                gradient="from-purple-500/20 to-pink-500/10"
                delay={0.2}
                features={["AI Analytics", "Auto Workflows", "Predictive Insights"]}
              />
              <FeatureCard
                icon={<Rocket className="h-5 w-5 sm:h-6 sm:w-6 lg:h-7 lg:w-7" />}
                title="Hyper Performance"
                description="Lightning-fast platform with 99.99% uptime and real-time collaboration"
                gradient="from-green-500/20 to-emerald-500/10"
                delay={0.3}
                features={["99.99% Uptime", "Real-time Sync", "Global CDN"]}
              />
            </div>
            
            {/* Enhanced Stats Card */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
              className="bg-gradient-to-br from-gray-800/40 to-gray-900/60 backdrop-blur-xl rounded-2xl lg:rounded-3xl p-6 lg:p-8 border border-gray-700/50 shadow-2xl relative overflow-hidden"
            >
              <div className="absolute top-0 right-0 w-24 h-24 lg:w-32 lg:h-32 bg-blue-500/10 rounded-full -translate-y-8 lg:-translate-y-16 translate-x-8 lg:translate-x-16 blur-xl"></div>
              <div className="relative z-10">
                <div className="flex items-center mb-4 lg:mb-6">
                  <Target className="h-5 w-5 lg:h-6 lg:w-6 text-blue-400 mr-2 lg:mr-3" />
                  <h3 className={`font-semibold text-white text-lg lg:text-xl ${fontClasses.heading}`}>Trusted by Innovators</h3>
                </div>
                <div className="grid grid-cols-3 gap-4 lg:gap-8">
                  <div className="text-center">
                    <div className="text-xl sm:text-2xl lg:text-3xl font-bold text-white mb-1 lg:mb-2 bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">500+</div>
                    <div className="text-gray-400 text-xs lg:text-sm">Enterprises</div>
                  </div>
                  <div className="text-center">
                    <div className="text-xl sm:text-2xl lg:text-3xl font-bold text-white mb-1 lg:mb-2 bg-gradient-to-r from-green-400 to-cyan-400 bg-clip-text text-transparent">75K+</div>
                    <div className="text-gray-400 text-xs lg:text-sm">Teams</div>
                  </div>
                  <div className="text-center">
                    <div className="text-xl sm:text-2xl lg:text-3xl font-bold text-white mb-1 lg:mb-2 bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">99.99%</div>
                    <div className="text-gray-400 text-xs lg:text-sm">Uptime</div>
                  </div>
                </div>
                <div className="mt-4 lg:mt-6 pt-4 lg:pt-6 border-t border-gray-700/50">
                  <div className="flex flex-col sm:flex-row items-center justify-between text-xs lg:text-sm text-gray-400 space-y-2 sm:space-y-0">
                    <div className="flex items-center">
                      <Clock className="h-3 w-3 lg:h-4 lg:w-4 mr-1 lg:mr-2" />
                      <span>Real-time updates</span>
                    </div>
                    <div className="flex items-center">
                      <Star className="h-3 w-3 lg:h-4 lg:w-4 mr-1 lg:mr-2 text-yellow-400" />
                      <span>4.9/5 Rating</span>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          </motion.div>

          {/* Enhanced Auth Forms */}
          <motion.div
            initial={{ opacity: 0, x: 30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6 }}
            className="flex justify-center w-full"
          >
            <div className="w-full max-w-md lg:max-w-lg">
              <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                <TabsList className="grid w-full grid-cols-2 mb-6 sm:mb-8 lg:mb-10 bg-gray-800/40 backdrop-blur-xl p-1 sm:p-2 rounded-xl lg:rounded-3xl border border-gray-700/50 shadow-xl lg:shadow-2xl">
                  <TabsTrigger 
                    value="login" 
                    className="flex items-center gap-2 sm:gap-3 rounded-xl lg:rounded-2xl py-3 sm:py-4 text-sm sm:text-base font-medium transition-all duration-300 data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-500/20 data-[state=active]:to-purple-500/20 data-[state=active]:border data-[state=active]:border-blue-500/30 data-[state=active]:text-white data-[state=active]:shadow-lg"
                  >
                    <User className="h-4 w-4 sm:h-5 sm:w-5" />
                    <span className="hidden xs:inline">Sign In</span>
                  </TabsTrigger>
                  <TabsTrigger 
                    value="register" 
                    className="flex items-center gap-2 sm:gap-3 rounded-xl lg:rounded-2xl py-3 sm:py-4 text-sm sm:text-base font-medium transition-all duration-300 data-[state=active]:bg-gradient-to-r data-[state=active]:from-green-500/20 data-[state=active]:to-emerald-500/20 data-[state=active]:border data-[state=active]:border-green-500/30 data-[state=active]:text-white data-[state=active]:shadow-lg"
                  >
                    <Rocket className="h-4 w-4 sm:h-5 sm:w-5" />
                    <span className="hidden xs:inline">Get Started</span>
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="login">
                  <LoginForm 
                    setIsLoading={setIsLoading}
                    setMessage={setMessage}
                    isLoading={isLoading}
                  />
                </TabsContent>

                <TabsContent value="register">
                  <RegistrationForm 
                    setIsLoading={setIsLoading}
                    setMessage={setMessage}
                    isLoading={isLoading}
                  />
                </TabsContent>
              </Tabs>

              <AnimatePresence>
                {message.text && (
                  <motion.div
                    initial={{ opacity: 0, y: 10, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -10, scale: 0.95 }}
                    className="mt-4 sm:mt-6"
                  >
                    <Alert className={
                      `backdrop-blur-xl border-l-4 ${
                        message.type === 'error' 
                          ? 'bg-red-500/10 border-red-400/50' 
                          : 'bg-green-500/10 border-green-400/50'
                      }`
                    }>
                      <AlertDescription className={
                        message.type === 'error' ? 'text-red-300' : 'text-green-300'
                      }>
                        <div className="flex items-center text-sm sm:text-base">
                          {message.type === 'error' ? (
                            <X className="h-3 w-3 sm:h-4 sm:w-4 mr-2" />
                          ) : (
                            <CheckCircle className="h-3 w-3 sm:h-4 sm:w-4 mr-2" />
                          )}
                          {message.text}
                        </div>
                      </AlertDescription>
                    </Alert>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </motion.div>
        </div>
      </div>

      {/* Floating Action Button - Responsive */}
      <motion.div
        initial={{ opacity: 0, scale: 0 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 1 }}
        className="fixed bottom-4 right-4 sm:bottom-6 sm:right-6 lg:bottom-8 lg:right-8 z-20"
      >
        <Button className="rounded-xl sm:rounded-2xl bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 text-white shadow-xl sm:shadow-2xl shadow-blue-500/30 px-4 py-2 sm:px-6 sm:py-3 h-auto text-sm sm:text-base">
          <Sparkles className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
          <span className="hidden sm:inline">Need Help?</span>
        </Button>
      </motion.div>
    </div>
  );
};

// Enhanced Feature Card Component - Responsive
const FeatureCard = ({ icon, title, description, gradient, delay = 0, features = [] }) => (
  <motion.div 
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ delay }}
    whileHover={{ scale: 1.02, y: -5 }}
    className="group relative"
  >
    <div className="absolute inset-0 bg-gradient-to-r from-blue-500/5 to-purple-500/5 rounded-2xl lg:rounded-3xl blur-lg group-hover:blur-xl transition-all duration-500"></div>
    <div className={`relative bg-gradient-to-br from-gray-800/40 to-gray-900/60 backdrop-blur-xl rounded-2xl lg:rounded-3xl p-4 lg:p-6 border border-gray-700/50 hover:border-gray-600/50 transition-all duration-300 shadow-lg hover:shadow-xl lg:shadow-xl lg:hover:shadow-2xl ${fontClasses.body}`}>
      <div className="flex items-start space-x-3 lg:space-x-4">
        <div className={`w-10 h-10 lg:w-12 lg:h-12 xl:w-14 xl:h-14 bg-gradient-to-br ${gradient} rounded-xl lg:rounded-2xl flex items-center justify-center text-white shadow-lg group-hover:scale-110 transition-transform duration-300 border border-white/10 relative overflow-hidden`}>
          <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent"></div>
          {icon}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between mb-2 lg:mb-3">
            <h3 className={`font-semibold text-white text-base lg:text-lg xl:text-lg ${fontClasses.heading} truncate`}>{title}</h3>
            <ArrowUpRight className="h-3 w-3 lg:h-4 lg:w-4 text-gray-400 group-hover:text-white transition-colors flex-shrink-0 ml-2" />
          </div>
          <p className="text-gray-400 text-xs lg:text-sm leading-relaxed mb-3 lg:mb-4 line-clamp-2">{description}</p>
          {features.length > 0 && (
            <div className="flex flex-wrap gap-1 lg:gap-2">
              {features.map((feature, index) => (
                <Badge 
                  key={index}
                  variant="outline" 
                  className="bg-white/5 text-gray-300 border-gray-600 text-xs px-2 py-0.5 lg:px-2 lg:py-1"
                >
                  {feature}
                </Badge>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  </motion.div>
);

// Enhanced Input Component - Responsive
const EnhancedInput = ({ icon, ...props }) => (
  <div className="relative">
    {icon && (
      <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400">
        {icon}
      </div>
    )}
    <Input
      className={`pl-10 lg:pl-12 pr-4 py-3 lg:py-4 bg-gray-800/40 backdrop-blur-sm border-gray-700/50 focus:bg-gray-800/60 focus:border-blue-500/50 transition-all duration-300 text-white placeholder-gray-500 rounded-xl lg:rounded-2xl ${fontClasses.body} text-sm lg:text-base`}
      {...props}
    />
  </div>
);

// Enhanced Button Component - Responsive
const EnhancedButton = ({ children, isLoading, variant = "default", ...props }) => {
  const baseClasses = "w-full py-3 lg:py-4 rounded-xl lg:rounded-2xl text-white shadow-lg lg:shadow-xl transition-all duration-300 font-medium text-sm lg:text-base";
  
  const variants = {
    default: "bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 shadow-blue-500/25 hover:shadow-xl lg:hover:shadow-2xl lg:hover:shadow-blue-500/30 hover:scale-[1.02]",
    outline: "bg-transparent border border-gray-700 hover:bg-gray-800/50 hover:border-gray-600 hover:scale-[1.02]",
    success: "bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-500 hover:to-emerald-500 shadow-green-500/25 hover:shadow-xl lg:hover:shadow-2xl lg:hover:shadow-green-500/30 hover:scale-[1.02]"
  };

  return (
    <Button
      className={`${baseClasses} ${variants[variant]} ${fontClasses.body}`}
      disabled={isLoading}
      {...props}
    >
      {isLoading ? (
        <Loader2 className="h-4 w-4 lg:h-5 lg:w-5 animate-spin mr-2 lg:mr-3" />
      ) : null}
      {children}
    </Button>
  );
};

// Enhanced Company Search Component - Responsive
const CompanySearch = ({ onCompanySelect, selectedCompany }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [companies, setCompanies] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [allCompanies, setAllCompanies] = useState([]);

  // Load all companies on component mount
  useEffect(() => {
    const loadCompanies = async () => {
      try {
        const response = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/company/all`);
        const data = await response.json();
        
        if (data.success) {
          setAllCompanies(data.companies);
        }
      } catch (error) {
        console.error('Error loading companies:', error);
      }
    };

    loadCompanies();
  }, []);

  useEffect(() => {
    const searchCompanies = async () => {
      if (searchTerm.length < 2) {
        setCompanies([]);
        return;
      }

      setIsLoading(true);
      try {
        // Filter from pre-loaded companies
        const filteredCompanies = allCompanies.filter(company =>
          company.name.toLowerCase().includes(searchTerm.toLowerCase())
        );
        setCompanies(filteredCompanies);
      } catch (error) {
        console.error('Error searching companies:', error);
      } finally {
        setIsLoading(false);
      }
    };

    const debounceTimer = setTimeout(searchCompanies, 200);
    return () => clearTimeout(debounceTimer);
  }, [searchTerm, allCompanies]);

  const handleCompanySelect = (company) => {
    onCompanySelect(company);
    setSearchTerm(company.name);
    setIsOpen(false);
  };

  return (
    <div className="relative">
      <Label className="text-gray-300 font-medium mb-3 lg:mb-4 block text-sm lg:text-base">Find Your Company</Label>
      <div className="relative">
        <EnhancedInput
          icon={<Search className="h-4 w-4 lg:h-5 lg:w-5" />}
          placeholder="Start typing company name..."
          value={selectedCompany ? selectedCompany.name : searchTerm}
          onChange={(e) => {
            setSearchTerm(e.target.value);
            setIsOpen(true);
          }}
          onFocus={() => setIsOpen(true)}
        />
        {selectedCompany && (
          <Button
            variant="ghost"
            size="sm"
            className="absolute right-10 lg:right-12 top-1/2 transform -translate-y-1/2 h-6 w-6 lg:h-8 lg:w-8 p-0 text-gray-400 hover:text-gray-300 rounded-lg lg:rounded-xl"
            onClick={() => {
              onCompanySelect(null);
              setSearchTerm('');
            }}
          >
            <X className="h-3 w-3 lg:h-4 lg:w-4" />
          </Button>
        )}
        <Button
          variant="ghost"
          size="sm"
          className="absolute right-2 lg:right-3 top-1/2 transform -translate-y-1/2 h-6 w-6 lg:h-8 lg:w-8 p-0 text-gray-400 hover:text-gray-300 rounded-lg lg:rounded-xl"
          onClick={() => setIsOpen(!isOpen)}
        >
          <ChevronDown className="h-3 w-3 lg:h-4 lg:w-4 transition-transform duration-200" style={{ transform: isOpen ? 'rotate(180deg)' : 'none' }} />
        </Button>
      </div>

      <AnimatePresence>
        {isOpen && (searchTerm.length >= 2 || companies.length > 0) && (
          <motion.div
            initial={{ opacity: 0, y: -10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.95 }}
            className="absolute z-50 w-full mt-2 bg-gray-800/95 backdrop-blur-xl border border-gray-700/50 rounded-xl lg:rounded-2xl shadow-xl lg:shadow-2xl max-h-48 lg:max-h-64 overflow-y-auto"
          >
            {isLoading ? (
              <div className="p-4 lg:p-6 text-center text-gray-400">
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                >
                  <Loader2 className="h-5 w-5 lg:h-6 lg:w-6 mx-auto mb-2 lg:mb-3" />
                </motion.div>
                <p className="text-xs lg:text-sm">Searching companies...</p>
              </div>
            ) : companies.length > 0 ? (
              companies.map((company, index) => (
                <motion.div
                  key={company.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className="p-3 lg:p-4 hover:bg-white/5 cursor-pointer border-b border-gray-700/30 last:border-b-0 transition-all duration-200 group"
                  onClick={() => handleCompanySelect(company)}
                >
                  <div className="flex items-center space-x-3 lg:space-x-4">
                    <div className="w-8 h-8 lg:w-10 lg:h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg lg:rounded-xl flex items-center justify-center text-white shadow-lg group-hover:scale-110 transition-transform duration-200 flex-shrink-0">
                      <Building className="h-4 w-4 lg:h-5 lg:w-5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-white font-medium text-sm truncate group-hover:text-blue-300 transition-colors">
                        {company.name}
                      </div>
                      <div className="text-gray-400 text-xs flex items-center mt-1 flex-wrap">
                        <Briefcase className="h-2 w-2 lg:h-3 lg:w-3 mr-1 flex-shrink-0" />
                        <span className="truncate">{company.industry}</span>
                        <span className="mx-1 lg:mx-2 text-gray-600">•</span>
                        <Users className="h-2 w-2 lg:h-3 lg:w-3 mr-1 flex-shrink-0" />
                        <span>{company.size}</span>
                      </div>
                    </div>
                    <Badge variant="outline" className="bg-blue-500/10 text-blue-300 border-blue-500/30 text-xs px-1 lg:px-2 py-0 flex-shrink-0 hidden sm:block">
                      ID: {company.id.substring(0, 6)}...
                    </Badge>
                  </div>
                </motion.div>
              ))
            ) : searchTerm.length >= 2 ? (
              <div className="p-4 lg:p-6 text-center text-gray-400">
                <Globe className="h-8 w-8 lg:h-10 lg:w-10 mx-auto mb-2 lg:mb-3 opacity-50" />
                <p className="text-xs lg:text-sm font-medium mb-1">No companies found</p>
                <p className="text-xs">Try a different search term</p>
              </div>
            ) : null}
          </motion.div>
        )}
      </AnimatePresence>

      {selectedCompany && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          className="mt-3 lg:mt-4 p-3 lg:p-4 bg-gradient-to-r from-green-500/10 to-emerald-500/10 border border-green-500/30 rounded-xl lg:rounded-2xl backdrop-blur-sm"
        >
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <div className="flex items-center mb-1 lg:mb-2">
                <CheckCircle className="h-4 w-4 lg:h-5 lg:w-5 text-green-400 mr-1 lg:mr-2" />
                <div className="text-green-300 text-xs lg:text-sm font-medium">Company Selected</div>
              </div>
              <div className="text-white text-sm lg:text-base font-semibold truncate">{selectedCompany.name}</div>
              <div className="text-gray-300 text-xs lg:text-sm mt-1">
                <span className="text-gray-400">Industry:</span> {selectedCompany.industry}
                <span className="mx-2 lg:mx-3 text-gray-600">•</span>
                <span className="text-gray-400">Size:</span> {selectedCompany.size}
              </div>
              <div className="text-gray-400 text-xs mt-1 lg:mt-2 font-mono truncate">
                Company ID: {selectedCompany.id}
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </div>
  );
};

// Login Component (Enhanced) - Responsive
const LoginForm = ({ setIsLoading, setMessage, isLoading }) => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    userType: 'employee',
    rememberMe: false
  });
  const [showPassword, setShowPassword] = useState(false);

  const handleLogin = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setMessage({ type: '', text: '' });
    
    try {
      const endpoint = formData.userType === 'admin' 
        ? `${import.meta.env.VITE_BACKEND_URL}/api/auth/admin/login` 
        : `${import.meta.env.VITE_BACKEND_URL}/api/auth/employee/login`;

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: formData.email,
          password: formData.password
        })
      });

      const data = await response.json();
       console.log(data);
      if (data.success) {
        localStorage.setItem('token', data.token);
        localStorage.setItem('userRole', formData.userType);
        localStorage.setItem("token", data.token);
        localStorage.setItem("userId", data.admin?.id || data.employee?.id);
        localStorage.setItem("companyId", data.admin?.company?.id || data.employee?.company?.id);
        localStorage.setItem("role", data.admin ? "admin" : "employee");
         
        if (formData.rememberMe) {
          localStorage.setItem('rememberMe', 'true');
        }
        setMessage({ type: 'success', text: data.message });
        setTimeout(() => {
          navigate('/profile');
        }, 1000);
      } else {
        setMessage({ type: 'error', text: data.error });
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Login failed. Please try again.' });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
    >
      <Card className="w-full border-gray-700/50 bg-gray-900/40 backdrop-blur-xl shadow-xl lg:shadow-2xl rounded-xl lg:rounded-3xl overflow-hidden relative">
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-500 to-purple-600"></div>
        <CardHeader className="pb-4 lg:pb-6 pt-6 lg:pt-8 px-4 lg:px-6">
          <CardTitle className={`text-2xl lg:text-3xl text-white text-center ${fontClasses.heading} mb-1 lg:mb-2`}>
            Welcome Back
          </CardTitle>
          <CardDescription className="text-gray-400 text-center text-sm lg:text-lg">
            Sign in to your enterprise dashboard
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4 lg:space-y-6 pb-6 lg:pb-8 px-4 lg:px-6">
          <form onSubmit={handleLogin} className="space-y-4 lg:space-y-6">
            <div className="space-y-3 lg:space-y-4">
              <Label className="text-gray-300 font-medium text-sm lg:text-base">Account Type</Label>
              <RadioGroup 
                value={formData.userType} 
                onValueChange={(value) => setFormData({ ...formData, userType: value })}
                className="flex space-x-2 lg:space-x-4"
              >
                <div className="flex-1">
                  <RadioGroupItem value="employee" id="employee-login" className="sr-only" />
                  <Label 
                    htmlFor="employee-login" 
                    className={`flex flex-col items-center justify-center p-3 lg:p-4 border rounded-xl lg:rounded-2xl cursor-pointer transition-all duration-300 ${
                      formData.userType === 'employee' 
                        ? 'border-blue-500 bg-blue-500/10 text-blue-300 shadow-lg' 
                        : 'border-gray-700 bg-gray-800/40 hover:border-gray-600 text-gray-400 hover:text-gray-300'
                    }`}
                  >
                    <User className="h-4 w-4 lg:h-6 lg:w-6 mb-1 lg:mb-2" />
                    <span className="text-xs lg:text-sm font-medium">Team Member</span>
                  </Label>
                </div>
                <div className="flex-1">
                  <RadioGroupItem value="admin" id="admin-login" className="sr-only" />
                  <Label 
                    htmlFor="admin-login" 
                    className={`flex flex-col items-center justify-center p-3 lg:p-4 border rounded-xl lg:rounded-2xl cursor-pointer transition-all duration-300 ${
                      formData.userType === 'admin' 
                        ? 'border-purple-500 bg-purple-500/10 text-purple-300 shadow-lg' 
                        : 'border-gray-700 bg-gray-800/40 hover:border-gray-600 text-gray-400 hover:text-gray-300'
                    }`}
                  >
                    <Crown className="h-4 w-4 lg:h-6 lg:w-6 mb-1 lg:mb-2" />
                    <span className="text-xs lg:text-sm font-medium">Administrator</span>
                  </Label>
                </div>
              </RadioGroup>
            </div>

            <div className="space-y-3 lg:space-y-4">
              <Label htmlFor="email" className="text-gray-300 font-medium text-sm lg:text-base">Email Address</Label>
              <EnhancedInput
                id="email"
                type="email"
                icon={<Mail className="h-4 w-4 lg:h-5 lg:w-5" />}
                placeholder="your.email@company.com"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                required
              />
            </div>

            <div className="space-y-3 lg:space-y-4">
              <Label htmlFor="password" className="text-gray-300 font-medium text-sm lg:text-base">Password</Label>
              <div className="relative">
                <EnhancedInput
                  id="password"
                  type={showPassword ? "text" : "password"}
                  icon={<Lock className="h-4 w-4 lg:h-5 lg:w-5" />}
                  placeholder="Enter your password"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  required
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-2 lg:right-3 top-1/2 transform -translate-y-1/2 h-6 w-6 lg:h-8 lg:w-8 p-0 text-gray-400 hover:text-gray-300 rounded-lg lg:rounded-xl"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? <EyeOff className="h-3 w-3 lg:h-4 lg:w-4" /> : <Eye className="h-3 w-3 lg:h-4 lg:w-4" />}
                </Button>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2 lg:space-x-3">
                <Checkbox
                  id="rememberMe"
                  checked={formData.rememberMe}
                  onCheckedChange={(checked) => setFormData({ ...formData, rememberMe: checked })}
                  className="data-[state=checked]:bg-blue-500 data-[state=checked]:border-blue-500 rounded-lg h-4 w-4 lg:h-5 lg:w-5"
                />
                <Label htmlFor="rememberMe" className="text-gray-400 cursor-pointer hover:text-gray-300 text-xs lg:text-sm">
                  Remember this device
                </Label>
              </div>
              <Link 
                to="/forgot-password" 
                className="text-blue-400 hover:text-blue-300 font-medium transition-colors text-xs lg:text-sm"
              >
                Forgot password?
              </Link>
            </div>

            <EnhancedButton type="submit" isLoading={isLoading}>
              {isLoading ? 'Signing In...' : 'Access Dashboard'}
            </EnhancedButton>
          </form>

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-700/50"></div>
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-gray-900/40 backdrop-blur-sm px-3 lg:px-4 text-gray-500 text-xs lg:text-sm">Enterprise Secure Access</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
};

// Multi-step Registration Component (Enhanced) - Responsive
const RegistrationForm = ({ setIsLoading, setMessage, isLoading }) => {
  const [currentStep, setCurrentStep] = useState(1);
  const [userType, setUserType] = useState('employee');
  const [selectedCompany, setSelectedCompany] = useState(null);
  const [formData, setFormData] = useState({
    // Company Data
    companyName: '',
    companyEmail: '',
    companyPhone: '',
    industry: '',
    companySize: '',
    website: '',
    address: '',
    
    // Admin Data
    adminFirstName: '',
    adminLastName: '',
    adminEmail: '',
    adminPassword: '',
    confirmPassword: '',
    adminPhone: '',
    
    // Employee Data
    employeeFirstName: '',
    employeeLastName: '',
    employeeEmail: '',
    employeePassword: '',
    employeeConfirmPassword: '',
    department: '',
    position: '',
    hireDate: '',
    employeePhone: '',
    
    // OTP Data
    companyId: '',
    otpCode: '',
    generatedOtp: ''
  });

  const [showPasswords, setShowPasswords] = useState({
    admin: false,
    employee: false
  });

  const steps = userType === 'admin' 
    ? ['Account Type', 'Company Details', 'Admin Profile', 'Confirmation']
    : ['Account Type', 'Personal Details', 'Company OTP', 'Confirmation'];

  const progress = (currentStep / steps.length) * 100;

  const handleNext = () => {
    if (validateStep(currentStep)) {
      setCurrentStep(prev => Math.min(prev + 1, steps.length));
    }
  };

  const handleBack = () => {
    setCurrentStep(prev => Math.max(prev - 1, 1));
  };

  const validateStep = (step) => {
    switch (step) {
      case 1:
        return userType !== '';
      
      case 2:
        if (userType === 'admin') {
          return formData.companyName && formData.companyEmail && formData.industry;
        }
        return formData.employeeFirstName && formData.employeeLastName && formData.employeeEmail;
      
      case 3:
        if (userType === 'admin') {
          return formData.adminFirstName && formData.adminLastName && 
                 formData.adminEmail && formData.adminPassword &&
                 formData.adminPassword === formData.confirmPassword;
        }
        return formData.otpCode && (selectedCompany || formData.companyId);
      
      default:
        return true;
    }
  };

  const generateOtp = async () => {
    setIsLoading(true);
    try {
      const token = localStorage.getItem('token');
      const companyId = selectedCompany ? selectedCompany.id : formData.companyId;
      
      const response = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/auth/otp/generate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ companyId })
      });

      const data = await response.json();
      if (data.success) {
        setFormData(prev => ({ ...prev, generatedOtp: data.otp }));
        setMessage({ type: 'success', text: 'OTP generated successfully' });
      } else {
        setMessage({ type: 'error', text: data.error });
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Failed to generate OTP' });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async () => {
    setIsLoading(true);
    setMessage({ type: '', text: '' });

    try {
      if (userType === 'admin') {
        const response = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/auth/company/register`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            companyData: {
              name: formData.companyName,
              email: formData.companyEmail,
              phone: formData.companyPhone,
              industry: formData.industry,
              size: formData.companySize,
              website: formData.website,
              address: formData.address
            },
            adminData: {
              firstName: formData.adminFirstName,
              lastName: formData.adminLastName,
              email: formData.adminEmail,
              password: formData.adminPassword,
              phone: formData.adminPhone
            }
          })
        });

        const data = await response.json();
        if (data.success) {
          setMessage({ type: 'success', text: 'Company and admin registered successfully!' });
          setTimeout(() => setCurrentStep(1), 2000);
        } else {
          setMessage({ type: 'error', text: data.error });
        }
      } else {
        const companyId = selectedCompany ? selectedCompany.id : formData.companyId;
        
        const response = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/auth/employee/register`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            companyId: companyId,
            otpCode: formData.otpCode,
            employeeData: {
              firstName: formData.employeeFirstName,
              lastName: formData.employeeLastName,
              email: formData.employeeEmail,
              password: formData.employeePassword,
              department: formData.department,
              position: formData.position,
              hireDate: formData.hireDate,
              phone: formData.employeePhone
            }
          })
        });

        const data = await response.json();
        if (data.success) {
          setMessage({ type: 'success', text: 'Employee registered successfully!' });
          setTimeout(() => setCurrentStep(1), 2000);
        } else {
          setMessage({ type: 'error', text: data.error });
        }
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Registration failed. Please try again.' });
    } finally {
      setIsLoading(false);
    }
  };

  const handleCompanySelect = (company) => {
    setSelectedCompany(company);
    if (company) {
      setFormData(prev => ({ ...prev, companyId: company.id }));
    }
  };

  // Step 1: Account Type Selection (Enhanced) - Responsive
  const renderStep1 = () => (
    <div className="space-y-6 lg:space-y-8">
      <div className="text-center space-y-3 lg:space-y-4">
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: "spring", stiffness: 200, damping: 15 }}
        >
          <div className="w-16 h-16 lg:w-20 lg:h-20 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl lg:rounded-3xl flex items-center justify-center mx-auto shadow-xl lg:shadow-2xl shadow-blue-500/30 mb-3 lg:mb-4">
            <Rocket className="h-6 w-6 lg:h-8 lg:w-8 xl:h-10 xl:w-10 text-white" />
          </div>
        </motion.div>
        <h3 className={`text-2xl lg:text-3xl font-semibold text-white ${fontClasses.heading}`}>
          Start Your Journey
        </h3>
        <p className="text-gray-400 text-sm lg:text-lg">Choose how you want to experience NexusFlow</p>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:gap-6">
        <motion.div
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
        >
          <Card 
            className={`cursor-pointer transition-all duration-500 border backdrop-blur-xl relative overflow-hidden ${
              userType === 'admin' 
                ? 'border-blue-500 bg-gradient-to-br from-blue-500/10 to-purple-500/10 shadow-xl lg:shadow-2xl shadow-blue-500/20' 
                : 'border-gray-700 bg-gray-800/40 hover:border-gray-600 hover:shadow-lg'
            }`}
            onClick={() => setUserType('admin')}
          >
            <CardContent className="p-4 lg:p-6 xl:p-8">
              <div className="flex items-start space-x-4 lg:space-x-6">
                <div className={`w-12 h-12 lg:w-16 lg:h-16 xl:w-20 xl:h-20 rounded-xl lg:rounded-2xl flex items-center justify-center ${
                  userType === 'admin' 
                    ? 'bg-gradient-to-br from-blue-500 to-purple-600 text-white shadow-xl lg:shadow-2xl' 
                    : 'bg-gray-700 text-gray-400'
                } relative overflow-hidden flex-shrink-0`}>
                  <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent"></div>
                  <Crown className="h-6 w-6 lg:h-8 lg:w-8 xl:h-10 xl:w-10 relative z-10" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-2 lg:mb-4">
                    <h3 className={`text-lg lg:text-xl xl:text-2xl font-semibold text-white ${fontClasses.heading} truncate`}>Enterprise Leader</h3>
                    {userType === 'admin' && (
                      <Badge className="bg-blue-500/20 text-blue-300 border-blue-500/30 hover:bg-blue-500/30 text-xs py-0.5 lg:py-1 px-2 lg:px-3 hidden sm:block">
                        <Star className="h-2 w-2 lg:h-3 lg:w-3 mr-1" />
                        Recommended
                      </Badge>
                    )}
                  </div>
                  <p className="text-gray-400 mb-3 lg:mb-4 leading-relaxed text-xs lg:text-sm xl:text-base line-clamp-3">
                    Launch your company on NexusFlow with full administrative control. 
                    Create your organization, manage teams, and scale your enterprise with AI-powered insights.
                  </p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 lg:gap-4 text-xs lg:text-sm text-gray-400">
                    <div className="flex items-center space-x-2 lg:space-x-3">
                      <CheckCircle className="h-3 w-3 lg:h-4 lg:w-4 xl:h-5 xl:w-5 text-green-400 flex-shrink-0" />
                      <span className="truncate">Company Setup</span>
                    </div>
                    <div className="flex items-center space-x-2 lg:space-x-3">
                      <CheckCircle className="h-3 w-3 lg:h-4 lg:w-4 xl:h-5 xl:w-5 text-green-400 flex-shrink-0" />
                      <span className="truncate">Team Management</span>
                    </div>
                    <div className="flex items-center space-x-2 lg:space-x-3">
                      <CheckCircle className="h-3 w-3 lg:h-4 lg:w-4 xl:h-5 xl:w-5 text-green-400 flex-shrink-0" />
                      <span className="truncate">AI Analytics</span>
                    </div>
                    <div className="flex items-center space-x-2 lg:space-x-3">
                      <CheckCircle className="h-3 w-3 lg:h-4 lg:w-4 xl:h-5 xl:w-5 text-green-400 flex-shrink-0" />
                      <span className="truncate">Full Control</span>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
        >
          <Card 
            className={`cursor-pointer transition-all duration-500 border backdrop-blur-xl relative overflow-hidden ${
              userType === 'employee' 
                ? 'border-green-500 bg-gradient-to-br from-green-500/10 to-emerald-500/10 shadow-xl lg:shadow-2xl shadow-green-500/20' 
                : 'border-gray-700 bg-gray-800/40 hover:border-gray-600 hover:shadow-lg'
            }`}
            onClick={() => setUserType('employee')}
          >
            <CardContent className="p-4 lg:p-6 xl:p-8">
              <div className="flex items-start space-x-4 lg:space-x-6">
                <div className={`w-12 h-12 lg:w-16 lg:h-16 xl:w-20 xl:h-20 rounded-xl lg:rounded-2xl flex items-center justify-center ${
                  userType === 'employee' 
                    ? 'bg-gradient-to-br from-green-500 to-emerald-600 text-white shadow-xl lg:shadow-2xl' 
                    : 'bg-gray-700 text-gray-400'
                } relative overflow-hidden flex-shrink-0`}>
                  <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent"></div>
                  <Users className="h-6 w-6 lg:h-8 lg:w-8 xl:h-10 xl:w-10 relative z-10" />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className={`text-lg lg:text-xl xl:text-2xl font-semibold mb-2 lg:mb-4 text-white ${fontClasses.heading}`}>Team Collaborator</h3>
                  <p className="text-gray-400 mb-3 lg:mb-4 leading-relaxed text-xs lg:text-sm xl:text-base line-clamp-3">
                    Join your company's workspace and collaborate seamlessly with your team. 
                    Access shared resources, contribute to projects, and grow with your organization.
                  </p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 lg:gap-4 text-xs lg:text-sm text-gray-400">
                    <div className="flex items-center space-x-2 lg:space-x-3">
                      <CheckCircle className="h-3 w-3 lg:h-4 lg:w-4 xl:h-5 xl:w-5 text-green-400 flex-shrink-0" />
                      <span className="truncate">Quick Setup</span>
                    </div>
                    <div className="flex items-center space-x-2 lg:space-x-3">
                      <CheckCircle className="h-3 w-3 lg:h-4 lg:w-4 xl:h-5 xl:w-5 text-green-400 flex-shrink-0" />
                      <span className="truncate">Team Collaboration</span>
                    </div>
                    <div className="flex items-center space-x-2 lg:space-x-3">
                      <CheckCircle className="h-3 w-3 lg:h-4 lg:w-4 xl:h-5 xl:w-5 text-green-400 flex-shrink-0" />
                      <span className="truncate">Secure Access</span>
                    </div>
                    <div className="flex items-center space-x-2 lg:space-x-3">
                      <CheckCircle className="h-3 w-3 lg:h-4 lg:w-4 xl:h-5 xl:w-5 text-green-400 flex-shrink-0" />
                      <span className="truncate">Role-based Tools</span>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      <div className="flex justify-end pt-4 lg:pt-6">
        <Button 
          onClick={handleNext}
          disabled={!userType}
          className="px-6 lg:px-8 xl:px-10 py-3 lg:py-4 rounded-xl lg:rounded-2xl bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 text-white shadow-xl lg:shadow-2xl shadow-blue-500/25 text-sm lg:text-base font-medium"
        >
          Continue Journey
          <ArrowRight className="h-4 w-4 lg:h-5 lg:w-5 ml-2 lg:ml-3" />
        </Button>
      </div>
    </div>
  );

  // Step 2: Company Details (Admin) or Personal Details (Employee) - Responsive
  const renderStep2 = () => (
    <div className="space-y-6 lg:space-y-8">
      <div className="text-center space-y-3 lg:space-y-4">
        <h3 className={`text-2xl lg:text-3xl font-semibold text-white ${fontClasses.heading}`}>
          {userType === 'admin' ? 'Company Foundation' : 'Your Profile'}
        </h3>
        <p className="text-gray-400 text-sm lg:text-lg">
          {userType === 'admin' 
            ? 'Build the foundation of your enterprise' 
            : 'Tell us about yourself to get started'
          }
        </p>
      </div>

      {userType === 'admin' ? (
        <div className="space-y-4 lg:space-y-6">
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2 lg:gap-6">
            <div className="space-y-3 lg:space-y-4">
              <Label htmlFor="companyName" className="text-gray-300 font-medium text-sm lg:text-base">Company Name *</Label>
              <EnhancedInput
                id="companyName"
                icon={<Building className="h-4 w-4 lg:h-5 lg:w-5" />}
                value={formData.companyName}
                onChange={(e) => setFormData({ ...formData, companyName: e.target.value })}
                placeholder="Enter your company name"
                required
              />
            </div>
            <div className="space-y-3 lg:space-y-4">
              <Label htmlFor="industry" className="text-gray-300 font-medium text-sm lg:text-base">Industry *</Label>
              <EnhancedInput
                id="industry"
                icon={<Briefcase className="h-4 w-4 lg:h-5 lg:w-5" />}
                value={formData.industry}
                onChange={(e) => setFormData({ ...formData, industry: e.target.value })}
                placeholder="e.g., Technology, Healthcare"
                required
              />
            </div>
          </div>
          
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2 lg:gap-6">
            <div className="space-y-3 lg:space-y-4">
              <Label htmlFor="companyEmail" className="text-gray-300 font-medium text-sm lg:text-base">Company Email *</Label>
              <EnhancedInput
                id="companyEmail"
                type="email"
                icon={<Mail className="h-4 w-4 lg:h-5 lg:w-5" />}
                value={formData.companyEmail}
                onChange={(e) => setFormData({ ...formData, companyEmail: e.target.value })}
                placeholder="company@example.com"
                required
              />
            </div>
            <div className="space-y-3 lg:space-y-4">
              <Label htmlFor="companyPhone" className="text-gray-300 font-medium text-sm lg:text-base">Company Phone</Label>
              <EnhancedInput
                id="companyPhone"
                icon={<Phone className="h-4 w-4 lg:h-5 lg:w-5" />}
                value={formData.companyPhone}
                onChange={(e) => setFormData({ ...formData, companyPhone: e.target.value })}
                placeholder="+1 (555) 123-4567"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2 lg:gap-6">
            <div className="space-y-3 lg:space-y-4">
              <Label htmlFor="website" className="text-gray-300 font-medium text-sm lg:text-base">Website</Label>
              <EnhancedInput
                id="website"
                icon={<Globe className="h-4 w-4 lg:h-5 lg:w-5" />}
                value={formData.website}
                onChange={(e) => setFormData({ ...formData, website: e.target.value })}
                placeholder="https://company.com"
              />
            </div>
            <div className="space-y-3 lg:space-y-4">
              <Label htmlFor="companySize" className="text-gray-300 font-medium text-sm lg:text-base">Company Size</Label>
              <select 
                id="companySize"
                value={formData.companySize}
                onChange={(e) => setFormData({ ...formData, companySize: e.target.value })}
                className="w-full px-3 lg:px-4 py-3 lg:py-4 pl-10 lg:pl-12 border border-gray-700/50 rounded-xl lg:rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-gray-800/40 text-white placeholder-gray-500 backdrop-blur-sm text-sm lg:text-base"
              >
                <option value="" className="bg-gray-800">Select company size</option>
                <option value="1-10" className="bg-gray-800">1-10 employees</option>
                <option value="11-50" className="bg-gray-800">11-50 employees</option>
                <option value="51-200" className="bg-gray-800">51-200 employees</option>
                <option value="201-500" className="bg-gray-800">201-500 employees</option>
                <option value="501+" className="bg-gray-800">501+ employees</option>
              </select>
            </div>
          </div>

          <div className="space-y-3 lg:space-y-4">
            <Label htmlFor="address" className="text-gray-300 font-medium text-sm lg:text-base">Company Address</Label>
            <EnhancedInput
              id="address"
              value={formData.address}
              onChange={(e) => setFormData({ ...formData, address: e.target.value })}
              placeholder="Enter your company address"
            />
          </div>
        </div>
      ) : (
        <div className="space-y-4 lg:space-y-6">
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2 lg:gap-6">
            <div className="space-y-3 lg:space-y-4">
              <Label htmlFor="employeeFirstName" className="text-gray-300 font-medium text-sm lg:text-base">First Name *</Label>
              <EnhancedInput
                id="employeeFirstName"
                value={formData.employeeFirstName}
                onChange={(e) => setFormData({ ...formData, employeeFirstName: e.target.value })}
                placeholder="Enter your first name"
                required
              />
            </div>
            <div className="space-y-3 lg:space-y-4">
              <Label htmlFor="employeeLastName" className="text-gray-300 font-medium text-sm lg:text-base">Last Name *</Label>
              <EnhancedInput
                id="employeeLastName"
                value={formData.employeeLastName}
                onChange={(e) => setFormData({ ...formData, employeeLastName: e.target.value })}
                placeholder="Enter your last name"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2 lg:gap-6">
            <div className="space-y-3 lg:space-y-4">
              <Label htmlFor="employeeEmail" className="text-gray-300 font-medium text-sm lg:text-base">Email Address *</Label>
              <EnhancedInput
                id="employeeEmail"
                type="email"
                icon={<Mail className="h-4 w-4 lg:h-5 lg:w-5" />}
                value={formData.employeeEmail}
                onChange={(e) => setFormData({ ...formData, employeeEmail: e.target.value })}
                placeholder="your.email@company.com"
                required
              />
            </div>
            <div className="space-y-3 lg:space-y-4">
              <Label htmlFor="employeePhone" className="text-gray-300 font-medium text-sm lg:text-base">Phone Number</Label>
              <EnhancedInput
                id="employeePhone"
                icon={<Smartphone className="h-4 w-4 lg:h-5 lg:w-5" />}
                value={formData.employeePhone}
                onChange={(e) => setFormData({ ...formData, employeePhone: e.target.value })}
                placeholder="+1 (555) 123-4567"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2 lg:gap-6">
            <div className="space-y-3 lg:space-y-4">
              <Label htmlFor="department" className="text-gray-300 font-medium text-sm lg:text-base">Department</Label>
              <EnhancedInput
                id="department"
                value={formData.department}
                onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                placeholder="e.g., Engineering, Sales"
              />
            </div>
            <div className="space-y-3 lg:space-y-4">
              <Label htmlFor="position" className="text-gray-300 font-medium text-sm lg:text-base">Position</Label>
              <EnhancedInput
                id="position"
                value={formData.position}
                onChange={(e) => setFormData({ ...formData, position: e.target.value })}
                placeholder="e.g., Software Engineer"
              />
            </div>
          </div>

          <div className="space-y-3 lg:space-y-4">
            <Label htmlFor="hireDate" className="text-gray-300 font-medium text-sm lg:text-base">Hire Date</Label>
            <EnhancedInput
              id="hireDate"
              type="date"
              icon={<Calendar className="h-4 w-4 lg:h-5 lg:w-5" />}
              value={formData.hireDate}
              onChange={(e) => setFormData({ ...formData, hireDate: e.target.value })}
            />
          </div>
        </div>
      )}

      <div className="flex justify-between pt-4 lg:pt-6">
        <Button variant="outline" onClick={handleBack} className="rounded-xl lg:rounded-2xl border-gray-700 text-gray-300 hover:bg-gray-800/50 px-4 lg:px-6 xl:px-8 py-2 lg:py-3 xl:py-4 text-sm lg:text-base">
          <ArrowLeft className="h-4 w-4 lg:h-5 lg:w-5 mr-2 lg:mr-3" />
          Go Back
        </Button>
        <Button onClick={handleNext} className="rounded-xl lg:rounded-2xl bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 px-4 lg:px-6 xl:px-8 py-2 lg:py-3 xl:py-4 text-sm lg:text-base">
          Continue
          <ArrowRight className="h-4 w-4 lg:h-5 lg:w-5 ml-2 lg:ml-3" />
        </Button>
      </div>
    </div>
  );

  // Step 3: Admin Profile or OTP Verification - Responsive
  const renderStep3 = () => (
    <div className="space-y-6 lg:space-y-8">
      <div className="text-center space-y-3 lg:space-y-4">
        <h3 className={`text-2xl lg:text-3xl font-semibold text-white ${fontClasses.heading}`}>
          {userType === 'admin' ? 'Administrator Profile' : 'Company Verification'}
        </h3>
        <p className="text-gray-400 text-sm lg:text-lg">
          {userType === 'admin' 
            ? 'Set up your administrator account' 
            : 'Connect to your company workspace'
          }
        </p>
      </div>

      {userType === 'admin' ? (
        <div className="space-y-4 lg:space-y-6">
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2 lg:gap-6">
            <div className="space-y-3 lg:space-y-4">
              <Label htmlFor="adminFirstName" className="text-gray-300 font-medium text-sm lg:text-base">First Name *</Label>
              <EnhancedInput
                id="adminFirstName"
                value={formData.adminFirstName}
                onChange={(e) => setFormData({ ...formData, adminFirstName: e.target.value })}
                placeholder="Enter your first name"
                required
              />
            </div>
            <div className="space-y-3 lg:space-y-4">
              <Label htmlFor="adminLastName" className="text-gray-300 font-medium text-sm lg:text-base">Last Name *</Label>
              <EnhancedInput
                id="adminLastName"
                value={formData.adminLastName}
                onChange={(e) => setFormData({ ...formData, adminLastName: e.target.value })}
                placeholder="Enter your last name"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2 lg:gap-6">
            <div className="space-y-3 lg:space-y-4">
              <Label htmlFor="adminEmail" className="text-gray-300 font-medium text-sm lg:text-base">Admin Email *</Label>
              <EnhancedInput
                id="adminEmail"
                type="email"
                icon={<Mail className="h-4 w-4 lg:h-5 lg:w-5" />}
                value={formData.adminEmail}
                onChange={(e) => setFormData({ ...formData, adminEmail: e.target.value })}
                placeholder="admin@company.com"
                required
              />
            </div>
            <div className="space-y-3 lg:space-y-4">
              <Label htmlFor="adminPhone" className="text-gray-300 font-medium text-sm lg:text-base">Phone Number</Label>
              <EnhancedInput
                id="adminPhone"
                icon={<Phone className="h-4 w-4 lg:h-5 lg:w-5" />}
                value={formData.adminPhone}
                onChange={(e) => setFormData({ ...formData, adminPhone: e.target.value })}
                placeholder="+1 (555) 123-4567"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2 lg:gap-6">
            <div className="space-y-3 lg:space-y-4">
              <Label htmlFor="adminPassword" className="text-gray-300 font-medium text-sm lg:text-base">Password *</Label>
              <div className="relative">
                <EnhancedInput
                  id="adminPassword"
                  type={showPasswords.admin ? "text" : "password"}
                  icon={<Lock className="h-4 w-4 lg:h-5 lg:w-5" />}
                  value={formData.adminPassword}
                  onChange={(e) => setFormData({ ...formData, adminPassword: e.target.value })}
                  placeholder="Create secure password"
                  required
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-2 lg:right-3 top-1/2 transform -translate-y-1/2 h-6 w-6 lg:h-8 lg:w-8 p-0 text-gray-400 hover:text-gray-300 rounded-lg lg:rounded-xl"
                  onClick={() => setShowPasswords(prev => ({ ...prev, admin: !prev.admin }))}
                >
                  {showPasswords.admin ? <EyeOff className="h-3 w-3 lg:h-4 lg:w-4" /> : <Eye className="h-3 w-3 lg:h-4 lg:w-4" />}
                </Button>
              </div>
            </div>
            <div className="space-y-3 lg:space-y-4">
              <Label htmlFor="confirmPassword" className="text-gray-300 font-medium text-sm lg:text-base">Confirm Password *</Label>
              <EnhancedInput
                id="confirmPassword"
                type={showPasswords.admin ? "text" : "password"}
                icon={<Lock className="h-4 w-4 lg:h-5 lg:w-5" />}
                value={formData.confirmPassword}
                onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                placeholder="Confirm your password"
                required
              />
            </div>
          </div>

          {formData.adminPassword && formData.confirmPassword && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              className={`p-3 lg:p-4 rounded-xl lg:rounded-2xl text-xs lg:text-sm font-medium backdrop-blur-sm ${
                formData.adminPassword === formData.confirmPassword 
                  ? 'bg-green-500/10 text-green-300 border border-green-500/30' 
                  : 'bg-red-500/10 text-red-300 border border-red-500/30'
              }`}
            >
              <div className="flex items-center space-x-2 lg:space-x-3">
                {formData.adminPassword === formData.confirmPassword ? (
                  <>
                    <CheckCircle className="h-4 w-4 lg:h-5 lg:w-5" />
                    <span>✓ Passwords match perfectly</span>
                  </>
                ) : (
                  <>
                    <div className="w-4 h-4 lg:w-5 lg:h-5 rounded-full bg-red-500 flex items-center justify-center">
                      <span className="text-white text-xs font-bold">!</span>
                    </div>
                    <span>✗ Passwords do not match</span>
                  </>
                )}
              </div>
            </motion.div>
          )}

          <div className="bg-gradient-to-r from-blue-500/10 to-purple-500/10 border border-blue-500/30 rounded-xl lg:rounded-2xl p-4 lg:p-6 backdrop-blur-sm">
            <div className="flex items-start space-x-3 lg:space-x-4">
              <ShieldCheck className="h-5 w-5 lg:h-6 lg:w-6 text-blue-400 mt-0.5 lg:mt-1" />
              <div>
                <h4 className="font-semibold text-blue-300 mb-1 lg:mb-2 text-base lg:text-lg">Administrator Privileges</h4>
                <p className="text-blue-300/80 text-sm lg:text-base leading-relaxed">
                  As an administrator, you'll have complete control over company settings, team management, 
                  security configurations, and AI-powered analytics.
                </p>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="space-y-6 lg:space-y-8">
          {/* Enhanced Company Search Component */}
          <CompanySearch 
            onCompanySelect={handleCompanySelect}
            selectedCompany={selectedCompany}
          />

          {!selectedCompany && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-3 lg:space-y-4"
            >
              <Label htmlFor="companyId" className="text-gray-300 font-medium text-sm lg:text-base">Company ID *</Label>
              <EnhancedInput
                id="companyId"
                icon={<Hash className="h-4 w-4 lg:h-5 lg:w-5" />}
                value={formData.companyId}
                onChange={(e) => setFormData({ ...formData, companyId: e.target.value })}
                placeholder="Enter company ID provided by your admin"
                required
              />
              <p className="text-xs lg:text-sm text-gray-500 mt-1 lg:mt-2">
                If you can't find your company in the search above, enter the Company ID manually provided by your administrator.
              </p>
            </motion.div>
          )}

          <div className="space-y-3 lg:space-y-4">
            <Label htmlFor="otpCode" className="text-gray-300 font-medium text-sm lg:text-base">Secure Access Code *</Label>
            <div className="flex flex-col sm:flex-row space-y-3 sm:space-y-0 sm:space-x-4">
              <div className="flex-1">
                <EnhancedInput
                  id="otpCode"
                  value={formData.otpCode}
                  onChange={(e) => setFormData({ ...formData, otpCode: e.target.value })}
                  placeholder="Enter 6-digit OTP from administrator"
                  required
                />
              </div>
              <Button 
                type="button" 
                variant="outline" 
                onClick={generateOtp}
                disabled={isLoading || (!selectedCompany && !formData.companyId)}
                className="whitespace-nowrap rounded-xl lg:rounded-2xl border-gray-700 text-gray-300 hover:bg-gray-800/50 px-4 lg:px-6 py-3 lg:py-4 h-auto text-sm lg:text-base"
              >
                {isLoading ? (
                  <Loader2 className="h-4 w-4 lg:h-5 lg:w-5 animate-spin" />
                ) : (
                  <Mail className="h-4 w-4 lg:h-5 lg:w-5" />
                )}
                <span className="ml-2 lg:ml-3">Request OTP</span>
              </Button>
            </div>
            <p className="text-xs lg:text-sm text-gray-500 mt-1 lg:mt-2">
              Contact your workspace administrator to get the secure access code. 
              This one-time password ensures secure onboarding and is valid for 15 minutes.
            </p>
          </div>

          {formData.generatedOtp && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-gradient-to-r from-blue-500/10 to-indigo-500/10 border border-blue-500/30 rounded-xl lg:rounded-2xl p-4 lg:p-6 backdrop-blur-sm"
            >
              <AlertDescription className="text-blue-300">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between space-y-2 sm:space-y-0">
                  <div className="flex items-center">
                    <Zap className="h-4 w-4 lg:h-5 lg:w-5 mr-2 lg:mr-3" />
                    <span className="text-sm lg:text-lg font-medium">Secure Access Code Generated</span>
                  </div>
                  <strong className="text-xl lg:text-2xl tracking-wider font-mono bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
                    {formData.generatedOtp}
                  </strong>
                </div>
              </AlertDescription>
            </motion.div>
          )}

          <div className="bg-gradient-to-r from-amber-500/10 to-orange-500/10 border border-amber-500/30 rounded-xl lg:rounded-2xl p-4 lg:p-6 backdrop-blur-sm">
            <div className="flex items-start space-x-3 lg:space-x-4">
              <Shield className="h-5 w-5 lg:h-6 lg:w-6 text-amber-400 mt-0.5 lg:mt-1" />
              <div>
                <h4 className="font-semibold text-amber-300 mb-1 lg:mb-2 text-base lg:text-lg">Secure Onboarding</h4>
                <p className="text-amber-300/80 text-sm lg:text-base leading-relaxed">
                  One-time passwords provide enterprise-grade security for team onboarding. 
                  Never share your OTP with anyone outside your organization.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="flex justify-between pt-4 lg:pt-6">
        <Button variant="outline" onClick={handleBack} className="rounded-xl lg:rounded-2xl border-gray-700 text-gray-300 hover:bg-gray-800/50 px-4 lg:px-6 xl:px-8 py-2 lg:py-3 xl:py-4 text-sm lg:text-base">
          <ArrowLeft className="h-4 w-4 lg:h-5 lg:w-5 mr-2 lg:mr-3" />
          Previous Step
        </Button>
        <Button onClick={handleNext} className="rounded-xl lg:rounded-2xl bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 px-4 lg:px-6 xl:px-8 py-2 lg:py-3 xl:py-4 text-sm lg:text-base">
          Continue
          <ArrowRight className="h-4 w-4 lg:h-5 lg:w-5 ml-2 lg:ml-3" />
        </Button>
      </div>
    </div>
  );

  // Step 4: Confirmation (Enhanced) - Responsive
  const renderStep4 = () => (
    <div className="space-y-6 lg:space-y-10 text-center">
      <motion.div
        initial={{ scale: 0, rotate: -180 }}
        animate={{ scale: 1, rotate: 0 }}
        transition={{ type: "spring", stiffness: 200, damping: 15 }}
        className="relative"
      >
        <div className="w-16 h-16 lg:w-20 lg:h-20 xl:w-24 xl:h-24 bg-gradient-to-br from-green-500 to-emerald-600 rounded-2xl lg:rounded-3xl flex items-center justify-center mx-auto shadow-xl lg:shadow-2xl shadow-green-500/30 relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-white/20 to-transparent"></div>
          <CheckCircle className="h-8 w-8 lg:h-10 lg:w-10 xl:h-12 xl:w-12 text-white relative z-10" />
        </div>
        <motion.div
          animate={{ 
            scale: [1, 1.2, 1],
            opacity: [0.5, 1, 0.5]
          }}
          transition={{ 
            duration: 2,
            repeat: Infinity
          }}
          className="absolute inset-0 rounded-2xl lg:rounded-3xl bg-green-400/20 blur-xl"
        />
      </motion.div>
      
      <div className="space-y-3 lg:space-y-4">
        <h3 className={`text-2xl lg:text-3xl xl:text-4xl font-semibold text-white ${fontClasses.heading}`}>
          Ready for Launch!
        </h3>
        <p className="text-gray-400 max-w-2xl mx-auto leading-relaxed text-sm lg:text-base xl:text-lg">
          {userType === 'admin' 
            ? 'Your enterprise is configured and ready to scale. Review the details below before launching your workspace.'
            : 'Welcome to the team! Your profile is set up and ready to connect with your company workspace.'
          }
        </p>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-gradient-to-br from-gray-800/40 to-gray-900/60 backdrop-blur-xl rounded-xl lg:rounded-2xl xl:rounded-3xl p-4 lg:p-6 xl:p-8 border border-gray-700/50 text-left shadow-xl lg:shadow-2xl"
      >
        <h4 className={`font-semibold text-white mb-4 lg:mb-6 text-lg lg:text-xl xl:text-2xl ${fontClasses.heading}`}>
          Launch Summary
        </h4>
        {userType === 'admin' ? (
          <div className="grid grid-cols-1 gap-4 lg:gap-6 xl:gap-8 text-sm lg:text-base">
            <div className="space-y-3 lg:space-y-4">
              <div className="flex justify-between items-center py-2 lg:py-3 border-b border-gray-700/30">
                <span className="text-gray-400">Company:</span>
                <span className="font-semibold text-white text-base lg:text-lg">{formData.companyName}</span>
              </div>
              <div className="flex justify-between items-center py-2 lg:py-3 border-b border-gray-700/30">
                <span className="text-gray-400">Industry:</span>
                <span className="font-semibold text-white">{formData.industry}</span>
              </div>
              <div className="flex justify-between items-center py-2 lg:py-3 border-b border-gray-700/30">
                <span className="text-gray-400">Company Email:</span>
                <span className="font-semibold text-white">{formData.companyEmail}</span>
              </div>
            </div>
            <div className="space-y-3 lg:space-y-4">
              <div className="flex justify-between items-center py-2 lg:py-3 border-b border-gray-700/30">
                <span className="text-gray-400">Administrator:</span>
                <span className="font-semibold text-white text-base lg:text-lg">{formData.adminFirstName} {formData.adminLastName}</span>
              </div>
              <div className="flex justify-between items-center py-2 lg:py-3 border-b border-gray-700/30">
                <span className="text-gray-400">Admin Email:</span>
                <span className="font-semibold text-white">{formData.adminEmail}</span>
              </div>
              <div className="flex justify-between items-center py-2 lg:py-3 border-b border-gray-700/30">
                <span className="text-gray-400">Company Size:</span>
                <span className="font-semibold text-white">{formData.companySize}</span>
              </div>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4 lg:gap-6 xl:gap-8 text-sm lg:text-base">
            <div className="space-y-3 lg:space-y-4">
              <div className="flex justify-between items-center py-2 lg:py-3 border-b border-gray-700/30">
                <span className="text-gray-400">Team Member:</span>
                <span className="font-semibold text-white text-base lg:text-lg">{formData.employeeFirstName} {formData.employeeLastName}</span>
              </div>
              <div className="flex justify-between items-center py-2 lg:py-3 border-b border-gray-700/30">
                <span className="text-gray-400">Email:</span>
                <span className="font-semibold text-white">{formData.employeeEmail}</span>
              </div>
              <div className="flex justify-between items-center py-2 lg:py-3 border-b border-gray-700/30">
                <span className="text-gray-400">Department:</span>
                <span className="font-semibold text-white">{formData.department || 'Not specified'}</span>
              </div>
            </div>
            <div className="space-y-3 lg:space-y-4">
              <div className="flex justify-between items-center py-2 lg:py-3 border-b border-gray-700/30">
                <span className="text-gray-400">Company:</span>
                <span className="font-semibold text-white text-base lg:text-lg">{selectedCompany ? selectedCompany.name : 'Manual ID Entry'}</span>
              </div>
              <div className="flex justify-between items-center py-2 lg:py-3 border-b border-gray-700/30">
                <span className="text-gray-400">Company ID:</span>
                <span className="font-semibold text-white font-mono text-xs lg:text-sm">{selectedCompany ? selectedCompany.id : formData.companyId}</span>
              </div>
              <div className="flex justify-between items-center py-2 lg:py-3 border-b border-gray-700/30">
                <span className="text-gray-400">Access Verified:</span>
                <span className="font-semibold text-white">{formData.otpCode ? '✅ Secure' : '❌ Pending'}</span>
              </div>
            </div>
          </div>
        )}
      </motion.div>

      <div className="flex justify-between pt-6 lg:pt-8">
        <Button variant="outline" onClick={handleBack} className="rounded-xl lg:rounded-2xl border-gray-700 text-gray-300 hover:bg-gray-800/50 px-4 lg:px-6 xl:px-8 py-2 lg:py-3 xl:py-4 text-sm lg:text-base">
          <ArrowLeft className="h-4 w-4 lg:h-5 lg:w-5 mr-2 lg:mr-3" />
          Review Details
        </Button>
        <Button 
          onClick={handleSubmit} 
          disabled={isLoading}
          className="rounded-xl lg:rounded-2xl bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-500 hover:to-emerald-500 text-white shadow-xl lg:shadow-2xl shadow-green-500/25 px-6 lg:px-8 xl:px-10 py-2 lg:py-3 xl:py-4 text-sm lg:text-base font-semibold"
        >
          {isLoading ? (
            <Loader2 className="h-4 w-4 lg:h-5 lg:w-5 animate-spin mr-2 lg:mr-3" />
          ) : (
            <Rocket className="h-4 w-4 lg:h-5 lg:w-5 mr-2 lg:mr-3" />
          )}
          {isLoading ? 'Launching...' : 'Launch Workspace'}
        </Button>
      </div>
    </div>
  );

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
    >
      <Card className="w-full max-w-2xl lg:max-w-4xl xl:max-w-5xl mx-auto border-gray-700/50 bg-gray-900/40 backdrop-blur-xl shadow-xl lg:shadow-2xl rounded-xl lg:rounded-2xl xl:rounded-3xl overflow-hidden relative">
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-500 to-purple-600"></div>
        <CardHeader className="pb-4 lg:pb-6 xl:pb-8 pt-6 lg:pt-8 xl:pt-10 px-4 lg:px-6 xl:px-8">
          <div className="space-y-4 lg:space-y-6">
            <div className="text-center space-y-3 lg:space-y-4">
              <CardTitle className={`text-2xl lg:text-3xl xl:text-4xl text-white ${fontClasses.heading}`}>
                Create Your Space
              </CardTitle>
              <CardDescription className="text-gray-400 text-sm lg:text-lg xl:text-xl">
                {steps[currentStep - 1]}
              </CardDescription>
            </div>
            
            {/* Enhanced Progress Bar */}
            <div className="space-y-3 lg:space-y-4">
              <Progress value={progress} className="h-2 lg:h-3 bg-gray-800/40 rounded-full">
                <div 
                  className="h-full bg-gradient-to-r from-blue-500 to-purple-600 rounded-full transition-all duration-700 ease-out shadow-lg shadow-blue-500/30"
                  style={{ width: `${progress}%` }}
                />
              </Progress>
              <div className="flex justify-between text-xs lg:text-sm text-gray-400">
                {steps.map((step, index) => (
                  <motion.div 
                    key={index} 
                    className="flex flex-col items-center"
                    whileHover={{ scale: 1.05 }}
                  >
                    <div className={`w-6 h-6 lg:w-8 lg:h-8 xl:w-10 xl:h-10 rounded-lg lg:rounded-xl xl:rounded-2xl flex items-center justify-center text-xs lg:text-sm font-semibold mb-1 lg:mb-2 transition-all duration-300 ${
                      currentStep > index + 1 
                        ? 'bg-green-500 text-white shadow-lg shadow-green-500/25' 
                        : currentStep === index + 1
                        ? 'bg-gradient-to-r from-blue-500 to-purple-600 text-white shadow-lg shadow-blue-500/25'
                        : 'bg-gray-700 text-gray-400'
                    }`}>
                      {currentStep > index + 1 ? (
                        <CheckCircle className="h-3 w-3 lg:h-4 lg:w-4 xl:h-5 xl:w-5" />
                      ) : (
                        index + 1
                      )}
                    </div>
                    <span className={`text-xs ${currentStep >= index + 1 ? 'text-white font-medium' : ''} hidden xs:block`}>
                      {step}
                    </span>
                  </motion.div>
                ))}
              </div>
            </div>
          </div>
        </CardHeader>

        <CardContent className="px-4 lg:px-6 xl:px-8 pb-6 lg:pb-8 xl:pb-10">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentStep}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.4 }}
            >
              {currentStep === 1 && renderStep1()}
              {currentStep === 2 && renderStep2()}
              {currentStep === 3 && renderStep3()}
              {currentStep === 4 && renderStep4()}
            </motion.div>
          </AnimatePresence>
        </CardContent>
      </Card>
    </motion.div>
  );
};

export default AuthPage;

// Add these CSS animations to your global CSS
const globalStyles = `
@keyframes orbital-1 {
  0%, 100% { transform: translate(0, 0) rotate(0deg); }
  25% { transform: translate(20px, -20px) rotate(90deg); }
  50% { transform: translate(0, -40px) rotate(180deg); }
  75% { transform: translate(-20px, -20px) rotate(270deg); }
}

@keyframes orbital-2 {
  0%, 100% { transform: translate(0, 0) rotate(0deg); }
  25% { transform: translate(-30px, 10px) rotate(-90deg); }
  50% { transform: translate(-20px, 30px) rotate(-180deg); }
  75% { transform: translate(10px, 20px) rotate(-270deg); }
}

@keyframes orbital-3 {
  0%, 100% { transform: translate(0, 0) scale(1); }
  50% { transform: translate(10px, -10px) scale(1.1); }
}

@keyframes grid-flow {
  0% { background-position: 0 0; }
  100% { background-position: 40px 40px; }
}

.animate-orbital-1 { animation: orbital-1 20s ease-in-out infinite; }
.animate-orbital-2 { animation: orbital-2 25s ease-in-out infinite; }
.animate-orbital-3 { animation: orbital-3 15s ease-in-out infinite; }
.animate-grid-flow { animation: grid-flow 20s linear infinite; }

/* Responsive line-clamp utilities */
.line-clamp-2 {
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.line-clamp-3 {
  display: -webkit-box;
  -webkit-line-clamp: 3;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

/* Responsive breakpoints */
@media (min-width: 475px) {
  .xs\\:inline {
    display: inline;
  }
  
  .xs\\:block {
    display: block;
  }
}
`;