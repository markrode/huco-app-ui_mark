import { Movie, Contact, Circle, LibraryEntry, WatchlistEntry, ReceivedRecommendation } from '../types';

export const MOCK_MOVIES: Movie[] = [
  {
    id: 278,
    title: 'Les Évadés',
    originalTitle: 'The Shawshank Redemption',
    poster: 'https://image.tmdb.org/t/p/w500/q6y0Go1tsGEsmtFryDOJo3dEmqu.jpg',
    backdrop: 'https://image.tmdb.org/t/p/w1280/kXfqcdQKsToO0OUXHcrrNCHDBzO.jpg',
    overview: "Un comptable innocent est condamné à la prison à vie. À travers des années d'épreuves, il conserve l'espoir grâce à une amitié improbable.",
    releaseDate: '1994-09-23',
    runtime: 142,
    genres: ['Drame'],
    rating: 9.3,
    cast: ['Tim Robbins', 'Morgan Freeman', 'Bob Gunton'],
    streaming: [{ id: 'netflix', name: 'Netflix', logo: 'N', url: 'https://netflix.com' }],
  },
  {
    id: 238,
    title: 'Le Parrain',
    originalTitle: 'The Godfather',
    poster: 'https://image.tmdb.org/t/p/w500/3bhkrj58Vtu7enYsLe1rjd1oJkI.jpg',
    backdrop: 'https://image.tmdb.org/t/p/w1280/tmU7GeKVybMWFButWEGl2M4GeiP.jpg',
    overview: "Le vieux Don Vito Corleone est le chef respecté d'une puissante famille de la mafia.",
    releaseDate: '1972-03-14',
    runtime: 175,
    genres: ['Crime', 'Drame'],
    rating: 9.2,
    cast: ['Marlon Brando', 'Al Pacino', 'James Caan'],
    streaming: [{ id: 'prime', name: 'Prime Video', logo: 'P', url: 'https://primevideo.com' }],
  },
  {
    id: 424,
    title: 'La Liste de Schindler',
    originalTitle: "Schindler's List",
    poster: 'https://image.tmdb.org/t/p/w500/sF1U4EUQS8YHUYjNl3pMGNIQyr0.jpg',
    backdrop: 'https://image.tmdb.org/t/p/w1280/loRmRzQXZeqG78TqZuyvSlEQfZb.jpg',
    overview: 'Pendant la Seconde Guerre mondiale, un industriel allemand sauve plus de mille Juifs polonais.',
    releaseDate: '1993-11-30',
    runtime: 195,
    genres: ['Drame', 'Histoire'],
    rating: 9.0,
    cast: ['Liam Neeson', 'Ralph Fiennes', 'Ben Kingsley'],
    streaming: [],
  },
  {
    id: 550,
    title: 'Fight Club',
    originalTitle: 'Fight Club',
    poster: 'https://image.tmdb.org/t/p/w500/pB8BM7pdSp6B6Ih7QZ4DrQ3PmJK.jpg',
    backdrop: 'https://image.tmdb.org/t/p/w1280/hZkgoQYus5vegHoetLkCJzb17zJ.jpg',
    overview: 'Un employé de bureau insomniaque et un fabricant de savon charismatique forment un club clandestin de combat.',
    releaseDate: '1999-10-15',
    runtime: 139,
    genres: ['Drame', 'Thriller'],
    rating: 8.8,
    cast: ['Brad Pitt', 'Edward Norton', 'Helena Bonham Carter'],
    streaming: [{ id: 'disney', name: 'Disney+', logo: 'D', url: 'https://disneyplus.com' }],
  },
  {
    id: 13,
    title: 'Forrest Gump',
    originalTitle: 'Forrest Gump',
    poster: 'https://image.tmdb.org/t/p/w500/arw2vcBveWOVZr6pxd9XTd1TdQa.jpg',
    backdrop: 'https://image.tmdb.org/t/p/w1280/7c9UVPPiTPltouxRVY6N9uugaVA.jpg',
    overview: "La vie extraordinaire de Forrest Gump, un homme simple d'esprit.",
    releaseDate: '1994-07-06',
    runtime: 142,
    genres: ['Comédie', 'Drame', 'Romance'],
    rating: 8.8,
    cast: ['Tom Hanks', 'Robin Wright', 'Gary Sinise'],
    streaming: [
      { id: 'netflix', name: 'Netflix', logo: 'N', url: 'https://netflix.com' },
      { id: 'prime', name: 'Prime Video', logo: 'P', url: 'https://primevideo.com' },
    ],
  },
  {
    id: 680,
    title: 'Pulp Fiction',
    originalTitle: 'Pulp Fiction',
    poster: 'https://image.tmdb.org/t/p/w500/d5iIlFn5s0ImszYzBPb8JPIfbXD.jpg',
    backdrop: 'https://image.tmdb.org/t/p/w1280/suaEOtk1N1sgg2MTM7oZd2cfVp3.jpg',
    overview: 'Les histoires de plusieurs criminels de Los Angeles se croisent dans ce film culte de Quentin Tarantino.',
    releaseDate: '1994-10-14',
    runtime: 154,
    genres: ['Thriller', 'Crime'],
    rating: 8.9,
    cast: ['John Travolta', 'Uma Thurman', 'Samuel L. Jackson'],
    streaming: [{ id: 'canal', name: 'Canal+', logo: 'C', url: 'https://canalplus.com' }],
  },
];

export const MOCK_CONTACTS: Contact[] = [
  { id: 'c1', name: 'Alice Martin', avatar: 'AM', username: '@alice' },
  { id: 'c2', name: 'Baptiste Durand', avatar: 'BD', username: '@baptiste' },
  { id: 'c3', name: 'Clara Petit', avatar: 'CP', username: '@clara' },
  { id: 'c4', name: 'David Moreau', avatar: 'DM', username: '@david' },
  { id: 'c5', name: 'Emma Lefebvre', avatar: 'EL', username: '@emma' },
];

export const MOCK_CIRCLES: Circle[] = [
  { id: 'circle1', name: 'Amis cinéphiles', members: [MOCK_CONTACTS[0], MOCK_CONTACTS[1], MOCK_CONTACTS[2]] },
  { id: 'circle2', name: 'Collègues', members: [MOCK_CONTACTS[3], MOCK_CONTACTS[4]] },
];

export const INITIAL_LIBRARY: LibraryEntry[] = [
  {
    movie: MOCK_MOVIES[0],
    userRating: { stars: 5, comment: "Un chef-d'œuvre absolu.", date: '2024-01-15' },
    addedAt: '2024-01-15',
  },
  {
    movie: MOCK_MOVIES[3],
    userRating: { stars: 4, comment: 'Très bon film, un peu sombre mais captivant.', date: '2024-02-20' },
    addedAt: '2024-02-20',
  },
];

export const INITIAL_WATCHLIST: WatchlistEntry[] = [
  {
    movie: MOCK_MOVIES[1],
    addedAt: '2024-03-01',
    recommendations: [
      {
        id: 'rec1',
        movie: MOCK_MOVIES[1],
        sender: MOCK_CONTACTS[0],
        senderRating: { stars: 5, comment: 'Le meilleur film de gangsters jamais fait !', date: '2024-02-28' },
        receivedAt: '2024-02-28',
        status: 'watchlisted',
      },
    ],
  },
];

export const INITIAL_RECOMMENDATIONS: ReceivedRecommendation[] = [
  {
    id: 'rec2',
    movie: MOCK_MOVIES[4],
    sender: MOCK_CONTACTS[1],
    senderRating: { stars: 5, comment: 'Un film magnifique, tu vas pleurer mais c\'est incontournable !', date: '2024-03-05' },
    receivedAt: '2024-03-05',
    status: 'pending',
  },
  {
    id: 'rec3',
    movie: MOCK_MOVIES[5],
    sender: MOCK_CONTACTS[2],
    senderRating: { stars: 4, comment: 'Tarantino à son meilleur. Les dialogues sont géniaux.', date: '2024-03-08' },
    receivedAt: '2024-03-08',
    status: 'pending',
  },
];
