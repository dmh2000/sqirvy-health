const express = require('express');
const fs = require('fs').promises;
const path = require('path');

// Helper function to get local date string
function getLocalDateString() {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

const router = express.Router();
const weightFilePath = path.join(__dirname, '../data/weight.json');

// Helper function to read weight data
async function readWeightData() {
  try {
    console.log(`   📖 Reading weight data from: ${weightFilePath}`);
    const data = await fs.readFile(weightFilePath, 'utf-8');
    const parsed = JSON.parse(data);
    console.log(`   ✅ Loaded weight data: goal=${parsed.weight?.goal}, daily entries=${parsed.weight?.daily?.length || 0}`);
    return parsed;
  } catch (error) {
    console.error(`   ❌ Error reading weight data: ${error.message}`);
    return { weight: { goal: 150.0, daily: [] } };
  }
}

// Helper function to write weight data
async function writeWeightData(data) {
  try {
    console.log(`   💾 Saving weight data to: ${weightFilePath}`);
    await fs.writeFile(weightFilePath, JSON.stringify(data, null, 2));
    console.log(`   ✅ Saved weight data: goal=${data.weight?.goal}, daily entries=${data.weight?.daily?.length || 0}`);
    return true;
  } catch (error) {
    console.error(`   ❌ Error writing weight data: ${error.message}`);
    return false;
  }
}

// GET /api/weight - Get all weight data
router.get('/', async (req, res) => {
  try {
    const weightData = await readWeightData();
    res.json(weightData);
  } catch (error) {
    console.error('Error getting weight data:', error);
    res.status(500).json({ error: 'Failed to retrieve weight data' });
  }
});

// POST /api/weight - Add new weight entry
router.post('/', async (req, res) => {
  try {
    const { weight } = req.body;
    const today = getLocalDateString();
    
    console.log(`   ⚖️ Adding weight entry: ${weight} lbs for ${today}`);
    
    const weightData = await readWeightData();
    
    // Check if there's already an entry for today
    const existingEntryIndex = weightData.weight.daily.findIndex(entry => entry.date === today);
    
    const newEntry = {
      date: today,
      weight: weight
    };
    
    if (existingEntryIndex !== -1) {
      console.log(`   🔄 Updating existing weight entry for ${today}`);
      // Update existing entry for today
      weightData.weight.daily[existingEntryIndex] = newEntry;
    } else {
      console.log(`   ➕ Adding new weight entry for ${today}`);
      // Add new entry
      weightData.weight.daily.push(newEntry);
      
      // Sort entries by date (newest first) and keep only last 90 days to prevent file from growing too large
      weightData.weight.daily.sort((a, b) => new Date(b.date) - new Date(a.date));
      const oldLength = weightData.weight.daily.length;
      weightData.weight.daily = weightData.weight.daily.slice(0, 90);
      if (oldLength > 90) {
        console.log(`   🗑️ Trimmed weight history from ${oldLength} to 90 entries`);
      }
    }
    
    // Save data
    const success = await writeWeightData(weightData);
    if (!success) {
      return res.status(500).json({ error: 'Failed to save weight entry' });
    }
    
    res.status(201).json(newEntry);
  } catch (error) {
    console.error('Error adding weight entry:', error);
    res.status(500).json({ error: 'Failed to add weight entry' });
  }
});

// PUT /api/weight/goal - Update goal weight
router.put('/goal', async (req, res) => {
  try {
    const { goal } = req.body;
    
    console.log(`   🎯 Updating goal weight to: ${goal} lbs`);
    
    const weightData = await readWeightData();
    const oldGoal = weightData.weight.goal;
    weightData.weight.goal = goal;
    
    console.log(`   📊 Goal weight changed from ${oldGoal} to ${goal} lbs`);
    
    // Save data
    const success = await writeWeightData(weightData);
    if (!success) {
      return res.status(500).json({ error: 'Failed to update goal weight' });
    }
    
    res.json({ goal });
  } catch (error) {
    console.error('Error updating goal weight:', error);
    res.status(500).json({ error: 'Failed to update goal weight' });
  }
});

module.exports = router;