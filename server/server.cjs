const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs').promises;

const mealsRoutes = require('./routes/meals.cjs');
const weightRoutes = require('./routes/weight.cjs');
const { validateRequest } = require('./middleware/validation.cjs');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(validateRequest);

// Serve static files from dist directory in production
if (process.env.NODE_ENV === 'production') {
  app.use(express.static(path.join(__dirname, '../dist')));
}

// API routes
app.use('/api/meals', mealsRoutes);
app.use('/api/weight', weightRoutes);

// Serve frontend in production
if (process.env.NODE_ENV === 'production') {
  app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '../dist/index.html'));
  });
}

// Generate sample meals data for the last 14 days
function generateSampleMealsData() {
  const meals = [];
  const today = new Date();
  
  for (let i = 13; i >= 0; i--) {
    const date = new Date(today);
    date.setDate(today.getDate() - i);
    const dateString = date.toISOString().split('T')[0];
    
    // Generate random but realistic daily calories between 1200-2400
    const baseCalories = 1200 + Math.random() * 1200;
    const breakfastCals = Math.floor(baseCalories * 0.25);
    const lunchCals = Math.floor(baseCalories * 0.35);
    const dinnerCals = Math.floor(baseCalories * 0.30);
    const snackCals = Math.floor(baseCalories * 0.10);
    
    const dayMeal = {
      date: dateString,
      totalKcal: breakfastCals + lunchCals + dinnerCals + snackCals,
      breakfast: [
        { id: `b-${i}-1`, name: 'Oatmeal', unit: 'serving', kcal: Math.floor(breakfastCals * 0.6) },
        { id: `b-${i}-2`, name: 'Banana', unit: 'medium', kcal: Math.floor(breakfastCals * 0.4) }
      ],
      morning_snack: [
        { id: `ms-${i}-1`, name: 'Apple', unit: 'medium', kcal: Math.floor(snackCals * 0.5) }
      ],
      lunch: [
        { id: `l-${i}-1`, name: 'Chicken breast', unit: 'ounce', kcal: Math.floor(lunchCals * 0.6) },
        { id: `l-${i}-2`, name: 'Brown rice', unit: 'cup', kcal: Math.floor(lunchCals * 0.4) }
      ],
      afternoon_snack: [
        { id: `as-${i}-1`, name: 'Greek yogurt', unit: 'cup', kcal: Math.floor(snackCals * 0.5) }
      ],
      dinner: [
        { id: `d-${i}-1`, name: 'Salmon', unit: 'ounce', kcal: Math.floor(dinnerCals * 0.5) },
        { id: `d-${i}-2`, name: 'Broccoli', unit: 'cup', kcal: Math.floor(dinnerCals * 0.2) },
        { id: `d-${i}-3`, name: 'Sweet potato', unit: 'medium', kcal: Math.floor(dinnerCals * 0.3) }
      ],
      evening_snack: []
    };
    
    meals.push(dayMeal);
  }
  
  return meals;
}

// Generate sample weight data for the last 14 days
function generateSampleWeightData() {
  const weights = [];
  const today = new Date();
  let currentWeight = 165 + Math.random() * 10; // Start between 165-175 lbs
  
  for (let i = 13; i >= 0; i--) {
    const date = new Date(today);
    date.setDate(today.getDate() - i);
    const dateString = date.toISOString().split('T')[0];
    
    // Add some realistic weight fluctuation (±2 lbs with slight downward trend)
    currentWeight += (Math.random() - 0.55) * 2; // Slight downward bias
    currentWeight = Math.max(140, Math.min(200, currentWeight)); // Keep in reasonable range
    
    // Only add weight entries for about 60% of days (realistic tracking)
    if (Math.random() > 0.4) {
      weights.push({
        date: dateString,
        weight: Math.round(currentWeight * 10) / 10 // Round to 1 decimal
      });
    }
  }
  
  return weights;
}

// Initialize data files if they don't exist
async function initializeDataFiles() {
  const dataDir = path.join(__dirname, 'data');
  
  try {
    await fs.access(dataDir);
  } catch {
    await fs.mkdir(dataDir, { recursive: true });
  }
  
  const mealsFile = path.join(dataDir, 'meals.json');
  const weightFile = path.join(dataDir, 'weight.json');
  
  try {
    await fs.access(mealsFile);
  } catch {
    const initialMealsData = {
      meals: generateSampleMealsData(),
      foodDatabase: [
        { name: 'Apple', unit: 'medium', kcal: 95 },
        { name: 'Banana', unit: 'medium', kcal: 105 },
        { name: 'Orange', unit: 'medium', kcal: 62 },
        { name: 'Oatmeal', unit: 'serving', kcal: 150 },
        { name: 'Whole grain toast', unit: 'slice', kcal: 80 },
        { name: 'Peanut butter', unit: 'tablespoon', kcal: 95 },
        { name: 'Greek yogurt', unit: 'cup', kcal: 130 },
        { name: 'Chicken breast', unit: 'ounce', kcal: 45 },
        { name: 'Brown rice', unit: 'cup', kcal: 220 },
        { name: 'Broccoli', unit: 'cup', kcal: 25 },
        { name: 'Eggs', unit: 'large', kcal: 70 },
        { name: 'Avocado', unit: 'half', kcal: 160 },
        { name: 'Salmon', unit: 'ounce', kcal: 50 }
      ]
    };
    await fs.writeFile(mealsFile, JSON.stringify(initialMealsData, null, 2));
  }
  
  try {
    await fs.access(weightFile);
  } catch {
    const initialWeightData = {
      weight: {
        goal: 150.0,
        daily: generateSampleWeightData()
      }
    };
    await fs.writeFile(weightFile, JSON.stringify(initialWeightData, null, 2));
  }
}

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(500).json({ error: 'Internal server error' });
});

// Start server
async function startServer() {
  try {
    await initializeDataFiles();
    app.listen(PORT, () => {
      console.log(`Sqirvy Health server running on port ${PORT}`);
      console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
}

startServer();