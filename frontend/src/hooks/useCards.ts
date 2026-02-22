import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '../api/client';
import type { BoardDetail, Card } from '../types';

export function useBoardData(boardId: string | null) {
  return useQuery<BoardDetail>({
    queryKey: ['board', boardId],
    queryFn: () => api.get<BoardDetail>(`/boards/${boardId}`),
    enabled: !!boardId,
  });
}

export function useCreateCard(boardId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: Partial<Card>) =>
      api.post<Card>(`/boards/${boardId}/cards`, data),
    onSuccess: (newCard) => {
      queryClient.setQueryData<BoardDetail>(['board', boardId], (old) => {
        if (!old) return old;
        return { ...old, cards: [...old.cards, newCard] };
      });
    },
  });
}

export function useUpdateCard(boardId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, ...data }: Partial<Card> & { id: string }) =>
      api.patch<Card>(`/cards/${id}`, data),
    onMutate: async ({ id, ...data }) => {
      await queryClient.cancelQueries({ queryKey: ['board', boardId] });
      const previous = queryClient.getQueryData<BoardDetail>(['board', boardId]);
      queryClient.setQueryData<BoardDetail>(['board', boardId], (old) => {
        if (!old) return old;
        return {
          ...old,
          cards: old.cards.map((c) => (c.id === id ? { ...c, ...data } : c)),
        };
      });
      return { previous };
    },
    onError: (_err, _vars, context) => {
      if (context?.previous) {
        queryClient.setQueryData(['board', boardId], context.previous);
      }
    },
  });
}

export function useDeleteCard(boardId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (cardId: string) => api.delete(`/cards/${cardId}`),
    onMutate: async (cardId) => {
      await queryClient.cancelQueries({ queryKey: ['board', boardId] });
      const previous = queryClient.getQueryData<BoardDetail>(['board', boardId]);
      queryClient.setQueryData<BoardDetail>(['board', boardId], (old) => {
        if (!old) return old;
        return {
          ...old,
          cards: old.cards.filter((c) => c.id !== cardId),
          connections: old.connections.filter(
            (conn) => conn.from_card_id !== cardId && conn.to_card_id !== cardId
          ),
        };
      });
      return { previous };
    },
    onError: (_err, _vars, context) => {
      if (context?.previous) {
        queryClient.setQueryData(['board', boardId], context.previous);
      }
    },
  });
}
