import React, { createContext, useContext, useReducer, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Movie, LibraryEntry, WatchlistEntry, ReceivedRecommendation, Contact, Circle, UserRating } from '../types';
import { INITIAL_LIBRARY, INITIAL_WATCHLIST, INITIAL_RECOMMENDATIONS, MOCK_CONTACTS, MOCK_CIRCLES } from '../data/mockData';

interface AppState {
  library: LibraryEntry[];
  watchlist: WatchlistEntry[];
  inbox: ReceivedRecommendation[];
  contacts: Contact[];
  circles: Circle[];
}

type Action =
  | { type: 'ADD_TO_LIBRARY'; movie: Movie; rating: UserRating }
  | { type: 'UPDATE_LIBRARY_RATING'; movieId: number; rating: UserRating }
  | { type: 'REMOVE_FROM_LIBRARY'; movieId: number }
  | { type: 'ADD_TO_WATCHLIST'; movie: Movie; rec?: ReceivedRecommendation }
  | { type: 'REMOVE_FROM_WATCHLIST'; movieId: number }
  | { type: 'MARK_WATCHED'; movieId: number; rating: UserRating }
  | { type: 'HANDLE_RECOMMENDATION'; recId: string; action: 'watchlist' | 'library' | 'ignore'; rating?: UserRating }
  | { type: 'ADD_CONTACT'; contact: Contact }
  | { type: 'REMOVE_CONTACT'; contactId: string }
  | { type: 'ADD_CIRCLE'; circle: Circle }
  | { type: 'REMOVE_CIRCLE'; circleId: string }
  | { type: 'HYDRATE'; state: AppState };

const STORAGE_KEY = '@huco_state';

function reducer(state: AppState, action: Action): AppState {
  switch (action.type) {
    case 'HYDRATE': return action.state;
    case 'ADD_TO_LIBRARY': {
      const exists = state.library.some((e) => e.movie.id === action.movie.id);
      if (exists) return { ...state, library: state.library.map((e) => e.movie.id === action.movie.id ? { ...e, userRating: action.rating } : e) };
      return { ...state, library: [{ movie: action.movie, userRating: action.rating, addedAt: new Date().toISOString() }, ...state.library] };
    }
    case 'UPDATE_LIBRARY_RATING':
      return { ...state, library: state.library.map((e) => e.movie.id === action.movieId ? { ...e, userRating: action.rating } : e) };
    case 'REMOVE_FROM_LIBRARY':
      return { ...state, library: state.library.filter((e) => e.movie.id !== action.movieId) };
    case 'ADD_TO_WATCHLIST': {
      const exists = state.watchlist.some((e) => e.movie.id === action.movie.id);
      if (exists) {
        if (!action.rec) return state;
        return { ...state, watchlist: state.watchlist.map((e) => e.movie.id === action.movie.id ? { ...e, recommendations: [...e.recommendations, action.rec!] } : e) };
      }
      return { ...state, watchlist: [{ movie: action.movie, addedAt: new Date().toISOString(), recommendations: action.rec ? [action.rec] : [] }, ...state.watchlist] };
    }
    case 'REMOVE_FROM_WATCHLIST':
      return { ...state, watchlist: state.watchlist.filter((e) => e.movie.id !== action.movieId) };
    case 'MARK_WATCHED': {
      const entry = state.watchlist.find((e) => e.movie.id === action.movieId);
      if (!entry) return state;
      const newWatchlist = state.watchlist.filter((e) => e.movie.id !== action.movieId);
      const alreadyInLibrary = state.library.some((e) => e.movie.id === action.movieId);
      const newLibrary = alreadyInLibrary
        ? state.library.map((e) => e.movie.id === action.movieId ? { ...e, userRating: action.rating } : e)
        : [{ movie: entry.movie, userRating: action.rating, addedAt: new Date().toISOString() }, ...state.library];
      return { ...state, watchlist: newWatchlist, library: newLibrary };
    }
    case 'HANDLE_RECOMMENDATION': {
      const rec = state.inbox.find((r) => r.id === action.recId);
      if (!rec) return state;
      let newState = { ...state, inbox: state.inbox.map((r) => r.id === action.recId ? { ...r, status: action.action === 'ignore' ? 'ignored' : action.action === 'watchlist' ? 'watchlisted' : 'seen' } : r) as ReceivedRecommendation[] };
      if (action.action === 'watchlist' && !newState.watchlist.some((e) => e.movie.id === rec.movie.id)) {
        newState = { ...newState, watchlist: [{ movie: rec.movie, addedAt: new Date().toISOString(), recommendations: [rec] }, ...newState.watchlist] };
      } else if (action.action === 'library' && action.rating && !newState.library.some((e) => e.movie.id === rec.movie.id)) {
        newState = { ...newState, library: [{ movie: rec.movie, userRating: action.rating, addedAt: new Date().toISOString() }, ...newState.library] };
      }
      return newState;
    }
    case 'ADD_CONTACT': return { ...state, contacts: [...state.contacts, action.contact] };
    case 'REMOVE_CONTACT': return { ...state, contacts: state.contacts.filter((c) => c.id !== action.contactId) };
    case 'ADD_CIRCLE': return { ...state, circles: [...state.circles, action.circle] };
    case 'REMOVE_CIRCLE': return { ...state, circles: state.circles.filter((c) => c.id !== action.circleId) };
    default: return state;
  }
}

const initialState: AppState = { library: INITIAL_LIBRARY, watchlist: INITIAL_WATCHLIST, inbox: INITIAL_RECOMMENDATIONS, contacts: MOCK_CONTACTS, circles: MOCK_CIRCLES };
interface AppContextValue { state: AppState; dispatch: React.Dispatch<Action>; }
const AppContext = createContext<AppContextValue>({ state: initialState, dispatch: () => {} });

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(reducer, initialState);
  useEffect(() => { AsyncStorage.getItem(STORAGE_KEY).then((raw) => { if (raw) { try { dispatch({ type: 'HYDRATE', state: JSON.parse(raw) }); } catch {} } }); }, []);
  useEffect(() => { AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(state)); }, [state]);
  return <AppContext.Provider value={{ state, dispatch }}>{children}</AppContext.Provider>;
}

export const useApp = () => useContext(AppContext);
