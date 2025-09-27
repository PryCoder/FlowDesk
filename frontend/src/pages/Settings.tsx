import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { 
  Palette, 
  Bell, 
  Bot, 
  Shield, 
  Smartphone, 
  Mail, 
  Calendar, 
  MessageSquare,
  Lock,
  Key,
  Trash2,
  Plus
} from 'lucide-react';

export const Settings = () => {
  const [theme, setTheme] = useState('dark');
  const [notifications, setNotifications] = useState({
    email: true,
    desktop: true,
    mobile: false
  });
  const [aiPreferences, setAiPreferences] = useState({
    taskSuggestions: true,
    emailHighlighting: true,
    meetingSummaries: true
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Settings</h1>
      </div>

      <div className="grid gap-6">
        {/* Theme Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Palette className="h-5 w-5" />
              <span>Appearance</span>
            </CardTitle>
            <CardDescription>Customize the look and feel of your workspace</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <Label className="text-base">Theme</Label>
                <p className="text-sm text-muted-foreground mb-3">Choose your preferred color scheme</p>
                <div className="grid grid-cols-3 gap-3">
                  <div 
                    className={`p-4 rounded-lg border-2 cursor-pointer transition-all ${
                      theme === 'light' ? 'border-primary' : 'border-border'
                    }`}
                    onClick={() => setTheme('light')}
                  >
                    <div className="w-full h-12 bg-white rounded mb-2 border"></div>
                    <p className="text-sm font-medium text-center">Light</p>
                  </div>
                  <div 
                    className={`p-4 rounded-lg border-2 cursor-pointer transition-all ${
                      theme === 'dark' ? 'border-primary' : 'border-border'
                    }`}
                    onClick={() => setTheme('dark')}
                  >
                    <div className="w-full h-12 bg-gray-900 rounded mb-2"></div>
                    <p className="text-sm font-medium text-center">Dark</p>
                  </div>
                  <div 
                    className={`p-4 rounded-lg border-2 cursor-pointer transition-all ${
                      theme === 'gradient' ? 'border-primary' : 'border-border'
                    }`}
                    onClick={() => setTheme('gradient')}
                  >
                    <div className="w-full h-12 bg-gradient-to-r from-purple-500 to-blue-500 rounded mb-2"></div>
                    <p className="text-sm font-medium text-center">Gradient</p>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Notification Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Bell className="h-5 w-5" />
              <span>Notifications</span>
            </CardTitle>
            <CardDescription>Configure how and when you receive notifications</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <Mail className="h-5 w-5 text-muted-foreground" />
                <div>
                  <p className="font-medium">Email Notifications</p>
                  <p className="text-sm text-muted-foreground">Receive updates via email</p>
                </div>
              </div>
              <Switch
                checked={notifications.email}
                onCheckedChange={(checked) => setNotifications({...notifications, email: checked})}
              />
            </div>

            <Separator />

            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <Bell className="h-5 w-5 text-muted-foreground" />
                <div>
                  <p className="font-medium">Desktop Notifications</p>
                  <p className="text-sm text-muted-foreground">Show notifications on desktop</p>
                </div>
              </div>
              <Switch
                checked={notifications.desktop}
                onCheckedChange={(checked) => setNotifications({...notifications, desktop: checked})}
              />
            </div>

            <Separator />

            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <Smartphone className="h-5 w-5 text-muted-foreground" />
                <div>
                  <p className="font-medium">Mobile Push Notifications</p>
                  <p className="text-sm text-muted-foreground">Receive push notifications on mobile</p>
                </div>
              </div>
              <Switch
                checked={notifications.mobile}
                onCheckedChange={(checked) => setNotifications({...notifications, mobile: checked})}
              />
            </div>
          </CardContent>
        </Card>

        {/* AI Assistant Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Bot className="h-5 w-5" />
              <span>AI Assistant</span>
            </CardTitle>
            <CardDescription>Control AI assistance behavior and personalization</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">Task Suggestions</p>
                <p className="text-sm text-muted-foreground">AI suggests tasks based on your patterns</p>
              </div>
              <Switch
                checked={aiPreferences.taskSuggestions}
                onCheckedChange={(checked) => setAiPreferences({...aiPreferences, taskSuggestions: checked})}
              />
            </div>

            <Separator />

            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">Urgent Email Highlighting</p>
                <p className="text-sm text-muted-foreground">Automatically highlight important emails</p>
              </div>
              <Switch
                checked={aiPreferences.emailHighlighting}
                onCheckedChange={(checked) => setAiPreferences({...aiPreferences, emailHighlighting: checked})}
              />
            </div>

            <Separator />

            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">Meeting Summaries</p>
                <p className="text-sm text-muted-foreground">Auto-generate meeting summaries and action items</p>
              </div>
              <Switch
                checked={aiPreferences.meetingSummaries}
                onCheckedChange={(checked) => setAiPreferences({...aiPreferences, meetingSummaries: checked})}
              />
            </div>
          </CardContent>
        </Card>

        {/* Security Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Shield className="h-5 w-5" />
              <span>Security</span>
            </CardTitle>
            <CardDescription>Manage your account security and authentication</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <Lock className="h-5 w-5 text-muted-foreground" />
                <div>
                  <p className="font-medium">Change Password</p>
                  <p className="text-sm text-muted-foreground">Update your account password</p>
                </div>
              </div>
              <Button variant="outline" size="sm">Change</Button>
            </div>

            <Separator />

            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <Key className="h-5 w-5 text-muted-foreground" />
                <div>
                  <p className="font-medium">Two-Factor Authentication</p>
                  <p className="text-sm text-muted-foreground">Add an extra layer of security</p>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <Badge variant="outline" className="text-green-600 border-green-600">Enabled</Badge>
                <Button variant="outline" size="sm">Configure</Button>
              </div>
            </div>

            <Separator />

            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">Active Sessions</p>
                <p className="text-sm text-muted-foreground">Manage your active login sessions</p>
              </div>
              <Button variant="outline" size="sm">Manage</Button>
            </div>
          </CardContent>
        </Card>

        {/* Integration Management */}
        <Card>
          <CardHeader>
            <CardTitle>Integration Management</CardTitle>
            <CardDescription>Connect and manage your external apps and services</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <Calendar className="h-5 w-5 text-muted-foreground" />
                <div>
                  <p className="font-medium">Calendar Integration</p>
                  <p className="text-sm text-muted-foreground">Google Calendar, Outlook</p>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <Badge variant="secondary">2 connected</Badge>
                <Button variant="outline" size="sm">Configure</Button>
              </div>
            </div>

            <Separator />

            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <Mail className="h-5 w-5 text-muted-foreground" />
                <div>
                  <p className="font-medium">Email Integration</p>
                  <p className="text-sm text-muted-foreground">Gmail, Outlook, Yahoo</p>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <Badge variant="secondary">1 connected</Badge>
                <Button variant="outline" size="sm">Configure</Button>
              </div>
            </div>

            <Separator />

            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <MessageSquare className="h-5 w-5 text-muted-foreground" />
                <div>
                  <p className="font-medium">Communication Tools</p>
                  <p className="text-sm text-muted-foreground">Slack, Teams, Discord</p>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <Badge variant="outline">Not connected</Badge>
                <Button variant="outline" size="sm">
                  <Plus className="h-4 w-4 mr-1" />
                  Connect
                </Button>
              </div>
            </div>

            <Separator />

            <div className="pt-4">
              <Button variant="destructive" size="sm" className="flex items-center space-x-2">
                <Trash2 className="h-4 w-4" />
                <span>Reset All Integrations</span>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};