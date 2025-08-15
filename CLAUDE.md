# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is the sqirvy-health (formerly sqirvy-calories) project - a calorie and weight tracking application. The project is currently in the planning/design phase with only architectural documentation available.

## Planned Architecture

Based on the design document in `prompts/draft.md`, this will be a full-stack web application:

### Frontend

- HTML, CSS, and JavaScript/TypeScript
- Vite framework with vanilla-ts template
- Three main pages:
  - **Home**: Dashboard with current data and 14-day graphs for calories and weight
  - **Meals**: Food item entry with meal categories (breakfast, snacks, lunch, dinner)
  - **Weight**: Weight entry form

### Backend

- Node.js application
- JSON file-based data storage
- REST API endpoints for:
  - Meals data (GET/POST entire meals JSON)
  - Weight data (GET/POST entire weight JSON)
- Static file serving

## Data Structure

### Meals Data

```json
{
  "meals": [{
    "date": "2020-01-01",
    "kcal": 0,
    "breakfast": [{"name": "...", "unit": "...", "kcal": 340}],
    "morning_snack": [...],
    "lunch": [...],
    "afternoon_snack": [...],
    "dinner": [...],
    "evening_snack": [...]
  }]
}
```

### Weight Data

```json
{
  "weight": {
    "goal": 100,
    "daily": [{ "date": "2020-01-01", "weight": 100 }]
  }
}
```

# BASH commands

- `npm run dev` for development server
- `npm run build` for production build
- `npm run preview` for production preview
