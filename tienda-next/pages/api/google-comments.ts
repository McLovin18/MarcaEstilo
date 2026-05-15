import type { NextApiRequest, NextApiResponse } from 'next';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { place_id } = req.query;
  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;

  if (!place_id || !apiKey) {
    return res.status(400).json({ error: 'Missing place_id or API key' });
  }

  const url = `https://maps.googleapis.com/maps/api/place/details/json?place_id=${place_id}&fields=reviews&key=${apiKey}`;

  try {
    const response = await fetch(url);
    const json = await response.json();
    if (json.status === 'OK' && json.result && json.result.reviews) {
      // Solo los primeros 8 comentarios
      const reviews = json.result.reviews.slice(0, 8).map(r => ({
        author_name: r.author_name,
        profile_photo_url: r.profile_photo_url,
        rating: r.rating,
        text: r.text,
        time: r.time,
        relative_time_description: r.relative_time_description,
      }));
      return res.status(200).json({ reviews });
    } else {
      return res.status(500).json({ error: json.error_message || 'Google Maps API error', status: json.status });
    }
  } catch (error: any) {
    return res.status(500).json({ error: error.message || 'Fetch error' });
  }
}
