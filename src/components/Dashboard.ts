import type { AppState } from '../types';
import { ApiService } from '../services/api';
import { ChartComponent } from './Chart';
import { NotificationManager } from '../utils/notifications';
import { LoadingManager } from '../utils/loading';

export class Dashboard {
  private static api = ApiService.getInstance();

  static render(_state: AppState): string {
    const today = new Date().toLocaleDateString();
    
    return `
      <div class="dashboard">
        <h2>Dashboard - ${today}</h2>
        
        <div class="stats-grid">
          <div class="stat-card">
            <h3>Today's Calories</h3>
            <div class="stat-value" id="today-calories">Loading...</div>
          </div>
          
          <div class="stat-card">
            <h3>Current Weight</h3>
            <div class="stat-value" id="current-weight">Loading...</div>
          </div>
          
          <div class="stat-card">
            <h3>Goal Weight</h3>
            <div class="stat-value" id="goal-weight">Loading...</div>
          </div>
        </div>

        <div class="charts-grid">
          <div class="chart-container">
            <div class="chart-wrapper">
              <canvas id="calories-chart"></canvas>
            </div>
          </div>
          
          <div class="chart-container">
            <div class="chart-wrapper">
              <canvas id="weight-chart"></canvas>
            </div>
          </div>
        </div>
      </div>
    `;
  }

  static async init(state: AppState) {
    await this.loadDashboardData(state);
  }

  private static async loadDashboardData(state: AppState) {
    try {
      // Show loading for stats
      LoadingManager.show('today-calories', '...');
      LoadingManager.show('current-weight', '...');
      LoadingManager.show('goal-weight', '...');
      
      // Load data in parallel for better performance
      const [mealsData, weightData] = await Promise.all([
        this.api.getMeals(),
        this.api.getWeight()
      ]);
      
      // Update calories
      const todayMeal = mealsData.meals.find(m => m.date === state.currentDate);
      const todayCalories = todayMeal?.totalKcal || 0;
      
      const todayCaloriesEl = document.getElementById('today-calories');
      if (todayCaloriesEl) {
        todayCaloriesEl.textContent = `${todayCalories} kcal`;
      }

      // Update weight data
      const latestWeight = weightData.weight.daily
        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())[0];
      
      const currentWeightEl = document.getElementById('current-weight');
      if (currentWeightEl) {
        currentWeightEl.textContent = latestWeight ? `${latestWeight.weight} lbs` : 'No data';
      }
      
      const goalWeightEl = document.getElementById('goal-weight');
      if (goalWeightEl) {
        goalWeightEl.textContent = `${weightData.weight.goal} lbs`;
      }

      // Initialize Chart.js charts
      this.initializeCharts(mealsData, weightData, state.currentDate);
      
    } catch (error) {
      console.error('Error loading dashboard data:', error);
      NotificationManager.error('Failed to load dashboard data. Please refresh the page.');
      
      // Show error states
      const todayCaloriesEl = document.getElementById('today-calories');
      const currentWeightEl = document.getElementById('current-weight');
      const goalWeightEl = document.getElementById('goal-weight');
      
      if (todayCaloriesEl) todayCaloriesEl.textContent = 'Error';
      if (currentWeightEl) currentWeightEl.textContent = 'Error';
      if (goalWeightEl) goalWeightEl.textContent = 'Error';
    } finally {
      // Hide loading states
      LoadingManager.hide('today-calories');
      LoadingManager.hide('current-weight');
      LoadingManager.hide('goal-weight');
    }
  }

  private static initializeCharts(mealsData: any, weightData: any, currentDate: string) {
    // Wait a bit for the DOM to be ready
    setTimeout(() => {
      ChartComponent.createCaloriesChart('calories-chart', mealsData, currentDate);
      ChartComponent.createWeightChart('weight-chart', weightData, currentDate);
    }, 100);
  }

  static cleanup() {
    // Clean up charts when leaving the dashboard
    ChartComponent.destroyAllCharts();
  }
}