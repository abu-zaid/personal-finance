'use client';

import { createContext, useContext, useCallback, useEffect, useState, useMemo, ReactNode } from 'react';
import { Category, CreateCategoryInput, UpdateCategoryInput } from '@/types';
import { useAuth } from '@/context/auth-context';
import { createClient } from '@/lib/supabase/client';
import { DEFAULT_CATEGORIES } from '@/lib/constants';

interface CategoriesContextType {
  categories: Category[];
  categoriesMap: Map<string, Category>;
  isLoading: boolean;
  error: string | null;
  createCategory: (input: CreateCategoryInput) => Promise<Category>;
  updateCategory: (id: string, input: UpdateCategoryInput) => Promise<Category>;
  deleteCategory: (id: string) => Promise<void>;
  getCategoryById: (id: string) => Category | undefined;
  refetch: () => Promise<void>;
}

const CategoriesContext = createContext<CategoriesContextType | undefined>(undefined);

// Map database row to Category type
function mapDbToCategory(row: {
  id: string;
  user_id: string;
  name: string;
  icon: string;
  color: string;
  is_default: boolean;
  sort_order: number;
  created_at: string;
  updated_at: string;
}): Category {
  return {
    id: row.id,
    userId: row.user_id,
    name: row.name,
    icon: row.icon,
    color: row.color,
    isDefault: row.is_default,
    order: row.sort_order,
    createdAt: new Date(row.created_at),
    updatedAt: new Date(row.updated_at),
  };
}

export function CategoriesProvider({ children }: { children: ReactNode }) {
  const { user, isAuthenticated } = useAuth();
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const supabase = createClient();

  // Create default categories for new users
  const createDefaultCategories = useCallback(async () => {
    if (!user || !supabase) return;

    const categoriesToCreate = DEFAULT_CATEGORIES.map((cat, index) => ({
      user_id: user.id,
      name: cat.name,
      icon: cat.icon,
      color: cat.color,
      is_default: true,
      sort_order: index,
    }));

    const { data, error } = await supabase
      .from('categories')
      .insert(categoriesToCreate)
      .select();

    if (error) {
      console.error('Error creating default categories:', error);
      return;
    }

    if (data) {
      const mappedCategories = data.map(mapDbToCategory);
      setCategories(mappedCategories);
    }
  }, [user, supabase]);

  // Fetch categories from Supabase with timeout
  const fetchCategories = useCallback(async () => {
    if (!user || !supabase) {
      setCategories([]);
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      setError(null);

      // Add timeout to prevent hanging on slow connections
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000);

      const { data, error: fetchError } = await supabase
        .from('categories')
        .select('*')
        .eq('user_id', user.id)
        .order('sort_order', { ascending: true })
        .abortSignal(controller.signal);

      clearTimeout(timeoutId);

      if (fetchError) {
        throw fetchError;
      }

      const mappedCategories = (data || []).map(mapDbToCategory);
      
      // If no categories exist, create default ones
      if (mappedCategories.length === 0) {
        await createDefaultCategories();
        return;
      }
      
      setCategories(mappedCategories);
    } catch (err) {
      console.error('Error fetching categories:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch categories');
      setCategories([]);
    } finally {
      setIsLoading(false);
    }
  }, [user, supabase, createDefaultCategories]);

  // Load categories when user changes
  useEffect(() => {
    if (isAuthenticated && user) {
      fetchCategories();
    } else {
      setCategories([]);
      setIsLoading(false);
    }
  }, [isAuthenticated, user, fetchCategories]);

  // Subscribe to realtime changes - handle incrementally instead of refetching
  useEffect(() => {
    if (!user || !supabase) return;

    const channel = supabase
      .channel('categories-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'categories',
          filter: `user_id=eq.${user.id}`,
        },
        (payload) => {
          // Handle changes incrementally
          if (payload.eventType === 'INSERT') {
            const newCat = mapDbToCategory(payload.new as Parameters<typeof mapDbToCategory>[0]);
            setCategories((prev) => {
              if (prev.some(c => c.id === newCat.id)) return prev;
              return [...prev, newCat];
            });
          } else if (payload.eventType === 'UPDATE') {
            const updatedCat = mapDbToCategory(payload.new as Parameters<typeof mapDbToCategory>[0]);
            setCategories((prev) =>
              prev.map(c => c.id === updatedCat.id ? updatedCat : c)
            );
          } else if (payload.eventType === 'DELETE') {
            const deletedId = (payload.old as { id: string }).id;
            setCategories((prev) => prev.filter(c => c.id !== deletedId));
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, supabase]);

  const createCategory = useCallback(
    async (input: CreateCategoryInput): Promise<Category> => {
      if (!user || !supabase) throw new Error('User not authenticated');

      const { data, error: insertError } = await supabase
        .from('categories')
        .insert({
          user_id: user.id,
          name: input.name,
          icon: input.icon,
          color: input.color,
          is_default: false,
          sort_order: categories.length,
        })
        .select()
        .single();

      if (insertError) {
        throw new Error(insertError.message);
      }

      const newCategory = mapDbToCategory(data);
      setCategories((prev) => [...prev, newCategory]);
      return newCategory;
    },
    [user, supabase, categories.length]
  );

  const updateCategory = useCallback(
    async (id: string, input: UpdateCategoryInput): Promise<Category> => {
      if (!user || !supabase) throw new Error('User not authenticated');

      const updateData: Record<string, unknown> = {};
      if (input.name !== undefined) updateData.name = input.name;
      if (input.icon !== undefined) updateData.icon = input.icon;
      if (input.color !== undefined) updateData.color = input.color;
      if (input.order !== undefined) updateData.sort_order = input.order;

      const { data, error: updateError } = await supabase
        .from('categories')
        .update(updateData)
        .eq('id', id)
        .eq('user_id', user.id)
        .select()
        .single();

      if (updateError) {
        throw new Error(updateError.message);
      }

      const updatedCategory = mapDbToCategory(data);
      setCategories((prev) =>
        prev.map((cat) => (cat.id === id ? updatedCategory : cat))
      );
      return updatedCategory;
    },
    [user, supabase]
  );

  const deleteCategory = useCallback(
    async (id: string): Promise<void> => {
      if (!user || !supabase) throw new Error('User not authenticated');

      const { error: deleteError } = await supabase
        .from('categories')
        .delete()
        .eq('id', id)
        .eq('user_id', user.id);

      if (deleteError) {
        throw new Error(deleteError.message);
      }

      setCategories((prev) => prev.filter((cat) => cat.id !== id));
    },
    [user, supabase]
  );

  // Create a memoized Map for O(1) lookups
  const categoriesMap = useMemo(() => {
    return new Map(categories.map(cat => [cat.id, cat]));
  }, [categories]);

  const getCategoryById = useCallback(
    (id: string): Category | undefined => {
      return categoriesMap.get(id);
    },
    [categoriesMap]
  );

  return (
    <CategoriesContext.Provider
      value={{
        categories,
        categoriesMap,
        isLoading,
        error,
        createCategory,
        updateCategory,
        deleteCategory,
        getCategoryById,
        refetch: fetchCategories,
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
