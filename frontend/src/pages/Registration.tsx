import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { 
  User, 
  Mail, 
  Lock, 
  Camera, 
  Briefcase, 
  Users, 
  Brain, 
  Shield, 
  Bell, 
  Check, 
  ArrowLeft, 
  ArrowRight,
  Sparkles,
  Zap,
  Heart,
  Code,
  Palette,
  BarChart3,
  MessageSquare,
  Calendar,
  Target,
  Rocket,
  Loader2,
  Star,
  Globe,
  ShieldCheck,
  Bot,
  Lightbulb,
  TrendingUp,
  Eye,
  EyeOff
} from 'lucide-react';
import { authAPI, RegisterRequest } from '@/services/api';

export const Registration = () => {
  const [currentStep, setCurrentStep] = useState(1);
  const [isComplete, setIsComplete] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [submitError, setSubmitError] = useState<string>('');
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState<RegisterRequest>({
    full_name: '',
    email: '',
    password: '',
    avatar_url: '',
    department: '',
    role: 'employee',
    work_style: '',
    skills: [],
    enable_2fa: false,
    accept_terms: false,
    receive_notifications: true,
    dashboard_layout: 'grid',
    theme: 'light',
    wellness_goals: []
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const navigate = useNavigate();

  const departments = [
    { 
      id: 'engineering', 
      name: 'Engineering', 
      icon: Code, 
      color: 'bg-gradient-to-br from-blue-500 to-cyan-500',
      features: ['Code Analysis', 'Tech Insights', 'API Integration']
    },
    { 
      id: 'design', 
      name: 'Design', 
      icon: Palette, 
      color: 'bg-gradient-to-br from-purple-500 to-pink-500',
      features: ['UI/UX Insights', 'Design Trends', 'Creative Tools']
    },
    { 
      id: 'marketing', 
      name: 'Marketing', 
      icon: Target, 
      color: 'bg-gradient-to-br from-pink-500 to-red-500',
      features: ['Campaign Analytics', 'Market Insights', 'Content Strategy']
    },
    { 
      id: 'sales', 
      name: 'Sales', 
      icon: BarChart3, 
      color: 'bg-gradient-to-br from-emerald-500 to-green-500',
      features: ['Lead Tracking', 'Performance Metrics', 'Client Insights']
    },
    { 
      id: 'hr', 
      name: 'Human Resources', 
      icon: Users, 
      color: 'bg-gradient-to-br from-orange-500 to-amber-500',
      features: ['Team Analytics', 'Wellness Tracking', 'HR Automation']
    },
    { 
      id: 'product', 
      name: 'Product', 
      icon: Rocket, 
      color: 'bg-gradient-to-br from-cyan-500 to-blue-500',
      features: ['Roadmap Planning', 'User Feedback', 'Feature Analytics']
    }
  ];

  const workStyles = [
    { 
      id: 'collaborative', 
      name: 'Collaborative', 
      desc: 'Love working in teams and brainstorming together',
      icon: Users,
      color: 'text-blue-400'
    },
    { 
      id: 'independent', 
      name: 'Independent', 
      desc: 'Prefer focused work with minimal interruptions',
      icon: Brain,
      color: 'text-purple-400'
    },
    { 
      id: 'hybrid', 
      name: 'Hybrid', 
      desc: 'Balance between team work and solo deep work',
      icon: Lightbulb,
      color: 'text-emerald-400'
    }
  ];

  const availableSkills = [
    'Project Management', 'Data Analysis', 'Content Creation', 'Communication',
    'Problem Solving', 'Leadership', 'Creative Thinking', 'Technical Writing',
    'Research', 'Strategy Planning', 'Customer Relations', 'Innovation'
  ];

  const wellnessGoals = [
    'Regular Breaks', 'Mindfulness', 'Physical Activity', 'Work-Life Balance',
    'Stress Management', 'Healthy Eating', 'Quality Sleep', 'Social Connection'
  ];

  const validateStep = (step: number) => {
    const newErrors: Record<string, string> = {};
    
    if (step === 1) {
      if (!formData.full_name.trim()) newErrors.full_name = 'Full name is required';
      if (!formData.email.trim()) newErrors.email = 'Email is required';
      if (formData.email && !/\S+@\S+\.\S+/.test(formData.email)) {
        newErrors.email = 'Please enter a valid email address';
      }
      if (!formData.password.trim()) newErrors.password = 'Password is required';
      if (formData.password.length < 6) newErrors.password = 'Password must be at least 6 characters';
    }
    
    if (step === 2) {
      if (!formData.department) newErrors.department = 'Please select a department';
      if (!formData.role.trim()) newErrors.role = 'Role is required';
      if (!formData.work_style) newErrors.work_style = 'Please select a work style';
    }
    
    if (step === 3) {
      if (!formData.accept_terms) newErrors.accept_terms = 'You must accept the terms';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const nextStep = () => {
    if (validateStep(currentStep)) {
      setCurrentStep(prev => Math.min(prev + 1, 3));
    }
  };

  const prevStep = () => {
    setCurrentStep(prev => Math.max(prev - 1, 1));
    setErrors({});
    setSubmitError('');
  };

  const handleSubmit = async () => {
    if (!validateStep(3)) return;
  
    setIsLoading(true);
    setSubmitError('');
  
    try {
      const registrationData: RegisterRequest = {
        full_name: formData.full_name,
        email: formData.email,
        password: formData.password,
        department: formData.department,
        role: formData.role,
        work_style: formData.work_style,
        skills: formData.skills,
        enable_2fa: formData.enable_2fa,
        accept_terms: formData.accept_terms,
        receive_notifications: formData.receive_notifications,
        avatar_url: formData.avatar_url || undefined,
        dashboard_layout: formData.dashboard_layout,
        theme: formData.theme,
        wellness_goals: formData.wellness_goals
      };
  
      const response = await authAPI.register(registrationData);
      
      // Token is automatically stored by the API interceptor
      setIsComplete(true);
      
      // Redirect to dashboard after delay
      setTimeout(() => {
        navigate('/');
      }, 2000);
  
    } catch (error: any) {
      console.error('Registration error:', error);
      const errorMessage = error.response?.data?.detail || 'Registration failed. Please try again.';
      setSubmitError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const toggleSkill = (skill: string) => {
    setFormData(prev => ({
      ...prev,
      skills: prev.skills.includes(skill) 
        ? prev.skills.filter(s => s !== skill)
        : [...prev.skills, skill]
    }));
  };

  const toggleWellnessGoal = (goal: string) => {
    setFormData(prev => ({
      ...prev,
      wellness_goals: prev.wellness_goals.includes(goal) 
        ? prev.wellness_goals.filter(g => g !== goal)
        : [...prev.wellness_goals, goal]
    }));
  };

  const updateFormData = (field: string, value: string | boolean) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
    if (submitError) {
      setSubmitError('');
    }
  };

  const handleAvatarUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const avatarUrl = URL.createObjectURL(file);
      setFormData(prev => ({ ...prev, avatar_url: avatarUrl }));
    }
  };

  const stepVariants = {
    hidden: { opacity: 0, x: 50 },
    visible: { opacity: 1, x: 0 },
    exit: { opacity: 0, x: -50 }
  };

  const floatingShapes = [
    { size: 'w-64 h-64', position: 'top-10 -right-20', color: 'bg-gradient-to-br from-indigo-400 to-purple-600', delay: 0 },
    { size: 'w-48 h-48', position: 'top-1/2 -left-16', color: 'bg-gradient-to-br from-pink-400 to-orange-400', delay: 1 },
    { size: 'w-32 h-32', position: 'bottom-20 right-1/4', color: 'bg-gradient-to-br from-emerald-400 to-cyan-400', delay: 2 },
  ];

  if (isComplete) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          className="max-w-md w-full"
        >
          <Card className="backdrop-blur-xl bg-white/10 border-white/20 text-white shadow-2xl">
            <CardContent className="p-8 text-center">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
                className="w-20 h-20 mx-auto mb-6 bg-gradient-to-r from-emerald-400 to-cyan-400 rounded-full flex items-center justify-center shadow-lg"
              >
                <Check className="w-10 h-10 text-white" />
              </motion.div>
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
              >
                <h2 className="text-2xl font-bold mb-2 font-['Clash_Display'] bg-gradient-to-r from-emerald-400 to-cyan-400 bg-clip-text text-transparent">
                  Welcome aboard!
                </h2>
                <p className="text-white/80 mb-6 font-['Satoshi']">
                  Your AI assistant is being personalized just for you. Redirecting to dashboard...
                </p>
                <div className="flex justify-center">
                  <Loader2 className="w-6 h-6 animate-spin text-emerald-400" />
                </div>
              </motion.div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 relative overflow-hidden">
      {/* Floating Background Shapes */}
      {floatingShapes.map((shape, index) => (
        <motion.div
          key={index}
          className={`absolute ${shape.size} ${shape.position} ${shape.color} rounded-full opacity-20 blur-3xl`}
          animate={{ 
            rotate: 360,
            scale: [1, 1.1, 1],
            y: [0, -20, 0]
          }}
          transition={{ 
            duration: 20 + index * 5, 
            repeat: Infinity, 
            delay: shape.delay 
          }}
        />
      ))}

      <div className="relative z-10 min-h-screen flex items-center justify-center p-4">
        <div className="max-w-2xl w-full">
          {/* Header with Login Link */}
          <motion.div 
            className="mb-8 text-center"
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <motion.div
              animate={{ rotate: [0, 10, -10, 0] }}
              transition={{ duration: 4, repeat: Infinity }}
              className="flex items-center justify-center space-x-4 mb-4"
            >
              <Sparkles className="w-8 h-8 text-yellow-400" />
              <h1 className="text-4xl font-bold font-['Clash_Display'] bg-gradient-to-r from-yellow-400 via-cyan-400 to-purple-400 bg-clip-text text-transparent">
                AI Employee Assistant
              </h1>
              <Zap className="w-8 h-8 text-cyan-400" />
            </motion.div>
            <p className="text-white/80 font-['Satoshi'] text-lg mb-4">
              Let's set up your intelligent workspace companion
            </p>
            
            <div className="flex justify-center">
              <p className="text-white/60 text-sm">
                Already have an account?{' '}
                <Link to="/login" className="text-cyan-400 hover:text-cyan-300 underline transition-colors">
                  Sign in here
                </Link>
              </p>
            </div>
            
            {/* Progress Bar */}
            <div className="mt-6 max-w-md mx-auto">
              <div className="flex justify-between text-sm text-white/60 mb-2 font-['Satoshi']">
                <span>Step {currentStep} of 3</span>
                <span>{Math.round((currentStep / 3) * 100)}% Complete</span>
              </div>
              <div className="relative">
                <Progress value={(currentStep / 3) * 100} className="h-3 bg-white/20 rounded-full" />
                <motion.div
                  className="absolute top-0 left-0 h-3 bg-gradient-to-r from-cyan-400 to-purple-400 rounded-full"
                  initial={{ width: 0 }}
                  animate={{ width: `${(currentStep / 3) * 100}%` }}
                  transition={{ duration: 0.5 }}
                />
              </div>
            </div>
          </motion.div>

          {/* Error Message */}
          {submitError && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-4 p-4 bg-gradient-to-r from-red-500/20 to-pink-500/20 border border-red-400/30 rounded-lg backdrop-blur-sm"
            >
              <div className="flex items-center space-x-2">
                <ShieldCheck className="w-4 h-4 text-red-400" />
                <p className="text-red-300 text-sm font-['Satoshi']">{submitError}</p>
              </div>
            </motion.div>
          )}

          {/* Step Content */}
          <AnimatePresence mode="wait">
            {/* Step 1: Personal Information */}
            {currentStep === 1 && (
              <motion.div
                key="step1"
                variants={stepVariants}
                initial="hidden"
                animate="visible"
                exit="exit"
                transition={{ duration: 0.5 }}
              >
                <Card className="backdrop-blur-xl bg-white/10 border-white/20 shadow-2xl">
                  <CardHeader className="text-center">
                    <motion.div
                      animate={{ scale: [1, 1.02, 1] }}
                      transition={{ duration: 2, repeat: Infinity }}
                    >
                      <CardTitle className="text-2xl text-white flex items-center justify-center space-x-2 font-['Clash_Display']">
                        <User className="w-6 h-6 text-cyan-400" />
                        <span>Personal Information</span>
                      </CardTitle>
                    </motion.div>
                    <CardDescription className="text-white/70 font-['Satoshi']">
                      We'll use this information to personalize your AI assistant experience
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    {/* Avatar Upload */}
                    <div className="flex flex-col items-center space-y-4">
                      <motion.div
                        whileHover={{ scale: 1.05 }}
                        className="relative"
                      >
                        <Avatar className="w-24 h-24 border-4 border-cyan-400/30 shadow-lg">
                          <AvatarImage src={formData.avatar_url} />
                          <AvatarFallback className="bg-gradient-to-br from-cyan-500 to-blue-500 text-white text-2xl font-bold">
                            {formData.full_name.charAt(0) || 'U'}
                          </AvatarFallback>
                        </Avatar>
                        <input
                          type="file"
                          id="avatar-upload"
                          className="hidden"
                          accept="image/*"
                          onChange={handleAvatarUpload}
                        />
                        <label htmlFor="avatar-upload">
                          <motion.div
                            whileHover={{ scale: 1.1 }}
                            whileTap={{ scale: 0.9 }}
                          >
                            <Button 
                              size="sm" 
                              className="absolute -bottom-2 -right-2 w-8 h-8 rounded-full p-0 bg-gradient-to-r from-cyan-400 to-blue-400 hover:from-cyan-500 hover:to-blue-500 cursor-pointer shadow-lg"
                            >
                              <Camera className="w-4 h-4" />
                            </Button>
                          </motion.div>
                        </label>
                      </motion.div>
                      <p className="text-white/60 text-sm font-['DM_Sans']">
                        Optional: Upload a profile picture
                      </p>
                    </div>

                    {/* Form Fields */}
                    <div className="grid gap-4">
                      {[
                        { field: 'full_name', label: 'Full Name', icon: User, type: 'text', placeholder: 'Enter your full name' },
                        { field: 'email', label: 'Email Address', icon: Mail, type: 'email', placeholder: 'your.email@company.com' },
                      ].map(({ field, label, icon: Icon, type, placeholder }) => (
                        <div key={field} className="space-y-2">
                          <Label className="text-white font-['Plus_Jakarta_Sans'] flex items-center space-x-2">
                            <Icon className="w-4 h-4" />
                            <span>{label}</span>
                          </Label>
                          <div className="relative">
                            <Input
                              type={type}
                              placeholder={placeholder}
                              className="pl-10 bg-white/5 border-white/20 text-white placeholder:text-white/40 font-['Inter'] h-12 rounded-xl"
                              value={formData[field as keyof typeof formData] as string}
                              onChange={(e) => updateFormData(field, e.target.value)}
                            />
                            <Icon className="absolute left-3 top-3.5 h-5 w-5 text-white/40" />
                          </div>
                          {errors[field] && (
                            <motion.p 
                              initial={{ opacity: 0 }}
                              animate={{ opacity: 1 }}
                              className="text-red-400 text-sm font-['Satoshi']"
                            >
                              {errors[field]}
                            </motion.p>
                          )}
                        </div>
                      ))}
                      
                      {/* Password Field with Toggle */}
                      <div className="space-y-2">
                        <Label className="text-white font-['Plus_Jakarta_Sans'] flex items-center space-x-2">
                          <Lock className="w-4 h-4" />
                          <span>Password</span>
                        </Label>
                        <div className="relative">
                          <Input
                            type={showPassword ? "text" : "password"}
                            placeholder="Create a secure password"
                            className="pl-10 pr-10 bg-white/5 border-white/20 text-white placeholder:text-white/40 font-['Inter'] h-12 rounded-xl"
                            value={formData.password}
                            onChange={(e) => updateFormData('password', e.target.value)}
                          />
                          <Lock className="absolute left-3 top-3.5 h-5 w-5 text-white/40" />
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            className="absolute right-3 top-3.5 h-5 w-5 text-white/40 hover:text-white/60"
                            onClick={() => setShowPassword(!showPassword)}
                          >
                            {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                          </Button>
                        </div>
                        {errors.password && (
                          <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-red-400 text-sm">
                            {errors.password}
                          </motion.p>
                        )}
                      </div>
                    </div>

                    <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                      <Button 
                        onClick={nextStep}
                        className="w-full bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600 text-white font-medium font-['Plus_Jakarta_Sans'] h-12 rounded-xl text-lg shadow-lg"
                      >
                        Continue to Work Details <ArrowRight className="w-5 h-5 ml-2" />
                      </Button>
                    </motion.div>
                  </CardContent>
                </Card>
              </motion.div>
            )}

            {/* Step 2: Work Preferences */}
            {currentStep === 2 && (
              <motion.div
                key="step2"
                variants={stepVariants}
                initial="hidden"
                animate="visible"
                exit="exit"
                transition={{ duration: 0.5 }}
              >
                <Card className="backdrop-blur-xl bg-white/10 border-white/20 shadow-2xl">
                  <CardHeader className="text-center">
                    <motion.div
                      animate={{ scale: [1, 1.02, 1] }}
                      transition={{ duration: 2, repeat: Infinity }}
                    >
                      <CardTitle className="text-2xl text-white flex items-center justify-center space-x-2 font-['Clash_Display']">
                        <Briefcase className="w-6 h-6 text-purple-400" />
                        <span>Work Preferences</span>
                      </CardTitle>
                    </motion.div>
                    <CardDescription className="text-white/70 font-['Satoshi']">
                      Help us understand your work style to customize your AI assistant
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    {/* Department Selection */}
                    <div className="space-y-4">
                      <Label className="text-white text-lg font-['DM_Sans'] flex items-center space-x-2">
                        <Globe className="w-5 h-5 text-blue-400" />
                        <span>Department</span>
                      </Label>
                      <div className="grid grid-cols-2 gap-3">
                        {departments.map((dept) => (
                          <motion.div
                            key={dept.id}
                            whileHover={{ scale: 1.03, y: -2 }}
                            whileTap={{ scale: 0.98 }}
                            className={`p-4 rounded-xl border-2 cursor-pointer transition-all backdrop-blur-sm ${
                              formData.department === dept.id 
                                ? 'border-cyan-400 bg-cyan-400/20 shadow-lg' 
                                : 'border-white/20 bg-white/5 hover:border-white/40 hover:bg-white/10'
                            }`}
                            onClick={() => updateFormData('department', dept.id)}
                          >
                            <div className="flex items-center space-x-3">
                              <div className={`w-12 h-12 ${dept.color} rounded-lg flex items-center justify-center shadow-lg`}>
                                <dept.icon className="w-6 h-6 text-white" />
                              </div>
                              <div className="flex-1">
                                <span className="text-white font-semibold font-['Plus_Jakarta_Sans'] block">
                                  {dept.name}
                                </span>
                                <div className="flex flex-wrap gap-1 mt-1">
                                  {dept.features.slice(0, 2).map((feature, idx) => (
                                    <Badge key={idx} variant="secondary" className="text-xs bg-white/10 text-white/80">
                                      {feature}
                                    </Badge>
                                  ))}
                                </div>
                              </div>
                            </div>
                          </motion.div>
                        ))}
                      </div>
                      {errors.department && (
                        <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-red-400 text-sm">
                          {errors.department}
                        </motion.p>
                      )}
                    </div>

                    {/* Role Input */}
                    <div className="space-y-2">
                      <Label className="text-white font-['Plus_Jakarta_Sans'] flex items-center space-x-2">
                        <Star className="w-4 h-4 text-yellow-400" />
                        <span>Your Role</span>
                      </Label>
                      <Input
                        placeholder="e.g. Senior Frontend Developer, Product Manager"
                        className="bg-white/5 border-white/20 text-white placeholder:text-white/40 font-['Inter'] h-12 rounded-xl"
                        value={formData.role}
                        onChange={(e) => updateFormData('role', e.target.value)}
                      />
                      {errors.role && <p className="text-red-400 text-sm">{errors.role}</p>}
                    </div>

                    {/* Work Style */}
                    <div className="space-y-4">
                      <Label className="text-white text-lg font-['DM_Sans'] flex items-center space-x-2">
                        <TrendingUp className="w-5 h-5 text-green-400" />
                        <span>Work Style</span>
                      </Label>
                      <RadioGroup 
                        value={formData.work_style} 
                        onValueChange={(value) => updateFormData('work_style', value)}
                        className="space-y-3"
                      >
                        {workStyles.map((style) => (
                          <motion.div
                            key={style.id}
                            whileHover={{ scale: 1.02 }}
                            className={`flex items-start space-x-3 p-4 rounded-xl backdrop-blur-sm border transition-all ${
                              formData.work_style === style.id
                                ? 'border-cyan-400 bg-cyan-400/20'
                                : 'border-white/10 bg-white/5 hover:border-white/30'
                            }`}
                          >
                            <RadioGroupItem 
                              value={style.id} 
                              className="mt-1 border-2 data-[state=checked]:bg-cyan-400 data-[state=checked]:border-cyan-400" 
                            />
                            <div className="flex items-start space-x-3 flex-1">
                              <style.icon className={`w-5 h-5 mt-0.5 ${style.color}`} />
                              <div className="flex-1">
                                <Label className="text-white font-semibold cursor-pointer font-['Plus_Jakarta_Sans'] block">
                                  {style.name}
                                </Label>
                                <p className="text-white/60 text-sm mt-1 font-['Satoshi']">
                                  {style.desc}
                                </p>
                              </div>
                            </div>
                          </motion.div>
                        ))}
                      </RadioGroup>
                      {errors.work_style && <p className="text-red-400 text-sm">{errors.work_style}</p>}
                    </div>

                    {/* Skills Selection */}
                    <div className="space-y-4">
                      <Label className="text-white text-lg font-['DM_Sans'] flex items-center space-x-2">
                        <Bot className="w-5 h-5 text-purple-400" />
                        <span>
                          Skills & Interests <span className="text-white/60 text-sm">(Select all that apply)</span>
                        </span>
                      </Label>
                      <div className="grid grid-cols-2 gap-3">
                        {availableSkills.map((skill) => (
                          <motion.div
                            key={skill}
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                          >
                            <Badge
                              variant={formData.skills.includes(skill) ? "default" : "outline"}
                              className={`cursor-pointer p-3 w-full justify-center transition-all font-['Plus_Jakarta_Sans'] text-sm h-auto rounded-lg ${
                                formData.skills.includes(skill)
                                  ? 'bg-gradient-to-r from-emerald-400 to-cyan-400 text-white shadow-lg'
                                  : 'border-white/20 text-white/70 hover:border-white/40 hover:bg-white/10'
                              }`}
                              onClick={() => toggleSkill(skill)}
                            >
                              {skill}
                            </Badge>
                          </motion.div>
                        ))}
                      </div>
                    </div>

                    <div className="flex space-x-3">
                      <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} className="flex-1">
                        <Button 
                          variant="outline"
                          onClick={prevStep}
                          className="w-full border-white/20 text-white hover:bg-white/10 font-['Plus_Jakarta_Sans'] h-12 rounded-xl"
                        >
                          <ArrowLeft className="w-5 h-5 mr-2" /> Back
                        </Button>
                      </motion.div>
                      <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} className="flex-1">
                        <Button 
                          onClick={nextStep}
                          className="w-full bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 font-['Plus_Jakarta_Sans'] h-12 rounded-xl text-lg shadow-lg"
                        >
                          Security Settings <ArrowRight className="w-5 h-5 ml-2" />
                        </Button>
                      </motion.div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            )}

            {/* Step 3: Security & Preferences */}
            {currentStep === 3 && (
              <motion.div
                key="step3"
                variants={stepVariants}
                initial="hidden"
                animate="visible"
                exit="exit"
                transition={{ duration: 0.5 }}
              >
                <Card className="backdrop-blur-xl bg-white/10 border-white/20 shadow-2xl">
                  <CardHeader className="text-center">
                    <motion.div
                      animate={{ scale: [1, 1.02, 1] }}
                      transition={{ duration: 2, repeat: Infinity }}
                    >
                      <CardTitle className="text-2xl text-white flex items-center justify-center space-x-2 font-['Clash_Display']">
                        <Shield className="w-6 h-6 text-emerald-400" />
                        <span>Security & Preferences</span>
                      </CardTitle>
                    </motion.div>
                    <CardDescription className="text-white/70 font-['Satoshi']">
                      Final step to secure your account and set communication preferences
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    {/* Security Settings */}
                    <div className="space-y-4">
                      <h3 className="text-lg font-semibold text-white flex items-center space-x-2 font-['DM_Sans']">
                        <ShieldCheck className="w-5 h-5 text-emerald-400" />
                        <span>Security Settings</span>
                      </h3>
                      
                      <motion.div
                        whileHover={{ scale: 1.01 }}
                        className="p-4 rounded-xl bg-white/5 border border-white/10 backdrop-blur-sm"
                      >
                        <div className="flex items-center justify-between">
                          <div>
                            <Label className="text-white font-semibold font-['Plus_Jakarta_Sans'] flex items-center space-x-2">
                              <Lock className="w-4 h-4 text-emerald-400" />
                              <span>Two-Factor Authentication</span>
                            </Label>
                            <p className="text-white/60 text-sm mt-1 font-['Satoshi']">
                              Add an extra layer of security to your account
                            </p>
                          </div>
                          <Switch
                            checked={formData.enable_2fa}
                            onCheckedChange={(checked) => updateFormData('enable_2fa', checked)}
                            className="data-[state=checked]:bg-emerald-400"
                          />
                        </div>
                      </motion.div>
                    </div>

                    {/* Notifications */}
                    <div className="space-y-4">
                      <h3 className="text-lg font-semibold text-white flex items-center space-x-2 font-['DM_Sans']">
                        <Bell className="w-5 h-5 text-cyan-400" />
                        <span>Communication Preferences</span>
                      </h3>
                      
                      <motion.div
                        whileHover={{ scale: 1.01 }}
                        className="p-4 rounded-xl bg-white/5 border border-white/10 backdrop-blur-sm"
                      >
                        <div className="flex items-start space-x-3">
                          <Checkbox
                            checked={formData.receive_notifications}
                            onCheckedChange={(checked) => updateFormData('receive_notifications', checked)}
                            className="mt-1 border-white/40 data-[state=checked]:bg-cyan-400 data-[state=checked]:border-cyan-400"
                          />
                          <div>
                            <Label className="text-white font-semibold cursor-pointer font-['Plus_Jakarta_Sans']">
                              Receive Notifications
                            </Label>
                            <p className="text-white/60 text-sm mt-1 font-['Satoshi']">
                              Get updates about AI suggestions, task reminders, and important alerts
                            </p>
                          </div>
                        </div>
                      </motion.div>
                    </div>

                    {/* Wellness Goals */}
                    <div className="space-y-4">
                      <Label className="text-white text-lg font-['DM_Sans'] flex items-center space-x-2">
                        <Heart className="w-5 h-5 text-pink-400" />
                        <span>Wellness Goals <span className="text-white/60 text-sm">(Optional)</span></span>
                      </Label>
                      <div className="grid grid-cols-2 gap-3">
                        {wellnessGoals.map((goal) => (
                          <motion.div
                            key={goal}
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                          >
                            <Badge
                              variant={formData.wellness_goals.includes(goal) ? "default" : "outline"}
                              className={`cursor-pointer p-3 w-full justify-center transition-all font-['Plus_Jakarta_Sans'] text-sm h-auto rounded-lg ${
                                formData.wellness_goals.includes(goal)
                                  ? 'bg-gradient-to-r from-pink-400 to-purple-400 text-white shadow-lg'
                                  : 'border-white/20 text-white/70 hover:border-white/40 hover:bg-white/10'
                              }`}
                              onClick={() => toggleWellnessGoal(goal)}
                            >
                              {goal}
                            </Badge>
                          </motion.div>
                        ))}
                      </div>
                    </div>

                    {/* Terms and Conditions */}
                    <div className="space-y-4">
                      <motion.div
                        whileHover={{ scale: 1.01 }}
                        className="p-4 rounded-xl bg-gradient-to-r from-emerald-500/10 to-cyan-500/10 border border-emerald-400/30 backdrop-blur-sm"
                      >
                        <div className="flex items-start space-x-3">
                          <Checkbox
                            checked={formData.accept_terms}
                            onCheckedChange={(checked) => updateFormData('accept_terms', checked)}
                            className="mt-1 border-white/40 data-[state=checked]:bg-emerald-400 data-[state=checked]:border-emerald-400"
                          />
                          <div>
                            <Label className="text-white font-semibold cursor-pointer font-['Plus_Jakarta_Sans']">
                              Accept Terms and Privacy Policy
                            </Label>
                            <p className="text-white/60 text-sm mt-1 font-['Satoshi']">
                              I agree to the <span className="text-emerald-400 underline cursor-pointer">Terms of Service</span> and <span className="text-emerald-400 underline cursor-pointer">Privacy Policy</span>
                            </p>
                          </div>
                        </div>
                        {errors.accept_terms && (
                          <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-red-400 text-sm mt-2">
                            {errors.accept_terms}
                          </motion.p>
                        )}
                      </motion.div>
                    </div>

                    {/* AI Features Preview */}
                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.2 }}
                      className="p-6 rounded-xl bg-gradient-to-r from-indigo-500/20 via-purple-500/20 to-pink-500/20 border border-purple-400/30 backdrop-blur-sm"
                    >
                      <div className="flex items-center space-x-2 mb-4">
                        <Brain className="w-6 h-6 text-purple-400" />
                        <h4 className="text-white font-semibold font-['DM_Sans'] text-lg">
                          Your AI Assistant will help you:
                        </h4>
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        {[
                          { icon: Heart, text: 'Prioritize wellness breaks', color: 'text-pink-400' },
                          { icon: Calendar, text: 'Optimize your schedule', color: 'text-emerald-400' },
                          { icon: MessageSquare, text: 'Smart email summaries', color: 'text-cyan-400' },
                          { icon: Target, text: 'Track goal progress', color: 'text-orange-400' }
                        ].map((item, index) => (
                          <motion.div
                            key={index}
                            whileHover={{ scale: 1.05 }}
                            className="flex items-center space-x-2 p-2 rounded-lg bg-white/5"
                          >
                            <item.icon className={`w-4 h-4 ${item.color}`} />
                            <span className="text-white/80 text-sm font-['Satoshi']">{item.text}</span>
                          </motion.div>
                        ))}
                      </div>
                    </motion.div>

                    <div className="flex space-x-3">
                      <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} className="flex-1">
                        <Button 
                          variant="outline"
                          onClick={prevStep}
                          disabled={isLoading}
                          className="w-full border-white/20 text-white hover:bg-white/10 font-['Plus_Jakarta_Sans'] h-12 rounded-xl"
                        >
                          <ArrowLeft className="w-5 h-5 mr-2" /> Back
                        </Button>
                      </motion.div>
                      <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} className="flex-1">
                        <Button 
                          onClick={handleSubmit}
                          disabled={isLoading}
                          className="w-full bg-gradient-to-r from-emerald-400 to-cyan-400 hover:from-emerald-500 hover:to-cyan-500 text-white font-semibold font-['Plus_Jakarta_Sans'] h-12 rounded-xl text-lg shadow-lg"
                        >
                          {isLoading ? (
                            <>
                              <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                              Creating Account...
                            </>
                          ) : (
                            <>
                              Complete Registration <Sparkles className="w-5 h-5 ml-2" />
                            </>
                          )}
                        </Button>
                      </motion.div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
};

export default Registration;