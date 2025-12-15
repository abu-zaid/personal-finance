// Category Types
export interface Category {
  id: string;
  userId: string;
  name: string;
  icon: string;
  color: string;
  isDefault: boolean;
  order: number;
  createdAt: Date;
  updatedAt: Date;
}

// Icon options for UI
export type CategoryIconOption =
  | 'utensils-crossed'
  | 'coffee'
  | 'car'
  | 'home'
  | 'shopping-bag'
  | 'film'
  | 'heart'
  | 'zap'
  | 'gift'
  | 'plane'
  | 'shirt'
  | 'dumbbell'
  | 'graduation-cap'
  | 'credit-card'
  | 'more-horizontal';

export interface CreateCategoryInput {
  name: string;
  icon: string;
  color: string;
}

export interface UpdateCategoryInput {
  name?: string;
  icon?: string;
  color?: string;
  order?: number;
}
