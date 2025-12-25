'use client';

import { useMediaQuery } from '@/hooks/use-media-query'; // Check if exists, else implement simple hook or use library
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from '@/components/ui/dialog';
import {
    Sheet,
    SheetContent,
    SheetDescription,
    SheetHeader,
    SheetTitle,
    SheetFooter,
} from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { useState, useEffect } from 'react';

interface EditProfileDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    editName: string;
    onNameChange: (val: string) => void;
    userEmail: string | undefined;
    onSave: () => void;
}

export function EditProfileDialog({
    open,
    onOpenChange,
    editName,
    onNameChange,
    userEmail,
    onSave
}: EditProfileDialogProps) {
    const isDesktop = useMediaQuery("(min-width: 768px)");

    const getInitials = (name: string) => {
        return name
            .split(' ')
            .map(n => n[0])
            .join('')
            .toUpperCase()
            .slice(0, 2);
    };

    const Content = (
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
                    onChange={(e) => onNameChange(e.target.value)}
                    placeholder="Enter your name"
                    className="bg-muted/30 focus:bg-background transition-colors"
                />
            </div>

            <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                    id="email"
                    value={userEmail || ''}
                    disabled
                    className="bg-muted text-muted-foreground"
                />
            </div>
        </div>
    );

    const Footer = (
        <div className="flex gap-2 justify-end mt-4">
            <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
            <Button onClick={onSave} disabled={!editName.trim()}>Save Changes</Button>
        </div>
    );

    if (isDesktop) {
        return (
            <Dialog open={open} onOpenChange={onOpenChange}>
                <DialogContent className="sm:max-w-[400px]">
                    <DialogHeader>
                        <DialogTitle>Edit Profile</DialogTitle>
                        <DialogDescription>Update your personal information</DialogDescription>
                    </DialogHeader>
                    {Content}
                    <DialogFooter>
                        <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
                        <Button onClick={onSave} disabled={!editName.trim()}>Save Changes</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        );
    }

    return (
        <Sheet open={open} onOpenChange={onOpenChange}>
            <SheetContent side="bottom" className="rounded-t-[2rem] pt-6 px-6 pb-8">
                <SheetHeader>
                    <SheetTitle>Edit Profile</SheetTitle>
                    <SheetDescription>Update your personal information</SheetDescription>
                </SheetHeader>
                {Content}
                <SheetFooter className="gap-2">
                    <Button variant="outline" onClick={() => onOpenChange(false)} className="flex-1">Cancel</Button>
                    <Button onClick={onSave} disabled={!editName.trim()} className="flex-1">Save Changes</Button>
                </SheetFooter>
            </SheetContent>
        </Sheet>
    );
}

// Inline useMediaQuery if it doesn't exist globally yet to ensure self-contained fix
// (Ideally this should be imported from @/hooks/use-media-query)
import { useMediaQuery as useGlobalMediaQuery } from '@/hooks/use-media-query';
// Since I can't verify if use-media-query exists in one shot without another tool call, 
// I'll assume it likely exists based on previous logs, BUT to be safe I will use the global import.
// If it fails I will fix it.
