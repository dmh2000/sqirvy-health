import type { AppState, MealType, FoodItem } from '../types';
import { ApiService } from '../services/api';
import { NotificationManager } from '../utils/notifications';
import { LoadingManager } from '../utils/loading';

export class MealsPage {
  private static api = ApiService.getInstance();
  private static currentMealType: MealType | null = null;

  static render(state: AppState): string {
    const mealTypes: { key: MealType; name: string }[] = [
      { key: 'breakfast', name: 'Breakfast' },
      { key: 'morning_snack', name: 'Morning Snack' },
      { key: 'lunch', name: 'Lunch' },
      { key: 'afternoon_snack', name: 'Afternoon Snack' },
      { key: 'dinner', name: 'Dinner' },
      { key: 'evening_snack', name: 'Evening Snack' }
    ];

    const mealCards = mealTypes.map(meal => this.renderMealCard(meal.key, meal.name, state)).join('');

    return `
      <div class="meals-page">
        <h2>Meals - ${this.formatDate(state.currentDate)}</h2>
        
        <div class="meals-grid">
          ${mealCards}
        </div>

        <!-- Food Item Modal -->
        <div id="food-modal" class="modal" style="display: none;">
          <div class="modal-content">
            <span class="close" id="close-modal">&times;</span>
            <h3 id="modal-title">Add Food Item</h3>
            <form id="food-form">
              <div class="form-group">
                <label for="food-name">Food Name:</label>
                <input type="text" id="food-name" required>
                <div id="autocomplete-results" class="autocomplete-results"></div>
              </div>
              
              <div class="form-group">
                <label for="food-unit">Unit:</label>
                <select id="food-unit" required>
                  <option value="">Select unit</option>
                  <option value="serving">serving</option>
                  <option value="cup">cup</option>
                  <option value="tablespoon">tablespoon</option>
                  <option value="ounce">ounce</option>
                  <option value="gram">gram</option>
                  <option value="small">small</option>
                  <option value="medium">medium</option>
                  <option value="large">large</option>
                </select>
              </div>
              
              <div class="form-group">
                <label for="food-calories">Calories:</label>
                <input type="number" id="food-calories" min="1" required>
              </div>
              
              <div class="form-actions">
                <button type="button" id="cancel-btn">Cancel</button>
                <button type="submit" id="submit-btn">Add Item</button>
              </div>
            </form>
          </div>
        </div>
      </div>
    `;
  }

  private static renderMealCard(mealType: MealType, mealName: string, state: AppState): string {
    const mealData = this.getMealData(mealType, state);
    const totalCalories = mealData.reduce((sum, item) => sum + item.kcal, 0);
    
    const foodItems = mealData.map(item => `
      <div class="food-item" data-food-id="${item.id}">
        <span class="food-name">${item.name}</span>
        <span class="food-details">${item.unit} - ${item.kcal} kcal</span>
        <div class="food-actions">
          <button class="edit-btn" data-action="edit">Edit</button>
          <button class="delete-btn" data-action="delete">Delete</button>
        </div>
      </div>
    `).join('');

    return `
      <div class="meal-card" data-meal-type="${mealType}">
        <div class="meal-header">
          <h3>${mealName}</h3>
          <span class="meal-calories">${totalCalories} kcal</span>
        </div>
        
        <div class="meal-items">
          ${foodItems || '<p class="no-items">No items added yet</p>'}
        </div>
        
        <button class="add-food-btn" data-meal-type="${mealType}">+ Add Food Item</button>
      </div>
    `;
  }

  private static formatDate(dateString: string): string {
    // Parse the date string (YYYY-MM-DD) manually to avoid timezone issues
    const [year, month, day] = dateString.split('-').map(Number);
    const date = new Date(year, month - 1, day); // month is 0-indexed
    return date.toLocaleDateString();
  }

  private static getMealData(mealType: MealType, state: AppState): FoodItem[] {
    if (!state.mealsData) return [];
    
    const todayMeal = state.mealsData.meals.find(m => m.date === state.currentDate);
    return todayMeal?.[mealType] || [];
  }

  static async init(_state: AppState) {
    await this.loadMealsData(_state);
    this.setupEventListeners();
  }

  private static async loadMealsData(state: AppState) {
    try {
      LoadingManager.show('meals-grid', 'Loading meals...');
      const mealsData = await this.api.getMeals();
      
      // After loading data, re-render the meals by updating the DOM directly
      this.renderMealsData(mealsData, state.currentDate);
    } catch (error) {
      console.error('Error loading meals data:', error);
      NotificationManager.error('Failed to load meals data. Please try again.');
    } finally {
      LoadingManager.hide('meals-grid');
    }
  }

  private static renderMealsData(mealsData: any, currentDate: string) {
    const mealTypes: { key: MealType; name: string }[] = [
      { key: 'breakfast', name: 'Breakfast' },
      { key: 'morning_snack', name: 'Morning Snack' },
      { key: 'lunch', name: 'Lunch' },
      { key: 'afternoon_snack', name: 'Afternoon Snack' },
      { key: 'dinner', name: 'Dinner' },
      { key: 'evening_snack', name: 'Evening Snack' }
    ];

    // Find today's meal data
    const todayMeal = mealsData.meals.find((m: any) => m.date === currentDate);

    // Update each meal card
    mealTypes.forEach(mealType => {
      const mealCard = document.querySelector(`[data-meal-type="${mealType.key}"]`);
      if (mealCard) {
        const mealItems = todayMeal?.[mealType.key] || [];
        const totalCalories = mealItems.reduce((sum: number, item: any) => sum + item.kcal, 0);
        
        // Update calories in header
        const caloriesSpan = mealCard.querySelector('.meal-calories');
        if (caloriesSpan) {
          caloriesSpan.textContent = `${totalCalories} kcal`;
        }
        
        // Update food items list
        const itemsContainer = mealCard.querySelector('.meal-items');
        if (itemsContainer) {
          if (mealItems.length === 0) {
            itemsContainer.innerHTML = '<p class="no-items">No items added yet</p>';
          } else {
            const itemsHtml = mealItems.map((item: any) => `
              <div class="food-item" data-food-id="${item.id}">
                <span class="food-name">${item.name}</span>
                <span class="food-details">${item.unit} - ${item.kcal} kcal</span>
                <div class="food-actions">
                  <button class="edit-btn" data-action="edit">Edit</button>
                  <button class="delete-btn" data-action="delete">Delete</button>
                </div>
              </div>
            `).join('');
            itemsContainer.innerHTML = itemsHtml;
          }
        }
      }
    });
  }

  private static setupEventListeners() {
    // Add food item buttons
    document.addEventListener('click', (e) => {
      const target = e.target as HTMLElement;
      
      if (target.matches('.add-food-btn')) {
        const mealType = target.getAttribute('data-meal-type') as MealType;
        this.openFoodModal(mealType);
      }
      
      if (target.matches('.edit-btn')) {
        const foodItem = target.closest('.food-item');
        const foodId = foodItem?.getAttribute('data-food-id');
        if (foodId) this.editFoodItem(foodId);
      }
      
      if (target.matches('.delete-btn')) {
        const foodItem = target.closest('.food-item');
        const foodId = foodItem?.getAttribute('data-food-id');
        if (foodId) this.deleteFoodItem(foodId);
      }
      
      if (target.matches('#close-modal, #cancel-btn')) {
        this.closeFoodModal();
      }
    });

    // Form submission
    const form = document.getElementById('food-form') as HTMLFormElement;
    if (form) {
      form.addEventListener('submit', (e) => {
        e.preventDefault();
        this.submitFoodForm();
      });
    }

    // Autocomplete
    const foodNameInput = document.getElementById('food-name') as HTMLInputElement;
    if (foodNameInput) {
      foodNameInput.addEventListener('input', this.handleAutocomplete.bind(this));
    }
  }

  private static openFoodModal(mealType: MealType, editData?: FoodItem) {
    this.currentMealType = mealType;
    const modal = document.getElementById('food-modal');
    const title = document.getElementById('modal-title');
    const submitBtn = document.getElementById('submit-btn');
    
    if (modal) modal.style.display = 'block';
    
    if (editData) {
      if (title) title.textContent = 'Edit Food Item';
      if (submitBtn) submitBtn.textContent = 'Update Item';
      this.populateForm(editData);
    } else {
      if (title) title.textContent = 'Add Food Item';
      if (submitBtn) submitBtn.textContent = 'Add Item';
      this.resetForm();
    }
  }

  private static closeFoodModal() {
    const modal = document.getElementById('food-modal');
    if (modal) modal.style.display = 'none';
    this.currentMealType = null;
    this.resetForm();
  }

  private static populateForm(foodItem: FoodItem) {
    const nameInput = document.getElementById('food-name') as HTMLInputElement;
    const unitSelect = document.getElementById('food-unit') as HTMLSelectElement;
    const caloriesInput = document.getElementById('food-calories') as HTMLInputElement;
    
    if (nameInput) nameInput.value = foodItem.name;
    if (unitSelect) unitSelect.value = foodItem.unit;
    if (caloriesInput) caloriesInput.value = foodItem.kcal.toString();
  }

  private static resetForm() {
    const form = document.getElementById('food-form') as HTMLFormElement;
    if (form) form.reset();
    
    const autocompleteResults = document.getElementById('autocomplete-results');
    if (autocompleteResults) autocompleteResults.innerHTML = '';
  }

  private static async handleAutocomplete(e: Event) {
    const input = e.target as HTMLInputElement;
    const query = input.value.trim();
    
    if (query.length < 2) {
      const results = document.getElementById('autocomplete-results');
      if (results) results.innerHTML = '';
      return;
    }

    const suggestions = await this.api.searchFood(query);
    this.displayAutocompleteResults(suggestions);
  }

  private static displayAutocompleteResults(suggestions: any[]) {
    const resultsContainer = document.getElementById('autocomplete-results');
    if (!resultsContainer) return;
    
    if (suggestions.length === 0) {
      resultsContainer.innerHTML = '';
      return;
    }
    
    const resultsHtml = suggestions.map(item => `
      <div class="autocomplete-item" data-name="${item.name}" data-unit="${item.unit}" data-calories="${item.kcal}">
        ${item.name} (${item.unit}) - ${item.kcal} kcal
      </div>
    `).join('');
    
    resultsContainer.innerHTML = resultsHtml;
    
    // Add click handlers for autocomplete items
    resultsContainer.addEventListener('click', (e) => {
      const target = e.target as HTMLElement;
      if (target.matches('.autocomplete-item')) {
        const name = target.getAttribute('data-name')!;
        const unit = target.getAttribute('data-unit')!;
        const calories = target.getAttribute('data-calories')!;
        
        const nameInput = document.getElementById('food-name') as HTMLInputElement;
        const unitSelect = document.getElementById('food-unit') as HTMLSelectElement;
        const caloriesInput = document.getElementById('food-calories') as HTMLInputElement;
        
        if (nameInput) nameInput.value = name;
        if (unitSelect) unitSelect.value = unit;
        if (caloriesInput) caloriesInput.value = calories;
        
        resultsContainer.innerHTML = '';
      }
    });
  }

  private static async submitFoodForm() {
    const nameInput = document.getElementById('food-name') as HTMLInputElement;
    const unitSelect = document.getElementById('food-unit') as HTMLSelectElement;
    const caloriesInput = document.getElementById('food-calories') as HTMLInputElement;
    const submitBtn = document.getElementById('submit-btn') as HTMLButtonElement;
    
    if (!nameInput || !unitSelect || !caloriesInput || !this.currentMealType) return;
    
    const foodItem = {
      name: nameInput.value.trim(),
      unit: unitSelect.value,
      kcal: parseInt(caloriesInput.value)
    };
    
    // Validation
    if (!foodItem.name) {
      this.showFormError('food-name', 'Food name is required');
      return;
    }
    
    if (!foodItem.unit) {
      this.showFormError('food-unit', 'Please select a unit');
      return;
    }
    
    if (!foodItem.kcal || foodItem.kcal <= 0) {
      this.showFormError('food-calories', 'Please enter a valid number of calories');
      return;
    }
    
    // Clear any existing errors
    this.clearFormErrors();
    
    try {
      // Show loading state
      if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.classList.add('loading');
      }
      
      const currentDate = new Date().toISOString().split('T')[0];
      const result = await this.api.addFoodItem(currentDate, this.currentMealType, foodItem);
      
      if (result) {
        NotificationManager.success(`Added ${foodItem.name} to ${this.currentMealType.replace('_', ' ')}`);
        this.closeFoodModal();
        // Refresh the meals data
        window.location.reload();
      } else {
        NotificationManager.error('Failed to add food item. Please try again.');
      }
    } catch (error) {
      console.error('Error adding food item:', error);
      NotificationManager.error('Failed to add food item. Please check your connection and try again.');
    } finally {
      // Remove loading state
      if (submitBtn) {
        submitBtn.disabled = false;
        submitBtn.classList.remove('loading');
      }
    }
  }

  private static showFormError(fieldId: string, message: string) {
    const field = document.getElementById(fieldId);
    if (!field) return;
    
    // Remove existing error
    const existingError = field.parentNode?.querySelector('.form-error');
    if (existingError) existingError.remove();
    
    // Add error message
    const error = document.createElement('span');
    error.className = 'form-error';
    error.textContent = message;
    field.parentNode?.appendChild(error);
    
    // Add error styling
    field.classList.add('error');
    field.focus();
  }

  private static clearFormErrors() {
    const modal = document.getElementById('food-modal');
    if (!modal) return;
    
    // Remove all error messages
    const errors = modal.querySelectorAll('.form-error');
    errors.forEach(error => error.remove());
    
    // Remove error styling
    const fields = modal.querySelectorAll('input, select');
    fields.forEach(field => field.classList.remove('error'));
  }

  private static async editFoodItem(foodId: string) {
    console.log('Edit food item:', foodId);
    // Implementation for editing food items
  }

  private static async deleteFoodItem(foodId: string) {
    if (!confirm('Are you sure you want to delete this food item?')) {
      return;
    }
    
    try {
      const currentDate = new Date().toISOString().split('T')[0];
      const result = await this.api.deleteFoodItem(currentDate, foodId);
      
      if (result) {
        NotificationManager.success('Food item deleted successfully');
        // Refresh the page (in a real app, this would update state and re-render)
        window.location.reload();
      } else {
        NotificationManager.error('Failed to delete food item. Please try again.');
      }
    } catch (error) {
      console.error('Error deleting food item:', error);
      NotificationManager.error('Failed to delete food item. Please check your connection and try again.');
    }
  }
}