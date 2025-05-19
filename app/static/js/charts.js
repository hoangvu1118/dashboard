// Minimal JavaScript to handle sensor selection and chart rendering
document.addEventListener('DOMContentLoaded', function() {
    // Chart objects
    let tempChart = null;
    let humidityChart = null;
    let moistureChart = null;
    
    // Currently selected sensor
    let selectedSensor = null;
    
    // Add click event listeners to all sensor items
    const sensorItems = document.querySelectorAll('.sensor-item');
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
        // Show dummy data if no sensors are available
        showDummyData();
    }
    
    // Function to show dummy data for development/testing
    function showDummyData() {
        const timestamps = [];
        const tempData = [];
        const humidityData = [];
        const moistureData = [];
        
        // Generate 10 data points with proper timestamps
        const now = new Date();
        for (let i = 9; i >= 0; i--) {
            const time = new Date(now.getTime() - (i * 3600000)); // One hour intervals
            timestamps.push(time.toISOString());
            tempData.push(Math.round((Math.random() * 15 + 15) * 10) / 10); // 15-30°C
            humidityData.push(Math.round((Math.random() * 50 + 30) * 10) / 10); // 30-80%
            moistureData.push(Math.round((Math.random() * 60 + 20) * 10) / 10); // 20-80
        }
        
        const data = {
            timestamps: timestamps,
            temperature: tempData,
            humidity: humidityData,
            moisture: moistureData
        };
        
        updateCharts(data);
        updateLatestReading(data);
    }
    
    // Function to fetch data for a sensor
    function fetchSensorData(sensorId) {
        // Show loading indication
        document.getElementById('latest-data').innerHTML = '<p>Loading...</p>';
        
        fetch(`/api/sensors/${sensorId}/chart-data`)
            .then(response => {
                if (!response.ok) {
                    throw new Error(`HTTP error! Status: ${response.status}`);
                }
                return response.json();
            })
            .then(data => {
                if (data && data.timestamps && data.timestamps.length > 0) {
                    updateCharts(data);
                    updateLatestReading(data);
                } else {
                    // Show no data message
                    document.getElementById('latest-data').innerHTML = '<p>No data available for this sensor</p>';
                    
                    // Clear charts
                    clearCharts();
                }
            })
            .catch(error => {
                console.error('Error fetching sensor data:', error);
                document.getElementById('latest-data').innerHTML = 
                    '<p>Error loading data. Please try again later.</p>';
                    
                // Optionally show dummy data for development
                // showDummyData();
            });
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
    
    // Function to format timestamps for display
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
        const formattedTimestamps = formatTimestamps(data.timestamps);
        const tempData = data.temperature;
        const humidityData = data.humidity;
        const moistureData = data.moisture;
        
        // Temperature chart
        tempChart = updateChart('tempChart', tempChart, 'Temperature (°C)', formattedTimestamps, tempData, 'rgba(255, 99, 132, 0.2)', 'rgba(255, 99, 132, 1)');
        
        // Humidity chart
        humidityChart = updateChart('humidityChart', humidityChart, 'Humidity (%)', formattedTimestamps, humidityData, 'rgba(54, 162, 235, 0.2)', 'rgba(54, 162, 235, 1)');
        
        // Moisture chart
        moistureChart = updateChart('moistureChart', moistureChart, 'Moisture (%)', formattedTimestamps, moistureData, 'rgba(75, 192, 192, 0.2)', 'rgba(75, 192, 192, 1)');
    }
    
    // Function to create or update a chart
    function updateChart(canvasId, chartObj, label, labels, data, backgroundColor, borderColor) {
        const ctx = document.getElementById(canvasId).getContext('2d');
        
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
        
        // Return the new chart object
        return newChart;
    }
    
    // Function to update the latest reading display
    function updateLatestReading(data) {
        const latestDataDiv = document.getElementById('latest-data');
        
        if (data.timestamps.length > 0) {
            // Get the most recent reading (last item in array)
            const lastIndex = data.timestamps.length - 1;
            
            // Format the timestamp properly
            const timestamp = new Date(data.timestamps[lastIndex]);
            const formattedTime = timestamp.toLocaleString('en-US', {
                weekday: 'short',
                year: 'numeric',
                month: 'short',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
                second: '2-digit'
            });
            
            const temp = data.temperature[lastIndex];
            const humidity = data.humidity[lastIndex];
            const moisture = data.moisture[lastIndex];
            
            // Update the HTML with better formatting
            latestDataDiv.innerHTML = `
                <div class="reading-item">
                    <span class="reading-label">Time:</span>
                    <span class="reading-value">${formattedTime}</span>
                </div>
                <div class="reading-item">
                    <span class="reading-label">Temperature:</span>
                    <span class="reading-value">${temp}°C</span>
                </div>
                <div class="reading-item">
                    <span class="reading-label">Humidity:</span>
                    <span class="reading-value">${humidity}%</span>
                </div>
                <div class="reading-item">
                    <span class="reading-label">Moisture:</span>
                    <span class="reading-value">${moisture}%</span>
                </div>
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
});
