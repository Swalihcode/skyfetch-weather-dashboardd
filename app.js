// 🏗️ WeatherApp Constructor
function WeatherApp(apiKey) {

    this.apiKey = apiKey;
    this.apiUrl = 'https://api.openweathermap.org/data/2.5/weather';
    this.forecastUrl = 'https://api.openweathermap.org/data/2.5/forecast';

    // DOM references
    this.searchBtn = document.getElementById('search-btn');
    this.cityInput = document.getElementById('city-input');
    this.weatherDisplay = document.getElementById('weather-display');

    this.recentSearchesSection = document.getElementById('recent-searches-section');
    this.recentSearchesContainer = document.getElementById('recent-searches-container');

    this.recentSearches = [];
    this.maxRecentSearches = 5;

    this.init();
}

// 🚀 Initialize App
WeatherApp.prototype.init = function () {

    // Search button
    this.searchBtn.addEventListener(
        'click',
        this.handleSearch.bind(this)
    );

    // Enter key support
    this.cityInput.addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            this.handleSearch();
        }
    }.bind(this));

    // Clear history button
    const clearBtn = document.getElementById('clear-history-btn');
    if (clearBtn) {
        clearBtn.addEventListener('click', this.clearHistory.bind(this));
    }

    // Load saved data
    this.loadRecentSearches();
    this.loadLastCity();
};

// 🌤️ Welcome Message
WeatherApp.prototype.showWelcome = function () {

    this.weatherDisplay.innerHTML = `
        <div class="welcome-message">
            <h2>🌍 Welcome to SkyFetch</h2>
            <p>Search for a city to get started.</p>
            <p style="color:#777; font-size:0.9rem; margin-top:10px;">
                Try: London, Paris, Tokyo, Delhi
            </p>
        </div>
    `;
};

// 🔎 Handle Search
WeatherApp.prototype.handleSearch = function () {

    const city = this.cityInput.value.trim();

    if (!city) {
        this.showError("Please enter a city name.");
        return;
    }

    if (city.length < 2) {
        this.showError("City name must be at least 2 characters.");
        return;
    }

    this.getWeather(city);
    this.cityInput.value = '';
};

// 🌍 Fetch Weather
WeatherApp.prototype.getWeather = async function (city) {

    this.showLoading();
    this.searchBtn.disabled = true;
    this.searchBtn.textContent = 'Searching...';

    const currentUrl = `${this.apiUrl}?q=${city}&appid=${this.apiKey}&units=metric`;

    try {

        const [currentWeather, forecastData] = await Promise.all([
            axios.get(currentUrl),
            this.getForecast(city)
        ]);

        this.displayWeather(currentWeather.data);
        this.displayForecast(forecastData);

        // Save successful search
        this.saveRecentSearch(city);
        localStorage.setItem('lastCity', city);

    } catch (error) {

        console.error("Error:", error);

        if (error.response && error.response.status === 404) {
            this.showError("City not found. Please check spelling.");
        } else {
            this.showError("Something went wrong. Please try again.");
        }

    } finally {

        this.searchBtn.disabled = false;
        this.searchBtn.textContent = '🔍 Search';
    }
};

// 🌡️ Display Current Weather
WeatherApp.prototype.displayWeather = function (data) {

    const cityName = data.name;
    const temperature = Math.round(data.main.temp);
    const description = data.weather[0].description;
    const icon = data.weather[0].icon;
    const iconUrl = `https://openweathermap.org/img/wn/${icon}@2x.png`;

    this.weatherDisplay.innerHTML = `
        <div class="weather-info">
            <h2 class="city-name">${cityName}</h2>
            <img src="${iconUrl}" alt="${description}" class="weather-icon">
            <div class="temperature">${temperature}°C</div>
            <p class="description">${description}</p>
        </div>
    `;

    this.cityInput.focus();
};

// 📊 Forecast Processing
WeatherApp.prototype.processForecastData = function(data) {
    return data.list
        .filter(item => item.dt_txt.includes('12:00:00'))
        .slice(0, 5);
};

WeatherApp.prototype.displayForecast = function(data) {

    const dailyForecasts = this.processForecastData(data);

    const forecastHTML = dailyForecasts.map(day => {

        const date = new Date(day.dt * 1000);
        const dayName = date.toLocaleDateString('en-US', { weekday: 'short' });
        const temp = Math.round(day.main.temp);
        const description = day.weather[0].description;
        const icon = day.weather[0].icon;
        const iconUrl = `https://openweathermap.org/img/wn/${icon}@2x.png`;

        return `
            <div class="forecast-card">
                <h4>${dayName}</h4>
                <img src="${iconUrl}" alt="${description}">
                <p>${temp}°C</p>
                <p>${description}</p>
            </div>
        `;
    }).join('');

    this.weatherDisplay.innerHTML += `
        <div class="forecast-section">
            <h3 class="forecast-title">5-Day Forecast</h3>
            <div class="forecast-container">
                ${forecastHTML}
            </div>
        </div>
    `;
};

// ⏳ Loading
WeatherApp.prototype.showLoading = function () {
    this.weatherDisplay.innerHTML = `
        <div class="loading-container">
            <div class="spinner"></div>
            <p>Loading weather data...</p>
        </div>
    `;
};

// ❌ Error
WeatherApp.prototype.showError = function (message) {
    this.weatherDisplay.innerHTML = `
        <div class="error-message">
            <h3>⚠️ Oops!</h3>
            <p>${message}</p>
        </div>    `;
};

// 🌍 Forecast API
WeatherApp.prototype.getForecast = async function(city) {
    const url = `${this.forecastUrl}?q=${city}&appid=${this.apiKey}&units=metric`;
    const response = await axios.get(url);
    return response.data;
};

// 💾 Load Recent Searches
WeatherApp.prototype.loadRecentSearches = function() {

    const saved = localStorage.getItem('recentSearches');

    if (saved) {
        this.recentSearches = JSON.parse(saved);
    }

    this.displayRecentSearches();
};

// 💾 Save Recent Search
WeatherApp.prototype.saveRecentSearch = function(city) {

    const cityName = city.charAt(0).toUpperCase() + city.slice(1).toLowerCase();

    const index = this.recentSearches.indexOf(cityName);
    if (index > -1) {
        this.recentSearches.splice(index, 1);
    }

    this.recentSearches.unshift(cityName);

    if (this.recentSearches.length > this.maxRecentSearches) {
        this.recentSearches.pop();
    }

    localStorage.setItem('recentSearches', JSON.stringify(this.recentSearches));

    this.displayRecentSearches();
};

// 🎯 Display Recent Searches
WeatherApp.prototype.displayRecentSearches = function() {

    this.recentSearchesContainer.innerHTML = '';

    if (this.recentSearches.length === 0) {
        this.recentSearchesSection.style.display = 'none';
        return;
    }

    this.recentSearchesSection.style.display = 'block';

    this.recentSearches.forEach(city => {

        const btn = document.createElement('button');
        btn.className = 'recent-search-btn';
        btn.textContent = city;

        btn.addEventListener('click', () => {
            this.cityInput.value = city;
            this.getWeather(city);
        });

        this.recentSearchesContainer.appendChild(btn);
    });
};

// 🧹 Clear History
WeatherApp.prototype.clearHistory = function() {

    if (confirm('Clear all recent searches?')) {
        this.recentSearches = [];
        localStorage.removeItem('recentSearches');
        this.displayRecentSearches();
    }
};

// 🔄 Load Last City
WeatherApp.prototype.loadLastCity = function() {

    const lastCity = localStorage.getItem('lastCity');

    if (lastCity) {
        this.getWeather(lastCity);
    } else {
        this.showWelcome();
    }
};

// 🧠 Create App Instance
const app = new WeatherApp('80af9604612ffdc53c830615a50bcfd0');