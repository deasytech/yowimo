import { PackResource } from '@/lib/api/types';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { renderHook, waitFor } from '@testing-library/react-native';
import React from 'react';

import { useGameTypePacks } from './usePacks';

const mockRequestPaginated = jest.fn();
jest.mock('@/hooks/api/useApi', () => ({
  useApi: () => ({ request: jest.fn(), requestPaginated: mockRequestPaginated }),
}));

const mockUseAuth = jest.fn();
jest.mock('@clerk/expo', () => ({
  useAuth: () => mockUseAuth(),
}));

const makePack = (id: number, name: string): PackResource => ({
  id,
  slug: `pack-${id}`,
  name,
  emoji: '🎉',
  tag: 'Hot',
  category: 'limited',
  description: 'Icebreakers, dares, and a few confessions.',
  price: 40,
  truths_count: 18,
  dares_count: 22,
  cards_count: 40,
  preview_cards_count: 4,
  cover_image_url: null,
  gradient: ['#D84CFF', '#FF8A2A'],
  is_featured: false,
  game_type: { id: 7, slug: 'party' },
  preview_cards: [],
  owned_by_me: false,
  created_at: '2026-01-10T00:00:00Z',
  updated_at: '2026-01-10T00:00:00Z',
});

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
  mockRequestPaginated.mockReset();
  mockUseAuth.mockReset();
  mockUseAuth.mockReturnValue({ userId: 'user_1', isLoaded: true, isSignedIn: true });
});

afterEach(() => {
  clients.forEach((client) => client.clear());
  clients.length = 0;
});

it("asks the API for the selected game type's decks", async () => {
  const pack = makePack(11, 'Party Starter Pack');
  mockRequestPaginated.mockResolvedValueOnce({ data: [pack] });

  const client = newClient();
  const { result } = await renderHook(() => useGameTypePacks(7), { wrapper: wrapper(client) });

  await waitFor(() => expect(result.current.isSuccess).toBe(true));
  // Server-side filter rather than slicing the paginated marketplace list client-side.
  expect(mockRequestPaginated).toHaveBeenCalledWith('/packs?game_type_id=7&per_page=50');
  expect(result.current.packs).toEqual([pack]);
});

it('flattens decks across loaded pages', async () => {
  mockRequestPaginated
    .mockResolvedValueOnce({
      data: [makePack(11, 'Party Starter Pack')],
      meta: { per_page: 50, has_more_pages: true, next_cursor: 'cursor-1', prev_cursor: null },
    })
    .mockResolvedValueOnce({
      data: [makePack(12, 'Drink Up Mixer')],
      meta: { per_page: 50, has_more_pages: false, next_cursor: null, prev_cursor: 'cursor-1' },
    });

  const client = newClient();
  const { result } = await renderHook(() => useGameTypePacks(7), { wrapper: wrapper(client) });

  await waitFor(() => expect(result.current.isSuccess).toBe(true));
  expect(result.current.hasNextPage).toBe(true);

  await result.current.fetchNextPage();

  await waitFor(() => expect(result.current.packs).toHaveLength(2));
  expect(result.current.packs.map((pack) => pack.id)).toEqual([11, 12]);
  expect(mockRequestPaginated).toHaveBeenLastCalledWith(
    '/packs?game_type_id=7&cursor=cursor-1&per_page=50',
  );
});

it('does not fetch until a game type is selected', async () => {
  const client = newClient();
  const { result } = await renderHook(() => useGameTypePacks(null), { wrapper: wrapper(client) });

  await waitFor(() => expect(result.current.fetchStatus).toBe('idle'));
  expect(mockRequestPaginated).not.toHaveBeenCalled();
});
