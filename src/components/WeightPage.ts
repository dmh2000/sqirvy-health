import type { AppState, WeightEntry } from '../types';
import { ApiService } from '../services/api';
import { NotificationManager } from '../utils/notifications';
import { LoadingManager } from '../utils/loading';

export class WeightPage {
  private static api = ApiService.getInstance();

  static render(_state: AppState): string {
    return `
      <div class="weight-page">
        <h2>Weight Tracking</h2>
        
        <div class="weight-forms">
          <div class="weight-entry-form">
            <h3>Record Weight</h3>
            <form id="weight-form">
              <div class="form-group">
                <label for="current-weight">Current Weight (lbs):</label>
                <input type="number" id="current-weight" step="0.1" min="0" required>
              </div>
              <button type="submit">Record Weight</button>
            </form>
          </div>
          
          <div class="goal-weight-form">
            <h3>Goal Weight</h3>
            <div class="current-goal">
              Current goal: <span id="current-goal">Loading...</span> lbs
            </div>
            <form id="goal-form">
              <div class="form-group">
                <label for="goal-weight">New Goal Weight (lbs):</label>
                <input type="number" id="goal-weight" step="0.1" min="0" required>
              </div>
              <button type="submit">Update Goal</button>
            </form>
          </div>
        </div>

        <div class="recent-weights">
          <h3>Recent Weight Entries</h3>
          <div id="weight-list">Loading...</div>
        </div>
      </div>
    `;
  }

  static async init(_state: AppState) {
    await this.loadWeightData();
    this.setupEventListeners();
  }

  private static async loadWeightData() {
    try {
      LoadingManager.show('weight-list', 'Loading weight data...');
      const weightData = await this.api.getWeight();
      
      // Update current goal display
      const currentGoalEl = document.getElementById('current-goal');
      if (currentGoalEl) {
        currentGoalEl.textContent = weightData.weight.goal.toString();
      }
      
      // Update goal form placeholder
      const goalInput = document.getElementById('goal-weight') as HTMLInputElement;
      if (goalInput) {
        goalInput.placeholder = weightData.weight.goal.toString();
      }
      
      // Display recent weight entries
      this.displayRecentWeights(weightData.weight.daily);
      
    } catch (error) {
      console.error('Error loading weight data:', error);
      NotificationManager.error('Failed to load weight data. Please refresh the page.');
      
      const weightListEl = document.getElementById('weight-list');
      if (weightListEl) {
        weightListEl.innerHTML = '<p class="error">Failed to load weight data</p>';
      }
    } finally {
      LoadingManager.hide('weight-list');
    }
  }

  private static displayRecentWeights(dailyWeights: WeightEntry[]) {
    const weightListEl = document.getElementById('weight-list');
    if (!weightListEl) return;
    
    if (dailyWeights.length === 0) {
      weightListEl.innerHTML = '<p class="no-data">No weight entries yet</p>';
      return;
    }
    
    // Sort by date (most recent first) and take last 7 entries
    const recentWeights = dailyWeights
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      .slice(0, 7);
    
    const weightItemsHtml = recentWeights.map(entry => {
      const date = new Date(entry.date).toLocaleDateString();
      return `
        <div class="weight-entry">
          <span class="weight-date">${date}</span>
          <span class="weight-value">${entry.weight} lbs</span>
        </div>
      `;
    }).join('');
    
    weightListEl.innerHTML = weightItemsHtml;
  }

  private static setupEventListeners() {
    // Weight form submission
    const weightForm = document.getElementById('weight-form') as HTMLFormElement;
    if (weightForm) {
      weightForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        await this.submitWeight();
      });
    }
    
    // Goal form submission
    const goalForm = document.getElementById('goal-form') as HTMLFormElement;
    if (goalForm) {
      goalForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        await this.updateGoal();
      });
    }
  }

  private static async submitWeight() {
    const weightInput = document.getElementById('current-weight') as HTMLInputElement;
    const submitBtn = weightInput?.closest('form')?.querySelector('button[type="submit"]') as HTMLButtonElement;
    
    if (!weightInput) return;
    
    const weight = parseFloat(weightInput.value);
    
    // Validation
    if (!weightInput.value.trim()) {
      this.showFieldError(weightInput, 'Please enter your weight');
      return;
    }
    
    if (!weight || weight <= 0) {
      this.showFieldError(weightInput, 'Please enter a valid weight greater than 0');
      return;
    }
    
    if (weight > 1000) {
      this.showFieldError(weightInput, 'Please enter a realistic weight');
      return;
    }
    
    this.clearFieldError(weightInput);
    
    // Round to 1 decimal place
    const roundedWeight = Math.round(weight * 10) / 10;
    
    try {
      if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.classList.add('loading');
      }
      
      const success = await this.api.addWeightEntry(roundedWeight);
      
      if (success) {
        weightInput.value = '';
        NotificationManager.success(`Weight recorded: ${roundedWeight} lbs`);
        
        // Reload weight data to show the new entry
        await this.loadWeightData();
      } else {
        NotificationManager.error('Failed to record weight. Please try again.');
      }
    } catch (error) {
      console.error('Error recording weight:', error);
      NotificationManager.error('Failed to record weight. Please check your connection and try again.');
    } finally {
      if (submitBtn) {
        submitBtn.disabled = false;
        submitBtn.classList.remove('loading');
      }
    }
  }

  private static async updateGoal() {
    const goalInput = document.getElementById('goal-weight') as HTMLInputElement;
    const submitBtn = goalInput?.closest('form')?.querySelector('button[type="submit"]') as HTMLButtonElement;
    
    if (!goalInput) return;
    
    const goal = parseFloat(goalInput.value);
    
    // Validation
    if (!goalInput.value.trim()) {
      this.showFieldError(goalInput, 'Please enter your goal weight');
      return;
    }
    
    if (!goal || goal <= 0) {
      this.showFieldError(goalInput, 'Please enter a valid goal weight greater than 0');
      return;
    }
    
    if (goal > 1000) {
      this.showFieldError(goalInput, 'Please enter a realistic goal weight');
      return;
    }
    
    this.clearFieldError(goalInput);
    
    // Round to 1 decimal place
    const roundedGoal = Math.round(goal * 10) / 10;
    
    try {
      if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.classList.add('loading');
      }
      
      const success = await this.api.updateGoalWeight(roundedGoal);
      
      if (success) {
        goalInput.value = '';
        NotificationManager.success(`Goal weight updated to ${roundedGoal} lbs`);
        
        // Reload weight data to show the new goal
        await this.loadWeightData();
      } else {
        NotificationManager.error('Failed to update goal weight. Please try again.');
      }
    } catch (error) {
      console.error('Error updating goal weight:', error);
      NotificationManager.error('Failed to update goal weight. Please check your connection and try again.');
    } finally {
      if (submitBtn) {
        submitBtn.disabled = false;
        submitBtn.classList.remove('loading');
      }
    }
  }

  private static showFieldError(field: HTMLInputElement, message: string) {
    // Remove existing error
    this.clearFieldError(field);
    
    // Add error message
    const error = document.createElement('span');
    error.className = 'form-error';
    error.textContent = message;
    field.parentNode?.appendChild(error);
    
    // Add error styling
    field.classList.add('error');
    field.focus();
  }

  private static clearFieldError(field: HTMLInputElement) {
    const existingError = field.parentNode?.querySelector('.form-error');
    if (existingError) existingError.remove();
    
    field.classList.remove('error');
  }
}