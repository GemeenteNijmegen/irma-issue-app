

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
  },
});


// Plot data on page load
plotData();

function plotData(){ 
  
  // Per dag of per maand
  const scope = document.getElementById('select').value;
  
  // Fetch data from the same lambda as renders this page
  fetch(window.location.href + "?scope="+scope).then(response => {
    response.json().then(data => {
      const labels = Object.keys(data);
      const values = Object.values(data);
      console.log(data);
    
      chart.data.labels = labels;
      chart.data.datasets.forEach((dataset) => {
        dataset.data = values;
      });
      console.log('Updating chart...');
      chart.update();
    });
  }).catch(error => {
    console.error(error);
  });

}