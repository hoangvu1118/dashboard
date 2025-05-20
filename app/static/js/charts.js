// Minimal JavaScript to handle sensor selection and chart rendering
console.log("Charts.js loaded at", new Date().toLocaleTimeString());

document.addEventListener('DOMContentLoaded', function() {
    console.log("DOM fully loaded - initializing charts");
    
    // Chart objects
    let tempChart = null;
    let humidityChart = null;
    let moistureChart = null;
    
    // Currently selected sensor
    let selectedSensor = null;
    
    // Add click event listeners to all sensor items
    const sensorItems = document.querySelectorAll('.sensor-item');
    console.log("Found sensor items:", sensorItems.length);
    
    sensorItems.forEach(item => {
        item.addEventListener('click', function() {
            // Remove active class from all sensors
            sensorItems.forEach(s => s.classList.remove('active'));
            
            // Add active class to the clicked sensor
            this.classList.add('active');
            
            // Get sensor ID
            const sensorId = this.getAttribute('data-sensor-id');
            selectedSensor = sensorId;
            
            // Update heading
            document.getElementById('selected-sensor').textContent = `Sensor: ${sensorId}`;
            
            // Fetch data for this sensor
            fetchSensorData(sensorId);
        });
    });
    
    // Select first sensor by default if available
    if (sensorItems.length > 0) {
        sensorItems[0].click();
    } else {
        // No sensors available - show a message but don't create dummy data
        document.getElementById('selected-sensor').textContent = 'No sensors available';
        document.getElementById('latest-data').innerHTML = 
            '<p>No sensors found. Please check if MQTT broker is receiving data.</p>';
        clearCharts();
    }
    
    // Function to clear all charts
    function clearCharts() {
        if (tempChart) {
            tempChart.destroy();
            tempChart = null;
        }
        if (humidityChart) {
            humidityChart.destroy();
            humidityChart = null;
        }
        if (moistureChart) {
            moistureChart.destroy();
            moistureChart = null;
        }
    }
    
    // Function to fetch data for a sensor
    function fetchSensorData(sensorId) {
        // Show loading state
        document.getElementById('latest-data').innerHTML = '<p>Loading data...</p>';
        
        fetch(`/api/sensors/${sensorId}/chart-data`)
            .then(response => {
                if (!response.ok) {
                    throw new Error(`HTTP error! Status: ${response.status}`);
                }
                return response.json();
            })
            .then(data => {
                if (data && data.timestamps && data.timestamps.length > 0) {
                    console.log("Received data for charts:", data.timestamps.length, "data points");
                    updateCharts(data);
                    updateLatestReading(data);
                } else {
                    console.log("No data available for selected sensor");
                    document.getElementById('latest-data').innerHTML = 
                        '<p>No data available for this sensor</p>';
                    clearCharts();
                }
            })
            .catch(error => {
                console.error('Error fetching sensor data:', error);
                document.getElementById('latest-data').innerHTML = 
                    '<p>Error loading data. Please try again later.</p>';
                clearCharts();
            });
    }
    
    // Function to format timestamps for readability
    function formatTimestamps(timestamps) {
        return timestamps.map(timestamp => {
            const date = new Date(timestamp);
            return date.toLocaleString('en-US', {
                month: 'short', 
                day: 'numeric',
                hour: '2-digit', 
                minute: '2-digit'
            });
        });
    }
    
    // Function to update all charts
    function updateCharts(data) {
        const timestamps = formatTimestamps(data.timestamps);
        const tempData = data.temperature;
        const humidityData = data.humidity;
        const moistureData = data.moisture;
        
        // Temperature chart
        tempChart = updateChart('tempChart', tempChart, 'Temperature (°C)', timestamps, tempData, 'rgba(255, 99, 132, 0.2)', 'rgba(255, 99, 132, 1)');
        
        // Humidity chart
        humidityChart = updateChart('humidityChart', humidityChart, 'Humidity (%)', timestamps, humidityData, 'rgba(54, 162, 235, 0.2)', 'rgba(54, 162, 235, 1)');
        
        // Moisture chart
        moistureChart = updateChart('moistureChart', moistureChart, 'Moisture (%)', timestamps, moistureData, 'rgba(75, 192, 192, 0.2)', 'rgba(75, 192, 192, 1)');
    }
    
    // Function to create or update a chart
    function updateChart(canvasId, chartObj, label, labels, data, backgroundColor, borderColor) {
        const canvas = document.getElementById(canvasId);
        if (!canvas) {
            console.error(`Canvas element with ID ${canvasId} not found`);
            return null;
        }
        
        const ctx = canvas.getContext('2d');
        
        // If chart already exists, destroy it
        if (chartObj) {
            chartObj.destroy();
        }
        
        // Create new chart
        const newChart = new Chart(ctx, {
            type: 'line',
            data: {
                labels: labels,
                datasets: [{
                    label: label,
                    data: data,
                    backgroundColor: backgroundColor,
                    borderColor: borderColor,
                    borderWidth: 1,
                    tension: 0.1,
                    fill: true
                }]
            },
            options: {
                scales: {
                    y: {
                        beginAtZero: false,
                        ticks: {
                            font: {
                                size: 10
                            }
                        }
                    },
                    x: {
                        ticks: {
                            font: {
                                size: 9
                            },
                            maxRotation: 45,
                            minRotation: 45
                        }
                    }
                },
                plugins: {
                    legend: {
                        labels: {
                            font: {
                                size: 12
                            }
                        }
                    }
                },
                responsive: true,
                maintainAspectRatio: false
            }
        });
        
        return newChart;
    }
    
    // Function to update the latest reading display
    function updateLatestReading(data) {
        const latestDataDiv = document.getElementById('latest-data');
        
        if (data.timestamps.length > 0) {
            // Get the most recent reading (last item in array)
            const lastIndex = data.timestamps.length - 1;
            const timestamp = new Date(data.timestamps[lastIndex]).toLocaleString();
            const temp = data.temperature[lastIndex];
            const humidity = data.humidity[lastIndex];
            const moisture = data.moisture[lastIndex];
            
            // Update the HTML
            latestDataDiv.innerHTML = `
                <p><strong>Time:</strong> ${timestamp}</p>
                <p><strong>Temperature:</strong> ${temp}°C</p>
                <p><strong>Humidity:</strong> ${humidity}%</p>
                <p><strong>Moisture:</strong> ${moisture}%</p>
            `;
        } else {
            latestDataDiv.innerHTML = '<p>No data available for this sensor</p>';
        }
    }
    
    // Set up periodic refresh of data (every 60 seconds)
    setInterval(() => {
        if (selectedSensor) {
            fetchSensorData(selectedSensor);
        }
    }, 60000);
    
    // Add diagnostic info
    console.log("Environment check:");
    console.log("- Sensors found:", sensorItems.length);
    console.log("- Charts library loaded:", typeof Chart !== 'undefined');
    
    // Add a diagnostic div at the bottom of the page for debugging
    const diagnosticDiv = document.createElement('div');
    diagnosticDiv.style.margin = '20px auto';
    diagnosticDiv.style.padding = '10px';
    diagnosticDiv.style.backgroundColor = '#f0f0f0';
    diagnosticDiv.style.border = '1px solid #ccc';
    diagnosticDiv.style.borderRadius = '4px';
    diagnosticDiv.style.maxWidth = '1200px';
    
    diagnosticDiv.innerHTML = `
        <h3 style="margin-bottom:10px;">App Status</h3>
        <p>UI loaded at: ${new Date().toLocaleTimeString()}</p>
        <p>Sensors detected: ${sensorItems.length}</p>
        <p>Chart.js loaded: ${typeof Chart !== 'undefined' ? 'Yes' : 'No'}</p>
        <button id="check-api-btn" style="padding:5px 10px;margin-right:10px;background:#3498db;color:white;border:none;border-radius:4px;cursor:pointer;">
            Check API
        </button>
        <button id="reload-btn" style="padding:5px 10px;background:#2ecc71;color:white;border:none;border-radius:4px;cursor:pointer;">
            Reload Page
        </button>
        <div id="api-status" style="margin-top:10px;"></div>
    `;
    
    document.body.appendChild(diagnosticDiv);
    
    // Add API check button functionality
    document.getElementById('check-api-btn').addEventListener('click', async () => {
        const apiStatus = document.getElementById('api-status');
        apiStatus.innerHTML = 'Checking API...';
        
        try {
            const response = await fetch('/api/sensors');
            if (response.ok) {
                const sensors = await response.json();
                apiStatus.innerHTML = `API is working. Found ${sensors.length} sensors.`;
                
                if (sensors.length > 0) {
                    apiStatus.innerHTML += '<ul style="margin-top:5px;">';
                    sensors.forEach(sensor => {
                        apiStatus.innerHTML += `<li>Sensor: ${sensor.id}, Hub: ${sensor.hub_id || 'Unknown'}</li>`;
                    });
                    apiStatus.innerHTML += '</ul>';
                }
            } else {
                apiStatus.innerHTML = `API error: ${response.status} ${response.statusText}`;
            }
        } catch (error) {
            apiStatus.innerHTML = `API connection failed: ${error.message}`;
        }
    });
    
    // Add reload button functionality
    document.getElementById('reload-btn').addEventListener('click', () => {
        window.location.reload();
    });
});
