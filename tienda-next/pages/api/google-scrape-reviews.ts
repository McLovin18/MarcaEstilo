import type { NextApiRequest, NextApiResponse } from 'next';
// import puppeteer from 'puppeteer';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const placeId = req.query.place_id as string;
  if (!placeId) {
    return res.status(400).json({ error: 'Falta el place_id' });
  }

  // Use Google Maps Places API to fetch reviews
  const apiKey = process.env.GOOGLE_MAPS_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: 'Falta GOOGLE_MAPS_API_KEY en el entorno' });
  }
  const mapsUrl = `https://maps.googleapis.com/maps/api/place/details/json?place_id=${placeId}&fields=reviews,rating,user_ratings_total&language=es&key=${apiKey}`;

  try {
    // Fetch reviews from Google Maps Places API
    const response = await fetch(mapsUrl);
    const data = await response.json();
    if (!data.result || !data.result.reviews) {
      return res.status(200).json({ reviews: [], error: 'No se encontraron comentarios.' });
    }
    // Translate reviews if needed
    const reviews = await Promise.all(
      data.result.reviews.slice(0, 5).map(async (review: any) => {
        let text = review.text;
        // If text is not in Spanish, translate
        if (review.language !== 'es') {
          // Use Google Translate API or fallback to a simple translation
          // For demo, use a dummy translation function
          text = await dummyTranslateToSpanish(text);
        }
        return {
          author: review.author_name,
          text,
          rating: review.rating,
          date: review.relative_time_description,
          photo: review.profile_photo_url || '',
        };
      })
    );
    return res.status(200).json({ reviews });
  // Dummy translation function (replace with real API if needed)
  async function dummyTranslateToSpanish(text: string) {
    // In production, use Google Translate API or similar
    return '[Traducido automáticamente] ' + text;
  }
  } catch (e) {
    return res.status(500).json({ error: 'Error al hacer scraping', details: String(e) });
  }
}
