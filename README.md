# Health Tracker Dashboard

A comprehensive fitness and health tracking dashboard that visualizes your personal data from Google Sheets.

## Features

- **Personal Data Configuration**: Enter your own Google Sheets URLs for customized tracking
- **Comprehensive Metrics**: Weight, body composition, nutrition, exercise, and calorie balance tracking
- **Interactive Charts**: Weight trends, macronutrient breakdown, exercise calories, and deficit analysis
- **Progress Tracking**: Visual progress indicators and goal achievement metrics
- **Responsive Design**: Works seamlessly on desktop and mobile devices
- **No Backend Required**: Pure client-side application using static HTML/CSS/JavaScript

## Getting Started

1. **First Visit**: The app will show a configuration modal where you can enter your data source URLs
2. **Use Demo Data**: Click "📊 Use Demo Data" to try the dashboard with sample data
3. **Configure Your Data**: Enter your Google Sheets CSV export URL to use your own fitness data
4. **Start Tracking**: The dashboard will load and display your personalized fitness metrics

## Configuration

### First-Time Setup
When you visit the Health Tracker dashboard for the first time, you will see a configuration modal that allows you to enter your own data source URLs:

1. **Data Sheet URL** (Required): Google Sheets CSV export URL containing daily fitness data
2. **Fitness Plan URL** (Optional): Markdown file URL with personalized fitness plans
3. **Exercise Sheet URL** (Optional): Google Sheets URL with workout routines

### Using Your Own Data
To use the dashboard with your own data:

1. Create a Google Sheet with your fitness data following the expected column structure
2. Publish the sheet as CSV (File → Share → Publish to web → CSV format)
3. Copy the published CSV URL
4. Enter the URL in the configuration modal when prompted
5. Optionally add URLs for your fitness plan (markdown file) and exercise sheet

### Configuration Management
- **Persistent Storage**: Configuration is automatically saved in browser localStorage
- **Reconfiguration**: Click the ⚙️ Configure button in the dashboard to update URLs
- **Demo Data**: Use the "📊 Use Demo Data" button to try the dashboard with sample data
- **Dynamic Links**: Data source buttons (📊 Data, 📝 Plan, 📥 CSV) automatically point to your configured URLs

### Development Testing
For developers testing the configuration system:
- Use `fitnessDebug.clearConfig()` in browser console to reset configuration
- Use `fitnessDebug.getConfig()` to view current configuration
- Use `fitnessDebug.showConfig()` to open configuration modal

### Static Server Compatibility
The configuration system works seamlessly with static HTML servers - no backend required. All configuration is handled client-side using localStorage.

## Data Format

Your Google Sheets should include columns for:
- Date, weight, calories, protein, fats, carbs
- Steps, sleep, water intake, exercise calories
- Body composition metrics (muscle mass, body fat %, etc.)
- Metabolic data (BMR, total calories burned, deficit)

See the demo data for the expected column structure and naming conventions.