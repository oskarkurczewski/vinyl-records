import { useEffect, useRef, useState } from 'react';
import * as d3 from 'd3';

const RatingComparisonChart = ({ data }) => {
  const chartRef = useRef();
  const [showUserRating, setShowUserRating] = useState(true);
  const [showOwnRating, setShowOwnRating] = useState(true);
  const [showPriceGraph, setShowPriceGraph] = useState(true);
  const [sortByReleaseDate, setSortByReleaseDate] = useState(true); // New state for sorting

  useEffect(() => {
    if (!data) return;

    let sortedData;
    if (sortByReleaseDate) {
      sortedData = [...data].sort((a, b) => {
        const dateA = d3.timeParse('%Y-%m-%d')(a.release_date);
        const dateB = d3.timeParse('%Y-%m-%d')(b.release_date);
        return d3.ascending(dateA, dateB);
      });
    } else {
      sortedData = [...data].sort((a, b) => a.current_price - b.current_price);
    }

    const margin = { top: 60, right: 120, bottom: 60, left: 60 };
    const width = 1400 - margin.left - margin.right;
    const height = 800 - margin.top - margin.bottom;

    const svg = d3.select(chartRef.current);
    svg.selectAll('*').remove();

    const mainSvg = svg
      .append('svg')
      .attr('width', width + margin.left + margin.right)
      .attr('height', height + margin.top + margin.bottom)
      .append('g')
      .attr('transform', `translate(${margin.left},${margin.top})`);

    const xScale = d3.scaleBand()
      .domain(sortedData.map(d => d.album))
      .range([0, width])
      .padding(0.8)
      .align(0.5);

    const yScaleRating = d3.scaleLinear()
      .domain([2, 5])
      .range([height, 0]);

    const maxPrice = 225;
    const yScalePrice = d3.scaleLinear()
      .domain([0, maxPrice])
      .range([height, 0])
      .nice();

    let filteredData = sortedData;

    if (!(showUserRating && showOwnRating) && (showPriceGraph || (!showUserRating && !showOwnRating))) {
      filteredData = sortedData.filter(d => (showUserRating && d.rym_user_rating) || (showOwnRating && d.rym_own_rating));
    }

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

    mainSvg.selectAll('.user-rating-circle')
      .data(filteredData)
      .enter().append('circle')
      .attr('class', 'user-rating-circle')
      .attr('style', 'z-index: 1;')
      .attr('cx', d => xScale(d.album) + xScale.bandwidth() / 2)
      .attr('cy', d => showUserRating ? yScaleRating(d.rym_user_rating) : height + 1000)
      .attr('r', 8)
      .attr('fill', '#3D348B')
      .attr('data-album', d => d.album)
      .attr('pointer-events', 'all');

    mainSvg.selectAll('.own-rating-circle')
      .data(filteredData)
      .enter().append('circle')
      .attr('class', 'own-rating-circle')
      .attr('style', 'z-index: 1;')
      .attr('cx', d => xScale(d.album) + xScale.bandwidth() / 2)
      .attr('cy', d => showOwnRating ? yScaleRating(d.rym_own_rating) : height + 1000)
      .attr('r', 8)
      .attr('fill', '#E6AF2E')
      .attr('data-album', d => d.album)
      .attr('pointer-events', 'all');

    mainSvg.append('g')
      .attr('transform', `translate(0,${height})`)
      .call(d3.axisBottom(xScale))
      .selectAll('text')
      .remove();

    mainSvg.append('g')
      .call(d3.axisLeft(yScaleRating).tickValues([2, 2.5, 3, 3.5, 4, 4.5, 5]));

    const yGridRating = d3.axisLeft(yScaleRating)
      .tickValues([2.5, 3, 3.5, 4, 4.5])
      .tickSize(-width)
      .tickFormat('')
      .tickSizeOuter(0);

    mainSvg.insert('g', ':first-child')
      .attr('class', 'grid')
      .call(yGridRating)
      .selectAll('line')
      .attr('opacity', 0.2);

    mainSvg.append('g')
      .attr('transform', `translate(${width}, 0)`)
      .call(d3.axisRight(yScalePrice)
        .ticks(5)
        .tickFormat(d => `PLN ${d.toFixed(2)}`)
        .scale(yScalePrice));

    const areaGenerator = d3.area()
      .x(d => xScale(d.album) + xScale.bandwidth() / 2)
      .y0(height)
      .y1(d => yScalePrice(+d.current_price));

    if (showPriceGraph) {
      console.log(filteredData)
      mainSvg.insert('path', ':first-child')
        .datum(sortedData)
        .attr('class', 'area')
        .attr('d', areaGenerator)
        .attr('fill', '#499647')
        .attr('opacity', 0.5);
    } else {
      mainSvg.selectAll('.area').remove();
    }

    // Tooltip container
    const tooltipContainer = d3.select(chartRef.current)
      .append('div')
      .attr('class', 'tooltip-container')
      .style('opacity', 0)
      .style('position', 'absolute')
      .style('border', '1px solid darkgrey')
      .style('border-radius', '2px')
      .style('background-color', 'rgba(245, 245, 245, 0.7)')
      .style('padding', '8px');

    // Tooltip
    const tooltip = tooltipContainer
      .append('div')
      .attr('class', 'tooltip');

    // Mouseover event for circles
    const handleMouseOver = (event, d) => {
      tooltipContainer.transition()
        .duration(250)
        .style('opacity', 1)

      tooltip.html(`<strong>${d.album}</strong><br>Release date: ${d.release_date}<br><br>User Rating: ${d.rym_user_rating}<br>Own Rating: ${d.rym_own_rating}`);
      
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
    svg.selectAll('.user-rating-circle, .own-rating-circle')
      .on('mouseover', handleMouseOver)
      .on('mouseout', handleMouseOut);

    }, [data, showUserRating, showOwnRating, showPriceGraph, sortByReleaseDate]); // Add sortByReleaseDate to the dependency array

    const handleUserRatingChange = () => {
      setShowUserRating(!showUserRating);
    };
  
    const handleOwnRatingChange = () => {
      setShowOwnRating(!showOwnRating);
    };
  
    const handlePriceGraphChange = () => {
      setShowPriceGraph(!showPriceGraph);
    };
  
    const handleSortByReleaseDateChange = () => {
      setSortByReleaseDate(true);
    };
  
    const handleSortByPriceChange = () => {
      setSortByReleaseDate(false);
    };
  
    return (
      <>
        <div className='inputs'>
          <div className='checkboxes'>
            <div>
              <label>
                <input 
                  type="checkbox" 
                  checked={showUserRating}
                  onChange={handleUserRatingChange}
                />
                Show<div className='user-rating'> User Rating</div>
              </label>
            </div>
            <div>
              <label>
                <input 
                  type="checkbox"
                  checked={showOwnRating}
                  onChange={handleOwnRatingChange}
                />
                Show<div className="personal-rating"> Personal Rating</div>
              </label>
            </div>
            <div>
              <label>
                <input 
                  type="checkbox" 
                  checked={showPriceGraph}
                  onChange={handlePriceGraphChange}
                />
                Show <div className="price">Price Graph</div>
              </label>
            </div>
          </div>
          <div className='radiobuttons'>
            <div>
              <label>
                <input 
                  type="radio" 
                  checked={sortByReleaseDate}
                  onChange={handleSortByReleaseDateChange}
                />
                Sort By Release Date (oldest/newest)
              </label>
            </div>
            <div>
              <label>
                <input 
                  type="radio" 
                  checked={!sortByReleaseDate}
                  onChange={handleSortByPriceChange}
                />
                Sort By Price (cheapest/most expensive)
              </label>
            </div>
          </div>
        </div>
        <div ref={chartRef}></div>
      </>
    );
  };
  
  export default RatingComparisonChart;