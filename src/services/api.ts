import type { MealsData, WeightData, FoodItem } from '../types';

export class ApiService {
  private static instance: ApiService;
  private baseUrl = 'http://localhost:3000/api';

  public static getInstance(): ApiService {
    if (!ApiService.instance) {
      ApiService.instance = new ApiService();
    }
    return ApiService.instance;
  }

  // Meals API
  async getMeals(): Promise<MealsData> {
    try {
      const response = await fetch(`${this.baseUrl}/meals`);
      if (!response.ok) throw new Error('Failed to fetch meals');
      return await response.json();
    } catch (error) {
      console.error('Error fetching meals:', error);
      return { meals: [], foodDatabase: [] };
    }
  }

  async getMealsForDate(date: string): Promise<any> {
    try {
      const response = await fetch(`${this.baseUrl}/meals/${date}`);
      if (!response.ok) throw new Error('Failed to fetch meals for date');
      return await response.json();
    } catch (error) {
      console.error(`Error fetching meals for ${date}:`, error);
      return null;
    }
  }

  async addFoodItem(date: string, mealType: string, foodItem: Omit<FoodItem, 'id'>): Promise<FoodItem | null> {
    try {
      const response = await fetch(`${this.baseUrl}/meals/${date}/food`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ mealType, ...foodItem }),
      });
      if (!response.ok) throw new Error('Failed to add food item');
      return await response.json();
    } catch (error) {
      console.error('Error adding food item:', error);
      return null;
    }
  }

  async updateFoodItem(date: string, foodId: string, updates: Partial<FoodItem>): Promise<FoodItem | null> {
    try {
      const response = await fetch(`${this.baseUrl}/meals/${date}/food/${foodId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updates),
      });
      if (!response.ok) throw new Error('Failed to update food item');
      return await response.json();
    } catch (error) {
      console.error('Error updating food item:', error);
      return null;
    }
  }

  async deleteFoodItem(date: string, foodId: string): Promise<boolean> {
    try {
      const response = await fetch(`${this.baseUrl}/meals/${date}/food/${foodId}`, {
        method: 'DELETE',
      });
      return response.ok;
    } catch (error) {
      console.error('Error deleting food item:', error);
      return false;
    }
  }

  async searchFood(query: string): Promise<Omit<FoodItem, 'id'>[]> {
    try {
      const response = await fetch(`${this.baseUrl}/meals/search?q=${encodeURIComponent(query)}`);
      if (!response.ok) throw new Error('Failed to search food');
      return await response.json();
    } catch (error) {
      console.error('Error searching food:', error);
      return [];
    }
  }

  // Weight API
  async getWeight(): Promise<WeightData> {
    try {
      const response = await fetch(`${this.baseUrl}/weight`);
      if (!response.ok) throw new Error('Failed to fetch weight data');
      return await response.json();
    } catch (error) {
      console.error('Error fetching weight:', error);
      return { weight: { goal: 150, daily: [] } };
    }
  }

  async addWeightEntry(weight: number): Promise<boolean> {
    try {
      const response = await fetch(`${this.baseUrl}/weight`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ weight }),
      });
      return response.ok;
    } catch (error) {
      console.error('Error adding weight entry:', error);
      return false;
    }
  }

  async updateGoalWeight(goal: number): Promise<boolean> {
    try {
      const response = await fetch(`${this.baseUrl}/weight/goal`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ goal }),
      });
      return response.ok;
    } catch (error) {
      console.error('Error updating goal weight:', error);
      return false;
    }
  }
}