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
import { CURRENCY_OPTIONS } from '@/lib/constants';
import { Currency } from '@/types';
import { cn } from '@/lib/utils';
import {
  User,
  Settings,
  LogOut,
  Sun,
  Moon,
  Monitor,
  ChevronRight,
  DollarSign,
  Smartphone,
  Tags,
  Check,
  Download,
  FileText
} from 'lucide-react';
import Link from 'next/link';
import { toast } from 'sonner';
import { useTransactions } from '@/context/transactions-context';
import { format } from 'date-fns';

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
  const { transactions } = useTransactions();
  const { theme, setTheme } = useTheme();
  const haptics = useHaptics();

  const [isEditProfileOpen, setIsEditProfileOpen] = useState(false);
  const [editName, setEditName] = useState(user?.name || '');
  const [hapticsEnabled, setHapticsEnabled] = useState(true);

  const handleExportCSV = useCallback(() => {
    haptics.success();

    // Prepare CSV content
    const headers = ['Date', 'Category', 'Amount', 'Notes'];
    const rows = transactions.map(t => [
      format(new Date(t.date), 'yyyy-MM-dd'),
      t.category?.name || 'Uncategorized',
      t.amount,
      `"${t.notes || ''}"` // Wrap notes in quotes to handle commas
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map(r => r.join(','))
    ].join('\n');

    // Create download link
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `financeflow-export-${format(new Date(), 'yyyy-MM-dd')}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    toast.success('Transaction history exported to CSV');
  }, [transactions, haptics]);

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
      <div className="space-y-6 pb-24 lg:pb-8 max-w-2xl mx-auto px-4">
        {/* Header */}
        <div className="pt-4">
          <h1 className="text-2xl font-bold">Settings</h1>
          <p className="text-muted-foreground text-sm">Manage preferences and account</p>
        </div>

        <StaggerContainer className="space-y-6">
          {/* Profile Section */}
          <StaggerItem>
            <div className="flex items-center gap-4 bg-card p-4 rounded-3xl border shadow-sm">
              <Avatar className="h-16 w-16 border-2 border-background shadow-sm">
                <AvatarFallback className="bg-primary/10 text-primary text-xl font-bold">
                  {getInitials(user?.name || 'User')}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1">
                <h2 className="font-bold text-lg leading-tight">{user?.name || 'User'}</h2>
                <p className="text-sm text-muted-foreground">{user?.email || 'No email'}</p>
              </div>
              <Button variant="outline" size="sm" onClick={openEditProfile} className="rounded-full px-4">
                Edit
              </Button>
            </div>
          </StaggerItem>

          {/* Appearance */}
          <StaggerItem>
            <div className="space-y-3">
              <h3 className="text-sm font-semibold text-muted-foreground px-1">Appearance</h3>
              <Card className="rounded-3xl border-none shadow-sm bg-white dark:bg-card">
                <CardContent className="p-4 grid grid-cols-3 gap-3">
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
                </CardContent>
              </Card>
            </div>
          </StaggerItem>

          {/* Preferences Group */}
          <StaggerItem>
            <div className="space-y-3">
              <h3 className="text-sm font-semibold text-muted-foreground px-1">Preferences</h3>
              <Card className="rounded-3xl border-none shadow-sm bg-white dark:bg-card overflow-hidden divide-y divide-border/50">
                <div className="p-4 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-muted rounded-full">
                      <DollarSign className="w-4 h-4 text-foreground" />
                    </div>
                    <span className="font-medium text-sm">Currency</span>
                  </div>
                  <Select
                    value={user?.preferences.currency}
                    onValueChange={handleCurrencyChange}
                  >
                    <SelectTrigger className="w-[180px] h-8 text-xs border-none bg-muted/50 rounded-full truncate">
                      <SelectValue placeholder="Select currency" />
                    </SelectTrigger>
                    <SelectContent className="max-h-[300px]">
                      {CURRENCY_OPTIONS.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="p-4 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-muted rounded-full">
                      <Smartphone className="w-4 h-4 text-foreground" />
                    </div>
                    <span className="font-medium text-sm">Haptics</span>
                  </div>
                  <Switch
                    checked={hapticsEnabled}
                    onCheckedChange={(v) => handleToggleChange(setHapticsEnabled, v)}
                  />
                </div>
              </Card>
            </div>
          </StaggerItem>

          {/* More Actions */}
          <StaggerItem>
            <div className="space-y-3">
              <h3 className="text-sm font-semibold text-muted-foreground px-1">More</h3>
              <Card className="rounded-3xl border-none shadow-sm bg-white dark:bg-card overflow-hidden divide-y divide-border/50">
                <Link href="/settings/categories" className="p-4 flex items-center justify-between hover:bg-muted/30 transition-colors">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-muted rounded-full">
                      <Tags className="w-4 h-4 text-foreground" />
                    </div>
                    <span className="font-medium text-sm">Manage Categories</span>
                  </div>
                  <ChevronRight className="h-4 w-4 text-muted-foreground" />
                </Link>

                <button onClick={handleExportCSV} className="w-full p-4 flex items-center justify-between hover:bg-muted/30 transition-colors">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-muted rounded-full">
                      <Download className="w-4 h-4 text-foreground" />
                    </div>
                    <span className="font-medium text-sm">Export Data (CSV)</span>
                  </div>
                  <ChevronRight className="h-4 w-4 text-muted-foreground" />
                </button>

                <button onClick={handleLogout} className="w-full p-4 flex items-center justify-between hover:bg-red-50 dark:hover:bg-red-900/10 transition-colors group">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-red-100 dark:bg-red-900/20 rounded-full group-hover:bg-red-200 dark:group-hover:bg-red-900/40 transition-colors">
                      <LogOut className="w-4 h-4 text-red-600 dark:text-red-400" />
                    </div>
                    <span className="font-medium text-sm text-red-600 dark:text-red-400">Sign Out</span>
                  </div>
                </button>
              </Card>
            </div>
          </StaggerItem>

        </StaggerContainer>
      </div>

      {/* Edit Profile Dialog */}
      <Dialog open={isEditProfileOpen} onOpenChange={setIsEditProfileOpen}>
        <DialogContent className="sm:max-w-[400px]">
          <DialogHeader>
            <DialogTitle>Edit Profile</DialogTitle>
            <DialogDescription>Update your personal information</DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="flex justify-center">
              <Avatar className="h-20 w-20 border-4 border-muted">
                <AvatarFallback className="bg-primary/10 text-primary text-2xl font-bold">
                  {getInitials(editName || 'U')}
                </AvatarFallback>
              </Avatar>
            </div>

            <div className="space-y-2">
              <Label htmlFor="name">Display Name</Label>
              <Input
                id="name"
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                placeholder="Enter your name"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                value={user?.email || ''}
                disabled
                className="bg-muted"
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditProfileOpen(false)}>Cancel</Button>
            <Button onClick={handleSaveProfile} disabled={!editName.trim()}>Save Changes</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </PageTransition>
  );
}
