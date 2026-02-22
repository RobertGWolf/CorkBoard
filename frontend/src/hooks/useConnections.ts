import { useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../api/client';
import type { BoardDetail, Connection } from '../types';

export function useCreateConnection(boardId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: { from_card_id: string; to_card_id: string; color?: string }) =>
      api.post<Connection>(`/boards/${boardId}/connections`, data),
    onSuccess: (newConnection) => {
      queryClient.setQueryData<BoardDetail>(['board', boardId], (old) => {
        if (!old) return old;
        return { ...old, connections: [...old.connections, newConnection] };
      });
    },
  });
}

export function useUpdateConnection(boardId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, color }: { id: string; color: string }) =>
      api.patch<Connection>(`/connections/${id}`, { color }),
    onMutate: async ({ id, color }) => {
      await queryClient.cancelQueries({ queryKey: ['board', boardId] });
      const previous = queryClient.getQueryData<BoardDetail>(['board', boardId]);
      queryClient.setQueryData<BoardDetail>(['board', boardId], (old) => {
        if (!old) return old;
        return {
          ...old,
          connections: old.connections.map((c) =>
            c.id === id ? { ...c, color } : c
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

export function useDeleteConnection(boardId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (connectionId: string) => api.delete(`/connections/${connectionId}`),
    onMutate: async (connectionId) => {
      await queryClient.cancelQueries({ queryKey: ['board', boardId] });
      const previous = queryClient.getQueryData<BoardDetail>(['board', boardId]);
      queryClient.setQueryData<BoardDetail>(['board', boardId], (old) => {
        if (!old) return old;
        return {
          ...old,
          connections: old.connections.filter((c) => c.id !== connectionId),
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
