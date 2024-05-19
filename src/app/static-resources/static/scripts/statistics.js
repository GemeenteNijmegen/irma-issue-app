

// Change chart on option update
document.getElementById('select').addEventListener('change', () => {
  plotData();
});

// Setup chart
const ctx = document.getElementById('chart');
const chart = new Chart(ctx, {
  type: 'line',
  data: {
    labels: [],
    datasets: [{
      label: 'Issue events',
      data: [],
      borderWidth: 1
    }]
  },
  options: {
    scales: {
      y: {
        beginAtZero: true
      }
    }
  }
});


// Plot data on page load
plotData();

function plotData(){ 
  
  // Per dag of per maand
  const scope = document.getElementById('select').value;
  
  // Get data
  const data = {
    "2024-05-01": 4,
    "2024-05-02": 24,
    "2024-05-03": 13,
    "2024-05-04": 38,
    "2024-05-05": 40,
    "2024-05-06": 60,
    "2024-05-07": 10,
    "2024-05-08": 10,
    "2024-05-09": 11,
    "2024-05-10": 44,
    "2024-05-11": 59,
    "2024-05-12": 108,
    "2024-05-13": 70,
    "2024-05-14": 93,
    "2024-05-15": 82,
    "2024-05-16": 94,
    "2024-05-17": 62,
    "2024-05-18": 82,
    "2024-05-19": 87,
  }

  const labels = Object.entries(data);
  const values = Object.values(data);

  chart.data.labels = labels;
  chart.data.datasets.forEach((dataset) => {
    dataset.data = values;
  });
  chart.update();

  

}