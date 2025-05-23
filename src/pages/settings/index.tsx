import { useState } from 'react'
import { z } from 'zod'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { 
  Bell, 
  Building, 
  Check, 
  CreditCard,
  Mail, 
  Save, 
  User as UserIcon
} from 'lucide-react'

import { useAuth } from '@/lib/auth/auth-provider'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Textarea } from '@/components/ui/textarea'
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs'
import { Separator } from '@/components/ui/separator'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'

const profileFormSchema = z.object({
  name: z.string().min(2, { message: 'Name must be at least 2 characters' }),
  email: z.string().email({ message: 'Please enter a valid email address' }),
  bio: z.string().optional(),
})

const workspaceFormSchema = z.object({
  workspaceName: z.string().min(2, { message: 'Workspace name must be at least 2 characters' }),
  workspaceDescription: z.string().optional(),
  logoUrl: z.string().url({ message: 'Please enter a valid URL' }).optional().or(z.literal('')),
})

type ProfileFormValues = z.infer<typeof profileFormSchema>
type WorkspaceFormValues = z.infer<typeof workspaceFormSchema>

export default function SettingsPage() {
  const { user } = useAuth()
  const [activeTab, setActiveTab] = useState('profile')
  const [profileSuccess, setProfileSuccess] = useState(false)
  const [workspaceSuccess, setWorkspaceSuccess] = useState(false)
  const [notificationsSuccess, setNotificationsSuccess] = useState(false)

  const profileForm = useForm<ProfileFormValues>({
    resolver: zodResolver(profileFormSchema),
    defaultValues: {
      name: user?.user_metadata?.name || '',
      email: user?.email || '',
      bio: user?.user_metadata?.bio || '',
    },
  })

  const workspaceForm = useForm<WorkspaceFormValues>({
    resolver: zodResolver(workspaceFormSchema),
    defaultValues: {
      workspaceName: user?.user_metadata?.workspace_name || '',
      workspaceDescription: user?.user_metadata?.workspace_description || '',
      logoUrl: user?.user_metadata?.logo_url || '',
    },
  })

  const onSubmitProfile = async (data: ProfileFormValues) => {
    console.log('Profile data', data)
    // In a real app, you would update the user's profile here
    setProfileSuccess(true)
    setTimeout(() => setProfileSuccess(false), 3000)
  }

  const onSubmitWorkspace = async (data: WorkspaceFormValues) => {
    console.log('Workspace data', data)
    // In a real app, you would update the workspace here
    setWorkspaceSuccess(true)
    setTimeout(() => setWorkspaceSuccess(false), 3000)
  }

  const onUpdateNotifications = () => {
    setNotificationsSuccess(true)
    setTimeout(() => setNotificationsSuccess(false), 3000)
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
        <p className="text-muted-foreground">
          Manage your account settings and preferences
        </p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="grid w-full grid-cols-4 lg:w-auto">
          <TabsTrigger value="profile">Profile</TabsTrigger>
          <TabsTrigger value="workspace">Workspace</TabsTrigger>
          <TabsTrigger value="notifications">Notifications</TabsTrigger>
          <TabsTrigger value="billing">Billing</TabsTrigger>
        </TabsList>

        {/* Profile Settings */}
        <TabsContent value="profile" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Profile</CardTitle>
              <CardDescription>
                Manage your personal information and account settings
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex flex-col space-y-4 sm:flex-row sm:space-x-4 sm:space-y-0">
                <div className="flex flex-col items-center space-y-2">
                  <Avatar className="h-24 w-24">
                    <AvatarImage src="https://github.com/shadcn.png" />
                    <AvatarFallback>
                      {user?.user_metadata?.name?.split(' ')
                        .map((n: string) => n[0])
                        .join('')
                        .toUpperCase() || user?.email?.[0].toUpperCase() || 'U'}
                    </AvatarFallback>
                  </Avatar>
                  <Button variant="outline" size="sm">
                    Change Avatar
                  </Button>
                </div>
                <div className="flex-1 space-y-4">
                  <Form {...profileForm}>
                    <form onSubmit={profileForm.handleSubmit(onSubmitProfile)} className="space-y-4">
                      <FormField
                        control={profileForm.control}
                        name="name"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Name</FormLabel>
                            <FormControl>
                              <div className="flex items-center rounded-md border bg-background ring-offset-background focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2">
                                <span className="flex select-none items-center px-3 text-muted-foreground">
                                  <UserIcon className="mr-1 h-4 w-4" />
                                </span>
                                <Input 
                                  className="border-0 bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0" 
                                  placeholder="Your name" 
                                  {...field} 
                                />
                              </div>
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={profileForm.control}
                        name="email"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Email</FormLabel>
                            <FormControl>
                              <div className="flex items-center rounded-md border bg-background ring-offset-background focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2">
                                <span className="flex select-none items-center px-3 text-muted-foreground">
                                  <Mail className="mr-1 h-4 w-4" />
                                </span>
                                <Input 
                                  className="border-0 bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0" 
                                  placeholder="Your email" 
                                  type="email"
                                  {...field} 
                                />
                              </div>
                            </FormControl>
                            <FormDescription>
                              This is the email used to sign in to your account
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={profileForm.control}
                        name="bio"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Bio</FormLabel>
                            <FormControl>
                              <Textarea 
                                placeholder="Tell us a bit about yourself"
                                className="min-h-[100px] resize-y"
                                {...field}
                              />
                            </FormControl>
                            <FormDescription>
                              This will be visible to other members of your workspace
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <div>
                        {profileSuccess && (
                          <Alert className="border-green-200 bg-green-50 text-green-800 dark:border-green-900 dark:bg-green-950 dark:text-green-300 mb-4">
                            <Check className="h-4 w-4" />
                            <AlertDescription>
                              Your profile has been updated successfully.
                            </AlertDescription>
                          </Alert>
                        )}
                        <Button type="submit" className="w-full">
                          <Save className="mr-2 h-4 w-4" /> Save Profile
                        </Button>
                      </div>
                    </form>
                  </Form>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle>Security</CardTitle>
              <CardDescription>
                Manage your password and account security settings
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="current-password">Current Password</Label>
                <Input id="current-password" type="password" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="new-password">New Password</Label>
                <Input id="new-password" type="password" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="confirm-password">Confirm New Password</Label>
                <Input id="confirm-password" type="password" />
              </div>
            </CardContent>
            <CardFooter>
              <Button variant="outline">Change Password</Button>
            </CardFooter>
          </Card>
        </TabsContent>

        {/* Workspace Settings */}
        <TabsContent value="workspace" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Workspace Settings</CardTitle>
              <CardDescription>
                Manage your organization's workspace settings and branding
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Form {...workspaceForm}>
                <form onSubmit={workspaceForm.handleSubmit(onSubmitWorkspace)} className="space-y-4">
                  <FormField
                    control={workspaceForm.control}
                    name="workspaceName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Workspace Name</FormLabel>
                        <FormControl>
                          <div className="flex items-center rounded-md border bg-background ring-offset-background focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2">
                            <span className="flex select-none items-center px-3 text-muted-foreground">
                              <Building className="mr-1 h-4 w-4" />
                            </span>
                            <Input 
                              className="border-0 bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0" 
                              placeholder="Your organization name" 
                              {...field} 
                            />
                          </div>
                        </FormControl>
                        <FormDescription>
                          This is your organization's name as it appears throughout the application
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={workspaceForm.control}
                    name="workspaceDescription"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Workspace Description</FormLabel>
                        <FormControl>
                          <Textarea 
                            placeholder="Brief description of your organization"
                            className="min-h-[100px] resize-y"
                            {...field}
                          />
                        </FormControl>
                        <FormDescription>
                          This description will be used in exported reports and documents
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={workspaceForm.control}
                    name="logoUrl"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Logo URL</FormLabel>
                        <FormControl>
                          <Input 
                            placeholder="https://example.com/logo.png" 
                            type="url"
                            {...field} 
                          />
                        </FormControl>
                        <FormDescription>
                          URL to your organization's logo for branding in reports (recommended size: 200x200px)
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  {workspaceSuccess && (
                    <Alert className="border-green-200 bg-green-50 text-green-800 dark:border-green-900 dark:bg-green-950 dark:text-green-300">
                      <Check className="h-4 w-4" />
                      <AlertDescription>
                        Workspace settings have been updated successfully.
                      </AlertDescription>
                    </Alert>
                  )}
                  
                  <div className="flex justify-end">
                    <Button type="submit">
                      <Save className="mr-2 h-4 w-4" /> Save Workspace Settings
                    </Button>
                  </div>
                </form>
              </Form>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle>Team Members</CardTitle>
              <CardDescription>
                Manage access for members of your workspace
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">Team member management will be available in a future update.</p>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Notification Settings */}
        <TabsContent value="notifications" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Notification Preferences</CardTitle>
              <CardDescription>
                Control how and when you receive notifications
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <h3 className="text-lg font-medium">Scan Notifications</h3>
                <Separator />
                
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="notify-scan-complete">Scan Complete</Label>
                    <p className="text-sm text-muted-foreground">
                      Receive a notification when a scan is complete
                    </p>
                  </div>
                  <Switch id="notify-scan-complete" defaultChecked />
                </div>
                
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="notify-advisor-review">Advisor Review Complete</Label>
                    <p className="text-sm text-muted-foreground">
                      Receive a notification when an advisor completes their review
                    </p>
                  </div>
                  <Switch id="notify-advisor-review" defaultChecked />
                </div>
                
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="notify-critical-risks">Critical Risks</Label>
                    <p className="text-sm text-muted-foreground">
                      Get alerted immediately when critical risks are found
                    </p>
                  </div>
                  <Switch id="notify-critical-risks" defaultChecked />
                </div>
              </div>
              
              <div className="space-y-4">
                <h3 className="text-lg font-medium">Communication Preferences</h3>
                <Separator />
                
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="email-notifications">Email Notifications</Label>
                    <p className="text-sm text-muted-foreground">
                      Receive important updates via email
                    </p>
                  </div>
                  <Switch id="email-notifications" defaultChecked />
                </div>
                
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="browser-notifications">Browser Notifications</Label>
                    <p className="text-sm text-muted-foreground">
                      Show push notifications in your browser
                    </p>
                  </div>
                  <Switch id="browser-notifications" />
                </div>
                
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="marketing-emails">Marketing Emails</Label>
                    <p className="text-sm text-muted-foreground">
                      Receive updates about new features and offers
                    </p>
                  </div>
                  <Switch id="marketing-emails" />
                </div>
              </div>
              
              {notificationsSuccess && (
                <Alert className="border-green-200 bg-green-50 text-green-800 dark:border-green-900 dark:bg-green-950 dark:text-green-300">
                  <Check className="h-4 w-4" />
                  <AlertDescription>
                    Notification settings have been updated successfully.
                  </AlertDescription>
                </Alert>
              )}
              
              <div className="flex justify-end">
                <Button onClick={onUpdateNotifications}>
                  <Save className="mr-2 h-4 w-4" /> Save Notification Settings
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Billing Settings */}
        <TabsContent value="billing" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Billing Information</CardTitle>
              <CardDescription>
                Manage your subscription and payment methods
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="rounded-lg border bg-muted/20 p-4">
                <div className="mb-4 flex items-start gap-3">
                  <CreditCard className="mt-0.5 h-5 w-5 flex-shrink-0 text-primary" />
                  <div>
                    <h3 className="font-medium">Current Plan</h3>
                    <p className="text-sm text-muted-foreground">
                      You are currently on the <strong>Pay-Per-Scan</strong> plan.
                    </p>
                  </div>
                </div>
                
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Scans Used This Month</span>
                    <span className="font-medium">3</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Cost Per Scan</span>
                    <span className="font-medium">$199</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Total This Month</span>
                    <span className="font-medium">$597</span>
                  </div>
                </div>
              </div>
              
              <div className="space-y-4">
                <h3 className="text-lg font-medium">Payment Methods</h3>
                <Separator />
                
                <div className="rounded-lg border p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <div className="flex h-10 w-16 items-center justify-center rounded-md border bg-muted">
                        <span className="font-medium">Visa</span>
                      </div>
                      <div>
                        <p className="text-sm font-medium">Visa ending in 4242</p>
                        <p className="text-xs text-muted-foreground">Expires 04/2025</p>
                      </div>
                    </div>
                    <Button variant="ghost" size="sm">
                      Edit
                    </Button>
                  </div>
                </div>
                
                <Button variant="outline" className="w-full">
                  Add Payment Method
                </Button>
              </div>
              
              <div className="space-y-4">
                <h3 className="text-lg font-medium">Billing History</h3>
                <Separator />
                
                <div className="space-y-2">
                  <div className="flex items-center justify-between rounded-md border p-3">
                    <div>
                      <p className="font-medium">Invoice #INV-001</p>
                      <p className="text-sm text-muted-foreground">April 1, 2023</p>
                    </div>
                    <div className="flex items-center">
                      <span className="mr-4 font-medium">$199.00</span>
                      <Button variant="outline" size="sm">
                        Download
                      </Button>
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between rounded-md border p-3">
                    <div>
                      <p className="font-medium">Invoice #INV-002</p>
                      <p className="text-sm text-muted-foreground">April 8, 2023</p>
                    </div>
                    <div className="flex items-center">
                      <span className="mr-4 font-medium">$199.00</span>
                      <Button variant="outline" size="sm">
                        Download
                      </Button>
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between rounded-md border p-3">
                    <div>
                      <p className="font-medium">Invoice #INV-003</p>
                      <p className="text-sm text-muted-foreground">April 15, 2023</p>
                    </div>
                    <div className="flex items-center">
                      <span className="mr-4 font-medium">$199.00</span>
                      <Button variant="outline" size="sm">
                        Download
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}