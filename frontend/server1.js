const districts = [
    "Adilabad", "Bhadradri Kothagudem", "Hyderabad", "Jagtial",
    "Jangaon", "Jayashankar Bhupalpally", "Jogulamba Gadwal", "Kamareddy",
    "Karimnagar", "Khammam", "Komaram Bheem Asifabad", "Mahabubabad",
    "Mahabubnagar", "Mancherial", "Medak", "Medchal Malkajgiri",
    "Nagarkurnool", "Nalgonda", "Narayanpet", "Nirmal", "Nizamabad",
    "Peddapalli", "Rajanna Sircilla", "Rangareddy", "Sangareddy",
    "Siddipet", "Suryapet", "Vikarabad", "Wanaparthy", "Warangal Rural",
    "Warangal Urban", "Yadadri Bhuvanagiri"
];

 const API_KEY =  "23848b900e79c9ea2444cc2f2965c6c1"// Replace with your actual OpenWeather API key


// Ensure all JS runs after DOM is loaded
document.addEventListener("DOMContentLoaded", function() {
    populateDistricts();

    // Add event listener after DOM exists
    document.getElementById("district-select").addEventListener("change", fetchWeatherData);
});

// Populate District Dropdown
function populateDistricts() {
    const dsel = document.getElementById("district-select");
    districts.forEach(d => {
        const opt = document.createElement("option");
        opt.value = d;
        opt.textContent = d;
        dsel.appendChild(opt);
    });
}

// Fetch weather for selected district
async function fetchWeatherData() {
    const district = document.getElementById("district-select").value;
    if(!district || district === "default") return;

    try {
        // --- ERROR LINES 41 & 42 FIXED: Use backticks (`) for template literals ---
        // Get lat/lon
        const geoResp = await fetch(`https://api.openweathermap.org/geo/1.0/direct?q=${district},IN&limit=1&appid=${API_KEY}`);
        const geoData = await geoResp.json();
        if(!geoData || geoData.length === 0) throw new Error("Location not found");
        const { lat, lon } = geoData[0];

        // Fetch weather
        // --- ERROR LINES 47 & 48 FIXED: Use backticks (`) for template literals ---
        // Also, OpenWeather's wind_speed is in meters/sec by default, but you display km/h,
        // so I'm leaving your original code which might rely on a custom OpenWeather unit configuration,
        // but note that the standard 'metric' unit returns m/s. I'll add a conversion in the logic.
        const weatherResp = await fetch(`https://api.openweathermap.org/data/3.0/onecall?lat=${lat}&lon=${lon}&units=metric&exclude=minutely,alerts&appid=${API_KEY}`);
        const weather = await weatherResp.json();

        // **Data Extraction & Conversion**
        // OneCall API 3.0 gives wind_speed in m/s with units=metric. Convert to km/h (m/s * 3.6).
        const windSpeedKPH = (weather.current.wind_speed * 3.6).toFixed(1);
        
        // Rainfall volume for the day is under daily[0].rain. It might be missing if there's no rain.
        // It's an object with a volume, or just a value, so we'll adjust the access to be safe.
        // Based on the OneCall 3.0 documentation, rain is a property in daily[0] for precipitation volume in mm.
        const rainToday = weather.daily[0].rain || 0; 
        
        // Update dashboard
        document.getElementById("temp-value").innerText = Math.round(weather.current.temp) + "°C";
        document.getElementById("humidity-value").innerText = weather.current.humidity + "%";
        document.getElementById("windspeed-value").innerText = windSpeedKPH + " km/h"; 
        document.getElementById("rainfall-value").innerText = (rainToday.toFixed(1)) + " mm";
        // Also ensure the advisory logic uses the converted wind speed
        weather.current.wind_speed_kph = parseFloat(windSpeedKPH);

        // Update advisory
        updateAdvisory(weather);

    } catch(err) {
        console.error("Weather fetch error:", err);
        alert("Weather fetch failed: " + err.message);
    }
}

// Update advisory logic
function updateAdvisory(weather) {
    const box = document.getElementById("advisory-message");
    box.className = "card advisory-card"; // reset classes

    // Use the wind speed in km/h which was added to the weather object in fetchWeatherData
    const wind = weather.current.wind_speed_kph;
    const humidity = weather.current.humidity;
    const rainToday = weather.daily[0].rain || 0; // Use the raw mm value

    // --- ERROR LINES 62 & 66 FIXED: Use template literals (backticks) for innerHTML ---
    if(wind > 15){
        box.classList.add("critical");
        // Template literal used here to insert variable `wind`
        box.innerHTML = `<p>🚨 Strong winds (${wind} km/h). Secure equipment & avoid aerial spraying.</p>`;
    } else if(rainToday > 20){
        box.classList.add("critical");
        // Template literal used here to insert variable `rainToday`
        box.innerHTML = `<p>🚨 Heavy rain expected (${rainToday} mm). Delay irrigation & fertilizer application.</p>`;
    } else if(humidity > 85){
        box.classList.add("warning");
        box.innerHTML = `<p>⚠️ High humidity (${humidity}%). Monitor for fungal disease.</p>`;
    } else {
        box.classList.add("normal");
        box.innerHTML = `<p>✅ Normal conditions. Proceed with scheduled operations.</p>`;
    }
}