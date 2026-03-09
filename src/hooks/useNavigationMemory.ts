import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

const STORAGE_KEY = 'atalaia_nav_memory';

interface NavMemory {
  lastPath: string;
  lastTab: string | null;
  lastMemberId: string | null;
  lastCampusId: string | null;
  timestamp: number;
}

function getMemory(): NavMemory | null {
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch { return null; }
}

function setMemory(update: Partial<NavMemory>) {
  const current = getMemory() || { lastPath: '/home', lastTab: null, lastMemberId: null, lastCampusId: null, timestamp: Date.now() };
  sessionStorage.setItem(STORAGE_KEY, JSON.stringify({ ...current, ...update, timestamp: Date.now() }));
}

/** Tracks navigation state so the user resumes where they left off. */
export function useNavigationMemory() {
  const location = useLocation();

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const tab = params.get('tab');

    // Track member/couple profile visits
    const memberMatch = location.pathname.match(/\/perfil\/membro\/(.+)/);
    const updates: Partial<NavMemory> = { lastPath: location.pathname };
    if (tab) updates.lastTab = tab;
    if (memberMatch) updates.lastMemberId = memberMatch[1];

    setMemory(updates);
  }, [location.pathname, location.search]);

  return { getMemory };
}
