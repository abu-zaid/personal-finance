'use client';

import { createContext, useContext, useCallback, useEffect, useState, ReactNode } from 'react';
import { Category, CreateCategoryInput, UpdateCategoryInput } from '@/types';
import { useAuth } from '@/context/auth-context';
import { generateId } from '@/lib/utils';
import { DEFAULT_CATEGORIES } from '@/lib/constants';

interface CategoriesContextType {
  categories: Category[];
  isLoading: boolean;
  createCategory: (input: CreateCategoryInput) => Promise<Category>;
  updateCategory: (id: string, input: UpdateCategoryInput) => Promise<Category>;
  deleteCategory: (id: string) => Promise<void>;
  getCategoryById: (id: string) => Category | undefined;
}

const CategoriesContext = createContext<CategoriesContextType | undefined>(undefined);

const STORAGE_KEY = 'financeflow_categories';

export function CategoriesProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Load categories from localStorage
  useEffect(() => {
    if (!user) {
      setCategories([]);
      setIsLoading(false);
      return;
    }

    const loadCategories = () => {
      try {
        const stored = localStorage.getItem(`${STORAGE_KEY}_${user.id}`);
        if (stored) {
          const parsed = JSON.parse(stored) as Category[];
          // Convert date strings back to Date objects
          const categoriesWithDates = parsed.map((cat) => ({
            ...cat,
            createdAt: new Date(cat.createdAt),
            updatedAt: new Date(cat.updatedAt),
          }));
          setCategories(categoriesWithDates);
        } else {
          // Initialize with default categories for new users
          const now = new Date();
          const defaultCategories: Category[] = DEFAULT_CATEGORIES.map((cat, index) => ({
            id: generateId(),
            userId: user.id,
            name: cat.name,
            icon: cat.icon as Category['icon'],
            color: cat.color as Category['color'],
            isDefault: true,
            order: index,
            createdAt: now,
            updatedAt: now,
          }));
          setCategories(defaultCategories);
          saveToStorage(defaultCategories, user.id);
        }
      } catch {
        setCategories([]);
      } finally {
        setIsLoading(false);
      }
    };

    loadCategories();
  }, [user]);

  const saveToStorage = (cats: Category[], userId: string) => {
    localStorage.setItem(`${STORAGE_KEY}_${userId}`, JSON.stringify(cats));
  };

  const createCategory = useCallback(
    async (input: CreateCategoryInput): Promise<Category> => {
      if (!user) throw new Error('User not authenticated');

      const now = new Date();
      const newCategory: Category = {
        id: generateId(),
        userId: user.id,
        name: input.name,
        icon: input.icon,
        color: input.color,
        isDefault: false,
        order: categories.length,
        createdAt: now,
        updatedAt: now,
      };

      const updatedCategories = [...categories, newCategory];
      setCategories(updatedCategories);
      saveToStorage(updatedCategories, user.id);

      return newCategory;
    },
    [user, categories]
  );

  const updateCategory = useCallback(
    async (id: string, input: UpdateCategoryInput): Promise<Category> => {
      if (!user) throw new Error('User not authenticated');

      const categoryIndex = categories.findIndex((cat) => cat.id === id);
      if (categoryIndex === -1) throw new Error('Category not found');

      const updatedCategory: Category = {
        ...categories[categoryIndex],
        ...input,
        updatedAt: new Date(),
      };

      const updatedCategories = [...categories];
      updatedCategories[categoryIndex] = updatedCategory;

      setCategories(updatedCategories);
      saveToStorage(updatedCategories, user.id);

      return updatedCategory;
    },
    [user, categories]
  );

  const deleteCategory = useCallback(
    async (id: string): Promise<void> => {
      if (!user) throw new Error('User not authenticated');

      const updatedCategories = categories.filter((cat) => cat.id !== id);
      setCategories(updatedCategories);
      saveToStorage(updatedCategories, user.id);
    },
    [user, categories]
  );

  const getCategoryById = useCallback(
    (id: string): Category | undefined => {
      return categories.find((cat) => cat.id === id);
    },
    [categories]
  );

  return (
    <CategoriesContext.Provider
      value={{
        categories,
        isLoading,
        createCategory,
        updateCategory,
        deleteCategory,
        getCategoryById,
      }}
    >
      {children}
    </CategoriesContext.Provider>
  );
}

export function useCategories() {
  const context = useContext(CategoriesContext);
  if (context === undefined) {
    throw new Error('useCategories must be used within a CategoriesProvider');
  }
  return context;
}
