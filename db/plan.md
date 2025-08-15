# SQLite Database Conversion Plan

## Overview
Convert the sqirvy-health application from JSON file-based data storage to SQLite database.

## Current Data Structure Analysis

### Meals Data (`server/data/meals.json`)
- Contains `meals` array with daily meal entries
- Each meal entry has: date, totalKcal, and meal categories (breakfast, morning_snack, lunch, afternoon_snack, dinner, evening_snack)
- Each food item has: id, name, unit, kcal
- Contains `foodDatabase` array with available food items

### Weight Data (`server/data/weight.json`)
- Contains `weight` object with goal and daily entries
- Daily entries have: date, weight

## Conversion Steps

### 1. Create SQLite Database
- **File**: `db/sqirvy-health.db`
- Use SQLite MCP server to create and manage the database

### 2. Create Database Tables

#### 2.1 Food Items Table
```sql
CREATE TABLE food_items (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL UNIQUE,
    unit TEXT NOT NULL,
    kcal INTEGER NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

#### 2.2 Meals Table
```sql
CREATE TABLE meals (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    date DATE NOT NULL UNIQUE,
    total_kcal INTEGER DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

#### 2.3 Meal Items Table (Junction table for meals and food items)
```sql
CREATE TABLE meal_items (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    meal_id INTEGER NOT NULL,
    food_item_id INTEGER NOT NULL,
    food_item_name TEXT NOT NULL,
    food_item_unit TEXT NOT NULL,
    food_item_kcal INTEGER NOT NULL,
    meal_category TEXT NOT NULL CHECK(meal_category IN ('breakfast', 'morning_snack', 'lunch', 'afternoon_snack', 'dinner', 'evening_snack')),
    quantity INTEGER DEFAULT 1,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (meal_id) REFERENCES meals(id) ON DELETE CASCADE
);
```

#### 2.4 Weight Table
```sql
CREATE TABLE weight_entries (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    date DATE NOT NULL UNIQUE,
    weight REAL NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

#### 2.5 Weight Goals Table
```sql
CREATE TABLE weight_goals (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    goal_weight REAL NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    is_active BOOLEAN DEFAULT TRUE
);
```

### 3. Data Migration
- Migrate existing food database to `food_items` table
- Migrate existing meals data to `meals` and `meal_items` tables
- Migrate existing weight data to `weight_entries` table
- Set current weight goal in `weight_goals` table

### 4. Server Code Modifications

#### 4.1 Database Connection Module
- **File**: `server/database/connection.js`
- Create SQLite connection and database utility functions
- Add query helpers for CRUD operations

#### 4.2 Data Access Layer (DAL)
- **File**: `server/database/meals-dal.js` - Meals and food items operations
- **File**: `server/database/weight-dal.js` - Weight operations
- Replace JSON file operations with SQLite queries

#### 4.3 API Route Updates
- **File**: `server/routes/meals.cjs` - Update to use SQLite DAL
- **File**: `server/routes/weight.cjs` - Update to use SQLite DAL
- Maintain existing API contract for frontend compatibility

### 5. Testing

#### 5.1 Database Tests
- **Directory**: `db/tests/`
- **File**: `db/tests/database.test.js` - Database connection and basic operations
- **File**: `db/tests/meals.test.js` - Meals table operations
- **File**: `db/tests/weight.test.js` - Weight table operations
- **File**: `db/tests/food-items.test.js` - Food items table operations

#### 5.2 Test Coverage
- Table creation verification
- Data insertion and retrieval
- Data validation and constraints
- Foreign key relationships
- Migration data integrity

### 6. Migration Script
- **File**: `db/migrate.js`
- Script to perform one-time migration from JSON to SQLite
- Backup existing JSON files
- Validate migration success

## Dependencies
- SQLite MCP server (already available)
- No additional npm packages required initially

## Rollback Plan
- Keep original JSON files as backup
- Create restore script if needed
- Ensure API compatibility during transition

## Implementation Order
1. Create database and tables
2. Create database utility modules
3. Create data access layer
4. Update API routes
5. Create migration script
6. Create tests
7. Perform migration
8. Validate functionality