const express = require('express');
const { v4: uuidv4 } = require('uuid');
const { mealTypes } = require('../middleware/validation.cjs');
const mealsDAL = require('../database/meals-dal.cjs');

const router = express.Router();

// Helper function to calculate total calories for a day
function calculateTotalCalories(dayMeals) {
  let total = 0;
  mealTypes.forEach(mealType => {
    if (dayMeals[mealType]) {
      total += dayMeals[mealType].reduce((sum, item) => sum + item.kcal, 0);
    }
  });
  return total;
}

// GET /api/meals - Get all meals data
router.get('/', async (req, res) => {
  try {
    const mealsData = mealsDAL.getMealsData();
    res.json(mealsData);
  } catch (error) {
    console.error('Error getting meals:', error);
    res.status(500).json({ error: 'Failed to retrieve meals data' });
  }
});

// GET /api/meals/:date - Get meals for specific date
router.get('/:date', async (req, res) => {
  try {
    const { date } = req.params;
    
    const dayMeals = mealsDAL.getMealByDate(date);
    
    if (!dayMeals) {
      // Return empty structure for new day
      const emptyDay = {
        date,
        totalKcal: 0,
        breakfast: [],
        morning_snack: [],
        lunch: [],
        afternoon_snack: [],
        dinner: [],
        evening_snack: []
      };
      return res.json(emptyDay);
    }
    
    res.json({
      date: dayMeals.date,
      totalKcal: dayMeals.total_kcal,
      breakfast: dayMeals.breakfast,
      morning_snack: dayMeals.morning_snack,
      lunch: dayMeals.lunch,
      afternoon_snack: dayMeals.afternoon_snack,
      dinner: dayMeals.dinner,
      evening_snack: dayMeals.evening_snack
    });
  } catch (error) {
    console.error('Error getting meals for date:', error);
    res.status(500).json({ error: 'Failed to retrieve meals for date' });
  }
});

// POST /api/meals/:date/food - Add food item to specific meal and date
router.post('/:date/food', async (req, res) => {
  try {
    const { date } = req.params;
    const { mealType, name, unit, kcal } = req.body;
    
    console.log(`   🍽️ Adding food item: "${name}" (${kcal} kcal) to ${mealType} on ${date}`);
    
    // Find or create day meals
    let dayMeals = mealsDAL.getMealByDate(date);
    let mealId;
    
    if (!dayMeals) {
      console.log(`   📅 Creating new day structure for ${date}`);
      const result = mealsDAL.addMeal(date, 0);
      mealId = result.lastInsertRowid;
    } else {
      console.log(`   📅 Found existing day structure for ${date}`);
      mealId = dayMeals.id;
    }
    
    // Create food item with unique ID
    const foodItem = {
      id: uuidv4(),
      name: name.trim(),
      unit,
      kcal
    };
    
    // Add meal item to database
    mealsDAL.addMealItem(mealId, name.trim(), unit, kcal, mealType);
    
    // Calculate and update total calories
    const updatedMeals = mealsDAL.getMealByDate(date);
    const totalKcal = calculateTotalCalories(updatedMeals);
    mealsDAL.updateMealTotalKcal(mealId, totalKcal);
    
    // Add to food database if it's a new item
    const existingFood = mealsDAL.getFoodItemByName(name.trim());
    
    if (!existingFood) {
      console.log(`   🆕 Adding new item to food database: "${name}" (${unit}, ${kcal} kcal)`);
      mealsDAL.addFoodItem(name.trim(), unit, kcal);
    } else {
      console.log(`   ✅ Food item already exists in database`);
    }
    
    res.status(201).json(foodItem);
  } catch (error) {
    console.error('Error adding food item:', error);
    res.status(500).json({ error: 'Failed to add food item' });
  }
});

// PUT /api/meals/:date/food/:id - Update food item
router.put('/:date/food/:id', async (req, res) => {
  try {
    const { date, id } = req.params;
    const updates = req.body;
    
    // For now, return not implemented since this requires more complex logic
    // to find and update specific meal items by the frontend-generated UUID
    res.status(501).json({ error: 'Update functionality not yet implemented with SQLite backend' });
  } catch (error) {
    console.error('Error updating food item:', error);
    res.status(500).json({ error: 'Failed to update food item' });
  }
});

// DELETE /api/meals/:date/food/:id - Delete food item
router.delete('/:date/food/:id', async (req, res) => {
  try {
    const { date, id } = req.params;
    
    // For now, return not implemented since this requires more complex logic
    // to find and delete specific meal items by the frontend-generated UUID
    res.status(501).json({ error: 'Delete functionality not yet implemented with SQLite backend' });
  } catch (error) {
    console.error('Error deleting food item:', error);
    res.status(500).json({ error: 'Failed to delete food item' });
  }
});

// GET /api/meals/search - Search food database for autocomplete
router.get('/search', async (req, res) => {
  try {
    const { q } = req.query;
    
    console.log(`   🔍 Searching food database for: "${q}"`);
    
    if (!q || q.length < 2) {
      console.log(`   ⚠️ Query too short, returning empty results`);
      return res.json([]);
    }
    
    const allFoodItems = mealsDAL.getAllFoodItems();
    const query = q.toLowerCase();
    
    // Search food database
    const matches = allFoodItems
      .filter(food => food.name.toLowerCase().includes(query))
      .sort((a, b) => {
        // Prioritize exact matches at the beginning
        const aStartsWith = a.name.toLowerCase().startsWith(query);
        const bStartsWith = b.name.toLowerCase().startsWith(query);
        
        if (aStartsWith && !bStartsWith) return -1;
        if (!aStartsWith && bStartsWith) return 1;
        
        // Then alphabetical
        return a.name.localeCompare(b.name);
      })
      .slice(0, 10); // Limit to 10 results
    
    console.log(`   🎯 Found ${matches.length} matches`);
    res.json(matches);
  } catch (error) {
    console.error('Error searching food:', error);
    res.status(500).json({ error: 'Failed to search food database' });
  }
});

// POST /api/meals/foodDatabase - Add new food item to database
router.post('/foodDatabase', async (req, res) => {
  try {
    const { name, unit, kcal } = req.body;
    
    console.log(`   🆕 Adding new food to database: "${name}" (${unit}, ${kcal} kcal)`);
    
    // Check if food item already exists
    const existingFood = mealsDAL.getFoodItemByName(name.trim());
    
    if (existingFood && existingFood.unit === unit) {
      console.log(`   ⚠️ Food item already exists in database`);
      return res.status(400).json({ error: 'Food item with this name and unit already exists in database' });
    }
    
    // Add to food database
    const result = mealsDAL.addFoodItem(name.trim(), unit, kcal);
    const newFoodItem = { name: name.trim(), unit, kcal };
    
    console.log(`   ✅ Successfully added "${name}" to food database`);
    res.status(201).json(newFoodItem);
  } catch (error) {
    console.error('Error adding food to database:', error);
    res.status(500).json({ error: 'Failed to add food item to database' });
  }
});

module.exports = router;