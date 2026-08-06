import { Movie, Genre } from '../types';

const TMDB_BASE_URL = 'https://api.themoviedb.org/3';
const TMDB_IMAGE_BASE = 'https://image.tmdb.org/t/p';

const API_KEY = process.env.EXPO_PUBLIC_TMDB_API_KEY || '';

// Stable TMDB genre IDs → French names (avoids an extra API call)
const GENRE_MAP: Record<number, string> = {
  28: 'Action',
  12: 'Aventure',
  16: 'Animation',
  35: 'Comédie',
  80: 'Crime',
  99: 'Documentaire',
  18: 'Drame',
  10751: 'Famille',
  14: 'Fantastique',
  36: 'Histoire',
  27: 'Horreur',
  10402: 'Musique',
  9648: 'Mystère',
  10749: 'Romance',
  878: 'Science-Fiction',
  53: 'Thriller',
  10752: 'Guerre',
  37: 'Western',
};

export const POPULAR_GENRES: Genre[] = [
  { id: 28, name: 'Action' },
  { id: 35, name: 'Comédie' },
  { id: 18, name: 'Drame' },
  { id: 53, name: 'Thriller' },
  { id: 878, name: 'Sci-Fi' },
  { id: 27, name: 'Horreur' },
  { id: 10749, name: 'Romance' },
  { id: 16, name: 'Animation' },
];

function mapTmdbMovie(raw: any): Movie {
  const genres = raw.genres
    ? raw.genres.map((g: any) => g.name)
    : (raw.genre_ids || []).map((id: number) => GENRE_MAP[id]).filter(Boolean);

  return {
    id: raw.id,
    title: raw.title || raw.name,
    originalTitle: raw.original_title || raw.original_name,
    poster: raw.poster_path ? `${TMDB_IMAGE_BASE}/w500${raw.poster_path}` : null,
    backdrop: raw.backdrop_path ? `${TMDB_IMAGE_BASE}/w1280${raw.backdrop_path}` : null,
    overview: raw.overview || '',
    releaseDate: raw.release_date || raw.first_air_date || '',
    runtime: raw.runtime || 0,
    genres,
    rating: raw.vote_average || 0,
    cast: [],
    streaming: [],
  };
}

async function tmdbFetch(endpoint: string): Promise<any> {
  if (!API_KEY) return null;
  try {
    const sep = endpoint.includes('?') ? '&' : '?';
    const res = await fetch(`${TMDB_BASE_URL}${endpoint}${sep}api_key=${API_KEY}&language=fr-FR`);
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  }
}

export async function searchMovies(query: string): Promise<Movie[]> {
  if (!API_KEY || !query.trim()) return [];
  const data = await tmdbFetch(`/search/movie?query=${encodeURIComponent(query)}`);
  return (data?.results || []).slice(0, 20).map(mapTmdbMovie);
}

export async function getTrendingMovies(): Promise<Movie[]> {
  const data = await tmdbFetch('/trending/movie/week');
  return (data?.results || []).slice(0, 10).map(mapTmdbMovie);
}

export async function getPopularMovies(): Promise<Movie[]> {
  const data = await tmdbFetch('/movie/popular');
  return (data?.results || []).slice(0, 10).map(mapTmdbMovie);
}

export async function searchMoviesByGenre(genreId: number): Promise<Movie[]> {
  const data = await tmdbFetch(`/discover/movie?with_genres=${genreId}&sort_by=popularity.desc`);
  return (data?.results || []).slice(0, 20).map(mapTmdbMovie);
}

export async function getMovieDetails(id: number): Promise<Movie | null> {
  if (!API_KEY) return null;
  try {
    const [details, credits, watchProviders, videos] = await Promise.all([
      tmdbFetch(`/movie/${id}`),
      tmdbFetch(`/movie/${id}/credits`),
      tmdbFetch(`/movie/${id}/watch/providers`),
      tmdbFetch(`/movie/${id}/videos`),
    ]);

    if (!details) return null;

    const movie = mapTmdbMovie(details);
    movie.cast = (credits?.cast || []).slice(0, 6).map((c: any) => c.name);

    const frProviders = watchProviders?.results?.FR;
    if (frProviders?.flatrate) {
      movie.streaming = frProviders.flatrate.map((p: any) => ({
        id: String(p.provider_id),
        name: p.provider_name,
        logo: `${TMDB_IMAGE_BASE}/w45${p.logo_path}`,
        url: frProviders.link || '',
      }));
    }

    // Prefer French trailer, fallback to any YouTube trailer
    const allVideos: any[] = videos?.results || [];
    const trailer =
      allVideos.find((v) => v.type === 'Trailer' && v.site === 'YouTube' && v.iso_639_1 === 'fr') ||
      allVideos.find((v) => v.type === 'Trailer' && v.site === 'YouTube') ||
      allVideos.find((v) => v.site === 'YouTube');
    if (trailer?.key) {
      movie.trailerUrl = `https://www.youtube.com/watch?v=${trailer.key}`;
    }

    return movie;
  } catch {
    return null;
  }
}
