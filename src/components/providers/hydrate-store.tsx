'use client';

import { useEffect, useRef } from 'react';
import { useAppDispatch } from '@/lib/hooks';
import { setCategories } from '@/lib/features/categories/categoriesSlice';
import { setTransactions } from '@/lib/features/transactions/transactionsSlice';
import { Category, Transaction } from '@/types';

interface HydrateStoreProps {
    categories: Category[];
    transactions?: Transaction[];
}

export function HydrateStore({ categories, transactions }: HydrateStoreProps) {
    const dispatch = useAppDispatch();
    const hydratedRef = useRef(false);

    useEffect(() => {
        if (!hydratedRef.current) {
            if (categories.length > 0) {
                dispatch(setCategories(categories));
            }
            if (transactions && transactions.length > 0) {
                // We might want to set initial transactions if needed by other components
                // but usually dashboard fetches its own. 
                // However, Modals might need recent context.
                // dispatch(setTransactions(transactions)); 
            }
            hydratedRef.current = true;
        }
    }, [categories, dispatch, transactions]);

    return null;
}
