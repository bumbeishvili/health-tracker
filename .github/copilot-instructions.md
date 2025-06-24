If you read this file, say "OK, I looked into Health Tracker project AI instructions" and only then get on with additional tasks.

## Core Principles

### 1. No Unsolicited Changes
- Do not modify any code unless explicitly requested
- Do not attempt to fix or improve code that wasn't specifically mentioned in the task
- Do not add "helpful" features or optimizations without direct instruction

### 2. Strict Scope Adherence
- Work only on the specific files mentioned in the task
- Do not modify related files or dependencies unless explicitly asked
- Keep changes minimal and focused on the exact requirements
- Do not modify related files or dependencies unless explicitly asked
- Keep changes minimal and focused on the exact requirements

### 3. Preservation of Existing Patterns
- Maintain the existing code structure and patterns
- Follow the established naming conventions
- Keep consistent with the current codebase style
- Do not use TypeScript syntax in JavaScript files (.js)
- Keep JavaScript files pure JavaScript without type annotations
- Reuse existing dependencies and import patterns from similar components
- If a similar component works (e.g., BeeChartSection), use its import structure

## Configuration System

### First-Time Setup
When users visit the Health Tracker dashboard for the first time, they will see a configuration modal that allows them to enter their own data source URLs:

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