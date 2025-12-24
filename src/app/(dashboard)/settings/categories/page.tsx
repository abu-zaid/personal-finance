'use client';

import { useState } from 'react';
import { PageTransition, StaggerContainer, StaggerItem } from '@/components/animations';
import { Card, CardContent } from '@/components/ui/card';
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
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetFooter,
} from '@/components/ui/sheet';
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
// import { useCategories } from '@/context/categories-context';
import { CATEGORY_ICONS } from '@/lib/constants';
import { cn } from '@/lib/utils';
import { Tags, ArrowLeft, Plus, Trash2, Loader2, ChevronRight } from 'lucide-react';
import Link from 'next/link';
import { toast } from 'sonner';
import { Category } from '@/types';
import { useMediaQuery } from '@/hooks/use-media-query';

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

interface CategoryFormProps {
  name: string;
  setName: (name: string) => void;
  icon: string;
  setIcon: (icon: string) => void;
  color: string;
  setColor: (color: string) => void;
}

function CategoryForm({ name, setName, icon, setIcon, color, setColor }: CategoryFormProps) {
  return (
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
          className="bg-transparent"
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
                'flex flex-col items-center gap-1 rounded-xl p-2 transition-all duration-200',
                icon === iconName
                  ? 'bg-muted ring-2 ring-primary ring-offset-2 ring-offset-background'
                  : 'bg-muted/50 hover:bg-muted hover:scale-105'
              )}
            >
              <CategoryIcon icon={iconName} color={color} size="sm" />
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
  );
}

import {
  selectCategories,
  createCategory,
  updateCategory,
  deleteCategory
} from '@/lib/features/categories/categoriesSlice';
import { useAppDispatch, useAppSelector } from '@/lib/hooks';

export default function CategoriesPage() {
  const dispatch = useAppDispatch();
  const categories = useAppSelector(selectCategories);
  const isDesktop = useMediaQuery('(min-width: 768px)');

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
        await dispatch(updateCategory({ id: categoryToEdit.id, input: { name, icon, color } })).unwrap();
        toast.success('Category updated');
      } else {
        await dispatch(createCategory({ name, icon, color })).unwrap();
        toast.success('Category created');
      }
      setDialogOpen(false);
    } catch {
      toast.error('Failed to save category');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteClick = (id: string, e?: React.MouseEvent) => {
    e?.stopPropagation();
    setCategoryToDelete(id);
    setDeleteDialogOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (categoryToDelete) {
      try {
        await dispatch(deleteCategory(categoryToDelete)).unwrap();
        toast.success('Category deleted');
        setDialogOpen(false);
      } catch {
        toast.error('Failed to delete category');
      }
    }
    setDeleteDialogOpen(false);
    setCategoryToDelete(null);
  };

  return (
    <PageTransition>
      <div className="space-y-6 pb-24 lg:pb-8 max-w-2xl mx-auto px-4">
        {/* Header */}
        <div className="pt-4 flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Button variant="ghost" size="icon" asChild className="h-8 w-8 -ml-2 rounded-full">
                <Link href="/settings">
                  <ArrowLeft className="h-4 w-4" />
                </Link>
              </Button>
              <h1 className="text-2xl font-bold">Categories</h1>
            </div>
            <p className="text-muted-foreground text-sm pl-8">
              {categories.length} categor{categories.length === 1 ? 'y' : 'ies'} defined
            </p>
          </div>
          <Button onClick={openCreateDialog} size="sm" className="rounded-full px-4">
            <Plus className="mr-1.5 h-4 w-4" />
            Add
          </Button>
        </div>

        {categories.length === 0 ? (
          <div className="pt-10">
            <EmptyState
              icon={<Tags className="h-12 w-12" />}
              title="No categories yet"
              description="Create categories to organize your expenses."
              action={{
                label: 'Create Category',
                onClick: openCreateDialog,
              }}
            />
          </div>
        ) : (
          <StaggerContainer className="space-y-3">
            {categories.map((category) => (
              <StaggerItem key={category.id}>
                <div
                  onClick={() => openEditDialog(category)}
                  className="group flex items-center justify-between p-4 bg-white dark:bg-card rounded-3xl border shadow-sm hover:shadow-md transition-all cursor-pointer"
                >
                  <div className="flex items-center gap-4">
                    <div className="relative">
                      <div
                        className="absolute inset-0 rounded-full opacity-20"
                        style={{ backgroundColor: category.color }}
                      />
                      <CategoryIcon icon={category.icon} color={category.color} size="md" className="relative z-10" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-sm sm:text-base">{category.name}</h3>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
                      onClick={(e) => handleDeleteClick(category.id, e)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                    <ChevronRight className="h-4 w-4 text-muted-foreground/50" />
                  </div>
                </div>
              </StaggerItem>
            ))}
          </StaggerContainer>
        )}

        {/* Responsive Drawer/Dialog */}
        {isDesktop ? (
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogContent className="sm:max-w-[400px]">
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

              <CategoryForm
                name={name}
                setName={setName}
                icon={icon}
                setIcon={setIcon}
                color={color}
                setColor={setColor}
              />

              <DialogFooter className="gap-2 sm:gap-0">
                {categoryToEdit && (
                  <Button
                    type="button"
                    variant="destructive"
                    className="sm:mr-auto"
                    onClick={() => handleDeleteClick(categoryToEdit.id)}
                  >
                    Delete
                  </Button>
                )}
                <div className="flex gap-2">
                  <Button variant="outline" onClick={() => setDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button onClick={handleSave} disabled={isSaving}>
                    {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    {categoryToEdit ? 'Update' : 'Create'}
                  </Button>
                </div>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        ) : (
          <Sheet open={dialogOpen} onOpenChange={setDialogOpen}>
            <SheetContent side="bottom" className="flex flex-col rounded-t-3xl p-0 h-[85vh] max-h-[85vh]">
              <div className="flex-1 overflow-y-auto p-6">
                <SheetHeader className="text-left mb-4 p-0">
                  <SheetTitle>
                    {categoryToEdit ? 'Edit Category' : 'Create Category'}
                  </SheetTitle>
                  <SheetDescription>
                    {categoryToEdit
                      ? 'Update the category details below.'
                      : 'Add a new category to organize your expenses.'}
                  </SheetDescription>
                </SheetHeader>

                <CategoryForm
                  name={name}
                  setName={setName}
                  icon={icon}
                  setIcon={setIcon}
                  color={color}
                  setColor={setColor}
                />
              </div>

              <div className="p-6 pt-2 bg-background border-t">
                <div className="flex flex-row gap-3">
                  <Button
                    variant="outline"
                    onClick={() => setDialogOpen(false)}
                    className="flex-1 rounded-xl h-14 text-base"
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={handleSave}
                    disabled={isSaving}
                    className="flex-1 rounded-xl h-14 text-base"
                  >
                    {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    {categoryToEdit ? 'Update' : 'Create'}
                  </Button>
                </div>
              </div>
            </SheetContent>
          </Sheet>
        )}

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
