'use client';

import { useState, useCallback } from 'react';
import { useTheme } from 'next-themes';
import { format } from 'date-fns';
import { toast } from 'sonner';
import * as XLSX from 'xlsx'; // Import xlsx

import { useAuth } from '@/context/auth-context';
import { useHaptics } from '@/hooks/use-haptics';
import { useAppDispatch, useAppSelector } from '@/lib/hooks'; // Add dispatch
import { fetchTransactionsForExport } from '@/lib/features/transactions/transactionsSlice';
import { Currency } from '@/types';

export function useSettingsView() {
    const dispatch = useAppDispatch();
    const { user, logout, updatePreferences, updateProfile } = useAuth();
    // const transactions = useAppSelector(selectTransactions); // No longer needed for direct export
    const { theme, setTheme } = useTheme();
    const haptics = useHaptics();

    // -- State --
    const [isEditProfileOpen, setIsEditProfileOpen] = useState(false);
    const [isExportPending, setIsExportPending] = useState(false);
    const [isExportDialogOpen, setIsExportDialogOpen] = useState(false);
    const [editName, setEditName] = useState(user?.name || '');
    // const [hapticsEnabled, setHapticsEnabled] = useState(true); // Removed previously

    // -- Handlers --
    const openEditProfile = useCallback(() => {
        haptics.light();
        setEditName(user?.name || '');
        setIsEditProfileOpen(true);
    }, [user?.name, haptics]);

    const handleSaveProfile = useCallback(async () => {
        if (editName.trim()) {
            await updateProfile(editName.trim());
            setIsEditProfileOpen(false);
            haptics.success();
            toast.success('Profile updated');
        }
    }, [editName, updateProfile, haptics]);

    const handleThemeChange = useCallback((newTheme: string) => {
        haptics.selection();
        setTheme(newTheme);
    }, [setTheme, haptics]);

    const handleCurrencyChange = useCallback((value: string) => {
        console.log('Currency change triggered:', value);
        haptics.selection();
        try {
            updatePreferences({ currency: value as Currency });
            toast.success(`Currency changed to ${value}`);
        } catch (error) {
            console.error('Failed to update currency:', error);
            toast.error('Failed to update currency');
        }
    }, [updatePreferences, haptics]);

    const handleToggleHaptics = useCallback((value: boolean) => {
        haptics.light();
        // setHapticsEnabled(value); // Removed state
        // In a real app, save to preferences/local storage
    }, [haptics]);

    const handleLogout = useCallback(() => {
        haptics.medium();
        logout();
    }, [logout, haptics]);

    const openExportDialog = useCallback(() => {
        haptics.light();
        setIsExportDialogOpen(true);
    }, [haptics]);

    const handleExportExcel = useCallback(async (date: Date) => {
        setIsExportPending(true);
        try {
            const monthStr = format(date, 'yyyy-MM');

            // Fetch data
            const resultAction = await dispatch(fetchTransactionsForExport({
                startMonth: monthStr,
                endMonth: monthStr // Single month export for now based on UI
            }));

            if (fetchTransactionsForExport.rejected.match(resultAction)) {
                throw new Error(resultAction.payload as string || 'Failed to fetch data');
            }

            const transactions = resultAction.payload;

            if (transactions.length === 0) {
                toast.info('No transactions found for this month');
                setIsExportPending(false);
                return;
            }

            // Prepare Data for Excel
            const data = transactions.map((t: any) => ({
                Date: format(new Date(t.date), 'yyyy-MM-dd'),
                Type: t.type.toUpperCase(),
                Category: t.category?.name || 'Uncategorized',
                Amount: t.amount,
                Notes: t.notes || '',
                Recurring: 'No', // Placeholder until implemented
            }));

            // Generate Worksheet
            const ws = XLSX.utils.json_to_sheet(data);

            // Auto-width columns (basic heuristic)
            const colWidths = [
                { wch: 12 }, // Date
                { wch: 10 }, // Type
                { wch: 20 }, // Category
                { wch: 12 }, // Amount
                { wch: 40 }, // Notes
                { wch: 10 }, // Recurring
            ];
            ws['!cols'] = colWidths;

            // Generate Workbook
            const wb = XLSX.utils.book_new();
            XLSX.utils.book_append_sheet(wb, ws, monthStr);

            // Write File
            XLSX.writeFile(wb, `FinanceFlow_${monthStr}.xlsx`);

            haptics.success();
            toast.success('Export successful');
            setIsExportDialogOpen(false);
        } catch (error) {
            console.error(error);
            toast.error('Export failed');
            haptics.error();
        } finally {
            setIsExportPending(false);
        }
    }, [dispatch, haptics]);

    return {
        // Data
        user,
        theme,
        // hapticsEnabled, // Removed

        // UI State
        isEditProfileOpen,
        isExportDialogOpen,
        isExportPending,
        editName,
        setEditName,
        setIsEditProfileOpen,
        setIsExportDialogOpen,

        // Actions
        openEditProfile,
        openExportDialog,
        handleSaveProfile,
        handleThemeChange,
        handleCurrencyChange,
        // handleToggleHaptics, // Removed
        handleLogout,
        handleExportExcel,
    };
}
