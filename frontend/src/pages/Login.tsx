import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { 
  Bot, 
  Mail, 
  Lock, 
  Eye, 
  EyeOff, 
  Sparkles, 
  Shield, 
  Zap,
  ArrowRight,
  Chrome,
  Github
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useAppStore } from '@/stores/useAppStore';
import aiBackground from '@/assets/ai-background.jpg';

const securityTips = [
  "🔐 Your data is encrypted with military-grade security",
  "🤖 AI learns your patterns to boost productivity by 40%",
  "🌟 Join 50,000+ professionals using AI Assistant",
  "⚡ Smart notifications reduce interruptions by 60%",
  "🎯 Personalized insights improve work-life balance"
];

const onboardingSteps = [
  {
    title: "Welcome to AI Assistant Ultimate",
    description: "Your premium AI-powered productivity companion",
    icon: Bot,
    color: "text-primary"
  },
  {
    title: "Personalize Your Experience",
    description: "Tell us about your work preferences and goals",
    icon: Sparkles,
    color: "text-accent-orange"
  },
  {
    title: "You're All Set!",
    description: "Start experiencing the future of work productivity",
    icon: Zap,
    color: "text-success"
  }
];

export default function Login() {
  const [isLogin, setIsLogin] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [currentTip, setCurrentTip] = useState(0);
  const [isOnboarding, setIsOnboarding] = useState(false);
  const navigate = useNavigate();
  const { setUser } = useAppStore();

  // Rotate security tips every 3 seconds
  useState(() => {
    const interval = setInterval(() => {
      setCurrentTip((prev) => (prev + 1) % securityTips.length);
    }, 3000);
    return () => clearInterval(interval);
  });

  const handleLogin = () => {
    setIsOnboarding(true);
    setTimeout(() => {
      setUser({
        id: '1',
        name: 'Alex Johnson',
        email: 'alex.johnson@company.com',
        avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face',
        role: 'Senior Product Manager',
        department: 'Product'
      });
      navigate('/');
    }, 4000);
  };

  const nextStep = () => {
    if (currentStep < onboardingSteps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      handleLogin();
    }
  };

  if (isOnboarding) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background relative overflow-hidden">
        {/* Background */}
        <div className="absolute inset-0">
          <img 
            src={aiBackground} 
            alt="AI Background" 
            className="w-full h-full object-cover opacity-20"
          />
          <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-background/80 to-primary-pink/10"></div>
        </div>

        {/* Floating Shapes */}
        <div className="absolute inset-0 overflow-hidden">
          {[...Array(6)].map((_, i) => (
            <motion.div
              key={i}
              className="absolute w-32 h-32 rounded-full opacity-20"
              style={{
                background: `linear-gradient(135deg, hsl(var(--primary)), hsl(var(--primary-glow)))`,
                left: Math.random() * 100 + '%',
                top: Math.random() * 100 + '%',
              }}
              animate={{
                y: [0, -30, 0],
                x: [0, 15, 0],
                scale: [1, 1.1, 1],
                rotate: [0, 180, 360]
              }}
              transition={{
                duration: 8 + i * 2,
                repeat: Infinity,
                ease: "linear"
              }}
            />
          ))}
        </div>

        {/* Onboarding Content */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
          className="relative z-10 max-w-md w-full mx-4"
        >
          <Card className="glass-card border-glass-border/50 backdrop-blur-xl">
            <CardContent className="p-8 text-center space-y-6">
              <motion.div
                key={currentStep}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.5 }}
              >
                {(() => {
                  const IconComponent = onboardingSteps[currentStep].icon;
                  return (
                    <>
                      <div className="p-4 rounded-2xl bg-glass mb-6 inline-flex">
                        <IconComponent className={`w-8 h-8 ${onboardingSteps[currentStep].color}`} />
                      </div>
                      <h2 className="text-2xl font-clash font-bold mb-3">
                        {onboardingSteps[currentStep].title}
                      </h2>
                      <p className="text-muted-foreground font-satoshi">
                        {onboardingSteps[currentStep].description}
                      </p>
                    </>
                  );
                })()}
              </motion.div>

              {/* Progress Bar */}
              <div className="flex space-x-2 justify-center">
                {onboardingSteps.map((_, index) => (
                  <div
                    key={index}
                    className={`h-2 rounded-full transition-all duration-300 ${
                      index === currentStep 
                        ? 'w-8 gradient-primary' 
                        : index < currentStep 
                        ? 'w-2 bg-primary' 
                        : 'w-2 bg-glass'
                    }`}
                  />
                ))}
              </div>

              <Button
                variant="premium"
                size="lg"
                onClick={nextStep}
                className="w-full"
              >
                {currentStep === onboardingSteps.length - 1 ? 'Get Started' : 'Continue'}
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex bg-background relative overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0">
        <img 
          src={aiBackground} 
          alt="AI Background" 
          className="w-full h-full object-cover opacity-30"
        />
        <div className="absolute inset-0 bg-gradient-to-br from-primary/20 via-background/80 to-primary-pink/20"></div>
      </div>

      {/* Floating Particles */}
      <div className="absolute inset-0 overflow-hidden">
        {[...Array(12)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute w-4 h-4 rounded-full bg-primary/30"
            style={{
              left: Math.random() * 100 + '%',
              top: Math.random() * 100 + '%',
            }}
            animate={{
              y: [0, -100, 0],
              opacity: [0, 1, 0],
            }}
            transition={{
              duration: 5 + Math.random() * 5,
              repeat: Infinity,
              delay: Math.random() * 5,
            }}
          />
        ))}
      </div>

      {/* Left Section - Branding */}
      <div className="hidden lg:flex lg:flex-1 relative z-10 flex-col justify-center items-center p-12">
        <motion.div
          initial={{ opacity: 0, x: -50 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.8 }}
          className="max-w-md text-center space-y-8"
        >
          <div className="space-y-4">
            <motion.div
              animate={{ rotate: [0, 360] }}
              transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
              className="p-4 gradient-primary rounded-3xl inline-flex shadow-glow"
            >
              <Bot className="w-12 h-12 text-white" />
            </motion.div>
            
            <h1 className="text-5xl font-clash font-bold gradient-text">
              AI Employee Assistant
            </h1>
            <p className="text-xl text-muted-foreground font-satoshi">
              Ultimate Edition
            </p>
          </div>

          <div className="space-y-6">
            <AnimatePresence mode="wait">
              <motion.div
                key={currentTip}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.5 }}
                className="p-4 glass-card rounded-xl border-glass-border/50"
              >
                <p className="text-sm font-jakarta">
                  {securityTips[currentTip]}
                </p>
              </motion.div>
            </AnimatePresence>

            <div className="flex items-center justify-center space-x-4">
              <Badge className="bg-success/20 text-success border-success/30">
                <Shield className="w-3 h-3 mr-1" />
                Secure
              </Badge>
              <Badge className="bg-primary/20 text-primary border-primary/30">
                <Sparkles className="w-3 h-3 mr-1" />
                AI-Powered
              </Badge>
              <Badge className="bg-accent-orange/20 text-accent-orange border-accent-orange/30">
                <Zap className="w-3 h-3 mr-1" />
                Premium
              </Badge>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Right Section - Login Form */}
      <div className="flex-1 lg:max-w-md flex items-center justify-center p-6 relative z-10">
        <motion.div
          initial={{ opacity: 0, x: 50 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.8, delay: 0.2 }}
          className="w-full max-w-sm space-y-6"
        >
          <Card className="glass-card border-glass-border/50 backdrop-blur-xl shadow-premium">
            <CardHeader className="space-y-1">
              <CardTitle className="text-2xl font-clash font-bold text-center">
                {isLogin ? 'Welcome Back' : 'Join AI Assistant'}
              </CardTitle>
              <CardDescription className="text-center font-satoshi">
                {isLogin 
                  ? 'Sign in to your premium AI workspace' 
                  : 'Create your account to get started'
                }
              </CardDescription>
            </CardHeader>
            
            <CardContent className="space-y-4">
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email" className="font-jakarta">Email address</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      id="email"
                      type="email"
                      placeholder="alex@company.com"
                      className="pl-10 glass-card border-glass-border/50 focus:border-primary/50 focus:ring-primary/20 font-jakarta"
                    />
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="password" className="font-jakarta">Password</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      placeholder="Enter your password"
                      className="pl-10 pr-10 glass-card border-glass-border/50 focus:border-primary/50 focus:ring-primary/20 font-jakarta"
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon-sm"
                      className="absolute right-2 top-1/2 transform -translate-y-1/2"
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      {showPassword ? (
                        <EyeOff className="w-4 h-4" />
                      ) : (
                        <Eye className="w-4 h-4" />
                      )}
                    </Button>
                  </div>
                </div>
              </div>

              <Button
                variant="premium"
                size="lg"
                className="w-full"
                onClick={handleLogin}
              >
                {isLogin ? 'Sign In' : 'Create Account'}
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>

              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-glass-border/50"></div>
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-background px-2 text-muted-foreground font-jakarta">
                    Or continue with
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <Button variant="glass" className="w-full">
                  <Chrome className="w-4 h-4 mr-2" />
                  Google
                </Button>
                <Button variant="glass" className="w-full">
                  <Github className="w-4 h-4 mr-2" />
                  Microsoft
                </Button>
              </div>

              <div className="text-center text-sm">
                <span className="text-muted-foreground font-jakarta">
                  {isLogin ? "Don't have an account? " : "Already have an account? "}
                </span>
                <Button
                  variant="link"
                  className="p-0 h-auto font-jakarta"
                  onClick={() => setIsLogin(!isLogin)}
                >
                  {isLogin ? 'Sign up' : 'Sign in'}
                </Button>
              </div>
            </CardContent>
          </Card>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.8, delay: 0.5 }}
            className="text-center"
          >
            <p className="text-xs text-muted-foreground font-jakarta">
              By continuing, you agree to our Terms of Service and Privacy Policy
            </p>
          </motion.div>
        </motion.div>
      </div>
    </div>
  );
}