const assert = require('assert');
const weightDAL = require('../../server/database/weight-dal.cjs');

function testWeightEntryOperations() {
  console.log('⚖️ Testing weight entry operations...');
  
  try {
    const testDate = '2025-08-15';
    const testWeight = 180.5;
    
    // Add a test weight entry
    const result = weightDAL.addWeightEntry(testDate, testWeight);
    assert(result.changes > 0, 'Should insert weight entry successfully');
    console.log('   ✅ Weight entry added successfully');
    
    // Get weight entry by date
    const weightEntry = weightDAL.getWeightEntryByDate(testDate);
    assert(weightEntry, 'Should find weight entry by date');
    assert(weightEntry.date === testDate, 'Weight entry date should match');
    assert(weightEntry.weight === testWeight, 'Weight entry weight should match');
    console.log('   ✅ Weight entry retrieved successfully');
    
    // Update weight entry (INSERT OR REPLACE)
    const newWeight = 179.8;
    const updateResult = weightDAL.addWeightEntry(testDate, newWeight);
    assert(updateResult.changes > 0, 'Should update weight entry successfully');
    
    const updatedEntry = weightDAL.getWeightEntryByDate(testDate);
    assert(updatedEntry.weight === newWeight, 'Weight should be updated');
    console.log('   ✅ Weight entry updated successfully');
    
    // Get all weight entries
    const allEntries = weightDAL.getAllWeightEntries();
    assert(Array.isArray(allEntries), 'Should return array of weight entries');
    assert(allEntries.length >= 1, 'Should have at least one weight entry');
    console.log(`   ✅ Retrieved ${allEntries.length} weight entries`);
    
    return true;
  } catch (error) {
    console.error('   ❌ Weight entry operations failed:', error.message);
    return false;
  }
}

function testWeightGoalOperations() {
  console.log('🎯 Testing weight goal operations...');
  
  try {
    const testGoal = 175.0;
    
    // Set a test goal
    const result = weightDAL.setGoal(testGoal);
    assert(result.lastInsertRowid, 'Should set goal successfully');
    console.log('   ✅ Weight goal set successfully');
    
    // Get current goal
    const currentGoal = weightDAL.getCurrentGoal();
    assert(currentGoal, 'Should find current goal');
    assert(currentGoal.goal_weight === testGoal, 'Goal weight should match');
    assert(currentGoal.is_active === 1, 'Goal should be active');
    console.log('   ✅ Current goal retrieved successfully');
    
    // Set a new goal (should deactivate the old one)
    const newGoal = 170.0;
    weightDAL.setGoal(newGoal);
    
    const updatedGoal = weightDAL.getCurrentGoal();
    assert(updatedGoal.goal_weight === newGoal, 'New goal weight should match');
    console.log('   ✅ Goal updated successfully');
    
    return true;
  } catch (error) {
    console.error('   ❌ Weight goal operations failed:', error.message);
    return false;
  }
}

function testWeightDataFormat() {
  console.log('📄 Testing weight data format compatibility...');
  
  try {
    const weightData = weightDAL.getWeightData();
    
    // Check structure
    assert(typeof weightData === 'object', 'Weight data should be an object');
    assert(typeof weightData.weight === 'object', 'Should have weight object');
    assert(typeof weightData.weight.goal === 'number', 'Should have goal number');
    assert(Array.isArray(weightData.weight.daily), 'Should have daily array');
    console.log('   ✅ Weight data has correct structure');
    
    // Check daily entries format
    if (weightData.weight.daily.length > 0) {
      const entry = weightData.weight.daily[0];
      assert(typeof entry.date === 'string', 'Daily entry should have date string');
      assert(typeof entry.weight === 'number', 'Daily entry should have weight number');
      console.log('   ✅ Daily entries format matches expected structure');
    }
    
    console.log(`   📊 Goal: ${weightData.weight.goal}, Daily entries: ${weightData.weight.daily.length}`);
    
    return true;
  } catch (error) {
    console.error('   ❌ Data format test failed:', error.message);
    return false;
  }
}

function runWeightTests() {
  console.log('🧪 Running weight tests...\n');
  
  let passed = 0;
  let failed = 0;
  
  // Test weight entry operations
  if (testWeightEntryOperations()) {
    passed++;
  } else {
    failed++;
  }
  
  console.log();
  
  // Test weight goal operations
  if (testWeightGoalOperations()) {
    passed++;
  } else {
    failed++;
  }
  
  console.log();
  
  // Test data format compatibility
  if (testWeightDataFormat()) {
    passed++;
  } else {
    failed++;
  }
  
  console.log();
  console.log(`📊 Weight Tests Summary: ${passed} passed, ${failed} failed`);
  
  if (failed === 0) {
    console.log('✅ All weight tests passed!');
    return true;
  } else {
    console.log('❌ Some weight tests failed');
    return false;
  }
}

// Run tests if this script is executed directly
if (require.main === module) {
  const success = runWeightTests();
  process.exit(success ? 0 : 1);
}

module.exports = { runWeightTests };