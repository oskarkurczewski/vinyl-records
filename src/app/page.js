'use client'

import { useEffect, useState } from 'react';
import RatingComparisonChart from '../components/RatingComparisonChart';
import * as d3 from 'd3';

const fetchData = async () => {
  const rawData = await d3.dsv(";", "https://vercel.com/api/v7/deployments/dpl_9Ytz5TWBrha6Jszg9yAY2Zq6t79r/files/get?path=public%2Falbums.csv");

  const albums = rawData.map(({ album, current_price, release_date, rym_user_rating, rym_own_rating }) => ({
    album,
    current_price: parseFloat(current_price.replace(',', '.')),
    release_date,
    rym_user_rating: parseFloat(rym_user_rating), // Convert to a number if needed
    rym_own_rating: parseFloat(rym_own_rating),  // Convert to a number if needed
  }));

  return albums;
};

export default function Home() {
  const [albums, setAlbums] = useState(null);

  useEffect(() => {
    fetchData().then((data) => {
      setAlbums(data);
    });
  }, []);

  console.log(albums)

  return (
    <main>
      <h1>Vinyl record collection</h1>
      <RatingComparisonChart data={albums} />
    </main>
  );
}
