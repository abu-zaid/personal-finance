import { db } from '../db';
import { createClient } from '../supabase/client';
import { SyncQueueEntry } from '../schemas';

const TABLES = [
    'categories',
    'transactions',
    'budgets',
    'budget_allocations',
    'goals',
    'recurring_transactions',
    'user_preferences',
] as const;

export class SyncManager {
    private isSyncing = false;

    async pushChanges() {
        if (this.isSyncing) return;
        const supabase = createClient();
        if (!supabase) return;

        this.isSyncing = true;
        try {
            const queue = await db.sync_queue.orderBy('id').toArray();
            if (queue.length === 0) return;

            for (const entry of queue) {
                await this.processEntry(supabase, entry);
            }
        } catch (error) {
            console.error('Sync process failed:', error);
        } finally {
            this.isSyncing = false;
        }
    }

    private async processEntry(supabase: any, entry: SyncQueueEntry) {
        try {
            const { table, action, payload, id } = entry;
            let error = null;

            if (action === 'create') {
                // eslint-disable-next-line @typescript-eslint/no-unused-vars
                const { error: insertError } = await supabase.from(table).insert(payload);
                error = insertError;
            } else if (action === 'update') {
                // eslint-disable-next-line @typescript-eslint/no-unused-vars
                const { error: updateError } = await supabase
                    .from(table)
                    .update(payload)
                    .eq('id', payload.id);
                error = updateError;
            } else if (action === 'delete') {
                // eslint-disable-next-line @typescript-eslint/no-unused-vars
                const { error: deleteError } = await supabase
                    .from(table)
                    .delete()
                    .eq('id', payload.id);
                error = deleteError;
            }

            if (!error) {
                // Remove from queue on success
                if (id) await db.sync_queue.delete(id);
            } else {
                console.error(`Failed to sync entry ${id}:`, error);
                // TODO: Implement retry logic or conflict queue
            }
        } catch (err) {
            console.error('Process entry error', err);
        }
    }

    async pullChanges() {
        const supabase = createClient();
        if (!supabase) return;

        try {
            const lastSync = localStorage.getItem('last_sync') || '1970-01-01T00:00:00.000Z';
            const newSyncTime = new Date().toISOString();

            await Promise.all(
                TABLES.map(async (table) => {
                    const { data, error } = await supabase
                        .from(table)
                        .select('*')
                        .gt('updated_at', lastSync);

                    if (error) throw error;

                    if (data && data.length > 0) {
                        // @ts-expect-error - Dexie table dynamic access
                        await db[table].bulkPut(data);
                    }
                })
            );

            localStorage.setItem('last_sync', newSyncTime);
        } catch (error) {
            console.error('Pull changes failed:', error);
        }
    }
}

export const syncManager = new SyncManager();
