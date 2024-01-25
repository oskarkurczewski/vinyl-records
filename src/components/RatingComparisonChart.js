import { useEffect, useRef, useState } from 'react';
import * as d3 from 'd3';

const RatingComparisonChart = ({ data }) => {
  const chartRef = useRef();
  const [showUserRating, setShowUserRating] = useState(true);
  const [showOwnRating, setShowOwnRating] = useState(true);

  useEffect(() => {
    if (!data) return;

    const margin = { top: 60, right: 60, bottom: 60, left: 60 };
    const width = 1000 - margin.left - margin.right;
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
      .domain(data.map(d => d.album))
      .range([0, width])
      .padding(0.4)
      .align(0.5);

    const yScale = d3.scaleLinear()
      .domain([2.25, 5.25])
      .range([height, 0]);

    let filteredData = data;

    // Handle different cases for checkbox combinations
    if (!(showUserRating && showOwnRating)) {
      filteredData = data.filter(d => (showUserRating && d.rym_user_rating) || (showOwnRating && d.rym_own_rating));
    }

    // Draw circles for rym_user_rating
    mainSvg.selectAll('.user-rating-circle')
      .data(filteredData)
      .enter().append('circle')
      .attr('class', 'user-rating-circle')
      .attr('cx', d => xScale(d.album) + xScale.bandwidth() / 2)
      .attr('cy', d => showUserRating ? yScale(d.rym_user_rating) : height + 1000) // Adjusted the position when not visible
      .attr('r', 4)
      .attr('fill', 'blue')
      .attr('opacity', 0.7)
      .attr('data-album', d => d.album)
      .attr('pointer-events', 'all'); // Enable mouse events for the circle

    // Draw circles for rym_own_rating
    mainSvg.selectAll('.own-rating-circle')
      .data(filteredData)
      .enter().append('circle')
      .attr('class', 'own-rating-circle')
      .attr('cx', d => xScale(d.album) + xScale.bandwidth() / 2)
      .attr('cy', d => showOwnRating ? yScale(d.rym_own_rating) : height + 1000) // Adjusted the position when not visible
      .attr('r', 4)
      .attr('fill', 'green')
      .attr('opacity', 0.9)
      .attr('data-album', d => d.album)
      .attr('pointer-events', 'all'); // Enable mouse events for the circle

    // Add X-axis
    mainSvg.append('g')
      .attr('transform', `translate(0,${height})`)
      .call(d3.axisBottom(xScale))
      .selectAll('text')
      .remove(); // Remove album labels

    // Add Y-axis
    mainSvg.append('g')
      .call(d3.axisLeft(yScale));

    // Draw horizontal grid lines
    const yGrid = d3.axisLeft(yScale)
      .tickValues([2.5, 3, 3.5, 4, 4.5, 5])
      .tickSize(-width)
      .tickFormat('')
      .tickSizeOuter(0); // Hide the outermost ticks

    mainSvg.append('g')
      .attr('class', 'grid')
      .call(yGrid)
      .selectAll('line')
      .attr('opacity', 0.2); // Adjust opacity for subtle grid lines

    // Add Y-axis label
    mainSvg.append('text')
      .attr('class', 'axis-label')
      .attr('text-anchor', 'middle')
      .attr('transform', 'rotate(-90)')
      .attr('y', 0 - margin.left)
      .attr('x', 0 - height / 2)
      .attr('dy', '1em')
      .text('RateYourMusic.com ratings');

    // Add X-axis label
    mainSvg.append('text')
      .attr('class', 'axis-label')
      .attr('text-anchor', 'middle')
      .attr('transform', `translate(${width / 2},${height + 40})`) // Adjusted the y-coordinate
      .text('Albums');

    // Tooltip container
    const tooltipContainer = svg
      .append('div')
      .attr('class', 'tooltip-container')
      .style('opacity', 0)
      .style('position', 'absolute')
      .style('border', '1px solid darkgrey')
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

      tooltip.html(`${d.album}<br>User Rating: ${d.rym_user_rating}<br>Own Rating: ${d.rym_own_rating}`);
      
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
    <div>
      <div>
        <label>
          Show User Rating
          <input 
            type="checkbox" 
            checked={showUserRating}
            onChange={() => setShowUserRating(!showUserRating)}
          />
        </label>
      </div>
      <div>
        <label>
          Show Own Rating
          <input 
            type="checkbox" 
            checked={showOwnRating}
            onChange={() => setShowOwnRating(!showOwnRating)}
          />
        </label>
      </div>
      <div ref={chartRef}></div>
    </div>
  );
};

export default RatingComparisonChart;
