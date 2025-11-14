// --- CONFIGURATION ---
// ⚠️ Replace this with your actual OpenWeatherMap API Key
const OPENWEATHERMAP_API_KEY = "c660cb46cb741e072f736e1256543233"; 
const API_BASE_URL = "https://api.openweathermap.org/data/2.5/weather";
const RAINFALL_CRITICAL_MM = 50;
const WIND_CRITICAL_KPH = 30;

// --- Telangana Districts Mapped to Coordinates ---
// Note: You must expand this list with coordinates for all your districts.
const telanganaDistrictCoordinates = {
    'Adilabad': { lat: 19.6667, lon: 78.5333 }, 
    'Bhadradri Kothagudem': { lat: 17.6150, lon: 80.3121 },
    'Hyderabad': { lat: 17.3850, lon: 78.4867 },
    'Karimnagar': { lat: 18.4381, lon: 79.1288 },
    'Khammam': { lat: 17.2500, lon: 80.1500 },
    'Mahabubabad': { lat: 17.6100, lon: 80.0000 },
    'Nizamabad': { lat: 18.6700, lon: 78.1000 },
    'Warangal Urban': { lat: 17.9689, lon: 79.5941 },
};
const telanganaDistricts = Object.keys(telanganaDistrictCoordinates); // Auto-generate district list

// --- INITIALIZATION ---

document.addEventListener('DOMContentLoaded', initializeDistrictDropdown);

function initializeDistrictDropdown() {
    const districtSelect = document.getElementById('district-select');
    
    // 1. Populate the District dropdown
    telanganaDistricts.forEach(district => {
        const option = document.createElement('option');
        option.value = district;
        option.textContent = district;
        districtSelect.appendChild(option);
    });

    // 2. Set the first actual district as selected for initial display
    const initialDistrict = telanganaDistricts[0]; 
    if (initialDistrict) {
        districtSelect.value = initialDistrict; 
    }
    
    // 3. Fetch data for the initially selected district
    fetchWeatherData();
}

// --- CORE DYNAMIC DATA FETCHING ---

async function fetchWeatherData() {
    const districtSelect = document.getElementById('district-select');
    const selectedDistrict = districtSelect.value;
    
    if (selectedDistrict === 'default' || !OPENWEATHERMAP_API_KEY.includes('YOUR_')) {
        clearDashboard();
        if (OPENWEATHERMAP_API_KEY.includes('YOUR_')) {
             console.error("Please replace 'YOUR_OPENWEATHERMAP_API_KEY_HERE' with a valid key.");
             document.getElementById('alert-banner').textContent = "🚨 CRITICAL ERROR: API Key Missing/Invalid. Cannot fetch data.";
             document.getElementById('alert-banner').className = "alert-banner critical";
             document.getElementById('alert-banner').style.display = 'block';
        }
        return;
    }

    const coords = telanganaDistrictCoordinates[selectedDistrict];
    if (!coords) {
        console.error("Coordinates not found for:", selectedDistrict);
        clearDashboard();
        return;
    }

    try {
        // Build the API URL using coordinates, the key, and 'units=metric' for Celsius
        const url = `${API_BASE_URL}?lat=${coords.lat}&lon=${coords.lon}&appid=${OPENWEATHERMAP_API_KEY}&units=metric`;
        
        // 1. Fetch data from OpenWeatherMap asynchronously
        const response = await fetch(url);
        if (!response.ok) {
            throw new Error(`HTTP error! Status: ${response.status}. Check API key or coordinates.`);
        }
        const apiData = await response.json();
        
        // 2. Process the API data into a simple dashboard object
        const processedData = processOpenWeatherData(apiData);

        // 3. Update the dashboard UI
        updateWeatherDisplay(processedData);
        generateAdvisoryAndAlert(processedData); 

    } catch (error) {
        console.error("Error fetching weather data:", error);
        document.getElementById('alert-banner').textContent = `⚠️ WARNING: Data fetch failed for ${selectedDistrict}. ${error.message}`;
        document.getElementById('alert-banner').className = "alert-banner warning";
        document.getElementById('alert-banner').style.display = 'block';
        clearDashboard(false); // Clear data but keep the warning banner
    }
}

/**
 * Maps complex OpenWeatherMap JSON to simple dashboard data.
 */
function processOpenWeatherData(apiData) {
    // OpenWeatherMap reports rain over the last 1 hour (default to 0 if not present)
    const rainfallMM = apiData.rain ? (apiData.rain['1h'] || 0) : 0;
    
    // Wind speed is usually m/s. Convert to km/h (m/s * 3.6)
    const windSpeedKPH = (apiData.wind.speed * 3.6).toFixed(1); 

    return {
        temp: apiData.main.temp.toFixed(1),      // Dynamic Temperature in Celsius
        humidity: apiData.main.humidity,         // Dynamic Humidity
        rainfall: rainfallMM,
        windSpeed: parseFloat(windSpeedKPH),
    };
}

/**
 * Generates advisories and alerts based on real-time data thresholds.
 */
function generateAdvisoryAndAlert(data) {
    let advisoryMessage = "Normal conditions. Proceed with scheduled operations.";
    let advisorySeverity = "normal";
    let alertData = null; 

    // Logic based on project specs:
    if (data.rainfall > RAINFALL_CRITICAL_MM) {
        advisoryMessage = `Heavy rain (${data.rainfall}mm) expected. Avoid irrigation and fertilizer today.`;
        advisorySeverity = "critical";
        alertData = {
            message: "🚨 CRITICAL ALERT: Severe rainfall expected. Avoid all field work.",
            severity: "critical"
        };
    } else if (data.windSpeed > WIND_CRITICAL_KPH) {
        advisoryMessage = `High wind speed (${data.windSpeed} km/h). Secure farm equipment and vulnerable crops.`;
        advisorySeverity = "critical";
        alertData = {
            message: "🚨 CRITICAL ALERT: Strong winds forecast. Secure property immediately.",
            severity: "critical"
        };
    } else if (data.temp > 35) {
         advisoryMessage = `High temperature (${data.temp}°C). Ensure adequate water supply for standing crops.`;
         advisorySeverity = "warning";
         alertData = {
            message: "⚠️ WARNING: Extreme heat advisory issued. Increase irrigation.",
            severity: "warning"
        };
    }
    
    updateAdvisory({ message: advisoryMessage, severity: advisorySeverity });
    updateAlertBanner(alertData);
}


// --- UI UPDATE FUNCTIONS (Remain largely the same) ---

function clearDashboard(clearBanner = true) {
    if (clearBanner) {
        document.getElementById('alert-banner').style.display = 'none';
    }

    document.getElementById('temp-value').textContent = '--°C';
    document.getElementById('humidity-value').textContent = '--%';
    document.getElementById('rainfall-value').textContent = '--mm';
    document.getElementById('windspeed-value').textContent = '-- km/h';

    document.getElementById('rainfall-status').textContent = '';
    document.getElementById('rainfall-status').className = 'status-indicator';
    document.getElementById('windspeed-status').textContent = '';
    document.getElementById('windspeed-status').className = 'status-indicator';
    
    const advisoryBox = document.getElementById('advisory-message');
    advisoryBox.querySelector('p').textContent = 'Please select a location to view real-time data and advisories.';
    advisoryBox.className = 'card advisory-card normal';
}

function updateWeatherDisplay(data) {
    // 1. Update Core Values - This now uses dynamic API data
    document.getElementById('temp-value').textContent = `${data.temp}°C`;
    document.getElementById('humidity-value').textContent = `${data.humidity}%`;
    document.getElementById('rainfall-value').textContent = `${data.rainfall}mm`;
    document.getElementById('windspeed-value').textContent = `${data.windSpeed} km/h`;

    // 2. Rainfall Color-Coding Logic
    const rainfallStatus = document.getElementById('rainfall-status');
    if (data.rainfall > RAINFALL_CRITICAL_MM) {
        rainfallStatus.textContent = 'High Risk';
        rainfallStatus.className = 'status-indicator high-risk'; 
    } else {
        rainfallStatus.textContent = 'Normal';
        rainfallStatus.className = 'status-indicator normal-risk';
    }

    // 3. Wind Speed Color-Coding Logic
    const windspeedStatus = document.getElementById('windspeed-status');
    if (data.windSpeed > WIND_CRITICAL_KPH) {
        windspeedStatus.textContent = 'High Risk';
        windspeedStatus.className = 'status-indicator high-risk';
    } else {
        windspeedStatus.textContent = 'Normal';
        windspeedStatus.className = 'status-indicator normal-risk';
    }
}

function updateAlertBanner(alertData) {
    const banner = document.getElementById('alert-banner');
    if (alertData) {
        banner.textContent = alertData.message;
        banner.className = `alert-banner ${alertData.severity}`;
        banner.style.display = 'block';
    } else {
        banner.style.display = 'none';
    }
}

function updateAdvisory(advisoryData) {
    const advisoryBox = document.getElementById('advisory-message');
    advisoryBox.querySelector('p').textContent = advisoryData.message;
    advisoryBox.className = `card advisory-card ${advisoryData.severity}`;
}