import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
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
  Rocket
} from 'lucide-react';

export const Registration = () => {
  const [currentStep, setCurrentStep] = useState(1);
  const [isComplete, setIsComplete] = useState(false);
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    password: '',
    avatar: '',
    department: '',
    role: '',
    workStyle: '',
    skills: [] as string[],
    enable2FA: false,
    acceptTerms: false,
    receiveNotifications: true
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
const navigate = useNavigate();
  const departments = [
    { id: 'engineering', name: 'Engineering', icon: Code, color: 'bg-blue-500' },
    { id: 'design', name: 'Design', icon: Palette, color: 'bg-purple-500' },
    { id: 'marketing', name: 'Marketing', icon: Target, color: 'bg-pink-500' },
    { id: 'sales', name: 'Sales', icon: BarChart3, color: 'bg-emerald-500' },
    { id: 'hr', name: 'Human Resources', icon: Users, color: 'bg-orange-500' },
    { id: 'product', name: 'Product', icon: Rocket, color: 'bg-cyan-500' }
  ];

  const workStyles = [
    { id: 'collaborative', name: 'Collaborative', desc: 'Love working in teams and brainstorming together' },
    { id: 'independent', name: 'Independent', desc: 'Prefer focused work with minimal interruptions' },
    { id: 'hybrid', name: 'Hybrid', desc: 'Balance between team work and solo deep work' }
  ];

  const availableSkills = [
    'Project Management', 'Data Analysis', 'Content Creation', 'Communication',
    'Problem Solving', 'Leadership', 'Creative Thinking', 'Technical Writing',
    'Research', 'Strategy Planning', 'Customer Relations', 'Innovation'
  ];

  const validateStep = (step: number) => {
    const newErrors: Record<string, string> = {};
    
    if (step === 1) {
      if (!formData.fullName.trim()) newErrors.fullName = 'Full name is required';
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
      if (!formData.workStyle) newErrors.workStyle = 'Please select a work style';
    }
    
    if (step === 3) {
      if (!formData.acceptTerms) newErrors.acceptTerms = 'You must accept the terms';
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
  };

  const handleSubmit = () => {
    if (validateStep(3)) {
      setIsComplete(true);
   
      console.log('Registration completed:', formData);
      const timer = setTimeout(() => {
        navigate('/'); // Navigate to home after 5 seconds
      }, 5000);
      return () => clearTimeout(timer);
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

  const updateFormData = (field: string, value: string | boolean) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
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
          <Card className="backdrop-blur-xl bg-white/10 border-white/20 text-white">
            <CardContent className="p-8 text-center">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
                className="w-20 h-20 mx-auto mb-6 bg-gradient-to-r from-emerald-400 to-cyan-400 rounded-full flex items-center justify-center"
              >
                <Check className="w-10 h-10 text-white" />
              </motion.div>
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
              >
                <h2 className="text-2xl font-bold mb-2 font-['Clash_Display']">Welcome aboard!</h2>
                <p className="text-white/80 mb-6 font-['Satoshi']">
                  Your AI assistant is being personalized just for you. Get ready for a smarter work experience!
                </p>
                <Button className="bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700">
                  Get Started
                </Button>
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
            scale: [1, 1.1, 1]
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
          {/* Progress Header */}
          <motion.div 
            className="mb-8 text-center"
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <div className="flex items-center justify-center space-x-4 mb-4">
              <Sparkles className="w-8 h-8 text-yellow-400" />
              <h1 className="text-4xl font-bold text-white font-['Clash_Display']">
                AI Employee Assistant
              </h1>
              <Zap className="w-8 h-8 text-cyan-400" />
            </div>
            <p className="text-white/80 font-['Satoshi']">
              Let's set up your intelligent workspace companion
            </p>
            
            {/* Progress Bar */}
            <div className="mt-6 max-w-md mx-auto">
              <div className="flex justify-between text-sm text-white/60 mb-2">
                <span>Step {currentStep} of 3</span>
                <span>{Math.round((currentStep / 3) * 100)}% Complete</span>
              </div>
              <Progress value={(currentStep / 3) * 100} className="h-2 bg-white/20" />
            </div>
          </motion.div>

          {/* Step Content */}
          <AnimatePresence mode="wait">
            {currentStep === 1 && (
              <motion.div
                key="step1"
                variants={stepVariants}
                initial="hidden"
                animate="visible"
                exit="exit"
                transition={{ duration: 0.5 }}
              >
                <Card className="backdrop-blur-xl bg-white/10 border-white/20">
                  <CardHeader>
                    <CardTitle className="text-2xl text-white flex items-center space-x-2 font-['Clash_Display']">
                      <User className="w-6 h-6 text-indigo-400" />
                      <span>Tell us about yourself</span>
                    </CardTitle>
                    <CardDescription className="text-white/70 font-['Satoshi']">
                      We'll use this information to personalize your AI assistant experience
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    {/* Avatar Upload */}
                    <div className="flex flex-col items-center space-y-4">
                      <div className="relative">
                        <Avatar className="w-24 h-24 border-4 border-white/20">
                          <AvatarImage src={formData.avatar} />
                          <AvatarFallback className="bg-gradient-to-br from-indigo-500 to-purple-600 text-white text-2xl">
                            {formData.fullName.charAt(0) || 'U'}
                          </AvatarFallback>
                        </Avatar>
                        <Button 
                          size="sm" 
                          className="absolute -bottom-2 -right-2 w-8 h-8 rounded-full p-0 bg-gradient-to-r from-emerald-400 to-cyan-400 hover:from-emerald-500 hover:to-cyan-500"
                        >
                          <Camera className="w-4 h-4" />
                        </Button>
                      </div>
                      <p className="text-white/60 text-sm font-['DM_Sans']">
                        Optional: Upload a profile picture
                      </p>
                    </div>

                    {/* Form Fields */}
                    <div className="grid gap-4">
                      <div className="space-y-2">
                        <Label className="text-white font-['Plus_Jakarta_Sans']">Full Name</Label>
                        <div className="relative">
                          <User className="absolute left-3 top-3 h-4 w-4 text-white/40" />
                          <Input
                            placeholder="Enter your full name"
                            className="pl-10 bg-white/10 border-white/20 text-white placeholder:text-white/40 font-['Inter']"
                            value={formData.fullName}
                            onChange={(e) => updateFormData('fullName', e.target.value)}
                          />
                        </div>
                        {errors.fullName && <p className="text-red-400 text-sm">{errors.fullName}</p>}
                      </div>

                      <div className="space-y-2">
                        <Label className="text-white font-['Plus_Jakarta_Sans']">Email Address</Label>
                        <div className="relative">
                          <Mail className="absolute left-3 top-3 h-4 w-4 text-white/40" />
                          <Input
                            type="email"
                            placeholder="your.email@company.com"
                            className="pl-10 bg-white/10 border-white/20 text-white placeholder:text-white/40 font-['Inter']"
                            value={formData.email}
                            onChange={(e) => updateFormData('email', e.target.value)}
                          />
                        </div>
                        {errors.email && <p className="text-red-400 text-sm">{errors.email}</p>}
                      </div>

                      <div className="space-y-2">
                        <Label className="text-white font-['Plus_Jakarta_Sans']">Password</Label>
                        <div className="relative">
                          <Lock className="absolute left-3 top-3 h-4 w-4 text-white/40" />
                          <Input
                            type="password"
                            placeholder="Create a secure password"
                            className="pl-10 bg-white/10 border-white/20 text-white placeholder:text-white/40 font-['Inter']"
                            value={formData.password}
                            onChange={(e) => updateFormData('password', e.target.value)}
                          />
                        </div>
                        {errors.password && <p className="text-red-400 text-sm">{errors.password}</p>}
                      </div>
                    </div>

                    <Button 
                      onClick={nextStep}
                      className="w-full bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white font-medium font-['Plus_Jakarta_Sans']"
                    >
                      Next Step <ArrowRight className="w-4 h-4 ml-2" />
                    </Button>
                  </CardContent>
                </Card>
              </motion.div>
            )}

            {currentStep === 2 && (
              <motion.div
                key="step2"
                variants={stepVariants}
                initial="hidden"
                animate="visible"
                exit="exit"
                transition={{ duration: 0.5 }}
              >
                <Card className="backdrop-blur-xl bg-white/10 border-white/20">
                  <CardHeader>
                    <CardTitle className="text-2xl text-white flex items-center space-x-2 font-['Clash_Display']">
                      <Briefcase className="w-6 h-6 text-purple-400" />
                      <span>Work Preferences</span>
                    </CardTitle>
                    <CardDescription className="text-white/70 font-['Satoshi']">
                      Help us understand your work style to customize your AI assistant
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    {/* Department Selection */}
                    <div className="space-y-3">
                      <Label className="text-white text-lg font-['DM_Sans']">Department</Label>
                      <div className="grid grid-cols-2 gap-3">
                        {departments.map((dept) => (
                          <motion.div
                            key={dept.id}
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            className={`p-4 rounded-xl border-2 cursor-pointer transition-all ${
                              formData.department === dept.id 
                                ? 'border-purple-400 bg-purple-400/20' 
                                : 'border-white/20 bg-white/5 hover:border-white/40'
                            }`}
                            onClick={() => updateFormData('department', dept.id)}
                          >
                            <div className="flex items-center space-x-3">
                              <div className={`w-10 h-10 ${dept.color} rounded-lg flex items-center justify-center`}>
                                <dept.icon className="w-5 h-5 text-white" />
                              </div>
                              <span className="text-white font-medium font-['Plus_Jakarta_Sans']">
                                {dept.name}
                              </span>
                            </div>
                          </motion.div>
                        ))}
                      </div>
                      {errors.department && <p className="text-red-400 text-sm">{errors.department}</p>}
                    </div>

                    {/* Role Input */}
                    <div className="space-y-2">
                      <Label className="text-white font-['Plus_Jakarta_Sans']">Your Role</Label>
                      <Input
                        placeholder="e.g. Senior Frontend Developer, Product Manager"
                        className="bg-white/10 border-white/20 text-white placeholder:text-white/40 font-['Inter']"
                        value={formData.role}
                        onChange={(e) => updateFormData('role', e.target.value)}
                      />
                      {errors.role && <p className="text-red-400 text-sm">{errors.role}</p>}
                    </div>

                    {/* Work Style */}
                    <div className="space-y-3">
                      <Label className="text-white text-lg font-['DM_Sans']">Work Style</Label>
                      <RadioGroup 
                        value={formData.workStyle} 
                        onValueChange={(value) => updateFormData('workStyle', value)}
                      >
                        {workStyles.map((style) => (
                          <div key={style.id} className="flex items-start space-x-3 p-4 rounded-xl bg-white/5 border border-white/10">
                            <RadioGroupItem value={style.id} className="mt-1 border-white/40 text-purple-400" />
                            <div>
                              <Label className="text-white font-medium cursor-pointer font-['Plus_Jakarta_Sans']">
                                {style.name}
                              </Label>
                              <p className="text-white/60 text-sm mt-1 font-['Satoshi']">
                                {style.desc}
                              </p>
                            </div>
                          </div>
                        ))}
                      </RadioGroup>
                      {errors.workStyle && <p className="text-red-400 text-sm">{errors.workStyle}</p>}
                    </div>

                    {/* Skills Selection */}
                    <div className="space-y-3">
                      <Label className="text-white text-lg font-['DM_Sans']">
                        Skills & Interests <span className="text-white/60 text-sm">(Select all that apply)</span>
                      </Label>
                      <div className="grid grid-cols-2 gap-2">
                        {availableSkills.map((skill) => (
                          <motion.div
                            key={skill}
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                          >
                            <Badge
                              variant={formData.skills.includes(skill) ? "default" : "outline"}
                              className={`cursor-pointer p-2 w-full justify-center transition-all font-['Plus_Jakarta_Sans'] ${
                                formData.skills.includes(skill)
                                  ? 'bg-gradient-to-r from-emerald-400 to-cyan-400 text-white'
                                  : 'border-white/20 text-white/70 hover:border-white/40'
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
                      <Button 
                        variant="outline"
                        onClick={prevStep}
                        className="flex-1 border-white/20 text-white hover:bg-white/10 font-['Plus_Jakarta_Sans']"
                      >
                        <ArrowLeft className="w-4 h-4 mr-2" /> Back
                      </Button>
                      <Button 
                        onClick={nextStep}
                        className="flex-1 bg-gradient-to-r from-purple-500 to-pink-600 hover:from-purple-600 hover:to-pink-700 font-['Plus_Jakarta_Sans']"
                      >
                        Next Step <ArrowRight className="w-4 h-4 ml-2" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            )}

            {currentStep === 3 && (
              <motion.div
                key="step3"
                variants={stepVariants}
                initial="hidden"
                animate="visible"
                exit="exit"
                transition={{ duration: 0.5 }}
              >
                <Card className="backdrop-blur-xl bg-white/10 border-white/20">
                  <CardHeader>
                    <CardTitle className="text-2xl text-white flex items-center space-x-2 font-['Clash_Display']">
                      <Shield className="w-6 h-6 text-emerald-400" />
                      <span>Security & Notifications</span>
                    </CardTitle>
                    <CardDescription className="text-white/70 font-['Satoshi']">
                      Final step to secure your account and set communication preferences
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    {/* Security Settings */}
                    <div className="space-y-4">
                      <h3 className="text-lg font-semibold text-white flex items-center space-x-2 font-['DM_Sans']">
                        <Lock className="w-5 h-5 text-emerald-400" />
                        <span>Security Settings</span>
                      </h3>
                      
                      <div className="p-4 rounded-xl bg-white/5 border border-white/10">
                        <div className="flex items-center justify-between">
                          <div>
                            <Label className="text-white font-medium font-['Plus_Jakarta_Sans']">
                              Two-Factor Authentication
                            </Label>
                            <p className="text-white/60 text-sm mt-1 font-['Satoshi']">
                              Add an extra layer of security to your account
                            </p>
                          </div>
                          <Switch
                            checked={formData.enable2FA}
                            onCheckedChange={(checked) => updateFormData('enable2FA', checked)}
                          />
                        </div>
                      </div>
                    </div>

                    {/* Notifications */}
                    <div className="space-y-4">
                      <h3 className="text-lg font-semibold text-white flex items-center space-x-2 font-['DM_Sans']">
                        <Bell className="w-5 h-5 text-cyan-400" />
                        <span>Communication Preferences</span>
                      </h3>
                      
                      <div className="p-4 rounded-xl bg-white/5 border border-white/10">
                        <div className="flex items-start space-x-3">
                          <Checkbox
                            checked={formData.receiveNotifications}
                            onCheckedChange={(checked) => updateFormData('receiveNotifications', checked)}
                            className="mt-1 border-white/40 data-[state=checked]:bg-cyan-400"
                          />
                          <div>
                            <Label className="text-white font-medium cursor-pointer font-['Plus_Jakarta_Sans']">
                              Receive Notifications
                            </Label>
                            <p className="text-white/60 text-sm mt-1 font-['Satoshi']">
                              Get updates about AI suggestions, task reminders, and important alerts
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Terms and Conditions */}
                    <div className="space-y-4">
                      <div className="p-4 rounded-xl bg-white/5 border border-white/10">
                        <div className="flex items-start space-x-3">
                          <Checkbox
                            checked={formData.acceptTerms}
                            onCheckedChange={(checked) => updateFormData('acceptTerms', checked)}
                            className="mt-1 border-white/40 data-[state=checked]:bg-emerald-400"
                          />
                          <div>
                            <Label className="text-white font-medium cursor-pointer font-['Plus_Jakarta_Sans']">
                              Accept Terms and Privacy Policy
                            </Label>
                            <p className="text-white/60 text-sm mt-1 font-['Satoshi']">
                              I agree to the <span className="text-emerald-400 underline cursor-pointer">Terms of Service</span> and <span className="text-emerald-400 underline cursor-pointer">Privacy Policy</span>
                            </p>
                          </div>
                        </div>
                        {errors.acceptTerms && <p className="text-red-400 text-sm mt-2">{errors.acceptTerms}</p>}
                      </div>
                    </div>

                    {/* AI Features Preview */}
                    <div className="p-4 rounded-xl bg-gradient-to-r from-indigo-500/20 to-purple-500/20 border border-purple-400/30">
                      <div className="flex items-center space-x-2 mb-3">
                        <Brain className="w-5 h-5 text-purple-400" />
                        <h4 className="text-white font-medium font-['DM_Sans']">
                          Your AI Assistant will help you:
                        </h4>
                      </div>
                      <div className="grid grid-cols-2 gap-2 text-sm text-white/80 font-['Satoshi']">
                        <div className="flex items-center space-x-2">
                          <Heart className="w-4 h-4 text-pink-400" />
                          <span>Prioritize wellness breaks</span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Calendar className="w-4 h-4 text-emerald-400" />
                          <span>Optimize your schedule</span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <MessageSquare className="w-4 h-4 text-cyan-400" />
                          <span>Smart email summaries</span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Target className="w-4 h-4 text-orange-400" />
                          <span>Track goal progress</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex space-x-3">
                      <Button 
                        variant="outline"
                        onClick={prevStep}
                        className="flex-1 border-white/20 text-white hover:bg-white/10 font-['Plus_Jakarta_Sans']"
                      >
                        <ArrowLeft className="w-4 h-4 mr-2" /> Back
                      </Button>
                      <Button 
                        onClick={handleSubmit}
                        className="flex-1 bg-gradient-to-r from-emerald-400 to-cyan-400 hover:from-emerald-500 hover:to-cyan-500 text-white font-medium font-['Plus_Jakarta_Sans']"
                      >
                        Complete Registration <Sparkles className="w-4 h-4 ml-2" />
                      </Button>
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