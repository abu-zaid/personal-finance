// Category Types
export interface Category {
  id: string;
  userId: string;
  name: string;
  icon: CategoryIcon;
  color: CategoryColor;
  isDefault: boolean;
  order: number;
  createdAt: Date;
  updatedAt: Date;
}

export type CategoryIcon =
  | 'shopping-cart'
  | 'coffee'
  | 'car'
  | 'home'
  | 'utensils'
  | 'film'
  | 'heart'
  | 'zap'
  | 'smartphone'
  | 'gift'
  | 'briefcase'
  | 'book'
  | 'plane'
  | 'music'
  | 'gamepad'
  | 'shirt'
  | 'dumbbell'
  | 'pill'
  | 'dog'
  | 'baby'
  | 'graduation-cap'
  | 'wrench'
  | 'more-horizontal';

export type CategoryColor =
  | 'red'
  | 'orange'
  | 'amber'
  | 'yellow'
  | 'lime'
  | 'green'
  | 'emerald'
  | 'teal'
  | 'cyan'
  | 'sky'
  | 'blue'
  | 'indigo'
  | 'violet'
  | 'purple'
  | 'fuchsia'
  | 'pink'
  | 'rose'
  | 'slate';

export interface CreateCategoryInput {
  name: string;
  icon: CategoryIcon;
  color: CategoryColor;
}

export interface UpdateCategoryInput {
  name?: string;
  icon?: CategoryIcon;
  color?: CategoryColor;
  order?: number;
}
