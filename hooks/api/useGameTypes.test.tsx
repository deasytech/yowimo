import { GameTypeResource } from '@/lib/api/types';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { renderHook, waitFor } from '@testing-library/react-native';
import React from 'react';

import { useGameTypes } from './useGameTypes';

const mockRequest = jest.fn();
jest.mock('@/hooks/api/useApi', () => ({
  useApi: () => ({ request: mockRequest, requestPaginated: jest.fn() }),
}));

const GAME_TYPES: GameTypeResource[] = [
  {
    id: 1,
    slug: 'party',
    name: 'Party',
    emoji: '🎉',
    tagline: 'Truth or Dare, turned up',
    audience: 'friends',
    intensity: 'wild',
    cost: 0,
    image_url: null,
    gradient: ['#F0A83C', '#B23A34'],
    created_at: '2026-01-10T00:00:00Z',
    updated_at: '2026-01-10T00:00:00Z',
  },
];

const wrapper = (client: QueryClient) =>
  function Wrapper({ children }: { children: React.ReactNode }) {
    return <QueryClientProvider client={client}>{children}</QueryClientProvider>;
  };

// Tracked so afterEach can clear them — otherwise react-query's gc timers keep Jest's
// process alive after the run finishes.
const clients: QueryClient[] = [];
const newClient = () => {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  clients.push(client);
  return client;
};

beforeEach(() => {
  mockRequest.mockReset();
});

afterEach(() => {
  clients.forEach((client) => client.clear());
  clients.length = 0;
});

it('fetches /game-types and returns the resolved list', async () => {
  mockRequest.mockResolvedValueOnce(GAME_TYPES);
  const client = newClient();

  const { result } = await renderHook(() => useGameTypes(), { wrapper: wrapper(client) });

  await waitFor(() => expect(result.current.isSuccess).toBe(true));
  expect(result.current.data).toEqual(GAME_TYPES);
  expect(mockRequest).toHaveBeenCalledWith('/game-types');
});

it('keeps the last successfully loaded game types usable after a failed refetch', async () => {
  mockRequest.mockResolvedValueOnce(GAME_TYPES);
  const client = newClient();

  const { result } = await renderHook(() => useGameTypes(), { wrapper: wrapper(client) });
  await waitFor(() => expect(result.current.isSuccess).toBe(true));
  expect(result.current.data).toEqual(GAME_TYPES);

  mockRequest.mockRejectedValueOnce(new Error('network blip'));
  result.current.refetch();

  await waitFor(() => expect(result.current.isError).toBe(true));
  // A failed background refetch must not wipe out a perfectly good cached list — screens
  // gate their blocking error UI on missing data, not on isError alone, for this reason.
  expect(result.current.data).toEqual(GAME_TYPES);
});
