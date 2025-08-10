const express = require('express');
const fs = require('fs').promises;
const path = require('path');
const { v4: uuidv4 } = require('uuid');
const { mealTypes } = require('../middleware/validation.cjs');

const router = express.Router();
const mealsFilePath = path.join(__dirname, '../data/meals.json');

// Helper function to read meals data
async function readMealsData() {
  try {
    const data = await fs.readFile(mealsFilePath, 'utf-8');
    return JSON.parse(data);
  } catch (error) {
    console.error('Error reading meals data:', error);
    return { meals: [], foodDatabase: [] };
  }
}

// Helper function to write meals data
async function writeMealsData(data) {
  try {
    await fs.writeFile(mealsFilePath, JSON.stringify(data, null, 2));
    return true;
  } catch (error) {
    console.error('Error writing meals data:', error);
    return false;
  }
}

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
    const mealsData = await readMealsData();
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
    const mealsData = await readMealsData();
    
    const dayMeals = mealsData.meals.find(m => m.date === date);
    
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
    
    res.json(dayMeals);
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
    
    const mealsData = await readMealsData();
    
    // Find or create day meals
    let dayMealsIndex = mealsData.meals.findIndex(m => m.date === date);
    
    if (dayMealsIndex === -1) {
      // Create new day structure
      const newDay = {
        date,
        totalKcal: 0,
        breakfast: [],
        morning_snack: [],
        lunch: [],
        afternoon_snack: [],
        dinner: [],
        evening_snack: []
      };
      mealsData.meals.push(newDay);
      dayMealsIndex = mealsData.meals.length - 1;
    }
    
    // Create food item with unique ID
    const foodItem = {
      id: uuidv4(),
      name: name.trim(),
      unit,
      kcal
    };
    
    // Add food item to the specific meal
    mealsData.meals[dayMealsIndex][mealType].push(foodItem);
    
    // Update total calories for the day
    mealsData.meals[dayMealsIndex].totalKcal = calculateTotalCalories(mealsData.meals[dayMealsIndex]);
    
    // Add to food database if it's a new item
    const existingFood = mealsData.foodDatabase.find(f => 
      f.name.toLowerCase() === name.toLowerCase().trim() && 
      f.unit === unit
    );
    
    if (!existingFood) {
      mealsData.foodDatabase.push({ name: name.trim(), unit, kcal });
    }
    
    // Save data
    const success = await writeMealsData(mealsData);
    if (!success) {
      return res.status(500).json({ error: 'Failed to save food item' });
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
    
    const mealsData = await readMealsData();
    
    // Find day meals
    const dayMealsIndex = mealsData.meals.findIndex(m => m.date === date);
    if (dayMealsIndex === -1) {
      return res.status(404).json({ error: 'No meals found for this date' });
    }
    
    // Find and update food item across all meal types
    let foodFound = false;
    let updatedFoodItem = null;
    
    for (const mealType of mealTypes) {
      const foodIndex = mealsData.meals[dayMealsIndex][mealType].findIndex(f => f.id === id);
      if (foodIndex !== -1) {
        const currentFood = mealsData.meals[dayMealsIndex][mealType][foodIndex];
        updatedFoodItem = {
          ...currentFood,
          name: updates.name?.trim() || currentFood.name,
          unit: updates.unit || currentFood.unit,
          kcal: updates.kcal || currentFood.kcal
        };
        mealsData.meals[dayMealsIndex][mealType][foodIndex] = updatedFoodItem;
        foodFound = true;
        break;
      }
    }
    
    if (!foodFound) {
      return res.status(404).json({ error: 'Food item not found' });
    }
    
    // Update total calories for the day
    mealsData.meals[dayMealsIndex].totalKcal = calculateTotalCalories(mealsData.meals[dayMealsIndex]);
    
    // Save data
    const success = await writeMealsData(mealsData);
    if (!success) {
      return res.status(500).json({ error: 'Failed to update food item' });
    }
    
    res.json(updatedFoodItem);
  } catch (error) {
    console.error('Error updating food item:', error);
    res.status(500).json({ error: 'Failed to update food item' });
  }
});

// DELETE /api/meals/:date/food/:id - Delete food item
router.delete('/:date/food/:id', async (req, res) => {
  try {
    const { date, id } = req.params;
    
    const mealsData = await readMealsData();
    
    // Find day meals
    const dayMealsIndex = mealsData.meals.findIndex(m => m.date === date);
    if (dayMealsIndex === -1) {
      return res.status(404).json({ error: 'No meals found for this date' });
    }
    
    // Find and delete food item across all meal types
    let foodDeleted = false;
    
    for (const mealType of mealTypes) {
      const foodIndex = mealsData.meals[dayMealsIndex][mealType].findIndex(f => f.id === id);
      if (foodIndex !== -1) {
        mealsData.meals[dayMealsIndex][mealType].splice(foodIndex, 1);
        foodDeleted = true;
        break;
      }
    }
    
    if (!foodDeleted) {
      return res.status(404).json({ error: 'Food item not found' });
    }
    
    // Update total calories for the day
    mealsData.meals[dayMealsIndex].totalKcal = calculateTotalCalories(mealsData.meals[dayMealsIndex]);
    
    // Save data
    const success = await writeMealsData(mealsData);
    if (!success) {
      return res.status(500).json({ error: 'Failed to delete food item' });
    }
    
    res.status(204).send();
  } catch (error) {
    console.error('Error deleting food item:', error);
    res.status(500).json({ error: 'Failed to delete food item' });
  }
});

// GET /api/food/search - Search food database for autocomplete
router.get('/search', async (req, res) => {
  try {
    const { q } = req.query;
    
    if (!q || q.length < 2) {
      return res.json([]);
    }
    
    const mealsData = await readMealsData();
    const query = q.toLowerCase();
    
    // Search food database
    const matches = mealsData.foodDatabase
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
    
    res.json(matches);
  } catch (error) {
    console.error('Error searching food:', error);
    res.status(500).json({ error: 'Failed to search food database' });
  }
});

module.exports = router;