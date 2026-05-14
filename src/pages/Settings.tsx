import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Loader2, Bell, Shield, Mail, Globe } from 'lucide-react';

export default function Settings() {
  const { profile, isAdmin } = useAuth();
  const [saving, setSaving] = useState(false);
  const [notifications, setNotifications] = useState({
    emailAlerts: true,
    auditReminders: true,
    riskNotifications: true,
    weeklyReports: false
  });

  if (!isAdmin) {
    return (
      <div className="p-6">
        <Card className="bg-red-50">
          <CardContent className="pt-6 text-center">
            <p className="text-red-600">Access Denied. Admin privileges required.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const handleSave = async () => {
    setSaving(true);
    // Simulate save
    setTimeout(() => {
      setSaving(false);
      alert('Settings saved successfully!');
    }, 1000);
  };

  return (
    <div className="p-6 space-y-6 bg-gray-50 min-h-screen">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">System Settings</h1>
        <p className="text-gray-500 mt-1">Configure system preferences and notifications</p>
      </div>

      <Tabs defaultValue="general" className="space-y-4">
        <TabsList>
          <TabsTrigger value="general">General</TabsTrigger>
          <TabsTrigger value="notifications">Notifications</TabsTrigger>
          <TabsTrigger value="security">Security</TabsTrigger>
          <TabsTrigger value="integrations">Integrations</TabsTrigger>
        </TabsList>

        <TabsContent value="general">
          <Card>
            <CardHeader>
              <CardTitle>General Settings</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label>Organization Name</Label>
                <Input defaultValue={profile?.organization_name || 'Seacom'} />
              </div>
              <div>
                <Label>Default Language</Label>
                <Input defaultValue="English" />
              </div>
              <div>
                <Label>Time Zone</Label>
                <Input defaultValue="Africa/Johannesburg" />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="notifications">
          <Card>
            <CardHeader>
              <CardTitle>Notification Preferences</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex justify-between items-center">
                <div>
                  <p className="font-medium">Email Alerts</p>
                  <p className="text-sm text-gray-500">Receive email notifications for important events</p>
                </div>
                <Switch checked={notifications.emailAlerts} onCheckedChange={(v) => setNotifications({...notifications, emailAlerts: v})} />
              </div>
              <div className="flex justify-between items-center">
                <div>
                  <p className="font-medium">Audit Reminders</p>
                  <p className="text-sm text-gray-500">Get reminders for upcoming audits</p>
                </div>
                <Switch checked={notifications.auditReminders} onCheckedChange={(v) => setNotifications({...notifications, auditReminders: v})} />
              </div>
              <div className="flex justify-between items-center">
                <div>
                  <p className="font-medium">Risk Notifications</p>
                  <p className="text-sm text-gray-500">Alerts for high-risk changes</p>
                </div>
                <Switch checked={notifications.riskNotifications} onCheckedChange={(v) => setNotifications({...notifications, riskNotifications: v})} />
              </div>
              <div className="flex justify-between items-center">
                <div>
                  <p className="font-medium">Weekly Reports</p>
                  <p className="text-sm text-gray-500">Receive weekly compliance summary</p>
                </div>
                <Switch checked={notifications.weeklyReports} onCheckedChange={(v) => setNotifications({...notifications, weeklyReports: v})} />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="security">
          <Card>
            <CardHeader>
              <CardTitle>Security Settings</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label>Session Timeout (minutes)</Label>
                <Input type="number" defaultValue="30" />
              </div>
              <div>
                <Label>MFA Required for Admins</Label>
                <Switch defaultChecked={true} />
              </div>
              <div>
                <Label>Password Policy</Label>
                <Input defaultValue="Minimum 12 characters, complexity required" />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="integrations">
          <Card>
            <CardHeader>
              <CardTitle>Integration Settings</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label>SharePoint API Key</Label>
                <Input type="password" placeholder="••••••••" />
              </div>
              <div>
                <Label>Azure AD Tenant ID</Label>
                <Input defaultValue="4c1a7a88-ef89-4360-a322-cc29c20d1966" />
              </div>
              <div>
                <Label>API Endpoint</Label>
                <Input defaultValue="https://api.seacom.com/v1" />
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <div className="flex justify-end">
        <Button onClick={handleSave} disabled={saving}>
          {saving ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : null}
          Save Changes
        </Button>
      </div>
    </div>
  );
}
