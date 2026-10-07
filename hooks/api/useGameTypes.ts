import { useApi } from '@/hooks/api/useApi';
import { GameTypeResource } from '@/lib/api/types';
import { useQuery } from '@tanstack/react-query';

export const GAME_TYPES_QUERY_KEY = ['game-types'] as const;

export function useGameTypes() {
  const { requestAllPages } = useApi();

  return useQuery({
    queryKey: GAME_TYPES_QUERY_KEY,
    // Cursor-paginated backend-side; the create-party screen wants the full catalog to render
    // its grid, not a "load more" control.
    queryFn: () => requestAllPages<GameTypeResource>('/game-types'),
  });
}
