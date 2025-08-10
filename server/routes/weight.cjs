const express = require('express');
const fs = require('fs').promises;
const path = require('path');

const router = express.Router();
const weightFilePath = path.join(__dirname, '../data/weight.json');

// Helper function to read weight data
async function readWeightData() {
  try {
    const data = await fs.readFile(weightFilePath, 'utf-8');
    return JSON.parse(data);
  } catch (error) {
    console.error('Error reading weight data:', error);
    return { weight: { goal: 150.0, daily: [] } };
  }
}

// Helper function to write weight data
async function writeWeightData(data) {
  try {
    await fs.writeFile(weightFilePath, JSON.stringify(data, null, 2));
    return true;
  } catch (error) {
    console.error('Error writing weight data:', error);
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
    const today = new Date().toISOString().split('T')[0];
    
    const weightData = await readWeightData();
    
    // Check if there's already an entry for today
    const existingEntryIndex = weightData.weight.daily.findIndex(entry => entry.date === today);
    
    const newEntry = {
      date: today,
      weight: weight
    };
    
    if (existingEntryIndex !== -1) {
      // Update existing entry for today
      weightData.weight.daily[existingEntryIndex] = newEntry;
    } else {
      // Add new entry
      weightData.weight.daily.push(newEntry);
      
      // Sort entries by date (newest first) and keep only last 90 days to prevent file from growing too large
      weightData.weight.daily.sort((a, b) => new Date(b.date) - new Date(a.date));
      weightData.weight.daily = weightData.weight.daily.slice(0, 90);
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
    
    const weightData = await readWeightData();
    weightData.weight.goal = goal;
    
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