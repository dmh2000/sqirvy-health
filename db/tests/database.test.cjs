const assert = require('assert');
const dbConnection = require('../../server/database/connection.cjs');

// Test database connection and table creation
function testDatabaseConnection() {
  console.log('🔌 Testing database connection...');
  
  try {
    const db = dbConnection.getDb();
    assert(db, 'Database connection should be established');
    console.log('   ✅ Database connection successful');
    
    // Test that foreign keys are enabled
    const fkResult = db.pragma('foreign_keys');
    assert(fkResult[0].foreign_keys === 1, 'Foreign keys should be enabled');
    console.log('   ✅ Foreign keys enabled');
    
    return true;
  } catch (error) {
    console.error('   ❌ Database connection failed:', error.message);
    return false;
  }
}

function testTablesExist() {
  console.log('📋 Testing table existence...');
  
  try {
    const db = dbConnection.getDb();
    
    // Get list of all tables
    const tables = db.prepare("SELECT name FROM sqlite_master WHERE type='table' ORDER BY name").all();
    const tableNames = tables.map(table => table.name);
    
    const expectedTables = [
      'food_items',
      'meals', 
      'meal_items',
      'weight_entries',
      'weight_goals'
    ];
    
    expectedTables.forEach(expectedTable => {
      assert(tableNames.includes(expectedTable), `Table ${expectedTable} should exist`);
      console.log(`   ✅ Table ${expectedTable} exists`);
    });
    
    return true;
  } catch (error) {
    console.error('   ❌ Table existence test failed:', error.message);
    return false;
  }
}

function testTableSchemas() {
  console.log('🏗️ Testing table schemas...');
  
  try {
    const db = dbConnection.getDb();
    
    // Test food_items table schema
    const foodItemsSchema = db.prepare("PRAGMA table_info(food_items)").all();
    const foodItemsColumns = foodItemsSchema.map(col => col.name);
    assert(foodItemsColumns.includes('id'), 'food_items should have id column');
    assert(foodItemsColumns.includes('name'), 'food_items should have name column');
    assert(foodItemsColumns.includes('unit'), 'food_items should have unit column');
    assert(foodItemsColumns.includes('kcal'), 'food_items should have kcal column');
    console.log('   ✅ food_items table schema correct');
    
    // Test meals table schema
    const mealsSchema = db.prepare("PRAGMA table_info(meals)").all();
    const mealsColumns = mealsSchema.map(col => col.name);
    assert(mealsColumns.includes('id'), 'meals should have id column');
    assert(mealsColumns.includes('date'), 'meals should have date column');
    assert(mealsColumns.includes('total_kcal'), 'meals should have total_kcal column');
    console.log('   ✅ meals table schema correct');
    
    // Test meal_items table schema
    const mealItemsSchema = db.prepare("PRAGMA table_info(meal_items)").all();
    const mealItemsColumns = mealItemsSchema.map(col => col.name);
    assert(mealItemsColumns.includes('id'), 'meal_items should have id column');
    assert(mealItemsColumns.includes('meal_id'), 'meal_items should have meal_id column');
    assert(mealItemsColumns.includes('meal_category'), 'meal_items should have meal_category column');
    console.log('   ✅ meal_items table schema correct');
    
    // Test weight_entries table schema
    const weightEntriesSchema = db.prepare("PRAGMA table_info(weight_entries)").all();
    const weightEntriesColumns = weightEntriesSchema.map(col => col.name);
    assert(weightEntriesColumns.includes('id'), 'weight_entries should have id column');
    assert(weightEntriesColumns.includes('date'), 'weight_entries should have date column');
    assert(weightEntriesColumns.includes('weight'), 'weight_entries should have weight column');
    console.log('   ✅ weight_entries table schema correct');
    
    // Test weight_goals table schema
    const weightGoalsSchema = db.prepare("PRAGMA table_info(weight_goals)").all();
    const weightGoalsColumns = weightGoalsSchema.map(col => col.name);
    assert(weightGoalsColumns.includes('id'), 'weight_goals should have id column');
    assert(weightGoalsColumns.includes('goal_weight'), 'weight_goals should have goal_weight column');
    assert(weightGoalsColumns.includes('is_active'), 'weight_goals should have is_active column');
    console.log('   ✅ weight_goals table schema correct');
    
    return true;
  } catch (error) {
    console.error('   ❌ Schema test failed:', error.message);
    return false;
  }
}

function runDatabaseTests() {
  console.log('🧪 Running database tests...\n');
  
  let passed = 0;
  let failed = 0;
  
  // Test database connection
  if (testDatabaseConnection()) {
    passed++;
  } else {
    failed++;
  }
  
  console.log();
  
  // Test table existence
  if (testTablesExist()) {
    passed++;
  } else {
    failed++;
  }
  
  console.log();
  
  // Test table schemas
  if (testTableSchemas()) {
    passed++;
  } else {
    failed++;
  }
  
  console.log();
  console.log(`📊 Database Tests Summary: ${passed} passed, ${failed} failed`);
  
  if (failed === 0) {
    console.log('✅ All database tests passed!');
    return true;
  } else {
    console.log('❌ Some database tests failed');
    return false;
  }
}

// Run tests if this script is executed directly
if (require.main === module) {
  const success = runDatabaseTests();
  process.exit(success ? 0 : 1);
}

module.exports = { runDatabaseTests };