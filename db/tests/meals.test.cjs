const assert = require('assert');
const mealsDAL = require('../../server/database/meals-dal.cjs');

function testFoodItemOperations() {
  console.log('🍎 Testing food item operations...');
  
  try {
    // Add a test food item
    const result = mealsDAL.addFoodItem('Test Apple', 'medium', 95);
    assert(result.lastInsertRowid, 'Should return insert ID for new food item');
    console.log('   ✅ Food item added successfully');
    
    // Get food item by name
    const foodItem = mealsDAL.getFoodItemByName('Test Apple');
    assert(foodItem, 'Should find food item by name');
    assert(foodItem.name === 'Test Apple', 'Food item name should match');
    assert(foodItem.unit === 'medium', 'Food item unit should match');
    assert(foodItem.kcal === 95, 'Food item calories should match');
    console.log('   ✅ Food item retrieved successfully');
    
    // Get all food items
    const allFoodItems = mealsDAL.getAllFoodItems();
    assert(Array.isArray(allFoodItems), 'Should return array of food items');
    assert(allFoodItems.length >= 1, 'Should have at least one food item');
    console.log(`   ✅ Retrieved ${allFoodItems.length} food items`);
    
    return true;
  } catch (error) {
    console.error('   ❌ Food item operations failed:', error.message);
    return false;
  }
}

function testMealOperations() {
  console.log('🍽️ Testing meal operations...');
  
  try {
    // Add a test meal
    const testDate = '2025-08-15';
    const result = mealsDAL.addMeal(testDate, 0);
    assert(result.lastInsertRowid, 'Should return insert ID for new meal');
    const mealId = result.lastInsertRowid;
    console.log('   ✅ Meal added successfully');
    
    // Add meal items
    mealsDAL.addMealItem(mealId, 'Test Banana', 'medium', 105, 'breakfast');
    mealsDAL.addMealItem(mealId, 'Test Chicken', '4oz', 180, 'lunch');
    console.log('   ✅ Meal items added successfully');
    
    // Update total calories
    mealsDAL.updateMealTotalKcal(mealId, 285);
    console.log('   ✅ Total calories updated successfully');
    
    // Get meal by date
    const meal = mealsDAL.getMealByDate(testDate);
    assert(meal, 'Should find meal by date');
    assert(meal.date === testDate, 'Meal date should match');
    assert(meal.total_kcal === 285, 'Total calories should match');
    assert(Array.isArray(meal.breakfast), 'Breakfast should be an array');
    assert(Array.isArray(meal.lunch), 'Lunch should be an array');
    assert(meal.breakfast.length === 1, 'Should have one breakfast item');
    assert(meal.lunch.length === 1, 'Should have one lunch item');
    console.log('   ✅ Meal retrieved with correct structure');
    
    // Test meal items structure
    const breakfastItem = meal.breakfast[0];
    assert(breakfastItem.name === 'Test Banana', 'Breakfast item name should match');
    assert(breakfastItem.kcal === 105, 'Breakfast item calories should match');
    
    const lunchItem = meal.lunch[0];
    assert(lunchItem.name === 'Test Chicken', 'Lunch item name should match');
    assert(lunchItem.kcal === 180, 'Lunch item calories should match');
    console.log('   ✅ Meal items have correct structure');
    
    return true;
  } catch (error) {
    console.error('   ❌ Meal operations failed:', error.message);
    return false;
  }
}

function testMealsDataFormat() {
  console.log('📄 Testing meals data format compatibility...');
  
  try {
    const mealsData = mealsDAL.getMealsData();
    
    // Check structure
    assert(typeof mealsData === 'object', 'Meals data should be an object');
    assert(Array.isArray(mealsData.meals), 'Should have meals array');
    assert(Array.isArray(mealsData.foodDatabase), 'Should have foodDatabase array');
    console.log('   ✅ Meals data has correct structure');
    
    // Check meals format
    if (mealsData.meals.length > 0) {
      const meal = mealsData.meals[0];
      assert(typeof meal.date === 'string', 'Meal should have date string');
      assert(typeof meal.totalKcal === 'number', 'Meal should have totalKcal number');
      assert(Array.isArray(meal.breakfast), 'Meal should have breakfast array');
      assert(Array.isArray(meal.morning_snack), 'Meal should have morning_snack array');
      assert(Array.isArray(meal.lunch), 'Meal should have lunch array');
      assert(Array.isArray(meal.afternoon_snack), 'Meal should have afternoon_snack array');
      assert(Array.isArray(meal.dinner), 'Meal should have dinner array');
      assert(Array.isArray(meal.evening_snack), 'Meal should have evening_snack array');
      console.log('   ✅ Meal format matches expected structure');
    }
    
    // Check food database format
    if (mealsData.foodDatabase.length > 0) {
      const foodItem = mealsData.foodDatabase[0];
      assert(typeof foodItem.name === 'string', 'Food item should have name string');
      assert(typeof foodItem.unit === 'string', 'Food item should have unit string');
      assert(typeof foodItem.kcal === 'number', 'Food item should have kcal number');
      console.log('   ✅ Food database format matches expected structure');
    }
    
    return true;
  } catch (error) {
    console.error('   ❌ Data format test failed:', error.message);
    return false;
  }
}

function runMealsTests() {
  console.log('🧪 Running meals tests...\n');
  
  let passed = 0;
  let failed = 0;
  
  // Test food item operations
  if (testFoodItemOperations()) {
    passed++;
  } else {
    failed++;
  }
  
  console.log();
  
  // Test meal operations
  if (testMealOperations()) {
    passed++;
  } else {
    failed++;
  }
  
  console.log();
  
  // Test data format compatibility
  if (testMealsDataFormat()) {
    passed++;
  } else {
    failed++;
  }
  
  console.log();
  console.log(`📊 Meals Tests Summary: ${passed} passed, ${failed} failed`);
  
  if (failed === 0) {
    console.log('✅ All meals tests passed!');
    return true;
  } else {
    console.log('❌ Some meals tests failed');
    return false;
  }
}

// Run tests if this script is executed directly
if (require.main === module) {
  const success = runMealsTests();
  process.exit(success ? 0 : 1);
}

module.exports = { runMealsTests };