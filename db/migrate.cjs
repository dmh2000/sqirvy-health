const fs = require('fs').promises;
const path = require('path');
const mealsDAL = require('../server/database/meals-dal.cjs');
const weightDAL = require('../server/database/weight-dal.cjs');

async function migrate() {
  try {
    console.log('🔄 Starting migration from JSON to SQLite...');
    
    // Backup existing JSON files
    const backupDir = path.join(__dirname, '../server/data/backup');
    await fs.mkdir(backupDir, { recursive: true });
    
    const mealsFile = path.join(__dirname, '../server/data/meals.json');
    const weightFile = path.join(__dirname, '../server/data/weight.json');
    
    // Read existing JSON data
    console.log('📖 Reading existing JSON data...');
    
    let mealsData = null;
    let weightData = null;
    
    try {
      const mealsContent = await fs.readFile(mealsFile, 'utf-8');
      mealsData = JSON.parse(mealsContent);
      console.log(`   ✅ Loaded ${mealsData.meals?.length || 0} meals, ${mealsData.foodDatabase?.length || 0} food items`);
      
      // Backup meals.json
      await fs.copyFile(mealsFile, path.join(backupDir, 'meals.json'));
      console.log('   💾 Backed up meals.json');
    } catch (error) {
      console.log(`   ⚠️ No meals data found or error reading: ${error.message}`);
      mealsData = { meals: [], foodDatabase: [] };
    }
    
    try {
      const weightContent = await fs.readFile(weightFile, 'utf-8');
      weightData = JSON.parse(weightContent);
      console.log(`   ✅ Loaded weight goal: ${weightData.weight?.goal}, daily entries: ${weightData.weight?.daily?.length || 0}`);
      
      // Backup weight.json
      await fs.copyFile(weightFile, path.join(backupDir, 'weight.json'));
      console.log('   💾 Backed up weight.json');
    } catch (error) {
      console.log(`   ⚠️ No weight data found or error reading: ${error.message}`);
      weightData = { weight: { goal: 150, daily: [] } };
    }
    
    // Migrate meals data
    console.log('🍽️ Migrating meals data to SQLite...');
    if (mealsData && (mealsData.meals.length > 0 || mealsData.foodDatabase.length > 0)) {
      mealsDAL.saveMealsData(mealsData);
      console.log('   ✅ Meals data migrated successfully');
    } else {
      console.log('   ⚠️ No meals data to migrate');
    }
    
    // Migrate weight data
    console.log('⚖️ Migrating weight data to SQLite...');
    if (weightData && weightData.weight) {
      weightDAL.saveWeightData(weightData);
      console.log('   ✅ Weight data migrated successfully');
    } else {
      console.log('   ⚠️ No weight data to migrate');
    }
    
    // Verify migration
    console.log('🔍 Verifying migration...');
    
    const migratedMeals = mealsDAL.getMealsData();
    const migratedWeight = weightDAL.getWeightData();
    
    console.log(`   📊 Verification results:`);
    console.log(`   - Food items: ${migratedMeals.foodDatabase.length}`);
    console.log(`   - Meals: ${migratedMeals.meals.length}`);
    console.log(`   - Weight goal: ${migratedWeight.weight.goal}`);
    console.log(`   - Weight entries: ${migratedWeight.weight.daily.length}`);
    
    console.log('✅ Migration completed successfully!');
    console.log('📁 Original JSON files backed up to server/data/backup/');
    console.log('🗄️ Data is now stored in SQLite database at db/sqirvy-health.db');
    
  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  }
}

// Run migration if this script is executed directly
if (require.main === module) {
  migrate()
    .then(() => process.exit(0))
    .catch(error => {
      console.error('Migration failed:', error);
      process.exit(1);
    });
}

module.exports = { migrate };