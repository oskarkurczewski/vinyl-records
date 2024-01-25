'use client'

import { useEffect, useState } from 'react';
import RatingComparisonChart from '../components/RatingComparisonChart';
import * as d3 from 'd3';

const fetchData = async () => {
  const rawData = await d3.dsv(";", "http://localhost:3000/albums.csv");

  // Extract only the necessary fields: "album", "rym_user_rating", "rym_own_rating"
  const albums = rawData.map(({ album, rym_user_rating, rym_own_rating }) => ({
    album,
    rym_user_rating: parseFloat(rym_user_rating), // Convert to a number if needed
    rym_own_rating: parseFloat(rym_own_rating),  // Convert to a number if needed
  }));

  console.log(rawData)

  return albums;
};

export default function Home() {
  const [albums, setAlbums] = useState(null);

  useEffect(() => {
    fetchData().then((data) => {
      setAlbums(data);
    });
  }, []);

  // const data = [
  //   { album: 'Album1', rym_user_rating: 4.5, rym_own_rating: 5 },
  //   { album: 'Album2', rym_user_rating: 3.8, rym_own_rating: 4 },
  //   // Add more data points...
  // ]

  console.log(albums)

  // console.log(albums)

  return (
    <main>
      <h1>Vinyl collection data</h1>
      <RatingComparisonChart data={albums} />
    </main>
  );
}
