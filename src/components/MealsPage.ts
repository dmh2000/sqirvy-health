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
        <div class="meals-header">
          <h2>Meals - ${this.formatDate(state.currentDate)}</h2>
          <button class="add-food-db-btn" id="add-food-db-btn">+ Add New Food Item</button>
        </div>
        
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
                <select id="food-name" required>
                  <option value="">Select food item</option>
                </select>
              </div>
              
              <div class="form-group">
                <label for="food-unit">Unit:</label>
                <input type="text" id="food-unit" readonly>
              </div>
              
              <div class="form-group">
                <label for="food-calories">Calories:</label>
                <input type="number" id="food-calories" readonly>
              </div>
              
              <div class="form-actions">
                <button type="button" id="cancel-btn">Cancel</button>
                <button type="submit" id="submit-btn">Add Item</button>
              </div>
            </form>
          </div>
        </div>

        <!-- Add Food to Database Modal -->
        <div id="food-db-modal" class="modal" style="display: none;">
          <div class="modal-content">
            <span class="close" id="close-food-db-modal">&times;</span>
            <h3>Add New Food Item to Database</h3>
            <form id="food-db-form">
              <div class="form-group">
                <label for="food-db-name">Food Name:</label>
                <input type="text" id="food-db-name" required placeholder="Enter food name">
              </div>
              
              <div class="form-group">
                <label for="food-db-unit">Unit:</label>
                <select id="food-db-unit" required>
                  <option value="">Select unit</option>
                  <option value="serving">serving</option>
                  <option value="cup">cup</option>
                  <option value="tablespoon">tablespoon</option>
                  <option value="ounce">ounce</option>
                  <option value="gram">gram</option>
                  <option value="small">small</option>
                  <option value="medium">medium</option>
                  <option value="large">large</option>
                  <option value="slice">slice</option>
                  <option value="piece">piece</option>
                  <option value="bowl">bowl</option>
                  <option value="plate">plate</option>
                  <option value="bunch">bunch</option>
                  <option value="can">can</option>
                </select>
              </div>
              
              <div class="form-group">
                <label for="food-db-calories">Calories (kcal):</label>
                <input type="number" id="food-db-calories" min="1" required placeholder="Enter calories">
              </div>
              
              <div class="form-actions">
                <button type="button" id="food-db-cancel-btn">Cancel</button>
                <button type="submit" id="food-db-submit-btn">Add to Database</button>
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
    await this.loadFoodDatabase();
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

  private static async loadFoodDatabase() {
    try {
      const mealsData = await this.api.getMeals();
      this.populateFoodDropdown(mealsData.foodDatabase);
    } catch (error) {
      console.error('Error loading food database:', error);
    }
  }

  private static populateFoodDropdown(foodDatabase: any[]) {
    const select = document.getElementById('food-name') as HTMLSelectElement;
    if (!select) return;

    // Clear existing options except the first one
    select.innerHTML = '<option value="">Select food item</option>';
    
    // Sort food items alphabetically
    const sortedFoods = [...foodDatabase].sort((a, b) => a.name.localeCompare(b.name));
    
    // Add food items as options
    sortedFoods.forEach((food, index) => {
      const option = document.createElement('option');
      option.value = index.toString();
      option.textContent = `${food.name} (${food.unit}, ${food.kcal} kcal)`;
      option.setAttribute('data-name', food.name);
      option.setAttribute('data-unit', food.unit);
      option.setAttribute('data-calories', food.kcal.toString());
      select.appendChild(option);
    });
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

      if (target.matches('#add-food-db-btn')) {
        this.openFoodDbModal();
      }

      if (target.matches('#close-food-db-modal, #food-db-cancel-btn')) {
        this.closeFoodDbModal();
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

    // Food database form submission
    const foodDbForm = document.getElementById('food-db-form') as HTMLFormElement;
    if (foodDbForm) {
      foodDbForm.addEventListener('submit', (e) => {
        e.preventDefault();
        this.submitFoodDbForm();
      });
    }

    // Food dropdown selection
    document.addEventListener('change', (e) => {
      const target = e.target as HTMLElement;
      if (target.matches('#food-name')) {
        this.handleFoodSelection(target as HTMLSelectElement);
      }
    });
  }

  private static async openFoodModal(mealType: MealType, editData?: FoodItem) {
    this.currentMealType = mealType;
    const modal = document.getElementById('food-modal');
    const title = document.getElementById('modal-title');
    const submitBtn = document.getElementById('submit-btn');
    
    if (modal) modal.style.display = 'block';
    
    // Ensure food database is loaded in the dropdown
    await this.loadFoodDatabase();
    
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

  private static handleFoodSelection(select: HTMLSelectElement) {
    const selectedOption = select.selectedOptions[0];
    if (!selectedOption || !selectedOption.value) {
      // Clear fields if no selection
      this.clearFoodFields();
      return;
    }

    const unit = selectedOption.getAttribute('data-unit');
    const calories = selectedOption.getAttribute('data-calories');

    const unitInput = document.getElementById('food-unit') as HTMLInputElement;
    const caloriesInput = document.getElementById('food-calories') as HTMLInputElement;

    if (unitInput) unitInput.value = unit || '';
    if (caloriesInput) caloriesInput.value = calories || '';
  }

  private static clearFoodFields() {
    const unitInput = document.getElementById('food-unit') as HTMLInputElement;
    const caloriesInput = document.getElementById('food-calories') as HTMLInputElement;

    if (unitInput) unitInput.value = '';
    if (caloriesInput) caloriesInput.value = '';
  }

  private static populateForm(foodItem: FoodItem) {
    const nameSelect = document.getElementById('food-name') as HTMLSelectElement;
    const unitInput = document.getElementById('food-unit') as HTMLInputElement;
    const caloriesInput = document.getElementById('food-calories') as HTMLInputElement;
    
    // Find the matching option in the dropdown
    if (nameSelect) {
      for (let i = 0; i < nameSelect.options.length; i++) {
        const option = nameSelect.options[i];
        if (option.getAttribute('data-name') === foodItem.name && 
            option.getAttribute('data-unit') === foodItem.unit &&
            option.getAttribute('data-calories') === foodItem.kcal.toString()) {
          nameSelect.value = option.value;
          break;
        }
      }
    }
    if (unitInput) unitInput.value = foodItem.unit;
    if (caloriesInput) caloriesInput.value = foodItem.kcal.toString();
  }

  private static resetForm() {
    const form = document.getElementById('food-form') as HTMLFormElement;
    if (form) form.reset();
    
    this.clearFoodFields();
  }


  private static async submitFoodForm() {
    const nameSelect = document.getElementById('food-name') as HTMLSelectElement;
    const unitInput = document.getElementById('food-unit') as HTMLInputElement;
    const caloriesInput = document.getElementById('food-calories') as HTMLInputElement;
    const submitBtn = document.getElementById('submit-btn') as HTMLButtonElement;
    
    if (!nameSelect || !unitInput || !caloriesInput || !this.currentMealType) return;

    const selectedOption = nameSelect.selectedOptions[0];
    if (!selectedOption || !selectedOption.value) {
      this.showFormError('food-name', 'Please select a food item');
      return;
    }

    const foodItem = {
      name: selectedOption.getAttribute('data-name') || '',
      unit: unitInput.value.trim(),
      kcal: parseInt(caloriesInput.value)
    };
    
    // Validation
    if (!foodItem.name) {
      this.showFormError('food-name', 'Please select a food item');
      return;
    }
    
    if (!foodItem.unit) {
      this.showFormError('food-name', 'Selected food item is missing unit information');
      return;
    }
    
    if (!foodItem.kcal || foodItem.kcal <= 0) {
      this.showFormError('food-name', 'Selected food item is missing calorie information');
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
      
      const currentDate = this.getLocalDateString();
      const result = await this.api.addFoodItem(currentDate, this.currentMealType, foodItem);
      
      if (result) {
        NotificationManager.success(`Added ${foodItem.name} to ${this.currentMealType.replace('_', ' ')}`);
        this.closeFoodModal();
        // Refresh the meals data without leaving the page
        await this.refreshMealsData();
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
      const currentDate = this.getLocalDateString();
      const result = await this.api.deleteFoodItem(currentDate, foodId);
      
      if (result) {
        NotificationManager.success('Food item deleted successfully');
        // Refresh the meals data without leaving the page
        await this.refreshMealsData();
      } else {
        NotificationManager.error('Failed to delete food item. Please try again.');
      }
    } catch (error) {
      console.error('Error deleting food item:', error);
      NotificationManager.error('Failed to delete food item. Please check your connection and try again.');
    }
  }

  private static async refreshMealsData() {
    try {
      LoadingManager.show('meals-grid', 'Refreshing meals...');
      const mealsData = await this.api.getMeals();
      const currentDate = this.getLocalDateString();
      
      // Re-render the meals data
      this.renderMealsData(mealsData, currentDate);
      
      // Re-populate food dropdown in case new items were added
      await this.loadFoodDatabase();
    } catch (error) {
      console.error('Error refreshing meals data:', error);
      NotificationManager.error('Failed to refresh meals data. Please try again.');
    } finally {
      LoadingManager.hide('meals-grid');
    }
  }

  private static openFoodDbModal() {
    const modal = document.getElementById('food-db-modal');
    if (modal) modal.style.display = 'block';
    this.resetFoodDbForm();
  }

  private static closeFoodDbModal() {
    const modal = document.getElementById('food-db-modal');
    if (modal) modal.style.display = 'none';
    this.resetFoodDbForm();
  }

  private static resetFoodDbForm() {
    const form = document.getElementById('food-db-form') as HTMLFormElement;
    if (form) form.reset();
    this.clearFoodDbFormErrors();
  }

  private static clearFoodDbFormErrors() {
    const modal = document.getElementById('food-db-modal');
    if (!modal) return;
    
    // Remove all error messages
    const errors = modal.querySelectorAll('.form-error');
    errors.forEach(error => error.remove());
    
    // Remove error styling
    const fields = modal.querySelectorAll('input, select');
    fields.forEach(field => field.classList.remove('error'));
  }

  private static showFoodDbFormError(fieldId: string, message: string) {
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

  private static async submitFoodDbForm() {
    const nameInput = document.getElementById('food-db-name') as HTMLInputElement;
    const unitSelect = document.getElementById('food-db-unit') as HTMLSelectElement;
    const caloriesInput = document.getElementById('food-db-calories') as HTMLInputElement;
    const submitBtn = document.getElementById('food-db-submit-btn') as HTMLButtonElement;
    
    if (!nameInput || !unitSelect || !caloriesInput) return;

    const foodItem = {
      name: nameInput.value.trim(),
      unit: unitSelect.value,
      kcal: parseInt(caloriesInput.value)
    };

    // Validation
    if (!foodItem.name) {
      this.showFoodDbFormError('food-db-name', 'Food name is required');
      return;
    }
    
    if (!foodItem.unit) {
      this.showFoodDbFormError('food-db-unit', 'Please select a unit');
      return;
    }
    
    if (!foodItem.kcal || foodItem.kcal <= 0) {
      this.showFoodDbFormError('food-db-calories', 'Please enter a valid number of calories');
      return;
    }

    // Clear any existing errors
    this.clearFoodDbFormErrors();
    
    try {
      // Show loading state
      if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.classList.add('loading');
      }
      
      const result = await this.api.addFoodToDatabase(foodItem);
      
      if (result) {
        NotificationManager.success(`Added "${foodItem.name}" to food database`);
        this.closeFoodDbModal();
        // Refresh the food dropdown to include the new item
        await this.loadFoodDatabase();
      } else {
        NotificationManager.error('Failed to add food item to database. Please try again.');
      }
    } catch (error) {
      console.error('Error adding food to database:', error);
      NotificationManager.error('Failed to add food item to database. Please check your connection and try again.');
    } finally {
      // Remove loading state
      if (submitBtn) {
        submitBtn.disabled = false;
        submitBtn.classList.remove('loading');
      }
    }
  }

  private static getLocalDateString(): string {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }
}