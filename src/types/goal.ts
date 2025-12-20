export interface Goal {
    id: string;
    user_id: string;
    name: string;
    target_amount: number;
    current_amount: number;
    icon: string;
    color: string;
    deadline: string | null;
    created_at: string;
    updated_at: string;
}

export type CreateGoalInput = Omit<Goal, 'id' | 'user_id' | 'created_at' | 'updated_at'>;
export type UpdateGoalInput = Partial<CreateGoalInput>;
