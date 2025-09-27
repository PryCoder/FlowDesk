import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { Camera, Mail, Phone, Globe, Languages, Shield } from 'lucide-react';

export const Profile = () => {
  const [isEditing, setIsEditing] = useState(false);
  const [profile, setProfile] = useState({
    name: 'John Doe',
    email: 'john.doe@company.com',
    phone: '+1 (555) 123-4567',
    role: 'Software Engineer',
    timezone: 'UTC-8',
    language: 'English'
  });

  const [privacy, setPrivacy] = useState({
    emailNotifications: true,
    dataSharing: false,
    profileVisibility: true
  });

  const handleSave = () => {
    // Save profile changes
    setIsEditing(false);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Profile</h1>
        <Button
          variant={isEditing ? "default" : "outline"}
          onClick={isEditing ? handleSave : () => setIsEditing(true)}
        >
          {isEditing ? 'Save Changes' : 'Edit Profile'}
        </Button>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Profile Information */}
        <Card>
          <CardHeader>
            <CardTitle>Personal Information</CardTitle>
            <CardDescription>Manage your personal details and contact information</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Avatar Section */}
            <div className="flex items-center space-x-4">
              <div className="relative">
                <Avatar className="h-20 w-20">
                  <AvatarImage src="/placeholder-avatar.jpg" alt="Profile" />
                  <AvatarFallback className="text-lg">JD</AvatarFallback>
                </Avatar>
                {isEditing && (
                  <Button size="sm" variant="secondary" className="absolute -bottom-2 -right-2 h-8 w-8 rounded-full p-0">
                    <Camera className="h-4 w-4" />
                  </Button>
                )}
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Profile Picture</p>
                {isEditing && (
                  <div className="flex space-x-2 mt-2">
                    <Button size="sm" variant="outline">Upload</Button>
                    <Button size="sm" variant="outline">Generate</Button>
                  </div>
                )}
              </div>
            </div>

            <div className="grid gap-4">
              <div className="grid gap-2">
                <Label htmlFor="name">Name</Label>
                <Input
                  id="name"
                  value={profile.name}
                  disabled={!isEditing}
                  onChange={(e) => setProfile({...profile, name: e.target.value})}
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="email">Email</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="email"
                    value={profile.email}
                    disabled={!isEditing}
                    className="pl-10"
                    onChange={(e) => setProfile({...profile, email: e.target.value})}
                  />
                </div>
              </div>

              <div className="grid gap-2">
                <Label htmlFor="phone">Phone</Label>
                <div className="relative">
                  <Phone className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="phone"
                    value={profile.phone}
                    disabled={!isEditing}
                    className="pl-10"
                    onChange={(e) => setProfile({...profile, phone: e.target.value})}
                  />
                </div>
              </div>

              <div className="grid gap-2">
                <Label htmlFor="role">Role</Label>
                <Input
                  id="role"
                  value={profile.role}
                  disabled={!isEditing}
                  onChange={(e) => setProfile({...profile, role: e.target.value})}
                />
              </div>

              <div className="grid gap-2">
                <Label>Timezone</Label>
                <Select disabled={!isEditing} value={profile.timezone} onValueChange={(value) => setProfile({...profile, timezone: value})}>
                  <SelectTrigger>
                    <Globe className="h-4 w-4 mr-2" />
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="UTC-8">Pacific Time (UTC-8)</SelectItem>
                    <SelectItem value="UTC-5">Eastern Time (UTC-5)</SelectItem>
                    <SelectItem value="UTC+0">GMT (UTC+0)</SelectItem>
                    <SelectItem value="UTC+1">Central European Time (UTC+1)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="grid gap-2">
                <Label>Language</Label>
                <Select disabled={!isEditing} value={profile.language} onValueChange={(value) => setProfile({...profile, language: value})}>
                  <SelectTrigger>
                    <Languages className="h-4 w-4 mr-2" />
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="English">English</SelectItem>
                    <SelectItem value="Spanish">Spanish</SelectItem>
                    <SelectItem value="French">French</SelectItem>
                    <SelectItem value="German">German</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Connected Accounts & Privacy */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Connected Accounts</CardTitle>
              <CardDescription>Manage your linked accounts and SSO connections</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center">
                    <span className="text-white text-sm font-bold">G</span>
                  </div>
                  <div>
                    <p className="font-medium">Google</p>
                    <p className="text-sm text-muted-foreground">Connected</p>
                  </div>
                </div>
                <Button variant="outline" size="sm">Disconnect</Button>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center">
                    <span className="text-white text-sm font-bold">M</span>
                  </div>
                  <div>
                    <p className="font-medium">Microsoft</p>
                    <p className="text-sm text-muted-foreground">Not connected</p>
                  </div>
                </div>
                <Button variant="outline" size="sm">Connect</Button>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-purple-500 rounded-full flex items-center justify-center">
                    <span className="text-white text-sm font-bold">S</span>
                  </div>
                  <div>
                    <p className="font-medium">Slack</p>
                    <p className="text-sm text-muted-foreground">Not connected</p>
                  </div>
                </div>
                <Button variant="outline" size="sm">Connect</Button>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Shield className="h-5 w-5" />
                <span>Privacy Settings</span>
              </CardTitle>
              <CardDescription>Control your privacy and data sharing preferences</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Email Notifications</p>
                  <p className="text-sm text-muted-foreground">Receive updates via email</p>
                </div>
                <Switch
                  checked={privacy.emailNotifications}
                  onCheckedChange={(checked) => setPrivacy({...privacy, emailNotifications: checked})}
                />
              </div>

              <Separator />

              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Data Sharing</p>
                  <p className="text-sm text-muted-foreground">Share usage data for improvements</p>
                </div>
                <Switch
                  checked={privacy.dataSharing}
                  onCheckedChange={(checked) => setPrivacy({...privacy, dataSharing: checked})}
                />
              </div>

              <Separator />

              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Profile Visibility</p>
                  <p className="text-sm text-muted-foreground">Make profile visible to team members</p>
                </div>
                <Switch
                  checked={privacy.profileVisibility}
                  onCheckedChange={(checked) => setPrivacy({...privacy, profileVisibility: checked})}
                />
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};