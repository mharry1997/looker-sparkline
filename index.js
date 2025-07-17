// visualization.js (Final Corrected Version)
looker.plugins.visualizations.add({
  id: 'single_value_sparkline_avg',
  label: 'Single Value Sparkline (Avg)',

  options: {
    sparkline_color: {
      type: 'string',
      label: 'Sparkline Color',
      display: 'color',
      default: '#60B17D'
    },
    value_color: {
      type: 'string',
      label: 'Value Color',
      display: 'color',
      default: '#424242'
    }
    // The 'value_format' option has been removed to use the field's native LookML formatting.
  },

  create: function(element, config) {
    element.innerHTML = `
      <style>
        .vis-container {
          display: flex;
          flex-direction: column;
          justify-content: center;
          align-items: center;
          height: 100%;
          font-family: 'Google Sans', 'Noto Sans', sans-serif;
        }
        .vis-value {
          font-size: 4em;
          font-weight: 500;
          margin-bottom: 8px;
        }
        .vis-sparkline-svg {
          width: 90%;
          height: 45%;
        }
        .sparkline-path {
          fill: none;
          stroke-width: 2.5;
        }
      </style>
      <div class="vis-container">
        <div class="vis-value"></div>
        <svg class="vis-sparkline-svg"></svg>
      </div>
    `;
  },

  updateAsync: function(data, element, config, queryResponse, details, done) {
    this.clearErrors();

    if (queryResponse.fields.dimensions.length !== 1 || queryResponse.fields.measures.length !== 2) {
      this.addError({
        title: 'Incorrect Configuration',
        message: 'This visualization requires exactly one dimension and two measures.'
      });
      return;
    }

    const sparklineMeasureName = queryResponse.fields.measures[0].name;
    const valueMeasureName = queryResponse.fields.measures[1].name;

    // --- Calculate and display the single value ---
    const valueData = data.map(row => row[valueMeasureName].value);
    const sum = valueData.reduce((acc, val) => acc + (val || 0), 0);
    const average = valueData.length > 0 ? sum / valueData.length : 0;

    const valueElement = element.querySelector('.vis-value');

    // --- THIS IS THE FINAL CORRECTED LINE ---
    // Use the formatter from the second measure's field definition via the 'details' object.
    // This uses the 'value_format' from your LookML.
    const valueFormatter = details.valueFormatters[valueMeasureName] || (value => value.toLocaleString());
    valueElement.textContent = valueFormatter(average);

    valueElement.style.color = config.value_color;

    // --- Draw the sparkline ---
    const sparklineData = data.map(row => row[sparklineMeasureName].value);
    const svg = element.querySelector('.vis-sparkline-svg');
    svg.innerHTML = '';

    if (sparklineData.length > 1) {
      const width = svg.clientWidth;
      const height = svg.clientHeight;
      const padding = 3;

      const minVal = Math.min(...sparklineData);
      const maxVal = Math.max(...sparklineData);
      const valRange = maxVal - minVal;

      const getX = (i) => (i / (sparklineData.length - 1)) * (width - padding * 2) + padding;
      const getY = (value) => height - ((value - minVal) / (valRange || 1)) * (height - padding * 2) - padding;

      const pathString = sparklineData.map((d, i) => {
        return (i === 0 ? 'M' : 'L') + `${getX(i)},${getY(d)}`;
      }).join(' ');

      const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
      path.setAttribute('d', pathString);
      path.setAttribute('class', 'sparkline-path');
      path.style.stroke = config.sparkline_color;
      svg.appendChild(path);
    }

    done();
  }
});
