

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

const table = document.getElementById('statistics-table');

function updateTable(data) {
  let body = '<tbody>';
  for(let dataPoint of Object.keys(data).reverse()) {
    body += `<tr>
      <td>${dataPoint}</td><td>${data[dataPoint]}</td>
    </tr>`;
  }
  body += '</tbody>';
  const newBody = htmlStringToElement(body);
  const oldBody = table.querySelector('tbody');
  oldBody.replaceWith(newBody);
}

// Plot data on page load
plotData();

function plotData(){ 
  
  // Per dag of per maand
  const scope = document.getElementById('select').value;
  
  // Fetch data from the same lambda as renders this page
  fetch(window.location.href + "?scope="+scope).then(response => {
    response.json().then(data => {
      const labels = Object.keys(data).reverse();
      const values = Object.values(data).reverse();
      console.log(data);
    
      chart.data.labels = labels;
      chart.data.datasets.forEach((dataset) => {
        dataset.data = values;
      });
      console.log('Updating chart...');
      chart.update();
      updateTable(data);
    });
  }).catch(error => {
    console.error(error);
  });

/**
 * Transform an html-string to an actual nodetree
 * 
 * @param {string} html the valid HTML as as string
 * @returns {Node} the html node
 */
function htmlStringToElement(html) {
  var template = document.createElement('template');
  html = html.trim(); // Never return a text node of whitespace as the result
  template.innerHTML = html;
  return template.content.firstChild;
}
