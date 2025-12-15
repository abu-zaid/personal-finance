'use client';

import { useState, useCallback, memo } from 'react';
import { motion } from 'framer-motion';
import { useTheme } from 'next-themes';
import { PageTransition, FadeIn, StaggerContainer, StaggerItem } from '@/components/animations';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Separator } from '@/components/ui/separator';
import { useAuth } from '@/context/auth-context';
import { useHaptics } from '@/hooks/use-haptics';
import { CURRENCY_OPTIONS, DATE_FORMAT_OPTIONS } from '@/lib/constants';
import { Currency, DateFormat } from '@/types';
import { cn } from '@/lib/utils';
import { 
  User, 
  Settings, 
  Bell, 
  LogOut, 
  Sun, 
  Moon, 
  Monitor,
  Palette,
  ChevronRight,
  Sparkles,
  DollarSign,
  Calendar,
  Smartphone,
  Tags,
  Check
} from 'lucide-react';
import Link from 'next/link';
import { toast } from 'sonner';

// Memoized theme option component
const ThemeOption = memo(function ThemeOption({ 
  value, 
  label, 
  icon: Icon, 
  isSelected, 
  onClick 
}: { 
  value: string; 
  label: string; 
  icon: React.ElementType; 
  isSelected: boolean; 
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "relative flex flex-col items-center gap-2 p-3 sm:p-4 rounded-xl border-2 transition-all",
        isSelected 
          ? "border-primary bg-primary/10" 
          : "border-transparent bg-muted/50 hover:bg-muted"
      )}
    >
      <div className={cn(
        "p-2.5 sm:p-3 rounded-xl",
        isSelected ? "bg-primary/20" : "bg-background"
      )}>
        <Icon className={cn("h-4 w-4 sm:h-5 sm:w-5", isSelected && "text-primary")} />
      </div>
      <span className={cn(
        "text-xs sm:text-sm font-medium",
        isSelected && "text-primary"
      )}>
        {label}
      </span>
      {isSelected && (
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          className="absolute -top-1 -right-1 bg-primary rounded-full p-0.5"
        >
          <Check className="h-3 w-3 text-primary-foreground" />
        </motion.div>
      )}
    </button>
  );
});

export default function SettingsPage() {
  const { user, logout, updatePreferences, updateProfile } = useAuth();
  const { theme, setTheme } = useTheme();
  const haptics = useHaptics();
  
  const [isEditProfileOpen, setIsEditProfileOpen] = useState(false);
  const [editName, setEditName] = useState(user?.name || '');
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [weeklyDigest, setWeeklyDigest] = useState(true);
  const [hapticsEnabled, setHapticsEnabled] = useState(true);

  const handleSaveProfile = useCallback(() => {
    if (editName.trim()) {
      updateProfile(editName.trim());
      setIsEditProfileOpen(false);
      haptics.success();
      toast.success('Profile updated');
    }
  }, [editName, updateProfile, haptics]);

  const openEditProfile = useCallback(() => {
    haptics.light();
    setEditName(user?.name || '');
    setIsEditProfileOpen(true);
  }, [user?.name, haptics]);

  const handleThemeChange = useCallback((newTheme: string) => {
    haptics.selection();
    setTheme(newTheme);
  }, [setTheme, haptics]);

  const handleCurrencyChange = useCallback((value: string) => {
    haptics.selection();
    updatePreferences({ currency: value as Currency });
    toast.success(`Currency changed to ${value}`);
  }, [updatePreferences, haptics]);

  const handleDateFormatChange = useCallback((value: string) => {
    haptics.selection();
    updatePreferences({ dateFormat: value as DateFormat });
  }, [updatePreferences, haptics]);

  const handleLogout = useCallback(() => {
    haptics.medium();
    logout();
  }, [logout, haptics]);

  const handleToggleChange = useCallback((
    setter: (value: boolean) => void, 
    value: boolean
  ) => {
    haptics.light();
    setter(value);
  }, [haptics]);

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <PageTransition>
      <div className="space-y-5 pb-20 lg:pb-4">
        {/* Header */}
        <div>
          <h1 className="text-xl font-bold lg:text-2xl">Settings</h1>
          <p className="text-muted-foreground text-xs sm:text-sm">Manage your account and preferences</p>
        </div>

        <StaggerContainer className="space-y-4">
          {/* Profile Card */}
          <StaggerItem>
            <motion.div
              className="relative overflow-hidden rounded-2xl p-5"
              style={{
                background: 'linear-gradient(145deg, #98EF5A 0%, #7BEA3C 100%)',
                boxShadow: '0 0 40px rgba(152, 239, 90, 0.2)',
              }}
            >
              <div className="absolute -right-8 -top-8 h-32 w-32 rounded-full bg-white/10 blur-2xl" />
              <div className="absolute -left-8 -bottom-8 h-24 w-24 rounded-full bg-white/10 blur-2xl" />
              
              <div className="relative flex items-center gap-4">
                <Avatar className="h-14 w-14 sm:h-16 sm:w-16 border-2 border-white/30 shadow-lg">
                  <AvatarFallback 
                    className="bg-white/20 text-[#101010] text-lg sm:text-xl font-bold"
                  >
                    {getInitials(user?.name || 'User')}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <h2 className="text-base sm:text-lg font-bold text-[#101010] truncate">
                    {user?.name || 'User'}
                  </h2>
                  <p className="text-[#101010]/70 text-xs sm:text-sm truncate">
                    {user?.email || 'No email'}
                  </p>
                </div>
                <Button 
                  size="sm"
                  onClick={openEditProfile}
                  className="bg-white/20 hover:bg-white/30 text-[#101010] border-0 backdrop-blur-sm text-xs sm:text-sm"
                >
                  Edit
                </Button>
              </div>
            </motion.div>
          </StaggerItem>

          {/* Appearance Section */}
          <StaggerItem>
            <FadeIn>
              <Card>
                <CardHeader className="pb-3">
                  <div className="flex items-center gap-2">
                    <div className="p-1.5 rounded-lg bg-purple-500/10">
                      <Palette className="h-4 w-4 text-purple-500" />
                    </div>
                    <CardTitle className="text-sm sm:text-base">Appearance</CardTitle>
                  </div>
                  <CardDescription className="text-xs">Choose your preferred theme</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-3 gap-2 sm:gap-3">
                    <ThemeOption
                      value="light"
                      label="Light"
                      icon={Sun}
                      isSelected={theme === 'light'}
                      onClick={() => handleThemeChange('light')}
                    />
                    <ThemeOption
                      value="dark"
                      label="Dark"
                      icon={Moon}
                      isSelected={theme === 'dark'}
                      onClick={() => handleThemeChange('dark')}
                    />
                    <ThemeOption
                      value="system"
                      label="Auto"
                      icon={Monitor}
                      isSelected={theme === 'system'}
                      onClick={() => handleThemeChange('system')}
                    />
                  </div>
                </CardContent>
              </Card>
            </FadeIn>
          </StaggerItem>

          {/* Preferences Section */}
          <StaggerItem>
            <FadeIn>
              <Card>
                <CardHeader className="pb-3">
                  <div className="flex items-center gap-2">
                    <div className="p-1.5 rounded-lg bg-blue-500/10">
                      <Settings className="h-4 w-4 text-blue-500" />
                    </div>
                    <CardTitle className="text-sm sm:text-base">Preferences</CardTitle>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Currency */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-lg bg-green-500/10">
                        <DollarSign className="h-4 w-4 text-green-500" />
                      </div>
                      <div>
                        <Label className="text-xs sm:text-sm font-medium">Currency</Label>
                        <p className="text-[10px] sm:text-xs text-muted-foreground">Display currency</p>
                      </div>
                    </div>
                    <Select
                      value={user?.preferences.currency}
                      onValueChange={handleCurrencyChange}
                    >
                      <SelectTrigger className="w-[90px] sm:w-[100px] h-9 text-xs sm:text-sm">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {CURRENCY_OPTIONS.map((option) => (
                          <SelectItem key={option.value} value={option.value}>
                            {option.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <Separator />

                  {/* Date Format */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-lg bg-orange-500/10">
                        <Calendar className="h-4 w-4 text-orange-500" />
                      </div>
                      <div>
                        <Label className="text-xs sm:text-sm font-medium">Date Format</Label>
                        <p className="text-[10px] sm:text-xs text-muted-foreground">How dates appear</p>
                      </div>
                    </div>
                    <Select
                      value={user?.preferences.dateFormat}
                      onValueChange={handleDateFormatChange}
                    >
                      <SelectTrigger className="w-[100px] sm:w-[120px] h-9 text-xs sm:text-sm">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {DATE_FORMAT_OPTIONS.map((option) => (
                          <SelectItem key={option.value} value={option.value}>
                            {option.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <Separator />

                  {/* Haptics */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-lg bg-pink-500/10">
                        <Smartphone className="h-4 w-4 text-pink-500" />
                      </div>
                      <div>
                        <Label className="text-xs sm:text-sm font-medium">Haptic Feedback</Label>
                        <p className="text-[10px] sm:text-xs text-muted-foreground">Vibration on tap</p>
                      </div>
                    </div>
                    <Switch 
                      checked={hapticsEnabled}
                      onCheckedChange={(v) => handleToggleChange(setHapticsEnabled, v)}
                    />
                  </div>
                </CardContent>
              </Card>
            </FadeIn>
          </StaggerItem>

          {/* Categories Link */}
          <StaggerItem>
            <FadeIn>
              <Link href="/settings/categories">
                <Card className="hover:bg-muted/50 transition-colors cursor-pointer">
                  <CardContent className="flex items-center justify-between py-4">
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-lg bg-indigo-500/10">
                        <Tags className="h-4 w-4 text-indigo-500" />
                      </div>
                      <div>
                        <p className="font-medium text-xs sm:text-sm">Manage Categories</p>
                        <p className="text-[10px] sm:text-xs text-muted-foreground">Add, edit, or remove categories</p>
                      </div>
                    </div>
                    <ChevronRight className="h-5 w-5 text-muted-foreground" />
                  </CardContent>
                </Card>
              </Link>
            </FadeIn>
          </StaggerItem>

          {/* Notifications Section */}
          <StaggerItem>
            <FadeIn>
              <Card>
                <CardHeader className="pb-3">
                  <div className="flex items-center gap-2">
                    <div className="p-1.5 rounded-lg bg-yellow-500/10">
                      <Bell className="h-4 w-4 text-yellow-500" />
                    </div>
                    <CardTitle className="text-sm sm:text-base">Notifications</CardTitle>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-lg bg-amber-500/10">
                        <Sparkles className="h-4 w-4 text-amber-500" />
                      </div>
                      <div>
                        <Label className="text-xs sm:text-sm font-medium">Budget Alerts</Label>
                        <p className="text-[10px] sm:text-xs text-muted-foreground">Near budget limit</p>
                      </div>
                    </div>
                    <Switch 
                      checked={notificationsEnabled}
                      onCheckedChange={(v) => handleToggleChange(setNotificationsEnabled, v)}
                    />
                  </div>

                  <Separator />

                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-lg bg-cyan-500/10">
                        <Calendar className="h-4 w-4 text-cyan-500" />
                      </div>
                      <div>
                        <Label className="text-xs sm:text-sm font-medium">Weekly Digest</Label>
                        <p className="text-[10px] sm:text-xs text-muted-foreground">Spending summary</p>
                      </div>
                    </div>
                    <Switch 
                      checked={weeklyDigest}
                      onCheckedChange={(v) => handleToggleChange(setWeeklyDigest, v)}
                    />
                  </div>
                </CardContent>
              </Card>
            </FadeIn>
          </StaggerItem>

          {/* Sign Out */}
          <StaggerItem>
            <FadeIn>
              <Card className="border-destructive/30">
                <CardContent className="py-4">
                  <button 
                    onClick={handleLogout}
                    className="w-full flex items-center justify-between"
                  >
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-lg bg-destructive/10">
                        <LogOut className="h-4 w-4 text-destructive" />
                      </div>
                      <div className="text-left">
                        <p className="font-medium text-xs sm:text-sm text-destructive">Sign Out</p>
                        <p className="text-[10px] sm:text-xs text-muted-foreground">Log out of your account</p>
                      </div>
                    </div>
                    <ChevronRight className="h-5 w-5 text-destructive/50" />
                  </button>
                </CardContent>
              </Card>
            </FadeIn>
          </StaggerItem>
        </StaggerContainer>
      </div>

      {/* Edit Profile Dialog */}
      <Dialog open={isEditProfileOpen} onOpenChange={setIsEditProfileOpen}>
        <DialogContent className="sm:max-w-[400px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-base sm:text-lg">
              <div 
                className="p-2 rounded-xl"
                style={{
                  background: 'linear-gradient(145deg, #98EF5A 0%, #7BEA3C 100%)',
                }}
              >
                <User className="h-4 w-4 text-[#101010]" />
              </div>
              Edit Profile
            </DialogTitle>
            <DialogDescription className="text-xs sm:text-sm">
              Update your profile information
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            {/* Avatar Preview */}
            <div className="flex justify-center">
              <Avatar className="h-20 w-20 border-4 border-primary/20">
                <AvatarFallback 
                  className="bg-primary/10 text-primary text-2xl font-bold"
                >
                  {getInitials(editName || 'U')}
                </AvatarFallback>
              </Avatar>
            </div>

            <div className="space-y-2">
              <Label htmlFor="name" className="text-xs sm:text-sm">Display Name</Label>
              <Input
                id="name"
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                placeholder="Enter your name"
                className="h-10 sm:h-11"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="email" className="text-xs sm:text-sm">Email</Label>
              <Input
                id="email"
                value={user?.email || ''}
                disabled
                className="bg-muted h-10 sm:h-11"
              />
              <p className="text-muted-foreground text-[10px] sm:text-xs">Email cannot be changed</p>
            </div>
          </div>
          
          <DialogFooter className="gap-2 sm:gap-0">
            <Button 
              variant="outline" 
              onClick={() => setIsEditProfileOpen(false)}
              className="flex-1 sm:flex-none"
            >
              Cancel
            </Button>
            <Button 
              onClick={handleSaveProfile} 
              disabled={!editName.trim()}
              className="flex-1 sm:flex-none"
              style={{
                background: editName.trim() 
                  ? 'linear-gradient(145deg, #98EF5A 0%, #7BEA3C 100%)' 
                  : undefined,
                color: editName.trim() ? '#101010' : undefined,
              }}
            >
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </PageTransition>
  );
}
