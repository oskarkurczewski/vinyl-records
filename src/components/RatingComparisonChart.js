import { useEffect, useRef, useState } from 'react';
import * as d3 from 'd3';

const RatingComparisonChart = ({ data }) => {
  const chartRef = useRef();
  const [showUserRating, setShowUserRating] = useState(true);
  const [showOwnRating, setShowOwnRating] = useState(true);

  useEffect(() => {
    if (!data) return;

    // Sort the data by release date (oldest to newest)
    const sortedData = [...data].sort((a, b) => {
      const dateA = d3.timeParse('%Y-%m-%d')(a.release_date);
      const dateB = d3.timeParse('%Y-%m-%d')(b.release_date);
      return d3.ascending(dateA, dateB);
    });

    const margin = { top: 60, right: 120, bottom: 60, left: 60 };
    const width = 1400 - margin.left - margin.right;
    const height = 800 - margin.top - margin.bottom;

    const svg = d3.select(chartRef.current);
    svg.selectAll('*').remove(); // Clear existing elements

    const mainSvg = svg
      .append('svg')
      .attr('width', width + margin.left + margin.right)
      .attr('height', height + margin.top + margin.bottom)
      .append('g')
      .attr('transform', `translate(${margin.left},${margin.top})`);

    const xScale = d3.scaleBand()
      .domain(sortedData.map(d => d.album))
      .range([0, width])
      .padding(0.8) // Adjusted padding for more space between albums
      .align(0.5);

    const yScaleRating = d3.scaleLinear()
      .domain([2, 5])
      .range([height, 0]);

    const maxPrice = 250; // Maximum price in PLN
    const minRating = 2; // Minimum rating
    const maxRating = 5; // Maximum rating

    // Adjusted the scale to align 150 PLN with a rating of 4.0
    const yScalePrice = d3.scaleLinear()
      .domain([0, maxPrice])
      .range([height, 0])
      .nice();

    let filteredData = sortedData;

    // Handle different cases for checkbox combinations
    if (!(showUserRating && showOwnRating)) {
      filteredData = sortedData.filter(d => (showUserRating && d.rym_user_rating) || (showOwnRating && d.rym_own_rating));
    }

    // Draw lines connecting user and own rating circles
    if (showUserRating && showOwnRating) {
      mainSvg.selectAll('.line')
        .data(filteredData)
        .enter().append('line')
        .attr('class', 'line')
        .attr('x1', d => xScale(d.album) + xScale.bandwidth() / 2)
        .attr('y1', d => yScaleRating(d.rym_user_rating))
        .attr('x2', d => xScale(d.album) + xScale.bandwidth() / 2)
        .attr('y2', d => yScaleRating(d.rym_own_rating))
        .attr('stroke', 'gray')
        .attr('stroke-width', 4)
        .attr('opacity', 0.5);
    }

    // Draw circles for rym_user_rating
    mainSvg.selectAll('.user-rating-circle')
      .data(filteredData)
      .enter().append('circle')
      .attr('class', 'user-rating-circle')
      .attr('cx', d => xScale(d.album) + xScale.bandwidth() / 2)
      .attr('cy', d => showUserRating ? yScaleRating(d.rym_user_rating) : height + 1000) // Adjusted the position when not visible
      .attr('r', 8)
      .attr('fill', '#3D348B')
      .attr('data-album', d => d.album)
      .attr('pointer-events', 'all'); // Enable mouse events for the circle

    // Draw circles for rym_own_rating
    mainSvg.selectAll('.own-rating-circle')
      .data(filteredData)
      .enter().append('circle')
      .attr('class', 'own-rating-circle')
      .attr('cx', d => xScale(d.album) + xScale.bandwidth() / 2)
      .attr('cy', d => showOwnRating ? yScaleRating(d.rym_own_rating) : height + 1000) // Adjusted the position when not visible
      .attr('r', 8)
      .attr('fill', '#E6AF2E')
      .attr('data-album', d => d.album)
      .attr('pointer-events', 'all'); // Enable mouse events for the circle

    // Add X-axis
    mainSvg.append('g')
      .attr('transform', `translate(0,${height})`)
      .call(d3.axisBottom(xScale))
      .selectAll('text')
      .remove(); // Remove album labels

    // Add left Y-axis for ratings
    mainSvg.append('g')
      .call(d3.axisLeft(yScaleRating).tickValues([2, 2.5, 3, 3.5, 4, 4.5, 5]));

    // Draw horizontal grid lines for ratings
    const yGridRating = d3.axisLeft(yScaleRating)
      .tickValues([2.5, 3, 3.5, 4, 4.5])
      .tickSize(-width)
      .tickFormat('')
      .tickSizeOuter(0); // Hide the outermost ticks

    mainSvg.append('g')
      .attr('class', 'grid')
      .call(yGridRating)
      .selectAll('line')
      .attr('opacity', 0.2); // Adjust opacity for subtle grid lines

    // Add right Y-axis for prices
    mainSvg.append('g')
      .attr('transform', `translate(${width}, 0)`)
      .call(d3.axisRight(yScalePrice)
        .ticks(5)
        .tickFormat(d => `PLN ${d.toFixed(2)}`)
        .scale(yScalePrice));

    // Draw area graph for current price
    const areaGenerator = d3.area()
      .x(d => xScale(d.album) + xScale.bandwidth() / 2)
      .y0(height)
      .y1(d => yScalePrice(+d.current_price));

    mainSvg.append('path')
      .datum(filteredData)
      .attr('class', 'area')
      .attr('d', areaGenerator)
      .attr('fill', '#499647')
      .attr('opacity', 0.5);

    // Tooltip container
    const tooltipContainer = svg
      .append('div')
      .attr('class', 'tooltip-container')
      .style('opacity', 0)
      .style('position', 'absolute')
      .style('border', '1px solid darkgrey')
      .style('border-radius', '4px')
      .style('background-color', 'rgba(245, 245, 245, 0.7)')
      .style('padding', '8px');

    // Tooltip
    const tooltip = tooltipContainer
      .append('div')
      .attr('class', 'tooltip');

    // Mouseover event for circles
    const handleMouseOver = (event, d) => {
      tooltipContainer.transition()
        .duration(200)
        .style('opacity', 0.9);

      tooltip.html(`<h2>${d.album}</h2><br>Release Date: ${d.release_date}<br><br>User Rating: ${d.rym_user_rating}<br>Personal Rating: ${d.rym_own_rating}<br>Current Price: PLN ${d.current_price}`);
      
      // Position tooltip using clientX and clientY
      tooltipContainer.style('left', `${event.clientX + 10}px`)
        .style('top', `${event.clientY + 10}px`);
    };

    // Mouseout event for circles
    const handleMouseOut = () => {
      tooltipContainer.transition()
        .duration(500)
        .style('opacity', 0);
    };

    // Apply mouseover and mouseout events to both circles
    mainSvg.selectAll('.user-rating-circle, .own-rating-circle')
      .on('mouseover', handleMouseOver)
      .on('mouseout', handleMouseOut);

  }, [data, showUserRating, showOwnRating]);

  return (
    <>
      <div className='inputs'>
        <div>
          <label>
            <input 
              type="checkbox" 
              checked={showUserRating}
              onChange={() => setShowUserRating(!showUserRating)}
            />
            Show User Rating
          </label>
        </div>
        <div>
          <label>
            <input 
              type="checkbox" 
              checked={showOwnRating}
              onChange={() => setShowOwnRating(!showOwnRating)}
            />
            Show Personal Rating
          </label>
        </div>
      </div>
      <div ref={chartRef}></div>
    </>
  );
};

export default RatingComparisonChart;
