export interface Movie {
  id: number;
  title: string;
  originalTitle: string;
  poster: string | null;
  backdrop: string | null;
  overview: string;
  releaseDate: string;
  runtime: number;
  genres: string[];
  rating: number;
  cast: string[];
  streaming: StreamingPlatform[];
  trailerUrl?: string;
}

export interface StreamingPlatform {
  id: string;
  name: string;
  logo: string;
  url: string;
}

export interface UserRating {
  stars: number;
  comment: string;
  date: string;
}

export interface LibraryEntry {
  movie: Movie;
  userRating: UserRating;
  addedAt: string;
}

export interface WatchlistEntry {
  movie: Movie;
  addedAt: string;
  recommendations: ReceivedRecommendation[];
}

export interface Contact {
  id: string;
  name: string;
  avatar: string;
  username: string;
}

export interface Circle {
  id: string;
  name: string;
  members: Contact[];
}

export interface SentRecommendation {
  id: string;
  movie: Movie;
  userRating: UserRating;
  recipients: (Contact | Circle)[];
  sentAt: string;
}

export interface ReceivedRecommendation {
  id: string;
  movie: Movie;
  sender: Contact;
  senderRating: UserRating;
  receivedAt: string;
  status: 'pending' | 'watchlisted' | 'seen' | 'ignored';
}

export interface AppUser {
  id: string;
  name: string;
  username: string;
  email: string;
  avatar: string;
}

export interface AppSettings {
  notificationsEnabled: boolean;
  recommendationAlerts: boolean;
  weeklyDigest: boolean;
}

export interface Genre {
  id: number;
  name: string;
}
