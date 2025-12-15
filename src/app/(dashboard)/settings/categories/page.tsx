'use client';

import { useState } from 'react';
import { PageTransition, FadeIn } from '@/components/animations';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { EmptyState } from '@/components/shared';
import { CategoryIcon } from '@/components/features/categories';
import { useCategories } from '@/context/categories-context';
import { CATEGORY_ICONS } from '@/lib/constants';
import { cn } from '@/lib/utils';
import { Tags, ArrowLeft, Plus, Pencil, Trash2, Loader2 } from 'lucide-react';
import Link from 'next/link';
import { toast } from 'sonner';
import { Category } from '@/types';

// Predefined colors
const COLORS = [
  '#ef4444', // red
  '#f97316', // orange
  '#f59e0b', // amber
  '#eab308', // yellow
  '#84cc16', // lime
  '#22c55e', // green
  '#14b8a6', // teal
  '#06b6d4', // cyan
  '#3b82f6', // blue
  '#6366f1', // indigo
  '#8b5cf6', // violet
  '#a855f7', // purple
  '#d946ef', // fuchsia
  '#ec4899', // pink
  '#f43f5e', // rose
];

export default function CategoriesPage() {
  const { categories, createCategory, updateCategory, deleteCategory } = useCategories();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [categoryToEdit, setCategoryToEdit] = useState<Category | null>(null);
  const [categoryToDelete, setCategoryToDelete] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  // Form state
  const [name, setName] = useState('');
  const [icon, setIcon] = useState('');
  const [color, setColor] = useState(COLORS[0]);

  const openCreateDialog = () => {
    setCategoryToEdit(null);
    setName('');
    setIcon('');
    setColor(COLORS[0]);
    setDialogOpen(true);
  };

  const openEditDialog = (category: Category) => {
    setCategoryToEdit(category);
    setName(category.name);
    setIcon(category.icon);
    setColor(category.color);
    setDialogOpen(true);
  };

  const handleSave = async () => {
    if (!name.trim()) {
      toast.error('Please enter a category name');
      return;
    }
    if (!icon) {
      toast.error('Please select an icon');
      return;
    }

    setIsSaving(true);
    try {
      if (categoryToEdit) {
        await updateCategory(categoryToEdit.id, { name, icon, color });
        toast.success('Category updated');
      } else {
        await createCategory({ name, icon, color });
        toast.success('Category created');
      }
      setDialogOpen(false);
    } catch {
      toast.error('Failed to save category');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteClick = (id: string) => {
    setCategoryToDelete(id);
    setDeleteDialogOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (categoryToDelete) {
      try {
        await deleteCategory(categoryToDelete);
        toast.success('Category deleted');
      } catch {
        toast.error('Failed to delete category');
      }
    }
    setDeleteDialogOpen(false);
    setCategoryToDelete(null);
  };

  return (
    <PageTransition>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" asChild>
              <Link href="/settings">
                <ArrowLeft className="h-4 w-4" />
              </Link>
            </Button>
            <div>
              <h2 className="text-2xl font-bold tracking-tight">Categories</h2>
              <p className="text-muted-foreground">Manage your expense categories</p>
            </div>
          </div>
          <Button onClick={openCreateDialog}>
            <Plus className="mr-2 h-4 w-4" />
            Add Category
          </Button>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Your Categories</CardTitle>
            <CardDescription>
              {categories.length} categor{categories.length === 1 ? 'y' : 'ies'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {categories.length === 0 ? (
              <EmptyState
                icon={<Tags className="h-12 w-12" />}
                title="No categories yet"
                description="Create categories to organize your expenses."
                action={{
                  label: 'Create Category',
                  onClick: openCreateDialog,
                }}
              />
            ) : (
              <div className="grid gap-3 sm:grid-cols-2">
                {categories.map((category) => (
                  <FadeIn key={category.id}>
                    <div className="bg-muted/50 hover:bg-muted flex items-center justify-between rounded-lg p-4 transition-colors">
                      <div className="flex items-center gap-3">
                        <CategoryIcon icon={category.icon} color={category.color} size="md" />
                        <span className="font-medium">{category.name}</span>
                      </div>
                      <div className="flex gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => openEditDialog(category)}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="text-destructive h-8 w-8"
                          onClick={() => handleDeleteClick(category.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </FadeIn>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Create/Edit Dialog */}
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                {categoryToEdit ? 'Edit Category' : 'Create Category'}
              </DialogTitle>
              <DialogDescription>
                {categoryToEdit
                  ? 'Update the category details below.'
                  : 'Add a new category to organize your expenses.'}
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-6 py-4">
              {/* Preview */}
              <div className="flex justify-center">
                <div className="flex flex-col items-center gap-2">
                  <CategoryIcon icon={icon || 'more-horizontal'} color={color} size="lg" />
                  <span className="text-muted-foreground text-sm">Preview</span>
                </div>
              </div>

              {/* Name */}
              <div className="space-y-2">
                <Label htmlFor="name">Name</Label>
                <Input
                  id="name"
                  placeholder="e.g., Groceries"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
              </div>

              {/* Icon Selection */}
              <div className="space-y-2">
                <Label>Icon</Label>
                <div className="grid grid-cols-5 gap-2">
                  {Object.entries(CATEGORY_ICONS).map(([iconName, _iconLabel]) => (
                    <button
                      key={iconName}
                      type="button"
                      onClick={() => setIcon(iconName)}
                      className={cn(
                        'flex flex-col items-center gap-1 rounded-lg p-2 transition-colors',
                        icon === iconName
                          ? 'bg-primary text-primary-foreground'
                          : 'bg-muted hover:bg-muted/80'
                      )}
                    >
                      <CategoryIcon icon={iconName} color={icon === iconName ? 'white' : color} size="sm" />
                    </button>
                  ))}
                </div>
              </div>

              {/* Color Selection */}
              <div className="space-y-2">
                <Label>Color</Label>
                <div className="flex flex-wrap gap-2">
                  {COLORS.map((c) => (
                    <button
                      key={c}
                      type="button"
                      onClick={() => setColor(c)}
                      className={cn(
                        'h-8 w-8 rounded-full transition-transform',
                        color === c && 'ring-2 ring-offset-2 ring-offset-background'
                      )}
                      style={{ backgroundColor: c, '--ring-color': c } as React.CSSProperties}
                    />
                  ))}
                </div>
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleSave} disabled={isSaving}>
                {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {categoryToEdit ? 'Update' : 'Create'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Delete Confirmation */}
        <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete Category</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to delete this category? Any transactions using this
                category will need to be recategorized.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={handleConfirmDelete}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              >
                Delete
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </PageTransition>
  );
}
