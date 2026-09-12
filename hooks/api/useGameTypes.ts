import { useApi } from '@/hooks/api/useApi';
import { GameTypeResource } from '@/lib/api/types';
import { useQuery } from '@tanstack/react-query';

export const GAME_TYPES_QUERY_KEY = ['game-types'] as const;

export function useGameTypes() {
  const { request } = useApi();

  return useQuery({
    queryKey: GAME_TYPES_QUERY_KEY,
    queryFn: () => request<GameTypeResource[]>('/game-types'),
  });
}
