import React, { createContext, useContext, useReducer, useEffect, useRef, useMemo } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  Movie,
  LibraryEntry,
  WatchlistEntry,
  ReceivedRecommendation,
  SentRecommendation,
  Contact,
  Circle,
  UserRating,
} from '../types';
import {
  INITIAL_LIBRARY,
  INITIAL_WATCHLIST,
  INITIAL_RECOMMENDATIONS,
  MOCK_CONTACTS,
  MOCK_CIRCLES,
} from '../data/mockData';
import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { scheduleNewRecommendationNotification } from '../lib/notifications';

interface AppState {
  library: LibraryEntry[];
  watchlist: WatchlistEntry[];
  inbox: ReceivedRecommendation[];
  sentRecs: SentRecommendation[];
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
  | { type: 'ADD_SENT_RECOMMENDATION'; recommendation: SentRecommendation }
  | { type: 'RECEIVE_RECOMMENDATION'; rec: ReceivedRecommendation }
  | { type: 'HYDRATE'; state: AppState };

const STORAGE_KEY = '@huco_state';

function mapSupabaseRec(r: any): ReceivedRecommendation {
  return {
    id: r.id,
    movie: r.movie,
    sender: {
      id: r.sender_id,
      userId: r.sender_id,
      name: r.sender_name,
      username: r.sender_username,
      avatar: r.sender_avatar || '',
    },
    senderRating: r.user_rating,
    receivedAt: r.sent_at,
    status: 'pending',
  };
}

function reducer(state: AppState, action: Action): AppState {
  switch (action.type) {
    case 'HYDRATE':
      return action.state;

    case 'RECEIVE_RECOMMENDATION': {
      if (state.inbox.some((r) => r.id === action.rec.id)) return state;
      return { ...state, inbox: [action.rec, ...state.inbox] };
    }

    case 'ADD_TO_LIBRARY': {
      const exists = state.library.some((e) => e.movie.id === action.movie.id);
      if (exists) {
        return {
          ...state,
          library: state.library.map((e) =>
            e.movie.id === action.movie.id ? { ...e, userRating: action.rating } : e
          ),
        };
      }
      const entry: LibraryEntry = {
        movie: action.movie,
        userRating: action.rating,
        addedAt: new Date().toISOString(),
      };
      return { ...state, library: [entry, ...state.library] };
    }

    case 'UPDATE_LIBRARY_RATING':
      return {
        ...state,
        library: state.library.map((e) =>
          e.movie.id === action.movieId ? { ...e, userRating: action.rating } : e
        ),
      };

    case 'REMOVE_FROM_LIBRARY':
      return { ...state, library: state.library.filter((e) => e.movie.id !== action.movieId) };

    case 'ADD_TO_WATCHLIST': {
      const exists = state.watchlist.some((e) => e.movie.id === action.movie.id);
      if (exists) {
        if (!action.rec) return state;
        return {
          ...state,
          watchlist: state.watchlist.map((e) =>
            e.movie.id === action.movie.id
              ? { ...e, recommendations: [...e.recommendations, action.rec!] }
              : e
          ),
        };
      }
      const entry: WatchlistEntry = {
        movie: action.movie,
        addedAt: new Date().toISOString(),
        recommendations: action.rec ? [action.rec] : [],
      };
      return { ...state, watchlist: [entry, ...state.watchlist] };
    }

    case 'REMOVE_FROM_WATCHLIST':
      return { ...state, watchlist: state.watchlist.filter((e) => e.movie.id !== action.movieId) };

    case 'MARK_WATCHED': {
      const entry = state.watchlist.find((e) => e.movie.id === action.movieId);
      if (!entry) return state;
      const newWatchlist = state.watchlist.filter((e) => e.movie.id !== action.movieId);
      const alreadyInLibrary = state.library.some((e) => e.movie.id === action.movieId);
      const newLibrary = alreadyInLibrary
        ? state.library.map((e) =>
            e.movie.id === action.movieId ? { ...e, userRating: action.rating } : e
          )
        : [
            { movie: entry.movie, userRating: action.rating, addedAt: new Date().toISOString() },
            ...state.library,
          ];
      return { ...state, watchlist: newWatchlist, library: newLibrary };
    }

    case 'HANDLE_RECOMMENDATION': {
      const rec = state.inbox.find((r) => r.id === action.recId);
      if (!rec) return state;
      let newState = {
        ...state,
        inbox: state.inbox.map((r) =>
          r.id === action.recId
            ? { ...r, status: action.action === 'ignore' ? 'ignored' : action.action === 'watchlist' ? 'watchlisted' : 'seen' }
            : r
        ) as ReceivedRecommendation[],
      };
      if (action.action === 'watchlist') {
        const exists = newState.watchlist.some((e) => e.movie.id === rec.movie.id);
        if (!exists) {
          newState = {
            ...newState,
            watchlist: [
              { movie: rec.movie, addedAt: new Date().toISOString(), recommendations: [rec] },
              ...newState.watchlist,
            ],
          };
        }
      } else if (action.action === 'library' && action.rating) {
        const exists = newState.library.some((e) => e.movie.id === rec.movie.id);
        if (!exists) {
          newState = {
            ...newState,
            library: [
              { movie: rec.movie, userRating: action.rating, addedAt: new Date().toISOString() },
              ...newState.library,
            ],
          };
        }
      }
      return newState;
    }

    case 'ADD_CONTACT':
      return { ...state, contacts: [...state.contacts, action.contact] };

    case 'REMOVE_CONTACT':
      return { ...state, contacts: state.contacts.filter((c) => c.id !== action.contactId) };

    case 'ADD_CIRCLE':
      return { ...state, circles: [...state.circles, action.circle] };

    case 'REMOVE_CIRCLE':
      return { ...state, circles: state.circles.filter((c) => c.id !== action.circleId) };

    case 'ADD_SENT_RECOMMENDATION':
      return { ...state, sentRecs: [action.recommendation, ...(state.sentRecs || [])] };

    default:
      return state;
  }
}

const initialState: AppState = {
  library: INITIAL_LIBRARY,
  watchlist: INITIAL_WATCHLIST,
  inbox: INITIAL_RECOMMENDATIONS,
  sentRecs: [],
  contacts: MOCK_CONTACTS,
  circles: MOCK_CIRCLES,
};

interface AppContextValue {
  state: AppState;
  dispatch: React.Dispatch<Action>;
}

const AppContext = createContext<AppContextValue>({ state: initialState, dispatch: () => {} });

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(reducer, initialState);
  const syncTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const storageTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const hydratedRef = useRef(false);
  const hydratingRef = useRef(false);
  const syncUserIdRef = useRef<string | null>(null);
  const channelRef = useRef<any>(null);

  useEffect(() => {
    function teardownChannel() {
      if (channelRef.current && supabase) {
        supabase.removeChannel(channelRef.current);
        channelRef.current = null;
      }
    }

    function clearPendingTimers() {
      if (syncTimerRef.current) {
        clearTimeout(syncTimerRef.current);
        syncTimerRef.current = null;
      }
      if (storageTimerRef.current) {
        clearTimeout(storageTimerRef.current);
        storageTimerRef.current = null;
      }
    }

    function subscribeToInbox(userId: string) {
      if (!supabase) return;
      teardownChannel();
      channelRef.current = supabase
        .channel(`inbox:${userId}`)
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'recommendations',
            filter: `recipient_id=eq.${userId}`,
          },
          (payload) => {
            const r = payload.new as any;
            dispatch({ type: 'RECEIVE_RECOMMENDATION', rec: mapSupabaseRec(r) });
            scheduleNewRecommendationNotification(r.sender_name, r.movie?.title || '');
          }
        )
        .subscribe();
    }

    async function hydrateFromSupabase(userId: string): Promise<boolean> {
      if (!supabase || hydratingRef.current) return hydratingRef.current;
      hydratingRef.current = true;
      try {
        const [{ data }, { data: recRows }] = await Promise.all([
          supabase.from('user_data').select('*').eq('user_id', userId).maybeSingle(),
          supabase.from('recommendations').select('*').eq('recipient_id', userId).order('sent_at', { ascending: false }),
        ]);

        const supabaseInbox = (recRows || []).map(mapSupabaseRec);
        // Server row may not exist yet for a brand-new account: treat as empty
        // state (never mock data, which would get upserted into the real row).
        const existingInbox: ReceivedRecommendation[] = data?.inbox ?? [];
        const merged = supabaseInbox.map((r) => {
          const existing = existingInbox.find((e) => e.id === r.id);
          return existing ? { ...r, status: existing.status } : r;
        });
        const jsonbOnly = existingInbox.filter((e) => !supabaseInbox.some((r) => r.id === e.id));

        dispatch({
          type: 'HYDRATE',
          state: {
            library: data?.library ?? [],
            watchlist: data?.watchlist ?? [],
            inbox: [...merged, ...jsonbOnly],
            sentRecs: data?.sent_recs ?? [],
            contacts: data?.contacts ?? [],
            circles: data?.circles ?? [],
          },
        });
        hydratedRef.current = true;
        syncUserIdRef.current = userId;

        // Always subscribe, even before the first user_data row exists —
        // otherwise a brand-new account receives nothing until app restart.
        subscribeToInbox(userId);
        return true;
      } finally {
        hydratingRef.current = false;
      }
    }

    async function hydrateFromStorage() {
      const raw = await AsyncStorage.getItem(STORAGE_KEY);
      if (raw) {
        try { dispatch({ type: 'HYDRATE', state: JSON.parse(raw) }); } catch {}
      }
      hydratedRef.current = true;
    }

    async function hydrate() {
      if (isSupabaseConfigured && supabase) {
        const { data: { session } } = await supabase.auth.getSession();
        if (session && (await hydrateFromSupabase(session.user.id))) return;
      }
      await hydrateFromStorage();
    }

    hydrate();

    // Re-hydrate and re-subscribe when the user signs in after app start;
    // reset to a clean slate on sign-out so data never leaks between accounts.
    let authSub: { unsubscribe: () => void } | null = null;
    if (isSupabaseConfigured && supabase) {
      const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
        if (event === 'SIGNED_IN' && session && !channelRef.current) {
          hydrateFromSupabase(session.user.id);
        } else if (event === 'SIGNED_OUT') {
          teardownChannel();
          // Kill any pending debounced write armed with the previous user's
          // state — it must never fire into the next signed-in account.
          clearPendingTimers();
          syncUserIdRef.current = null;
          hydratedRef.current = false;
          AsyncStorage.removeItem(STORAGE_KEY);
          dispatch({ type: 'HYDRATE', state: initialState });
        }
      });
      authSub = subscription;
    }

    return () => {
      teardownChannel();
      clearPendingTimers();
      authSub?.unsubscribe();
    };
  }, []);

  // Persist on state change: AsyncStorage debounced 400ms (full-state
  // JSON.stringify on every tap causes JS-thread jank), Supabase debounced 2s.
  useEffect(() => {
    if (!hydratedRef.current) return;

    if (storageTimerRef.current) clearTimeout(storageTimerRef.current);
    storageTimerRef.current = setTimeout(() => {
      AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    }, 400);

    if (isSupabaseConfigured && supabase) {
      const armedForUser = syncUserIdRef.current;
      if (syncTimerRef.current) clearTimeout(syncTimerRef.current);
      syncTimerRef.current = setTimeout(async () => {
        const { data: { session } } = await supabase!.auth.getSession();
        // Abort if the signed-in user changed since this timer was armed.
        if (!session || (armedForUser && session.user.id !== armedForUser)) return;
        await supabase!.from('user_data').upsert({
          user_id: session.user.id,
          library: state.library,
          watchlist: state.watchlist,
          inbox: state.inbox,
          sent_recs: state.sentRecs,
          contacts: state.contacts,
          circles: state.circles,
          updated_at: new Date().toISOString(),
        });
      }, 2000);
    }
  }, [state]);

  const value = useMemo(() => ({ state, dispatch }), [state]);

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export const useApp = () => useContext(AppContext);
