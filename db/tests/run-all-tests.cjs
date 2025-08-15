const { runDatabaseTests } = require('./database.test.cjs');
const { runMealsTests } = require('./meals.test.cjs');
const { runWeightTests } = require('./weight.test.cjs');

function runAllTests() {
  console.log('🚀 Starting SQLite Database Test Suite\n');
  console.log('=' .repeat(50));
  
  let totalPassed = 0;
  let totalFailed = 0;
  
  // Run database tests
  console.log('\n📋 DATABASE TESTS');
  console.log('-'.repeat(50));
  if (runDatabaseTests()) {
    totalPassed++;
  } else {
    totalFailed++;
  }
  
  // Run meals tests
  console.log('\n🍽️ MEALS TESTS');
  console.log('-'.repeat(50));
  if (runMealsTests()) {
    totalPassed++;
  } else {
    totalFailed++;
  }
  
  // Run weight tests
  console.log('\n⚖️ WEIGHT TESTS');
  console.log('-'.repeat(50));
  if (runWeightTests()) {
    totalPassed++;
  } else {
    totalFailed++;
  }
  
  // Summary
  console.log('\n' + '='.repeat(50));
  console.log('🎯 FINAL TEST RESULTS');
  console.log('='.repeat(50));
  console.log(`Test Suites: ${totalPassed} passed, ${totalFailed} failed`);
  
  if (totalFailed === 0) {
    console.log('🎉 ALL TESTS PASSED! SQLite database is working correctly.');
    return true;
  } else {
    console.log('❌ SOME TESTS FAILED! Please check the SQLite database setup.');
    return false;
  }
}

// Run tests if this script is executed directly
if (require.main === module) {
  const success = runAllTests();
  process.exit(success ? 0 : 1);
}

module.exports = { runAllTests };