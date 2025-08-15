const dbConnection = require('./connection.cjs');

class MealsDAL {
    constructor() {
        this.db = dbConnection;
    }

    // Food Items operations
    getAllFoodItems() {
        const stmt = this.db.prepare('SELECT * FROM food_items ORDER BY name');
        return stmt.all();
    }

    addFoodItem(name, unit, kcal) {
        const stmt = this.db.prepare('INSERT INTO food_items (name, unit, kcal) VALUES (?, ?, ?)');
        return stmt.run(name, unit, kcal);
    }

    getFoodItemByName(name) {
        const stmt = this.db.prepare('SELECT * FROM food_items WHERE name = ?');
        return stmt.get(name);
    }

    // Meals operations
    getAllMeals() {
        const stmt = this.db.prepare('SELECT * FROM meals ORDER BY date DESC');
        const meals = stmt.all();
        
        // Get meal items for each meal
        return meals.map(meal => ({
            ...meal,
            ...this.getMealItems(meal.id)
        }));
    }

    getMealByDate(date) {
        const stmt = this.db.prepare('SELECT * FROM meals WHERE date = ?');
        const meal = stmt.get(date);
        
        if (!meal) return null;
        
        return {
            ...meal,
            ...this.getMealItems(meal.id)
        };
    }

    getMealItems(mealId) {
        const stmt = this.db.prepare('SELECT * FROM meal_items WHERE meal_id = ? ORDER BY meal_category, created_at');
        const items = stmt.all(mealId);
        
        const mealStructure = {
            breakfast: [],
            morning_snack: [],
            lunch: [],
            afternoon_snack: [],
            dinner: [],
            evening_snack: []
        };
        
        items.forEach(item => {
            mealStructure[item.meal_category].push({
                id: item.id,
                name: item.food_item_name,
                unit: item.food_item_unit,
                kcal: item.food_item_kcal,
                quantity: item.quantity
            });
        });
        
        return mealStructure;
    }

    addMeal(date, totalKcal = 0) {
        const stmt = this.db.prepare('INSERT INTO meals (date, total_kcal) VALUES (?, ?)');
        return stmt.run(date, totalKcal);
    }

    updateMealTotalKcal(mealId, totalKcal) {
        const stmt = this.db.prepare('UPDATE meals SET total_kcal = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?');
        return stmt.run(totalKcal, mealId);
    }

    addMealItem(mealId, foodItemName, foodItemUnit, foodItemKcal, mealCategory, quantity = 1) {
        const stmt = this.db.prepare(`
            INSERT INTO meal_items 
            (meal_id, food_item_name, food_item_unit, food_item_kcal, meal_category, quantity) 
            VALUES (?, ?, ?, ?, ?, ?)
        `);
        return stmt.run(mealId, foodItemName, foodItemUnit, foodItemKcal, mealCategory, quantity);
    }

    // Save entire meals data (for compatibility with existing API)
    saveMealsData(mealsData) {
        const transaction = this.db.transaction(() => {
            // Clear existing data
            this.db.prepare('DELETE FROM meal_items').run();
            this.db.prepare('DELETE FROM meals').run();
            this.db.prepare('DELETE FROM food_items').run();

            // Insert food database
            if (mealsData.foodDatabase) {
                const foodStmt = this.db.prepare('INSERT INTO food_items (name, unit, kcal) VALUES (?, ?, ?)');
                mealsData.foodDatabase.forEach(food => {
                    foodStmt.run(food.name, food.unit, food.kcal);
                });
            }

            // Insert meals
            if (mealsData.meals) {
                const mealStmt = this.db.prepare('INSERT INTO meals (date, total_kcal) VALUES (?, ?)');
                const mealItemStmt = this.db.prepare(`
                    INSERT INTO meal_items 
                    (meal_id, food_item_name, food_item_unit, food_item_kcal, meal_category) 
                    VALUES (?, ?, ?, ?, ?)
                `);

                mealsData.meals.forEach(meal => {
                    const mealResult = mealStmt.run(meal.date, meal.totalKcal);
                    const mealId = mealResult.lastInsertRowid;

                    // Insert meal items for each category
                    const categories = ['breakfast', 'morning_snack', 'lunch', 'afternoon_snack', 'dinner', 'evening_snack'];
                    categories.forEach(category => {
                        if (meal[category] && Array.isArray(meal[category])) {
                            meal[category].forEach(item => {
                                mealItemStmt.run(mealId, item.name, item.unit, item.kcal, category);
                            });
                        }
                    });
                });
            }
        });

        transaction();
    }

    // Get meals data in original JSON format (for compatibility with existing API)
    getMealsData() {
        const foodDatabase = this.getAllFoodItems().map(item => ({
            name: item.name,
            unit: item.unit,
            kcal: item.kcal
        }));

        const meals = this.getAllMeals().map(meal => ({
            date: meal.date,
            totalKcal: meal.total_kcal,
            breakfast: meal.breakfast,
            morning_snack: meal.morning_snack,
            lunch: meal.lunch,
            afternoon_snack: meal.afternoon_snack,
            dinner: meal.dinner,
            evening_snack: meal.evening_snack
        }));

        return {
            meals,
            foodDatabase
        };
    }
}

module.exports = new MealsDAL();