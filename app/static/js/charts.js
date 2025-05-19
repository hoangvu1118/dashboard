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
    }
    
    // Function to fetch data for a sensor
    function fetchSensorData(sensorId) {
        fetch(`/api/sensors/${sensorId}/chart-data`)
            .then(response => response.json())
            .then(data => {
                updateCharts(data);
                updateLatestReading(data);
            })
            .catch(error => {
                console.error('Error fetching sensor data:', error);
            });
    }
    
    // Function to update all charts
    function updateCharts(data) {
        const timestamps = data.timestamps;
        const tempData = data.temperature;
        const humidityData = data.humidity;
        const moistureData = data.moisture;
        
        // Temperature chart
        tempChart = updateChart('tempChart', tempChart, 'Temperature', timestamps, tempData, 'rgba(255, 99, 132, 0.2)', 'rgba(255, 99, 132, 1)');
        
        // Humidity chart
        humidityChart = updateChart('humidityChart', humidityChart, 'Humidity', timestamps, humidityData, 'rgba(54, 162, 235, 0.2)', 'rgba(54, 162, 235, 1)');
        
        // Moisture chart
        moistureChart = updateChart('moistureChart', moistureChart, 'Moisture', timestamps, moistureData, 'rgba(75, 192, 192, 0.2)', 'rgba(75, 192, 192, 1)');
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
                    tension: 0.1
                }]
            },
            options: {
                scales: {
                    y: {
                        beginAtZero: false
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
            const timestamp = new Date(data.timestamps[lastIndex]).toLocaleString();
            const temp = data.temperature[lastIndex];
            const humidity = data.humidity[lastIndex];
            const moisture = data.moisture[lastIndex];
            
            // Update the HTML
            latestDataDiv.innerHTML = `
                <p><strong>Time:</strong> ${timestamp}</p>
                <p><strong>Temperature:</strong> ${temp}°C</p>
                <p><strong>Humidity:</strong> ${humidity}%</p>
                <p><strong>Moisture:</strong> ${moisture}</p>
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
