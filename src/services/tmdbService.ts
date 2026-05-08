import { Movie } from '../types';

const TMDB_BASE_URL = 'https://api.themoviedb.org/3';
const TMDB_IMAGE_BASE = 'https://image.tmdb.org/t/p';
const API_KEY = process.env.EXPO_PUBLIC_TMDB_API_KEY || '';

function mapTmdbMovie(raw: any): Movie {
  return {
    id: raw.id,
    title: raw.title || raw.name,
    originalTitle: raw.original_title || raw.original_name,
    poster: raw.poster_path ? `${TMDB_IMAGE_BASE}/w500${raw.poster_path}` : null,
    backdrop: raw.backdrop_path ? `${TMDB_IMAGE_BASE}/w1280${raw.backdrop_path}` : null,
    overview: raw.overview || '',
    releaseDate: raw.release_date || raw.first_air_date || '',
    runtime: raw.runtime || 0,
    genres: (raw.genres || []).map((g: any) => g.name),
    rating: raw.vote_average || 0,
    cast: [],
    streaming: [],
  };
}

export async function searchMovies(query: string): Promise<Movie[]> {
  if (!API_KEY || !query.trim()) return [];
  try {
    const url = `${TMDB_BASE_URL}/search/movie?api_key=${API_KEY}&query=${encodeURIComponent(query)}&language=fr-FR`;
    const res = await fetch(url);
    const data = await res.json();
    return (data.results || []).slice(0, 20).map(mapTmdbMovie);
  } catch {
    return [];
  }
}

export async function getMovieDetails(id: number): Promise<Movie | null> {
  if (!API_KEY) return null;
  try {
    const [detailsRes, creditsRes, watchRes] = await Promise.all([
      fetch(`${TMDB_BASE_URL}/movie/${id}?api_key=${API_KEY}&language=fr-FR`),
      fetch(`${TMDB_BASE_URL}/movie/${id}/credits?api_key=${API_KEY}`),
      fetch(`${TMDB_BASE_URL}/movie/${id}/watch/providers?api_key=${API_KEY}`),
    ]);
    const details = await detailsRes.json();
    const credits = await creditsRes.json();
    const watchProviders = await watchRes.json();
    const movie = mapTmdbMovie(details);
    movie.cast = (credits.cast || []).slice(0, 5).map((c: any) => c.name);
    const frProviders = watchProviders.results?.FR;
    if (frProviders?.flatrate) {
      movie.streaming = frProviders.flatrate.map((p: any) => ({
        id: String(p.provider_id),
        name: p.provider_name,
        logo: `${TMDB_IMAGE_BASE}/w45${p.logo_path}`,
        url: frProviders.link || '',
      }));
    }
    return movie;
  } catch {
    return null;
  }
}
