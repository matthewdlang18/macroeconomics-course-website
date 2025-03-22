class MapVisualizer {
    constructor(containerId) {
        this.container = document.getElementById(containerId);
        this.width = this.container.clientWidth;
        this.height = 500;
        this.projection = d3.geoMercator()
            .scale(150)
            .center([0, 20])
            .translate([this.width / 2, this.height / 2]);
        
        this.path = d3.geoPath().projection(this.projection);
        this.svg = null;
        this.tooltip = null;
        this.initialize();
    }

    initialize() {
        // Clear any existing content
        this.container.innerHTML = '';
        
        // Create SVG
        this.svg = d3.select(this.container)
            .append('svg')
            .attr('width', this.width)
            .attr('height', this.height)
            .style('background-color', '#f8fafc');
        
        // Create tooltip
        this.tooltip = d3.select('body')
            .append('div')
            .attr('class', 'tooltip')
            .style('opacity', 0)
            .style('position', 'absolute')
            .style('background-color', 'white')
            .style('padding', '10px')
            .style('border', '1px solid #ddd')
            .style('border-radius', '4px')
            .style('pointer-events', 'none');
    }

    drawMap(geoData, countryData, dataType = 'gdp') {
        if (!geoData || !geoData.features || !countryData) {
            console.error('Invalid data provided to drawMap');
            return;
        }

        if (!this.svg) this.initialize();
        
        // Clear existing content
        this.svg.selectAll('*').remove();
        
        // Add zoom behavior
        const zoom = d3.zoom()
            .scaleExtent([1, 8])
            .on('zoom', (event) => {
                this.svg.selectAll('path')
                    .attr('transform', event.transform);
            });
        
        this.svg.call(zoom);
        
        // Create color scale
        const values = countryData
            .map(d => d[dataType])
            .filter(d => !isNaN(d) && d !== null);
            
        const colorScale = d3.scaleSequential(d3.interpolateBlues)
            .domain([d3.min(values), d3.max(values)]);
        
        // Draw countries
        this.svg.selectAll('path')
            .data(geoData.features)
            .enter()
            .append('path')
            .attr('d', this.path)
            .attr('class', 'country')
            .attr('fill', d => {
                const countryInfo = countryData.find(c => 
                    c.id === d.id || 
                    c.id === d.properties.name
                );
                return countryInfo ? colorScale(countryInfo[dataType]) : '#eee';
            })
            .attr('stroke', '#fff')
            .attr('stroke-width', '0.5')
            .on('mouseover', (event, d) => {
                const countryInfo = countryData.find(c => 
                    c.id === d.id || 
                    c.id === d.properties.name
                );
                
                if (countryInfo) {
                    this.tooltip
                        .transition()
                        .duration(200)
                        .style('opacity', 0.9);
                    
                    const value = countryInfo[dataType];
                    const formattedValue = dataType === 'gdp' 
                        ? value.toLocaleString('en-US', {maximumFractionDigits: 2})
                        : value.toLocaleString('en-US', {maximumFractionDigits: 3});
                    
                    this.tooltip.html(
                        `<strong>${countryInfo.name}</strong><br/>
                        ${dataType.toUpperCase()}: ${formattedValue}`
                    )
                    .style('left', (event.pageX + 10) + 'px')
                    .style('top', (event.pageY - 28) + 'px');
                }
            })
            .on('mouseout', () => {
                this.tooltip
                    .transition()
                    .duration(500)
                    .style('opacity', 0);
            });
    }

    updateMap(countryData, dataType) {
        this.drawMap(window.geoData, countryData, dataType);
    }
}
