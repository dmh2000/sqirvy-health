const express = require('express');
const weightDAL = require('../database/weight-dal.cjs');

// Helper function to get local date string
function getLocalDateString() {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

const router = express.Router();

// GET /api/weight - Get all weight data
router.get('/', async (req, res) => {
  try {
    const weightData = weightDAL.getWeightData();
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
    
    // Check if there's already an entry for today
    const existingEntry = weightDAL.getWeightEntryByDate(today);
    
    const newEntry = {
      date: today,
      weight: weight
    };
    
    if (existingEntry) {
      console.log(`   🔄 Updating existing weight entry for ${today}`);
    } else {
      console.log(`   ➕ Adding new weight entry for ${today}`);
    }
    
    // Add or update entry (INSERT OR REPLACE)
    weightDAL.addWeightEntry(today, weight);
    
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
    
    const currentGoal = weightDAL.getCurrentGoal();
    const oldGoal = currentGoal ? currentGoal.goal_weight : null;
    
    weightDAL.setGoal(goal);
    
    console.log(`   📊 Goal weight changed from ${oldGoal} to ${goal} lbs`);
    
    res.json({ goal });
  } catch (error) {
    console.error('Error updating goal weight:', error);
    res.status(500).json({ error: 'Failed to update goal weight' });
  }
});

module.exports = router;