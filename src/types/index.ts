export interface FoodItem {
  id: string;
  name: string;
  unit: string;
  kcal: number;
}

export interface DayMeals {
  date: string;
  totalKcal: number;
  breakfast: FoodItem[];
  morning_snack: FoodItem[];
  lunch: FoodItem[];
  afternoon_snack: FoodItem[];
  dinner: FoodItem[];
  evening_snack: FoodItem[];
}

export interface MealsData {
  meals: DayMeals[];
  foodDatabase: Omit<FoodItem, 'id'>[];
}

export interface WeightEntry {
  date: string;
  weight: number;
}

export interface WeightData {
  weight: {
    goal: number;
    daily: WeightEntry[];
  };
}

export type MealType = 'breakfast' | 'morning_snack' | 'lunch' | 'afternoon_snack' | 'dinner' | 'evening_snack';

export interface AppState {
  currentPage: 'dashboard' | 'meals' | 'weight';
  currentDate: string;
  mealsData: MealsData | null;
  weightData: WeightData | null;
}