const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs').promises;

const mealsRoutes = require('./routes/meals.cjs');
const weightRoutes = require('./routes/weight.cjs');
const { validateRequest } = require('./middleware/validation.cjs');

const app = express();
const PORT = process.env.PORT || 3000;

// Helper function to get local date string
function getLocalDateString() {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

// Logging middleware
function requestLogger(req, res, next) {
  const startTime = Date.now();
  const timestamp = new Date().toISOString();
  
  // Log incoming request
  console.log(`\n[${timestamp}] 📥 ${req.method} ${req.url}`);
  if (Object.keys(req.query).length > 0) {
    console.log(`   Query: ${JSON.stringify(req.query)}`);
  }
  if (req.body && Object.keys(req.body).length > 0) {
    console.log(`   Body: ${JSON.stringify(req.body)}`);
  }
  if (req.headers['content-type']) {
    console.log(`   Content-Type: ${req.headers['content-type']}`);
  }
  
  // Capture original end method
  const originalEnd = res.end;
  
  // Override end method to log response
  res.end = function(chunk, encoding) {
    const duration = Date.now() - startTime;
    const responseTimestamp = new Date().toISOString();
    
    console.log(`[${responseTimestamp}] 📤 ${req.method} ${req.url} - ${res.statusCode} (${duration}ms)`);
    
    // Log response body for API endpoints (but not static files)
    if (req.url.startsWith('/api/') && chunk) {
      try {
        const responseData = JSON.parse(chunk.toString());
        if (res.statusCode >= 400) {
          console.log(`   ❌ Error Response: ${JSON.stringify(responseData)}`);
        } else {
          // For large responses, just log summary
          if (JSON.stringify(responseData).length > 500) {
            if (responseData.meals) {
              console.log(`   ✅ Success: ${responseData.meals.length} meals, ${responseData.foodDatabase?.length || 0} food items`);
            } else if (Array.isArray(responseData)) {
              console.log(`   ✅ Success: Array with ${responseData.length} items`);
            } else {
              console.log(`   ✅ Success: ${Object.keys(responseData).join(', ')}`);
            }
          } else {
            console.log(`   ✅ Response: ${JSON.stringify(responseData)}`);
          }
        }
      } catch (e) {
        console.log(`   ✅ Response: ${chunk.toString().substring(0, 100)}${chunk.length > 100 ? '...' : ''}`);
      }
    }
    
    // Call original end method
    originalEnd.call(this, chunk, encoding);
  };
  
  next();
}

// Middleware
app.use(cors());
app.use(express.json());
app.use(requestLogger);
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
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const dateString = `${year}-${month}-${day}`;
    
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
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const dateString = `${year}-${month}-${day}`;
    
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
  const timestamp = new Date().toISOString();
  console.error(`\n[${timestamp}] 💥 ERROR in ${req.method} ${req.url}:`);
  console.error(`   Message: ${err.message}`);
  console.error(`   Stack: ${err.stack}`);
  
  if (req.body && Object.keys(req.body).length > 0) {
    console.error(`   Request Body: ${JSON.stringify(req.body)}`);
  }
  
  res.status(500).json({ 
    error: 'Internal server error',
    timestamp: timestamp,
    path: req.url,
    method: req.method
  });
});

// Start server
async function startServer() {
  try {
    console.log('🚀 Starting Sqirvy Health Server...');
    console.log(`📅 Current date: ${getLocalDateString()}`);
    
    await initializeDataFiles();
    
    app.listen(PORT, () => {
      console.log('\n🎉 Sqirvy Health Server Started Successfully!');
      console.log(`🌐 Server running on: http://localhost:${PORT}`);
      console.log(`📊 Environment: ${process.env.NODE_ENV || 'development'}`);
      console.log(`📝 Logging: Enabled (requests, responses, errors)`);
      console.log('\n📋 Available endpoints:');
      console.log('   GET    /api/meals              - Get all meals data');
      console.log('   GET    /api/meals/:date        - Get meals for date');
      console.log('   POST   /api/meals/:date/food   - Add food item');
      console.log('   PUT    /api/meals/:date/food/:id - Update food item');
      console.log('   DELETE /api/meals/:date/food/:id - Delete food item');
      console.log('   GET    /api/meals/search       - Search food database');
      console.log('   GET    /api/weight             - Get weight data');
      console.log('   POST   /api/weight             - Add weight entry');
      console.log('   PUT    /api/weight/goal        - Update goal weight');
      console.log('\n⏰ Ready to serve requests...\n');
    });
  } catch (error) {
    console.error('💥 Failed to start server:', error.message);
    console.error(error.stack);
    process.exit(1);
  }
}

startServer();