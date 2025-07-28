'use strict';

// Configuration Management
const CONFIG_STORAGE_KEY = 'fitness_dashboard_config';
const DEFAULT_CONFIG = {
    dataSheetUrl: '',
    planMdUrl: '',
    exerciseSheetUrl: ''
};

// Get current configuration from localStorage or use defaults
function getConfig() {
    try {
        const stored = localStorage.getItem(CONFIG_STORAGE_KEY);
        if (stored) {
            const config = JSON.parse(stored);
            // Ensure all required fields exist
            return {
                dataSheetUrl: config.dataSheetUrl || DEFAULT_CONFIG.dataSheetUrl,
                planMdUrl: config.planMdUrl || DEFAULT_CONFIG.planMdUrl,
                exerciseSheetUrl: config.exerciseSheetUrl || DEFAULT_CONFIG.exerciseSheetUrl
            };
        }
    } catch (error) {
        console.error('Error reading config from localStorage:', error);
    }
    return null; // No config found
}

// Save configuration to localStorage
function saveConfig(config) {
    try {
        localStorage.setItem(CONFIG_STORAGE_KEY, JSON.stringify(config));
        return true;
    } catch (error) {
        console.error('Error saving config to localStorage:', error);
        return false;
    }
}

// Check if configuration exists
function hasConfig() {
    return getConfig() !== null;
}

// Dynamic URLs based on configuration
function getDataSheetUrl() {
    const config = getConfig();
    return config ? config.dataSheetUrl : DEFAULT_CONFIG.dataSheetUrl;
}

function getPlanMdUrl() {
    const config = getConfig();
    return config ? config.planMdUrl : DEFAULT_CONFIG.planMdUrl;
}

function getExerciseSheetUrl() {
    const config = getConfig();
    return config ? config.exerciseSheetUrl : DEFAULT_CONFIG.exerciseSheetUrl;
}

// Global Variables
let currentData = [];
let selectedTimeRange = '7';
const PROTEIN_TARGET_GRAMS = 170;
const STEPS_TARGET = 8000;

// Add these constants at the top with other constants
const BASE_METRIC_RANGES = {
    // Body Metrics - no progress, just status
    weight: { min: 65, max: 85, unit: 'kg', showProgress: false },
    muscle: { minPercent: 0.60, maxPercent: 0.65, unit: 'kg', showProgress: false },
    boneMass: { minPercent: 0.03, maxPercent: 0.04, unit: 'kg', showProgress: false },
    visceralFat: { min: 1, max: 12, unit: '', showProgress: false },
    
    // Body Composition - no progress, just status
    proteinPercentage: { min: 16, max: 20, unit: '%', showProgress: false },
    waterPercentage: { min: 50, max: 65, unit: '%', showProgress: false },
    bodyFat: { min: 8, max: 20, unit: '%', showProgress: false },
    basalMetabolism: { min: 1800, max: 2200, unit: 'cal', showProgress: false },
    
    // Daily targets - show progress without status
    calories: { min: 1500, max: 2500, unit: 'cal', showProgress: true, progressOnly: true },
    protein: { min: 140, max: 180, unit: 'g', showProgress: true, progressOnly: true },
    fats: { min: 40, max: 80, unit: 'g', showProgress: true, progressOnly: true },
    carbs: { min: 150, max: 250, unit: 'g', showProgress: true, progressOnly: true },
    steps: { min: 6000, max: 10000, unit: '', showProgress: true, progressOnly: true },
    sleep: { min: 7, max: 9, unit: 'h', showProgress: true },
    waterIntake: { min: 2, max: 3, unit: 'L', showProgress: true, progressOnly: true },
    
    // Calorie Balance - show progress without status
    bmr: { min: 1500, max: 2500, unit: 'cal', showProgress: true, progressOnly: true },
    totalBurn: { min: 2000, max: 3000, unit: 'cal', showProgress: true, progressOnly: true },
    deficit: { min: 300, max: 500, unit: 'cal', showProgress: true, progressOnly: true }
};

function calculateMetricRanges(weight) {
    const ranges = { ...BASE_METRIC_RANGES };
    
    // Calculate weight-dependent ranges
    if (weight) {
        // Muscle mass range based on weight
        ranges.muscle = {
            min: weight * BASE_METRIC_RANGES.muscle.minPercent,
            max: weight * BASE_METRIC_RANGES.muscle.maxPercent,
            unit: 'kg',
            showProgress: false
        };
        
        // Bone mass range based on weight
        ranges.boneMass = {
            min: weight * BASE_METRIC_RANGES.boneMass.minPercent,
            max: weight * BASE_METRIC_RANGES.boneMass.maxPercent,
            unit: 'kg',
            showProgress: false
        };
        
        // BMR and calorie ranges based on weight (rough estimation)
        const baseBMR = weight * 22; // Updated BMR calculation
        ranges.basalMetabolism = {
            min: baseBMR * 0.9,
            max: baseBMR * 1.1,
            unit: 'cal',
            showProgress: false
        };
        
        // Total burn based on BMR
        ranges.totalBurn = {
            min: baseBMR * 1.3, // Sedentary
            max: baseBMR * 1.6, // Moderate activity
            unit: 'cal',
            showProgress: true,
            progressOnly: true
        };
        
        // Calories based on goal (assuming weight loss)
        ranges.calories = {
            min: ranges.totalBurn.min - 500, // 500 cal deficit
            max: ranges.totalBurn.max - 300, // 300 cal deficit
            unit: 'cal',
            showProgress: true,
            progressOnly: true
        };
    }
    
    return ranges;
}

// Data Processing Functions
function processData(rawData) {
    return rawData
        .filter(d => d.date && d['actual weight'] && d['actual weight'].trim() !== '')
        .map(d => ({
            date: parseDate(d.date),
            weight: parseFloat(d['actual weight']) || null,
            calories: parseInt(d['total food callories']) || 0,
            protein: parseFloat(d['total food proteins']) || 0,
            fat: parseFloat(d['total food fats']) || 0,
            carbs: parseFloat(d['total food carbs']) || 0,
            steps: parseInt(d.steps) || 0,
            sleep: parseFloat(d.sleep) || 0,
            waterIntake: parseFloat(d['water in liters']) || 0,
            exerciseCalories: parseInt(d['total exercise calories burn']) || 0,
            stepsCalories: parseInt(d['total steps calories burn']) || 0,
            boneMass: parseFloat(d['Bone Mass(kg)']) || null,
            muscle: parseFloat(d['Muscle (kg)']) || null,
            visceralFat: parseInt(d['Visceral fat']) || null,
            basalMetabolism: parseInt(d['Basal Metabolism (kcal)']) || null,
            proteinPercentage: parseFloat(d['Protein(%)']) || null,
            waterPercentage: parseFloat(d['Water (%)']) || null,
            bodyFat: parseFloat(d['Body fat (%)']) || null,
            bmr: parseInt(d['bmr (metabolic rate calories)']) || null,
            totalCaloriesBurn: parseInt(d['total calories burn']) || 0,
            deficit: parseInt(d['calorie deficit']) || null,
            deficitWeightByCalories: parseFloat(d['deficit-weight-by-callories']) || 0
        }))
        .filter(d => d.weight !== null && d.date !== null)
        .sort((a, b) => a.date - b.date);
}

function parseDate(dateStr) {
    if (!dateStr) return null;
    const parts = dateStr.trim().split('/');
    if (parts.length !== 3) return null;
    
    const month = parseInt(parts[0], 10) - 1;
    const day = parseInt(parts[1], 10);
    const year = parseInt(parts[2], 10);
    
    const date = new Date(year, month, day);
    if (isNaN(date.getTime()) || date.getFullYear() !== year || date.getMonth() !== month || date.getDate() !== day) {
        return null;
    }
    return date;
}

// UI State Management Functions
function showLoading() {
    document.getElementById('loadingMessage').style.display = 'block';
    document.getElementById('errorMessage').style.display = 'none';
    document.getElementById('dashboardContent').style.display = 'none';
    document.getElementById('noDataMessage').style.display = 'none';
}

function showError(message) {
    document.getElementById('loadingMessage').style.display = 'none';
    document.getElementById('errorMessage').style.display = 'block';
    document.getElementById('errorDetails').textContent = message;
    document.getElementById('dashboardContent').style.display = 'none';
    document.getElementById('noDataMessage').style.display = 'none';
}

function showDashboard() {
    document.getElementById('loadingMessage').style.display = 'none';
    document.getElementById('errorMessage').style.display = 'none';
    document.getElementById('dashboardContent').style.display = 'block';
    document.getElementById('noDataMessage').style.display = 'none';
}

function showNoDataMessage(message = 'No data available for the selected time range.') {
    const noDataEl = document.getElementById('noDataMessage');
    noDataEl.textContent = message;
    noDataEl.style.display = 'block';
    document.getElementById('dashboardContent').style.display = 'none';
    document.getElementById('loadingMessage').style.display = 'none';
    document.getElementById('errorMessage').style.display = 'none';
}

function hideNoDataMessage() {
    document.getElementById('noDataMessage').style.display = 'none';
}

function getFilteredData() {
    if (selectedTimeRange === 'all') return currentData;
    
    const days = parseInt(selectedTimeRange);
    if (isNaN(days) || currentData.length === 0) return currentData;

    const lastDateInCurrentData = currentData[currentData.length - 1].date;
    const cutoffDate = new Date(lastDateInCurrentData);
    cutoffDate.setDate(lastDateInCurrentData.getDate() - (days -1) );
    cutoffDate.setHours(0,0,0,0);

    return currentData.filter(d => d.date >= cutoffDate);
}

// Progress Chart Creation
function createProgressChart(containerId, percentage, color) {
    const container = document.getElementById(containerId);
    if (!container) {
        console.error(`Progress chart container ${containerId} not found!`);
        return;
    }
    if (typeof d3 === 'undefined') {
        console.error('D3 is not loaded! Cannot create progress chart.');
        container.innerHTML = '<p class="no-data-message" style="font-size:0.8rem;">Chart library error (D3)</p>';
        return;
    }
    
    d3.select(`#${containerId}`).selectAll("*").remove();
    
    const width = 120;
    const height = 120;
    const radius = Math.min(width, height) / 2 - 10;
    const thickness = 8;

    const svg = d3.select(`#${containerId}`)
        .append("svg")
        .attr("width", width)
        .attr("height", height)
        .append("g")
        .attr("transform", `translate(${width/2},${height/2})`);

    // Create background circle
    svg.append("circle")
        .attr("class", "progress-circle-background")
        .attr("r", radius)
        .attr("fill", "none")
        .attr("stroke", "var(--progress-bg-color)")
        .attr("stroke-width", thickness);

    // Create progress arc
    if (percentage > 0) {
        const tau = 2 * Math.PI;
        const arc = d3.arc()
            .innerRadius(radius - thickness/2)
            .outerRadius(radius + thickness/2)
            .startAngle(0)
            .endAngle(percentage / 100 * tau);

        svg.append("path")
            .attr("class", "progress-circle-path")
            .attr("d", arc)
            .attr("fill", color);
    }
}

// Data Loading and Chart Updates
async function loadData() {
    showLoading();
    hideNoDataMessage();
    
    if (typeof d3 === 'undefined') {
        console.error('D3 library not loaded. Cannot fetch data.');
        showError('Core library (D3) failed to load. Please refresh.');
        return;
    }

    try {
        const dataUrl = getDataSheetUrl();
        const response = await fetch(dataUrl);
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}, URL: ${dataUrl}`);
        }
        const csvString = await response.text();
        const rawData = d3.csvParse(csvString);
        
        currentData = processData(rawData);

        console.log('data',{rawData,processData})
        
        if (currentData.length === 0) {
            showError('No valid data found in the spreadsheet after processing.');
            return;
        }
        
        showDashboard();
        updateDashboard();
        
    } catch (error) {
        console.error('Error loading or processing data:', error);
        showError(`Failed to load data: ${error.message}`);
    }
}

function setupTimeRangeButtons() {
    const buttons = document.querySelectorAll('.time-range-btn');
    buttons.forEach(button => {
        button.addEventListener('click', (e) => {
            buttons.forEach(btn => {
                btn.classList.remove('active');
                btn.setAttribute('aria-pressed', 'false');
            });
            e.target.classList.add('active');
            e.target.setAttribute('aria-pressed', 'true');
            selectedTimeRange = e.target.dataset.range;
            updateDashboard();
        });
    });
}

function updateDashboard() {
    if (typeof Highcharts === 'undefined') {
        console.error('Highcharts not available when trying to update dashboard.');
        showError('Charting library (Highcharts) not ready. Please refresh.');
        return;
    }

    const filteredData = getFilteredData();
    
    if (filteredData.length === 0) {
        showNoDataMessage();
        resetDailyTracking();
        updateChartControlsVisibility(filteredData);
        return;
    }
    
    showDashboard();
    updateChartControlsVisibility(filteredData);
    updateDailyTracking(filteredData[filteredData.length - 1]);
    updateMetrics(filteredData);
    createCharts(filteredData);
}

function resetDailyTracking() {
    const elements = [
        'todayWeight', 'todayMuscle', 'todayBoneMass', 'todayVisceralFat',
        'todayProteinPercentage', 'todayWaterPercentage', 'todayBodyFat',
        'todayCalories', 'todayProtein', 'todayFats', 'todayCarbs',
        'todaySteps', 'todaySleep', 'todayWaterIntake',
        'todayBMR', 'todayTotalBurn', 'todayDeficit'
    ];
    elements.forEach(id => document.getElementById(id).textContent = '--');
    document.getElementById('currentDate').textContent = '';
}

function updateMetricProgress(value, range, elementId) {
    if (!value || isNaN(value)) return;

    const statusEl = document.getElementById(elementId + 'Status');
    const progressEl = document.getElementById(elementId + 'Progress');
    
    if (!statusEl || !progressEl) return;

    let percentage, status;
    
    // Check if value is within range
    const isWithinRange = value >= range.min && value <= range.max;
    
    if (range.showProgress) {
        if (range.progressOnly) {
            // For nutrition, activity, and calorie balance - just show progress without status colors
            status = 'neutral';
            percentage = ((value - range.min) / (range.max - range.min)) * 100;
        } else {
            // Normal metric handling with progress bar and status
            if (value < range.min) {
                status = 'danger';
                percentage = ((value - 0) / (range.min - 0)) * 50;
            } else if (value > range.max) {
                status = 'danger';
                percentage = 100 - (((value - range.max) / range.max) * 50);
            } else {
                status = 'good';
                percentage = ((value - range.min) / (range.max - range.min)) * 100;
                
                // Warning zone is within 10% of min or max
                const warningThreshold = (range.max - range.min) * 0.1;
                if (value - range.min < warningThreshold || range.max - value < warningThreshold) {
                    status = 'warning';
                }
            }
        }
    } else {
        // Simple good/bad status without progress
        status = isWithinRange ? 'good' : 'danger';
        percentage = isWithinRange ? 100 : 0;
    }

    // Ensure percentage is within bounds
    percentage = Math.max(0, Math.min(100, percentage));

    // Update elements
    if (!range.progressOnly) {
        statusEl.className = `tracking-status ${status}`;
    } else {
        // Hide status indicator for progress-only metrics
        statusEl.className = 'tracking-status hidden';
    }
    
    if (range.showProgress) {
        progressEl.className = `tracking-progress-bar ${status}`;
        progressEl.style.width = `${percentage}%`;
    } else {
        // Hide progress bar for non-progress metrics
        progressEl.style.width = '0';
        progressEl.className = 'tracking-progress-bar';
    }
}

function updateDailyTracking(latestData) {
    if (!latestData) return;

    // Calculate ranges based on current weight
    const ranges = calculateMetricRanges(latestData.weight);

    // Update current date
    document.getElementById('currentDate').textContent = latestData.date.toLocaleDateString('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });

    // Update metrics with progress
    const metrics = {
        weight: latestData.weight,
        muscle: latestData.muscle,
        boneMass: latestData.boneMass,
        visceralFat: latestData.visceralFat,
        proteinPercentage: latestData.proteinPercentage,
        waterPercentage: latestData.waterPercentage,
        bodyFat: latestData.bodyFat,
        basalMetabolism: latestData.basalMetabolism,
        calories: latestData.calories,
        protein: latestData.protein,
        fats: latestData.fat,
        carbs: latestData.carbs,
        steps: latestData.steps,
        sleep: latestData.sleep,
        waterIntake: latestData.waterIntake,
        bmr: latestData.bmr,
        totalBurn: latestData.totalCaloriesBurn,
        deficit: latestData.deficit
    };

    // Update each metric
    Object.entries(metrics).forEach(([key, value]) => {
        const element = document.getElementById(`today${key.charAt(0).toUpperCase() + key.slice(1)}`);
        if (element) {
            if (value !== null && value !== undefined) {
                const range = ranges[key];
                const formattedValue = range.unit ? `${value.toLocaleString()} ${range.unit}` : value.toLocaleString();
                element.textContent = formattedValue;
                updateMetricProgress(value, range, key);
            } else {
                element.textContent = '--';
            }
        }
    });
}

function updateMetrics(data) {
    if (!data || data.length === 0) { return; }
    const latest = data[data.length - 1];
    const first = data[0];
    const validCalories = data.filter(d => d.calories > 0);
    const validProtein = data.filter(d => d.protein > 0);
    const validSteps = data.filter(d => d.steps > 0);
    const validDeficit = data.filter(d => d.deficit !== null);
    
    const avgCalories = validCalories.length > 0 ? Math.round(validCalories.reduce((sum, d) => sum + d.calories, 0) / validCalories.length) : 0;
    const avgProtein = validProtein.length > 0 ? Math.round(validProtein.reduce((sum, d) => sum + d.protein, 0) / validProtein.length) : 0;
    const avgSteps = validSteps.length > 0 ? Math.round(validSteps.reduce((sum, d) => sum + d.steps, 0) / validSteps.length) : 0;
    const avgDeficit = validDeficit.length > 0 ? Math.round(validDeficit.reduce((sum, d) => sum + d.deficit, 0) / validDeficit.length) : 0;
    
    const weightChange = data.length > 1 ? latest.weight - first.weight : 0;
    const daysInPeriod = data.length > 1 ? (latest.date.getTime() - first.date.getTime()) / (1000 * 60 * 60 * 24) + 1 : 1;
    const weeklyRate = daysInPeriod >= 1 && data.length > 1 ? (weightChange / (daysInPeriod / 7)) : 0;
    
    // Update UI elements
    document.getElementById('currentWeight').textContent = latest.weight.toFixed(1) + ' kg';
    document.getElementById('weeklyRate').textContent = (weeklyRate >= 0 && weeklyRate !== 0 ? '+' : '') + weeklyRate.toFixed(1) + ' kg/week';
    document.getElementById('totalLoss').textContent = (weightChange >= 0 && weightChange !== 0 ? '+' : '') + weightChange.toFixed(1) + ' kg';
    document.getElementById('avgCalories').textContent = avgCalories.toLocaleString();
    document.getElementById('avgProtein').textContent = avgProtein + 'g';
    document.getElementById('avgSteps').textContent = avgSteps.toLocaleString();
    document.getElementById('avgDeficit').textContent = avgDeficit.toLocaleString() + ' cal';
    document.getElementById('proteinTargetDisplay').textContent = PROTEIN_TARGET_GRAMS;
    document.getElementById('stepsTargetDisplay').textContent = STEPS_TARGET.toLocaleString();
    
    const proteinProgress = PROTEIN_TARGET_GRAMS > 0 ? Math.min(Math.max(0, (avgProtein / PROTEIN_TARGET_GRAMS) * 100), 100) : 0;
    const stepsProgress = STEPS_TARGET > 0 ? Math.min(Math.max(0, (avgSteps / STEPS_TARGET) * 100), 100) : 0;
    
    document.getElementById('proteinPercent').textContent = Math.round(proteinProgress) + '%';
    document.getElementById('stepsPercent').textContent = Math.round(stepsProgress) + '%';
    
    createProgressChart('proteinProgressChart', proteinProgress, 'var(--green-500)');
    createProgressChart('stepsProgressChart', stepsProgress, 'var(--purple-500)');
    
    // Setup tooltips after updating metrics
    setupTrackingTooltips();
}

// Chart Creation Functions
function createCharts(data) {
    ['weightChart', 'macroChart', 'weightLossDeficitChart'].forEach(id => {
        const container = document.getElementById(id);
        if (container) {
            const chartIndex = Highcharts.attr(container, 'data-highcharts-chart');
            if (chartIndex && Highcharts.charts[chartIndex]) {
                 Highcharts.charts[chartIndex].destroy();
            }
            container.innerHTML = '';
        }
    });
    createWeightChart(data);
    createMacroChart(data);
    createWeightLossDeficitChart(data);
}

// Calculate moving average for data series
function calculateMovingAverage(data, windowSize) {
    if (data.length < windowSize) return [];
    
    const result = [];
    for (let i = windowSize - 1; i < data.length; i++) {
        const window = data.slice(i - windowSize + 1, i + 1);
        const sum = window.reduce((acc, point) => acc + point[1], 0);
        const average = sum / windowSize;
        result.push([data[i][0], average]); // Keep the same timestamp as the last point in window
    }
    return result;
}

function createWeightChart(data) {
    const weightData = data.map(d => [d.date.getTime(), d.weight]);
    const useMovingAverage = document.getElementById('weightMovingAverage').checked && data.length > 14;
    
    let series = [];
    
    if (useMovingAverage) {
        // Show moving average instead of original data
        const movingAverageData = calculateMovingAverage(weightData, 14); // 2 weeks = 14 days
        series.push({
            name: '2-Week Moving Average',
            data: movingAverageData,
            color: 'var(--red-500)',
            lineWidth: 3,
            marker: { radius: 4, fillColor: 'var(--red-500)' }
        });
    } else {
        // Show original data
        series.push({
            name: 'Weight',
            data: weightData,
            color: 'var(--red-500)',
            lineWidth: 3,
            marker: { radius: 4, fillColor: 'var(--red-500)' }
        });
    }
    
    Highcharts.chart('weightChart', {
        chart: { type: 'line', height: 300 },
        legend: { enabled: false },
        yAxis: { title: { text: 'Weight (kg)' } },
        series: series,
        tooltip: {
            pointFormat: '<span style="color:{series.color}">●</span> {series.name}: <b>{point.y:.1f} kg</b><br/>'
        }
    });
}

function createMacroChart(data) {
    const validData = data.filter(d => (d.protein * 4 + d.fat * 9 + d.carbs * 4) > 0);
    const proteinData = validData.map(d => [d.date.getTime(), d.protein * 4]);
    const fatData = validData.map(d => [d.date.getTime(), d.fat * 9]);
    const carbsData = validData.map(d => [d.date.getTime(), d.carbs * 4]);
    
    const useMovingAverage = document.getElementById('macroMovingAverage').checked && validData.length > 14;
    
    let seriesData = {
        protein: proteinData,
        fat: fatData,
        carbs: carbsData
    };
    
    let avgText = '';
    
    if (useMovingAverage) {
        // Calculate moving averages
        seriesData.protein = calculateMovingAverage(proteinData, 14);
        seriesData.fat = calculateMovingAverage(fatData, 14);
        seriesData.carbs = calculateMovingAverage(carbsData, 14);
        
        // Calculate averages for moving average data
        const avgProtein = seriesData.protein.length > 0 ? Math.round(seriesData.protein.reduce((sum, d) => sum + d[1], 0) / seriesData.protein.length) : 0;
        const avgFat = seriesData.fat.length > 0 ? Math.round(seriesData.fat.reduce((sum, d) => sum + d[1], 0) / seriesData.fat.length) : 0;
        const avgCarbs = seriesData.carbs.length > 0 ? Math.round(seriesData.carbs.reduce((sum, d) => sum + d[1], 0) / seriesData.carbs.length) : 0;
        const avgTotal = avgProtein + avgFat + avgCarbs;
        
        avgText = `2-Week MA Avg: ${avgTotal.toLocaleString()} kcal (P: ${avgProtein}, F: ${avgFat}, C: ${avgCarbs})`;
    } else {
        // Calculate averages for original data
        const avgProtein = proteinData.length > 0 ? Math.round(proteinData.reduce((sum, d) => sum + d[1], 0) / proteinData.length) : 0;
        const avgFat = fatData.length > 0 ? Math.round(fatData.reduce((sum, d) => sum + d[1], 0) / fatData.length) : 0;
        const avgCarbs = carbsData.length > 0 ? Math.round(carbsData.reduce((sum, d) => sum + d[1], 0) / carbsData.length) : 0;
        const avgTotal = avgProtein + avgFat + avgCarbs;
        
        avgText = `Avg: ${avgTotal.toLocaleString()} kcal (P: ${avgProtein}, F: ${avgFat}, C: ${avgCarbs})`;
    }
    
    Highcharts.chart('macroChart', {
        chart: { type: 'area', height: 300 },
        legend: { enabled: false },
        title: {
            text: avgText,
            align: 'left',
            style: { fontSize: '0.9rem', color: 'var(--text-color-lighter)' }
        },
        yAxis: { 
            title: { text: 'cal' },
            labels: {
                formatter: function() {
                    return this.value.toLocaleString();
                }
            }
        },
        plotOptions: {
            area: {
                stacking: 'normal',
                marker: { enabled: false }
            }
        },
        series: [{
            name: useMovingAverage ? 'Protein (2-Week MA)' : 'Protein',
            data: seriesData.protein,
            color: 'var(--green-500)',
            fillOpacity: 0.7
        }, {
            name: useMovingAverage ? 'Fat (2-Week MA)' : 'Fat',
            data: seriesData.fat,
            color: 'var(--red-500)',
            fillOpacity: 0.7
        }, {
            name: useMovingAverage ? 'Carbs (2-Week MA)' : 'Carbs',
            data: seriesData.carbs,
            color: 'var(--yellow-500)',
            fillOpacity: 0.7
        }],
        tooltip: {
            pointFormatter: function() {
                const kcal = this.y;
                let grams = 0;
                if (this.series.name.includes('Protein') || this.series.name.includes('Carbs')) grams = kcal / 4;
                else if (this.series.name.includes('Fat')) grams = kcal / 9;
                return `<span style="color:${this.series.color}">●</span> ${this.series.name}: <b>${kcal.toFixed(0)} kcal</b> (${grams.toFixed(0)}g)<br/>`;
            },
            shared: false
        }
    });
}

function createWeightLossDeficitChart(data) {
    let cumulativeWeightLossFromDeficit = 0;
    const seriesData = data.map(d => {
        cumulativeWeightLossFromDeficit += d.deficitWeightByCalories;
        return {
            x: d.date.getTime(),
            y: cumulativeWeightLossFromDeficit,
            dailyImpact: d.deficitWeightByCalories,
            dailyDeficit: d.deficit
        };
    });
    
    const minProjectedWeightChange = Math.min(0, ...seriesData.map(p => p.y));
    const maxProjectedWeightChange = Math.max(0, ...seriesData.map(p => p.y));
    
    Highcharts.chart('weightLossDeficitChart', {
        chart: { height: 300 },
        legend: { enabled: false },
        xAxis: { labels: { rotation: -30, align: 'right' } },
        yAxis: [{
            title: {
                text: null
            },
            labels: {
                style: { color: 'var(--blue-500)' },
                format: '{value:.1f} kg'
            },
            gridLineWidth: 1,
            min: minProjectedWeightChange,
            max: maxProjectedWeightChange,
            plotLines: seriesData.length > 0 ? [{
                value: seriesData[seriesData.length - 1].y,
                color: 'var(--text-color-lighter)',
                width: 2,
                dashStyle: 'shortdash',
                label: {
                    text: `Total: ${seriesData[seriesData.length - 1].y.toFixed(1)} kg`,
                    align: 'right',
                    y: -5,
                    style: { color: 'var(--text-color-light)'}
                }
            }] : []
        }],
        series: [{
            name: 'Weight Change by Deficit',
            type: 'line',
            data: seriesData,
            color: 'var(--blue-500)',
            step: 'right',
            lineWidth: 3,
            marker: {
                enabled: seriesData.length < 50,
                radius: 4
            }
        }],
        tooltip: {
            shared: false,
            formatter: function() {
                let tooltip = `<b>${Highcharts.dateFormat('%A, %b %e, %Y', this.x)}</b><br/>`;
                tooltip += `<span style="color:${this.series.color}">●</span> Projected Cum. Weight Change: <b>${this.y.toFixed(2)} kg</b><br/>`;
                if (this.point.options) {
                    tooltip += `Daily Impact: <b>${(this.point.options.dailyImpact || 0).toFixed(3)} kg</b><br/>`;
                    tooltip += `Daily Calorie Deficit: <b>${(this.point.options.dailyDeficit || 0).toLocaleString()} cal</b>`;
                }
                return tooltip;
            }
        }
    });
}

function exportData() {
    const filteredData = getFilteredData();
    if (filteredData.length === 0) {
        alert("No data available to export for the selected range.");
        return;
    }
    
    const csvHeader = "Date,Weight (kg),Calories (kcal),Protein (g),Fat (g),Carbs (g),Steps,Exercise Calories (kcal),Deficit (kcal),Deficit Weight Impact (kg)\n";
    const csvRows = filteredData.map(d => [
        d.date.toISOString().split('T')[0],
        d.weight !== null ? d.weight.toFixed(1) : '',
        d.calories || '',
        d.protein || '',
        d.fat || '',
        d.carbs || '',
        d.steps || '',
        d.exerciseCalories || '',
        d.deficit !== null ? d.deficit : '',
        d.deficitWeightByCalories !== null ? d.deficitWeightByCalories.toFixed(3) : ''
    ].join(","));
    
    const csvContent = "data:text/csv;charset=utf-8," + csvHeader + csvRows.join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    const dateStr = new Date().toISOString().split('T')[0];
    link.setAttribute("download", `fitness_data_${selectedTimeRange}_days_as_of_${dateStr}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}

// Tooltip handling
function generateTooltipContent(data, metric) {
    // Get historical data for the metric
    const historicalData = getHistoricalData(metric);
    if (!historicalData || historicalData.length === 0) {
        return '<div class="tracking-tooltip-content">No historical data available</div>';
    }

    // Calculate statistics
    const values = historicalData.map(d => d.value);
    const avg = values.reduce((a, b) => a + b, 0) / values.length;
    const min = Math.min(...values);
    const max = Math.max(...values);
    const unit = getMetricUnit(metric);
    
    // Format values based on metric type
    const formatValue = (value) => {
        if (metric === 'weight' || metric === 'muscle' || metric === 'boneMass') {
            return value.toFixed(1);
        } else if (metric === 'steps' || metric.includes('calories') || metric === 'bmr' || metric === 'totalBurn' || metric === 'deficit') {
            return value.toLocaleString();
        }
        return value.toFixed(1);
    };
    
    return `
        <div class="tracking-tooltip-chart" id="tooltipChart"></div>
        <div class="tracking-tooltip-stats">
            <div class="tracking-tooltip-stat">
                <div class="tracking-tooltip-label">Average</div>
                <div class="tracking-tooltip-value">${formatValue(avg)}${unit}</div>
            </div>
            <div class="tracking-tooltip-stat">
                <div class="tracking-tooltip-label">Minimum</div>
                <div class="tracking-tooltip-value">${formatValue(min)}${unit}</div>
            </div>
            <div class="tracking-tooltip-stat">
                <div class="tracking-tooltip-label">Maximum</div>
                <div class="tracking-tooltip-value">${formatValue(max)}${unit}</div>
            </div>
        </div>
    `;
}

function createTooltipChart(data, metric) {
    const historicalData = getHistoricalData(metric);
    if (!historicalData || historicalData.length === 0) return;

    const chartData = historicalData.map(d => [d.date.getTime(), d.value]);
    const unit = getMetricUnit(metric);
    
    // Determine chart type based on metric
    const barChartMetrics = ['calories', 'protein', 'fats', 'carbs', 'steps', 'sleep', 'waterIntake', 'totalBurn', 'deficit'];
    const chartType = barChartMetrics.includes(metric) ? 'column' : 'line';
    
    // Destroy existing chart if any
    const chartContainer = document.getElementById('tooltipChart');
    const existingChart = Highcharts.charts[Highcharts.attr(chartContainer, 'data-highcharts-chart')];
    if (existingChart) {
        existingChart.destroy();
    }
    
    // Create new chart
    Highcharts.chart('tooltipChart', {
        chart: {
            type: chartType,
            height: 150,
            margin: [10, 35, 30, 45],
            backgroundColor: 'transparent',
            style: {
                fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif"
            }
        },
        title: { text: null },
        credits: { enabled: false },
        xAxis: {
            type: 'datetime',
            labels: {
                style: { fontSize: '9px', color: 'var(--text-color-lighter)' },
                format: '{value:%b %d}'
            },
            tickLength: 3,
            lineWidth: 1,
            lineColor: 'var(--border-color-medium)',
            gridLineWidth: 0,
            title: {
                text: 'Date',
                style: { 
                    fontSize: '10px',
                    color: 'var(--text-color-lighter)'
                },
                margin: 10
            }
        },
        yAxis: {
            title: {
                text: unit ? `Value (${unit})` : 'Value',
                style: { 
                    fontSize: '10px',
                    color: 'var(--text-color-lighter)'
                },
                margin: 10
            },
            gridLineColor: 'var(--border-color-soft)',
            gridLineDashStyle: 'shortdot',
            labels: {
                style: { fontSize: '9px', color: 'var(--text-color-lighter)' },
                x: -5
            },
            lineWidth: 1,
            lineColor: 'var(--border-color-medium)',
            min: (chartType === 'column' && metric !== 'deficit') ? 0 : undefined,
            plotLines: metric === 'deficit' ? [{ value: 0, color: 'var(--border-color-medium)', width: 1 }] : undefined
        },
        legend: { enabled: false },
        tooltip: {
            backgroundColor: 'rgba(255, 255, 255, 0.98)',
            borderColor: 'var(--border-color-medium)',
            borderRadius: 8,
            style: { fontSize: '0.8rem' },
            shadow: true,
            shared: true,
            useHTML: true,
            headerFormat: '<span style="font-size: 0.8rem">{point.key:%A, %b %e}</span><br/>',
            pointFormat: `<span style="color:{series.color}">●</span> <b>{point.y:,.1f}${unit}</b><br/>`
        },
        plotOptions: {
            series: {
                animation: false,
                marker: {
                    enabled: chartType === 'line',
                    radius: 3
                }
            },
            column: {
                borderRadius: 2,
                pointPadding: 0.1,
                groupPadding: 0.05
            }
        },
        series: [{
            name: metric,
            data: chartData,
            color: metric === 'deficit' ? undefined : getMetricColor(metric), // Let deficit use colorByPoint
            colors: metric === 'deficit' ? chartData.map(d => d[1] >= 0 ? 'var(--green-500)' : 'var(--red-500)') : undefined,
            colorByPoint: metric === 'deficit',
            lineWidth: chartType === 'line' ? 2 : undefined
        }]
    });
}

function getMetricColor(metric) {
    const colors = {
        // Body Metrics (Line charts - cooler colors)
        weight: 'var(--red-500)',
        muscle: 'var(--green-500)',
        boneMass: '#4299e1', // Custom blue
        visceralFat: '#ef4444', // Red variant
        
        // Body Composition (Line charts)
        proteinPercentage: 'var(--green-500)',
        waterPercentage: '#3182ce', // Blue variant
        bodyFat: '#f59e0b', // Orange
        basalMetabolism: '#8b5cf6', // Purple variant
        
        // Nutrition (Bar charts - warmer colors)
        calories: '#f59e0b', // Orange/yellow
        protein: 'var(--green-500)',
        fats: '#ef4444', // Red
        carbs: '#f59e0b', // Yellow/orange
        
        // Activity (Bar charts)
        steps: 'var(--purple-500)',
        sleep: '#3182ce', // Blue
        waterIntake: '#06b6d4', // Cyan
        
        // Calorie Balance (Mixed)
        bmr: 'var(--purple-500)', // Line chart
        totalBurn: '#f97316', // Orange (Bar chart)
        deficit: 'var(--blue-500)' // Bar chart
    };
    return colors[metric] || 'var(--blue-500)';
}

function setupTrackingTooltips() {
    const tooltip = document.getElementById('trackingTooltip');
    let isTooltipHovered = false;
    let activeTrackingItem = null;
    let hideTimeout = null;

    // Add hover handler for the tooltip itself
    tooltip.addEventListener('mouseenter', () => {
        isTooltipHovered = true;
        if (hideTimeout) {
            clearTimeout(hideTimeout);
            hideTimeout = null;
        }
    });

    tooltip.addEventListener('mouseleave', () => {
        isTooltipHovered = false;
        if (!activeTrackingItem) {
            hideTooltip();
        }
    });

    // Update tracking items event handlers
    document.querySelectorAll('.tracking-item').forEach(item => {
        // Get metric name from the value element ID instead of label
        const valueEl = item.querySelector('.tracking-value');
        if (!valueEl || !valueEl.id) return;
        
        // Convert from todayBoneMass -> boneMass format
        const metricName = valueEl.id
            .replace('today', '') // Remove 'today' prefix
            .replace(/^[A-Z]/, char => char.toLowerCase()); // Make first character lowercase
        
        // Debug log to help track issues
        console.log(`Setting up tooltip for: ${valueEl.id} -> ${metricName}`);
        
        item.addEventListener('mouseenter', (event) => {
            if (hideTimeout) {
                clearTimeout(hideTimeout);
                hideTimeout = null;
            }
            activeTrackingItem = item;
            showTooltip(event, metricName);
        });

        item.addEventListener('mouseleave', () => {
            activeTrackingItem = null;
            // Small delay to check if user moved to tooltip
            hideTimeout = setTimeout(() => {
                if (!isTooltipHovered) {
                    hideTooltip();
                }
            }, 100);
        });
    });
}

function hideTooltip() {
    const tooltip = document.getElementById('trackingTooltip');
    tooltip.classList.remove('visible');
    
    // Use a timeout to match the CSS transition duration
    setTimeout(() => {
        if (!tooltip.classList.contains('visible')) {
            tooltip.style.display = 'none';
            
            // Clean up any existing chart
            const chartContainer = document.getElementById('tooltipChart');
            if (chartContainer) {
                const existingChart = Highcharts.charts[Highcharts.attr(chartContainer, 'data-highcharts-chart')];
                if (existingChart) {
                    existingChart.destroy();
                }
            }
        }
    }, 200);
}

function showTooltip(event, metric) {
    const tooltip = document.getElementById('trackingTooltip');
    
    // Clean up any existing chart first
    const chartContainer = document.getElementById('tooltipChart');
    if (chartContainer) {
        const existingChart = Highcharts.charts[Highcharts.attr(chartContainer, 'data-highcharts-chart')];
        if (existingChart) {
            existingChart.destroy();
        }
    }
    
    tooltip.style.display = 'block';
    
    // Force a reflow to enable the transition
    tooltip.offsetHeight;
    
    // Set content and position
    const content = generateTooltipContent(currentData, metric);
    tooltip.querySelector('.tracking-tooltip-title').textContent = getMetricTitle(metric).replace(' History', '');
    tooltip.querySelector('.tracking-tooltip-content').innerHTML = content;
    
    // Position the tooltip
    const rect = event.target.closest('.tracking-item').getBoundingClientRect();
    const tooltipRect = tooltip.getBoundingClientRect();
    
    let left = rect.left + (rect.width - tooltipRect.width) / 2;
    let top = rect.top - tooltipRect.height - 10;
    
    // Check if tooltip would go off the left or right edge of the viewport
    if (left < 10) left = 10;
    if (left + tooltipRect.width > window.innerWidth - 10) {
        left = window.innerWidth - tooltipRect.width - 10;
    }
    
    // If tooltip would go off the top, position it below the element instead
    if (top < 10) {
        top = rect.bottom + 10;
    }
    
    tooltip.style.left = `${left}px`;
    tooltip.style.top = `${top}px`;
    tooltip.classList.add('visible');
    
    // Create the chart after positioning
    createTooltipChart(currentData, metric);
}

function getMetricTitle(metric) {
    const titles = {
        'weight': 'Weight History',
        'muscle': 'Muscle Mass History',
        'boneMass': 'Bone Mass History',
        'visceralFat': 'Visceral Fat History',
        'proteinPercentage': 'Protein % History',
        'waterPercentage': 'Water % History',
        'bodyFat': 'Body Fat % History',
        'basalMetabolism': 'Basal Metabolism History',
        'calories': 'Calorie Intake History',
        'protein': 'Protein Intake History',
        'fats': 'Fat Intake History',
        'carbs': 'Carbs Intake History',
        'steps': 'Steps History',
        'sleep': 'Sleep History',
        'waterIntake': 'Water Intake History',
        'bmr': 'BMR History',
        'totalBurn': 'Total Burn History',
        'deficit': 'Calorie Deficit History'
    };
    return titles[metric] || 'History';
}

function getHistoricalData(metric) {
    if (!currentData || !currentData.length) return [];
    
    const data = getFilteredData();
    
    // Map metric names to their corresponding data properties
    const metricMapping = {
        // Body Metrics
        'weight': 'weight',
        'muscle': 'muscle',
        'boneMass': 'boneMass',
        'visceralFat': 'visceralFat',
        
        // Body Composition
        'proteinPercentage': 'proteinPercentage',
        'waterPercentage': 'waterPercentage',
        'bodyFat': 'bodyFat',
        'basalMetabolism': 'basalMetabolism',
        
        // Nutrition
        'calories': 'calories',
        'protein': 'protein',
        'fats': 'fat',
        'carbs': 'carbs',
        
        // Activity
        'steps': 'steps',
        'sleep': 'sleep',
        'waterIntake': 'waterIntake',
        
        // Calorie Balance
        'bmr': 'basalMetabolism', // Fixed: BMR should map to basalMetabolism which gets "Basal Metabolism (kcal)"
        'totalBurn': 'totalCaloriesBurn',
        'deficit': 'deficit'
    };

    const dataProperty = metricMapping[metric];
    if (!dataProperty) {
        console.warn(`No mapping found for metric: ${metric}`);
        return [];
    }

    return data.map(d => ({
        date: d.date,
        value: d[dataProperty],
        unit: getMetricUnit(metric)
    })).filter(d => d.value !== null && d.value !== undefined && !isNaN(d.value));
}

function getMetricUnit(metric) {
    const units = {
        'weight': 'kg',
        'muscle': 'kg',
        'boneMass': 'kg',
        'visceralFat': '',
        'proteinPercentage': '%',
        'waterPercentage': '%',
        'bodyFat': '%',
        'basalMetabolism': 'cal',
        'calories': 'cal',
        'protein': 'g',
        'fats': 'g',
        'carbs': 'g',
        'steps': '',
        'sleep': 'hrs',
        'waterIntake': 'L',
        'bmr': 'cal',
        'totalBurn': 'cal',
        'deficit': 'cal'
    };
    return units[metric] || '';
}

// Configuration Modal Management
function showConfigModal() {
    const modal = document.getElementById('configurationModal');
    const reconfigureBtn = document.getElementById('reconfigureBtn');
    
    // Show reconfigure button if we have existing config
    if (hasConfig()) {
        reconfigureBtn.style.display = 'block';
        populateConfigForm();
    } else {
        reconfigureBtn.style.display = 'none';
    }
    
    modal.classList.add('visible');
    
    // Focus first input
    setTimeout(() => {
        document.getElementById('dataSheetUrl').focus();
    }, 100);
}

function hideConfigModal() {
    const modal = document.getElementById('configurationModal');
    modal.classList.remove('visible');
}

function populateConfigForm() {
    const config = getConfig();
    if (config) {
        document.getElementById('dataSheetUrl').value = config.dataSheetUrl;
        document.getElementById('planMdUrl').value = config.planMdUrl;
        document.getElementById('exerciseSheetUrl').value = config.exerciseSheetUrl;
    }
}

function setupConfigurationHandlers() {
    const modal = document.getElementById('configurationModal');
    const form = document.getElementById('configForm');
    const useDefaultsBtn = document.getElementById('useDefaultsBtn');
    const reconfigureBtn = document.getElementById('reconfigureBtn');
    const configureBtn = document.getElementById('configureBtn');

    // Form submission
    form.addEventListener('submit', (e) => {
        e.preventDefault();
        
        // Show loading state
        form.classList.add('loading');
        
        const formData = new FormData(form);
        const config = {
            dataSheetUrl: formData.get('dataSheetUrl').trim(),
            planMdUrl: formData.get('planMdUrl').trim() || DEFAULT_CONFIG.planMdUrl,
            exerciseSheetUrl: formData.get('exerciseSheetUrl').trim() || DEFAULT_CONFIG.exerciseSheetUrl
        };
        
        // Validate required URL
        if (!config.dataSheetUrl) {
            form.classList.remove('loading');
            alert('Data Sheet URL is required!');
            return;
        }
        
        // Basic URL validation
        try {
            new URL(config.dataSheetUrl);
            if (config.planMdUrl) new URL(config.planMdUrl);
            if (config.exerciseSheetUrl) new URL(config.exerciseSheetUrl);
        } catch (error) {
            form.classList.remove('loading');
            alert('Please enter valid URLs');
            return;
        }
        
        // Save configuration
        if (saveConfig(config)) {
            hideConfigModal();
            initializeDashboard();
        } else {
            form.classList.remove('loading');
            alert('Failed to save configuration. Please try again.');
        }
    });

    // Use defaults button
    useDefaultsBtn.addEventListener('click', () => {
        if (saveConfig(DEFAULT_CONFIG)) {
            hideConfigModal();
            initializeDashboard();
        } else {
            alert('Failed to save configuration. Please try again.');
        }
    });

    // Reconfigure button in modal
    reconfigureBtn.addEventListener('click', () => {
        populateConfigForm();
    });

    // Configure button in dashboard
    configureBtn.addEventListener('click', showConfigModal);

    // Close modal when clicking outside
    modal.addEventListener('click', (e) => {
        if (e.target === modal) {
            hideConfigModal();
        }
    });

    // Escape key to close modal
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && modal.classList.contains('visible')) {
            hideConfigModal();
        }
    });
}

function initializeDashboard() {
    updateDataSourceButtons();
    loadData();
    setupTimeRangeButtons();
    setupChartControls();
    loadFitnessPlan();
}

function setupChartControls() {
    // Set up event listeners for moving average checkboxes
    const weightCheckbox = document.getElementById('weightMovingAverage');
    const macroCheckbox = document.getElementById('macroMovingAverage');
    
    if (weightCheckbox) {
        weightCheckbox.addEventListener('change', () => {
            if (currentData && currentData.length > 0) {
                const filteredData = getFilteredData();
                createWeightChart(filteredData);
            }
        });
    }
    
    if (macroCheckbox) {
        macroCheckbox.addEventListener('change', () => {
            if (currentData && currentData.length > 0) {
                const filteredData = getFilteredData();
                createMacroChart(filteredData);
            }
        });
    }
}

function updateChartControlsVisibility(data) {
    const weightCheckboxContainer = document.querySelector('#weightMovingAverage').closest('.chart-controls');
    const macroCheckboxContainer = document.querySelector('#macroMovingAverage').closest('.chart-controls');
    
    // Show/hide based on whether we have enough data for meaningful moving averages
    const hasEnoughData = data && data.length > 14;
    
    if (weightCheckboxContainer) {
        weightCheckboxContainer.style.display = hasEnoughData ? 'flex' : 'none';
    }
    
    if (macroCheckboxContainer) {
        macroCheckboxContainer.style.display = hasEnoughData ? 'flex' : 'none';
    }
    
    // Reset checkboxes if not enough data
    if (!hasEnoughData) {
        const weightCheckbox = document.getElementById('weightMovingAverage');
        const macroCheckbox = document.getElementById('macroMovingAverage');
        if (weightCheckbox) weightCheckbox.checked = false;
        if (macroCheckbox) macroCheckbox.checked = false;
    }
}

function checkConfigAndStart() {
    if (hasConfig()) {
        // Configuration exists, start dashboard
        initializeDashboard();
    } else {
        // No configuration, show config modal
        showConfigModal();
    }
}

// Initialize when DOM is ready
window.addEventListener('DOMContentLoaded', () => {
    if (typeof d3 === 'undefined') {
        console.error("CRITICAL: D3 library not available at DOMContentLoaded. Dashboard cannot initialize.");
        showError("Core D3 library failed to load. Please refresh.");
        return;
    }
    if (typeof Highcharts === 'undefined') {
        console.error("CRITICAL: Highcharts library not available at DOMContentLoaded. Dashboard cannot initialize.");
        showError("Charting library (Highcharts) failed to load. Please refresh.");
        return;
    }

    // Highcharts Global Options
    Highcharts.setOptions({
        chart: {
            backgroundColor: 'transparent',
            style: { fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" }
        },
        title: { text: null },
        credits: { enabled: false },
        xAxis: {
            type: 'datetime',
            lineWidth: 0,
            tickWidth: 0,
            labels: { style: { color: 'var(--text-color-lighter)', fontSize: '11px' } }
        },
        yAxis: {
            gridLineColor: 'var(--border-color-soft)',
            labels: { style: { color: 'var(--text-color-lighter)' } },
            title: { style: { color: 'var(--text-color-lighter)' } }
        },
        legend: { itemStyle: { color: 'var(--text-color-lighter)', fontSize: '11px' } },
        tooltip: {
            backgroundColor: 'rgba(255, 255, 255, 0.98)',
            borderColor: 'var(--border-color-medium)',
            borderRadius: 8,
            style: { color: 'var(--text-color-medium)' },
            shadow: true,
            useHTML: true,
            headerFormat: '<span style="font-size: 10px">{point.key:%A, %b %e, %Y}</span><br/>',
            pointFormat: '<span style="color:{series.color}">●</span> {series.name}: <b>{point.y}</b><br/>',
        }
    });

    // Debug helpers (available in browser console)
    window.fitnessDebug = {
        clearConfig: clearConfig,
        getConfig: getConfig,
        showConfig: showConfigModal,
        hasConfig: hasConfig
    };

    // Setup configuration handlers
    setupConfigurationHandlers();
    
    // Check if configuration exists and start dashboard or show config modal
    checkConfigAndStart();

    // Auto-refresh interval
    setInterval(() => {
        if (document.visibilityState === 'visible' && hasConfig()) {
            console.log('Auto-refreshing data...');
            loadData();
            loadFitnessPlan();
        }
    }, 5 * 60 * 1000);
});

async function loadFitnessPlan() {
    try {
        const planUrl = getPlanMdUrl();
        const response = await fetch(planUrl);
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const markdown = await response.text();
        const planContent = document.getElementById('planContent');
        
        if (typeof marked === 'undefined') {
            console.error('Marked library not loaded');
            planContent.innerHTML = '<div class="error-message">Error loading plan content. Please refresh.</div>';
            return;
        }

        // Configure marked options
        marked.setOptions({
            breaks: true,
            gfm: true,
            headerIds: true,
            mangle: false
        });

        // Convert markdown to HTML and insert
        planContent.innerHTML = marked.parse(markdown);

        // Add target="_blank" to all links
        planContent.querySelectorAll('a').forEach(link => {
            link.setAttribute('target', '_blank');
            link.setAttribute('rel', 'noopener noreferrer');
        });

    } catch (error) {
        console.error('Error loading fitness plan:', error);
        document.getElementById('planContent').innerHTML = 
            '<div class="error-message">Failed to load fitness plan. Please try refreshing.</div>';
    }
}

function updateDataSourceButtons() {
    const config = getConfig();
    if (!config) return;
    
    // Update the href attributes of data source buttons
    const dataButtons = document.querySelectorAll('.data-source-btn');
    if (dataButtons.length >= 3) {
        dataButtons[0].href = config.exerciseSheetUrl; // Data sheet
        dataButtons[1].href = config.planMdUrl; // Plan
        dataButtons[2].href = config.dataSheetUrl; // CSV
    }
}

// Clear configuration (useful for development/testing)
function clearConfig() {
    try {
        localStorage.removeItem(CONFIG_STORAGE_KEY);
        return true;
    } catch (error) {
        console.error('Error clearing config from localStorage:', error);
        return false;
    }
}