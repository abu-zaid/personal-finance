'use client';

import { PageTransition, StaggerContainer, StaggerItem } from '@/components/animations';
import { useSettingsView } from '@/hooks/use-settings-view';

import { SettingsHeader } from '@/components/features/settings/settings-header';
import { ProfileSection } from '@/components/features/settings/profile-section';
import { ThemeSelector } from '@/components/features/settings/theme-selector';
import { PreferencesSection } from '@/components/features/settings/preferences-section';
import { DataManagementSection } from '@/components/features/settings/data-management-section';
import { EditProfileDialog } from '@/components/features/settings/edit-profile-dialog';
import { ExportDataDialog } from '@/components/features/settings/export-data-dialog';

export default function SettingsPage() {
  const {
    // Data
    user,
    theme,
    isEditProfileOpen,
    editName,

    // Actions
    setEditName,
    setIsEditProfileOpen,
    openEditProfile,
    handleSaveProfile,
    handleThemeChange,
    handleCurrencyChange,
    // handleToggleHaptics,
    handleLogout,

    // Export
    openExportDialog,
    isExportDialogOpen,
    setIsExportDialogOpen,
    handleExportExcel,
    isExportPending
  } = useSettingsView();

  return (
    <PageTransition>
      <div className="space-y-6 pb-24 lg:pb-8 max-w-2xl mx-auto px-4">
        <SettingsHeader />

        <StaggerContainer className="space-y-6">
          {/* Profile Section */}
          <StaggerItem>
            <ProfileSection
              user={user}
              onEdit={openEditProfile}
            />
          </StaggerItem>

          {/* Appearance */}
          <StaggerItem>
            <ThemeSelector
              currentTheme={theme}
              onThemeChange={handleThemeChange}
            />
          </StaggerItem>

          {/* Preferences Group */}
          <StaggerItem>
            <PreferencesSection
              currency={user?.preferences.currency || 'USD'}
              onCurrencyChange={handleCurrencyChange}
            />
          </StaggerItem>

          {/* All Other Actions */}
          <StaggerItem>
            <DataManagementSection
              onExport={openExportDialog}
              onLogout={handleLogout}
            />
          </StaggerItem>
        </StaggerContainer>
      </div>

      {/* Edit Profile Dialog */}
      <EditProfileDialog
        open={isEditProfileOpen}
        onOpenChange={setIsEditProfileOpen}
        editName={editName}
        onNameChange={setEditName}
        userEmail={user?.email}
        onSave={handleSaveProfile}
      />

      {/* Export Data Dialog */}
      <ExportDataDialog
        open={isExportDialogOpen}
        onOpenChange={setIsExportDialogOpen}
        onExport={handleExportExcel}
        isExporting={isExportPending}
      />
    </PageTransition>
  );
}
