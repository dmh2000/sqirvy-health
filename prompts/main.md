# Sqirvy Health - Comprehensive Development Prompt

You are an experienced full-stack developer tasked with creating a calorie and weight tracking web application called **Sqirvy Health**.

## Project Overview

Build a modern web application that helps users track their daily calorie intake and weight progress with visual analytics and an intuitive interface.

## Technology Stack

- **Frontend**: HTML, CSS, JavaScript/TypeScript
- **Build Tool**: Vite with `--template vanilla-ts`
- **Backend**: Node.js with Express
- **Data Storage**: JSON files
- **Charts**: Chart.js library
- **Architecture**: Single Page Application (SPA)

## Core Features

### 1. Dashboard (Home Page)
- Display current day's total calories consumed
- Display current weight
- Show 14-day calorie intake chart using Chart.js
- Show 14-day weight progress chart with two lines:
  - Actual daily weight (blue line)
  - Goal weight (red horizontal line)
- Quick summary cards with today's statistics

### 2. Meals Page
- Display 6 meal category cards for the current day:
  - Breakfast
  - Morning Snack
  - Lunch
  - Afternoon Snack
  - Dinner
  - Evening Snack
- Each card shows:
  - Meal name and total calories for that meal
  - List of food items added to that meal
  - "Add Food Item" button
- **Food Item Management**:
  - Add new food items with name, unit, and calories
  - Real-time search/autocomplete from existing food database
  - Edit existing food items (current day only)
  - Delete food items (current day only)
- Food item form includes:
  - Name (text input with autocomplete)
  - Unit (dropdown: serving, cup, tablespoon, ounce, gram, etc.)
  - Calories (number input)

### 3. Weight Page
- Simple form to enter current weight (pounds, one decimal place)
- Display current goal weight
- Form to modify goal weight
- Submit button to save weight entry
- Show recent weight entries (last 7 days) in a simple list

## Data Structure

### Meals Data (`data/meals.json`)
```json
{
  "meals": [
    {
      "date": "2025-01-15",
      "totalKcal": 1850,
      "breakfast": [
        {
          "id": "uuid",
          "name": "Oatmeal with berries",
          "unit": "serving",
          "kcal": 250
        }
      ],
      "morning_snack": [
        {
          "id": "uuid", 
          "name": "Apple",
          "unit": "medium",
          "kcal": 95
        }
      ],
      "lunch": [],
      "afternoon_snack": [],
      "dinner": [],
      "evening_snack": []
    }
  ],
  "foodDatabase": [
    {
      "name": "Oatmeal with berries",
      "unit": "serving", 
      "kcal": 250
    }
  ]
}
```

### Weight Data (`data/weight.json`)
```json
{
  "weight": {
    "goal": 150.0,
    "daily": [
      {
        "date": "2025-01-15",
        "weight": 165.5
      }
    ]
  }
}
```

## API Endpoints

### Meals API
- `GET /api/meals` - Get all meals data
- `GET /api/meals/:date` - Get meals for specific date
- `POST /api/meals/:date/food` - Add food item to specific meal and date
- `PUT /api/meals/:date/food/:id` - Update food item (current date only)
- `DELETE /api/meals/:date/food/:id` - Delete food item (current date only)
- `GET /api/food/search?q=query` - Search food database for autocomplete

### Weight API
- `GET /api/weight` - Get all weight data
- `POST /api/weight` - Add new weight entry
- `PUT /api/weight/goal` - Update goal weight

## User Experience Requirements

### Navigation
- Clean, responsive navigation bar with three main sections
- Active page highlighting
- Mobile-friendly hamburger menu

### Food Entry Flow
1. User clicks "Add Food Item" on a meal card
2. Modal/popup opens with form
3. As user types in name field, show autocomplete suggestions
4. User can select from suggestions or continue typing new item
5. User enters unit and calories
6. Form validates and submits
7. Meal card updates immediately
8. New item added to food database if novel

### Data Validation
- Calories must be positive numbers
- Weight must be positive number with max 1 decimal place
- Dates must be valid ISO format
- Food names must be non-empty strings
- Units must be from predefined list

### Error Handling
- Display user-friendly error messages
- Graceful handling of missing data files
- Network error recovery
- Form validation feedback

## Technical Implementation Notes

### Frontend Structure
```
src/
├── main.ts (entry point)
├── router.ts (SPA routing)
├── components/
│   ├── Dashboard.ts
│   ├── MealsPage.ts
│   ├── WeightPage.ts
│   ├── FoodItemForm.ts
│   └── Chart.ts
├── services/
│   ├── api.ts
│   └── storage.ts
├── types/
│   └── index.ts
└── styles/
    └── main.css
```

### Backend Structure
```
server/
├── server.js (Express setup)
├── routes/
│   ├── meals.js
│   └── weight.js
├── middleware/
│   └── validation.js
└── data/
    ├── meals.json
    └── weight.json
```

### State Management
- Use vanilla JavaScript/TypeScript with custom state management
- Implement reactive updates when data changes
- Cache API responses for better performance

## Development Priorities

1. **Phase 1**: Basic structure, routing, and static layouts
2. **Phase 2**: API endpoints and data storage
3. **Phase 3**: Meals page with CRUD operations
4. **Phase 4**: Weight tracking functionality
5. **Phase 5**: Dashboard with Chart.js integration
6. **Phase 6**: Polish, responsive design, and error handling

## Success Criteria

- Users can track daily meals and calories effortlessly
- Visual progress tracking motivates continued use
- Data persists between sessions
- Application works on mobile and desktop
- Intuitive food search and entry experience
- Fast, responsive interface

Begin development with setting up the Vite project structure and basic routing system.