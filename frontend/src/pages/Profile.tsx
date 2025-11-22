// components/profile-page.tsx
"use client";

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2, User, Shield, Building, Save, Key, Mail, Calendar, Briefcase } from 'lucide-react';

// Validation schemas
const profileFormSchema = z.object({
  firstName: z.string().min(2, 'First name must be at least 2 characters'),
  lastName: z.string().min(2, 'Last name must be at least 2 characters'),
  department: z.string().optional(),
  position: z.string().optional(),
});

const passwordFormSchema = z.object({
  currentPassword: z.string().min(1, 'Current password is required'),
  newPassword: z.string().min(8, 'Password must be at least 8 characters'),
  confirmPassword: z.string(),
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

type ProfileFormValues = z.infer<typeof profileFormSchema>;
type PasswordFormValues = z.infer<typeof passwordFormSchema>;

interface UserProfile {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: 'admin' | 'employee';
  department?: string;
  position?: string;
  hireDate?: string;
  lastLogin?: string;
  companyId?: string;
  company?: {
    id: string;
    name: string;
    email: string;
    industry: string;
  } | null;
}

export  function Profile() {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isUpdating, setIsUpdating] = useState(false);
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [activeTab, setActiveTab] = useState('profile');
  const { toast } = useToast();

  // Profile form
  const profileForm = useForm<ProfileFormValues>({
    resolver: zodResolver(profileFormSchema),
    defaultValues: {
      firstName: '',
      lastName: '',
      department: '',
      position: '',
    },
  });

  // Password form
  const passwordForm = useForm<PasswordFormValues>({
    resolver: zodResolver(passwordFormSchema),
    defaultValues: {
      currentPassword: '',
      newPassword: '',
      confirmPassword: '',
    },
  });

  useEffect(() => {
    fetchProfile();
  }, []);

  // Reset forms when profile loads
  useEffect(() => {
    if (profile) {
      profileForm.reset({
        firstName: profile.firstName,
        lastName: profile.lastName,
        department: profile.department || '',
       
        position: profile.position || '',
      });
    }
  }, [profile, profileForm]);

 // In your Profile component, update the fetchProfile function:
const fetchProfile = async () => {
  try {
    const token = localStorage.getItem('token');
    if (!token) {
      throw new Error('No authentication token found');
    }

    // First verify the token is still valid
    const verifyResponse = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/auth/verify`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });

    if (!verifyResponse.ok) {
      throw new Error('Token verification failed');
    }

    // Then fetch the current user profile
    const response = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/auth/current-user`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });

    if (response.status === 401) {
      // Clear invalid token
      localStorage.removeItem('token');
      localStorage.removeItem('userRole');
      localStorage.removeItem('userId');
      localStorage.removeItem('companyId');
      localStorage.removeItem('role');
      
      toast({
        title: 'Session Expired',
        description: 'Please login again',
        variant: 'destructive',
      });
      window.location.href = '/auth';
      return;
    }

    if (!response.ok) {
      let errorMsg = 'Failed to fetch profile';
      try {
        const errData = await response.json();
        errorMsg = errData.error || errorMsg;
      } catch {}
      throw new Error(errorMsg);
    }

    const data = await response.json();
    setProfile(data.user);
  } catch (error: any) {
    console.error('Profile fetch error:', error);
    toast({
      title: 'Error',
      description: error.message || 'Failed to load profile',
      variant: 'destructive',
    });
  } finally {
    setIsLoading(false);
  }
};
  
  const onProfileUpdate = async (data: ProfileFormValues) => {
    setIsUpdating(true);
    try {
      const token = localStorage.getItem('token');
      // Map to backend expected snake_case fields
      const payload = {
        first_name: data.firstName,
        last_name: data.lastName,
        department: data.department,
        position: data.position,
      };
  
      const response = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/auth/employee/profile`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });
  
      if (!response.ok) {
        let errorMsg = 'Failed to update profile';
        try {
          const errData = await response.json();
          errorMsg = errData.error || errorMsg;
        } catch {}
        throw new Error(errorMsg);
      }
  
      // Refresh profile from backend to stay in sync
      await fetchProfile();
  
      toast({
        title: 'Success',
        description: 'Profile updated successfully',
      });
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to update profile',
        variant: 'destructive',
      });
    } finally {
      setIsUpdating(false);
    }
  };
  
  const onPasswordChange = async (data: PasswordFormValues) => {
    setIsChangingPassword(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/auth/change-password`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          currentPassword: data.currentPassword,
          newPassword: data.newPassword,
        }),
      });
  
      if (!response.ok) {
        let errorMsg = 'Failed to change password';
        try {
          const errData = await response.json();
          errorMsg = errData.error || errorMsg;
        } catch {}
        throw new Error(errorMsg);
      }
  
      toast({
        title: 'Success',
        description: 'Password changed successfully',
      });
  
      passwordForm.reset();
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to change password',
        variant: 'destructive',
      });
    } finally {
      setIsChangingPassword(false);
    }
  };
  

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!profile) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="text-center text-muted-foreground">
            Failed to load profile
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="container mx-auto py-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center space-x-4">
          <div className="bg-primary/10 p-3 rounded-full">
            {profile.role === 'admin' ? (
              <Shield className="h-8 w-8 text-primary" />
            ) : (
              <User className="h-8 w-8 text-primary" />
            )}
          </div>
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">
              {profile.firstName} {profile.lastName}
            </h1>
            <p className="text-muted-foreground capitalize">
              {profile.role} • {profile.department || 'No department'}
            </p>
            {profile.company && (
              <div className="flex items-center space-x-1 text-sm text-muted-foreground mt-1">
                <Building className="h-3 w-3" />
                <span>{profile.company.name}</span>
              </div>
            )}
          </div>
        </div>
        <div className="text-left sm:text-right">
          <div className="inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 border-transparent bg-primary text-primary-foreground capitalize">
            {profile.role}
          </div>
          <p className="text-sm text-muted-foreground mt-1">
            Last login: {profile.lastLogin ? new Date(profile.lastLogin).toLocaleDateString() : 'Never'}
          </p>
        </div>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="profile" className="flex items-center space-x-2">
            <User className="h-4 w-4" />
            <span className="hidden sm:inline">Profile</span>
          </TabsTrigger>
          <TabsTrigger value="security" className="flex items-center space-x-2">
            <Key className="h-4 w-4" />
            <span className="hidden sm:inline">Security</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="profile" className="space-y-6">
          <div className="grid gap-6 lg:grid-cols-3">
            {/* Profile Info Card */}
            <div className="lg:col-span-1">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <User className="h-5 w-5" />
                    <span>Profile Information</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center space-x-3">
                    <Mail className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="text-sm font-medium">Email</p>
                      <p className="text-sm text-muted-foreground">{profile.email}</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-3">
                    <Briefcase className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="text-sm font-medium">Role</p>
                      <p className="text-sm text-muted-foreground capitalize">{profile.role}</p>
                    </div>
                  </div>

                  {profile.hireDate && (
                    <div className="flex items-center space-x-3">
                      <Calendar className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <p className="text-sm font-medium">Hire Date</p>
                        <p className="text-sm text-muted-foreground">
                          {new Date(profile.hireDate).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                  )}

                  {profile.company && (
                    <>
                      <div className="border-t pt-4">
                        <p className="text-sm font-medium mb-2">Company</p>
                        <div className="space-y-2 text-sm">
                          <p className="font-medium">{profile.company.name}</p>
                          <p className="text-muted-foreground">{profile.company.industry}</p>
                          <p className="text-muted-foreground">{profile.company.email}</p>
                        </div>
                      </div>
                    </>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Edit Profile Form */}
            <div className="lg:col-span-2">
              <Card>
                <CardHeader>
                  <CardTitle>Edit Profile</CardTitle>
                  <CardDescription>
                    Update your personal information and professional details.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Form {...profileForm}>
                    <form onSubmit={profileForm.handleSubmit(onProfileUpdate)} className="space-y-6">
                      <div className="grid gap-4 sm:grid-cols-2">
                        <FormField
                          control={profileForm.control}
                          name="firstName"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>First Name</FormLabel>
                              <FormControl>
                                <Input placeholder="Enter your first name" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        
                        <FormField
                          control={profileForm.control}
                          name="lastName"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Last Name</FormLabel>
                              <FormControl>
                                <Input placeholder="Enter your last name" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>

                      <div className="grid gap-4 sm:grid-cols-2">
                        <FormField
                          control={profileForm.control}
                          name="department"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Department</FormLabel>
                              <Select onValueChange={field.onChange} defaultValue={field.value}>
                                <FormControl>
                                  <SelectTrigger>
                                    <SelectValue placeholder="Select department" />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  <SelectItem value="engineering">Engineering</SelectItem>
                                  <SelectItem value="sales">Sales</SelectItem>
                                  <SelectItem value="marketing">Marketing</SelectItem>
                                  <SelectItem value="hr">Human Resources</SelectItem>
                                  <SelectItem value="finance">Finance</SelectItem>
                                  <SelectItem value="operations">Operations</SelectItem>
                                  <SelectItem value="it">IT</SelectItem>
                                  <SelectItem value="support">Customer Support</SelectItem>
                                </SelectContent>
                              </Select>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        
                        <FormField
                          control={profileForm.control}
                          name="position"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Position</FormLabel>
                              <FormControl>
                                <Input placeholder="Your job title" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>

                      <Button type="submit" disabled={isUpdating}>
                        {isUpdating ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Updating...
                          </>
                        ) : (
                          <>
                            <Save className="mr-2 h-4 w-4" />
                            Update Profile
                          </>
                        )}
                      </Button>
                    </form>
                  </Form>
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="security">
          <div className="max-w-2xl">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Key className="h-5 w-5" />
                  <span>Change Password</span>
                </CardTitle>
                <CardDescription>
                  Update your password to keep your account secure.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Form {...passwordForm}>
                  <form onSubmit={passwordForm.handleSubmit(onPasswordChange)} className="space-y-4">
                    <FormField
                      control={passwordForm.control}
                      name="currentPassword"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Current Password</FormLabel>
                          <FormControl>
                            <Input type="password" placeholder="Enter current password" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={passwordForm.control}
                      name="newPassword"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>New Password</FormLabel>
                          <FormControl>
                            <Input type="password" placeholder="Enter new password" {...field} />
                          </FormControl>
                          <FormDescription>
                            Password must be at least 8 characters long.
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={passwordForm.control}
                      name="confirmPassword"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Confirm New Password</FormLabel>
                          <FormControl>
                            <Input type="password" placeholder="Confirm new password" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <Button type="submit" disabled={isChangingPassword}>
                      {isChangingPassword ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Changing Password...
                        </>
                      ) : (
                        <>
                          <Key className="mr-2 h-4 w-4" />
                          Change Password
                        </>
                      )}
                    </Button>
                  </form>
                </Form>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}