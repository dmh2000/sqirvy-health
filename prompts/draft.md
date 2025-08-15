You are an experienced software architect and designer. You are working on a new project. You are to create a draft of a software design document that will guide the development of a software system.

## Project

the project is called sqirvy-calories
The project will ahve a front end using html, css and javascript
The project will have a backend that will store the data in a json file
The project will be a node.js application using the vite framework with the --template vanilla-ts option

## FUNCTIONALITY

- track their daily calories intake
  - a graph of calories for last 14 days
- track their daily weight
  - a graph of weight
    - one line for last 14 days of weight
    - one line for the current goal weight

The application will have 3 pages:

### home page

- the home page will be a dashboard that shows:
  - the current data
  - a graph of their daily calories intake for the lats 14 days
  - a graph of their daily weight for the lats 14 days

### meals page

- on startup the meals page will lost the meals data from the backend
- the meals page will display a 'card' for each the following meals:
  - breakfast
  - morning snack
  - lunch
  - snack
  - dinner
  - snack
- each card will show a list of the food items that have been entered for that meal today
- each card will have a button that pops up a form that allows the user to enter a new food item
  - a food item consists of a name, a unit and a calories (kcal) field
  - as a user enters a food item, the app will search the json data file from the backend for a list of known food items and show a list of food items that are similar to the user's input.
  - the user can either select a food item from the list or enter a new food item
  - the form will have a submit button that sends the new food item to the backend and updates the current meal display

### weight page

- the weight page will have a form that allows the user to enter their weight in pounds with one decimal place
- there will be a submit button that sends the weight to the backend

- backend

### Server

- server
  - serves the application html, css and js files

### Meals backend handler

- meals
  - the meals backend will store the data in a backend json file
  - when a meal item is submitted on the meals page the backend will update the json file and write it
  - the backend will have REST methods to:
    - POST a copy of the entire 'meals' json file and store it
    - GET read the json file and return a copy of it

```json
    "meals": [
    "meal": {

        "date": "2020-01-01", // todays date
        "kcal": 0, // total calories
        "breakfast"[
            "item": {
                "name": "bacon breakfast roller",
                "unit": "serving",
                "kcal": 340
            }
        ],
        "morning_snack": [
            "item": {
                "name": "pretzl",
                "unit": "serving",
                "kcal": 100
            }
        ],
        "lunch": [
            "item": {
                "name": "bacon breakfast roller",
                "unit": "serving",
                "kcal": 340
            }
        ],
        "afternoon_snack": [
            "item": {
                "name": "bacon breakfast roller",
                "unit": "serving",
                "kcal": 340
            }
        ],
        "dinner": [
            "item": {
                "name": "bacon breakfast roller",
                "unit": "serving",
                "kcal": 340
            }
        ],
        "evening_snack": [
            "item": {
                "name": "bacon breakfast roller",
                "unit": "serving",
                "kcal": 340
            }
        ],
    }
    ]

```

### weight backend handler

    - the weight backend will store the data in a backend json file
    - when a weight item is submitted on the weight page the backend will update the json file and write it
    - the backend will have REST methods to:
      - POST a copy of the entire 'weight' json file and store it
      - GET read the json file and return a copy of it

    ```json
        "weight": {
            "goal": 100, // goal weight in pounds
            "daily": [
                "date": "2020-01-01", // todays date
                "weight": 100, // weight in pounds
            ]
        }
    ```

======================================================================================
i want to convert the sqirvy-health data store from the json database to sqlite database.
First, create a plan for the conversion. put the plan in file "db/plan.md"

you can use the sqlite mcp server to create the database

- steps:
  - create a sqlite database in db/sqirvy-health.db
  - create a table for meals
  - create a table for weight
  - create a table for food items
  - modify the server code to use the new database
  - create simple tests that the tables are created and data is stored correctly. put the tests in folder db/tests

do not implement the changes yet. just create the plan.
