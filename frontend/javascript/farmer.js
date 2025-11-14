// ===================================
// Farmer Dashboard Logic
// ===================================

let weatherCharts = {}; // Store chart instances
let currentWeatherData = null; // Store current weather data
let currentLocation = null; // Store current location

document.addEventListener('DOMContentLoaded', function() {
    // Check authentication
    checkAuthentication();

    // Load user info
    loadUserInfo();

    // Setup event listeners
    const locationForm = document.getElementById('locationForm');
    if (locationForm) {
        locationForm.addEventListener('submit', handleLocationSubmit);
    }

    const logoutBtn = document.getElementById('logoutBtn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', logout);
    }
});

/**
 * Load and display user information
 */
function loadUserInfo() {
    const user = getUserInfo();
    if (user && user.name) {
        const userName = document.getElementById('userName');
        if (userName) {
            userName.textContent = `Welcome, ${user.name}`;
        }
    }
}

/**
 * Handle location form submission - Fetch weather data
 */
async function handleLocationSubmit(e) {
    e.preventDefault();

    const location = document.getElementById('location').value.trim();
    const locationError = document.getElementById('locationError');
    const token = getToken();

    // Clear previous error
    locationError.classList.remove('show');

    try {
        if (!location) {
            throw new Error('Please enter a location');
        }

        currentLocation = location;

        // Fetch current weather data
        const weatherResponse = await apiCall(
            API_ENDPOINTS.weather.getWeather(location),
            'GET'
        );

        currentWeatherData = weatherResponse.weather;

        // Update weather cards
        updateWeatherCards(weatherResponse.weather);

        // Update advisory box
        updateAdvisoryBox(weatherResponse);

        // Fetch and display alerts
        await fetchAndDisplayAlerts(location);

        // Fetch and display weekly summary charts
        await fetchAndDisplayCharts(location);

    } catch (error) {
        locationError.textContent = error.message;
        locationError.classList.add('show');
        console.error('Location error:', error);
    }
}

/**
 * Update weather cards with current data
 */
function updateWeatherCards(weather) {
    // Temperature
    document.getElementById('tempValue').textContent = 
        `${weather.temperature.toFixed(1)}°C`;
    const tempStatus = document.getElementById('tempStatus');
    if (weather.temperature > 35) {
        tempStatus.textContent = 'High Temperature';
    } else if (weather.temperature < 15) {
        tempStatus.textContent = 'Low Temperature';
    } else {
        tempStatus.textContent = 'Normal';
    }

    // Humidity
    document.getElementById('humidityValue').textContent = 
        `${weather.humidity.toFixed(1)}%`;
    const humidityStatus = document.getElementById('humidityStatus');
    if (weather.humidity > 80) {
        humidityStatus.textContent = 'High Humidity';
    } else if (weather.humidity < 40) {
        humidityStatus.textContent = 'Low Humidity';
    } else {
        humidityStatus.textContent = 'Normal';
    }

    // Rainfall
    document.getElementById('rainfallValue').textContent = 
        `${weather.rainfall.toFixed(1)} mm`;
    const rainfallStatus = document.getElementById('rainfallStatus');
    if (weather.rainfall > 50) {
        rainfallStatus.textContent = 'Heavy Rain';
    } else if (weather.rainfall > 10) {
        rainfallStatus.textContent = 'Moderate Rain';
    } else {
        rainfallStatus.textContent = 'Light Rain';
    }

    // Wind Speed
    document.getElementById('windValue').textContent = 
        `${weather.windSpeed.toFixed(1)} m/s`;
    const windStatus = document.getElementById('windStatus');
    if (weather.windSpeed > 40) {
        windStatus.textContent = 'High Wind';
    } else if (weather.windSpeed > 20) {
        windStatus.textContent = 'Moderate Wind';
    } else {
        windStatus.textContent = 'Normal';
    }
}

/**
 * Update advisory box with recommendation
 */
function updateAdvisoryBox(weatherResponse) {
    const advisoryBox = document.getElementById('advisoryBox');
    const advisory = weatherResponse.advisory;
    const severity = weatherResponse.severity;

    advisoryBox.textContent = advisory;
    advisoryBox.className = 'advisory-box';

    if (severity === 'warning') {
        advisoryBox.classList.add('warning');
    } else if (severity === 'critical') {
        advisoryBox.classList.add('critical');
    }
}

/**
 * Fetch and display alerts for location
 */
async function fetchAndDisplayAlerts(location) {
    try {
        const alertsResponse = await apiCall(
            API_ENDPOINTS.alerts.getByLocation(location),
            'GET'
        );

        const alertsList = document.getElementById('alertsList');
        alertsList.innerHTML = ''; // Clear previous alerts

        if (alertsResponse.alerts && alertsResponse.alerts.length > 0) {
            alertsResponse.alerts.forEach(alert => {
                const alertItem = createAlertElement(alert);
                alertsList.appendChild(alertItem);
            });
        } else {
            alertsList.innerHTML = '<p>No active alerts for your location</p>';
        }

    } catch (error) {
        console.error('Error fetching alerts:', error);
    }
}

/**
 * Create alert HTML element
 */
function createAlertElement(alert) {
    const alertDiv = document.createElement('div');
    alertDiv.className = 'alert-item';

    // Determine severity color
    if (alert.condition && 
        ['Heavy Rain', 'Cyclone', 'Frost'].includes(alert.condition)) {
        alertDiv.classList.add('critical');
    } else {
        alertDiv.classList.add('warning');
    }

    alertDiv.innerHTML = `
        <h5>🚨 ${alert.condition || 'Alert'}</h5>
        <p>${alert.message}</p>
        <small>Date: ${new Date(alert.createdAt).toLocaleString()}</small>
    `;

    return alertDiv;
}

/**
 * Fetch and display weekly charts
 */
async function fetchAndDisplayCharts(location) {
    try {
        const summaryResponse = await apiCall(
            API_ENDPOINTS.weather.getWeeklySummary(location),
            'GET'
        );

        const summary = summaryResponse.summary;

        if (!summary || summary.length === 0) {
            console.log('No weekly data available yet');
            return;
        }

        // Prepare data for charts
        const dates = summary.map(d => {
            const date = new Date(d.createdAt);
            return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
        });

        const temperatures = summary.map(d => d.temperature);
        const rainfalls = summary.map(d => d.rainfall);

        // Create/Update Temperature Chart
        updateChart('temperatureChart', 'Temperature Trend', dates, temperatures, '#f5576c');

        // Create/Update Rainfall Chart
        updateChart('rainfallChart', 'Rainfall Trend', dates, rainfalls, '#43e97b');

    } catch (error) {
        console.error('Error fetching weekly data:', error);
    }
}

/**
 * Create or update chart
 */
function updateChart(canvasId, label, labels, data, color) {
    const ctx = document.getElementById(canvasId);
    if (!ctx) return;

    // Destroy previous chart if exists
    if (weatherCharts[canvasId]) {
        weatherCharts[canvasId].destroy();
    }

    // Create new chart
    weatherCharts[canvasId] = new Chart(ctx, {
        type: 'line',
        data: {
            labels: labels,
            datasets: [{
                label: label,
                data: data,
                borderColor: color,
                backgroundColor: color + '20', // Semi-transparent fill
                borderWidth: 2,
                fill: true,
                tension: 0.4,
                pointRadius: 5,
                pointHoverRadius: 7,
                pointBackgroundColor: color,
                pointBorderColor: '#fff',
                pointBorderWidth: 2
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: true,
            plugins: {
                legend: {
                    display: true,
                    position: 'top'
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    grid: {
                        color: '#e0e0e0'
                    }
                },
                x: {
                    grid: {
                        color: '#f0f0f0'
                    }
                }
            }
        }
    });
}
