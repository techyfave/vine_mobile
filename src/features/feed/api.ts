import { type InfiniteData, type QueryClient, useMutation, useQueryClient } from '@tanstack/react-query';

import { api, type Schemas } from '@/api/client';
import { unwrap } from '@/api/errors';

export type Post = Schemas['PostDetailSchema'];
type Page = Schemas['CursorPage_PostDetailSchema_'];

/** Apply a change to a post everywhere it's cached (feeds, detail) for instant feedback. */
function patchPost(qc: QueryClient, id: string, fn: (p: Post) => Post) {
  qc.setQueriesData<InfiniteData<Page>>({ queryKey: ['feed'] }, (data) =>
    data ? { ...data, pages: data.pages.map((pg) => ({ ...pg, results: pg.results.map((p) => (p.id === id ? fn(p) : p)) })) } : data,
  );
  qc.setQueryData<Post>(['post', id], (p) => (p ? fn(p) : p));
}

export function useToggleLike() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (post: Post) => {
      const path = { params: { path: { post_id: post.id } } };
      if (post.my_reaction) unwrap(await api.DELETE('/api/v1/feed/posts/{post_id}/react/', path));
      else unwrap(await api.POST('/api/v1/feed/posts/{post_id}/react/', { ...path, body: { reaction_type: 'like' } }));
    },
    onMutate: (post) =>
      patchPost(qc, post.id, (p) => {
        const counts = { ...p.reaction_counts };
        if (p.my_reaction) {
          counts[p.my_reaction] = Math.max(0, (counts[p.my_reaction] ?? 1) - 1);
          return { ...p, my_reaction: null, reaction_counts: counts };
        }
        counts.like = (counts.like ?? 0) + 1;
        return { ...p, my_reaction: 'like', reaction_counts: counts };
      }),
    onError: () => qc.invalidateQueries({ queryKey: ['feed'] }),
  });
}

export function useToggleSave() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (post: Post) => {
      const path = { params: { path: { post_id: post.id } } };
      if (post.is_bookmarked) unwrap(await api.DELETE('/api/v1/feed/posts/{post_id}/bookmark/', path));
      else unwrap(await api.POST('/api/v1/feed/posts/{post_id}/bookmark/', path));
    },
    onMutate: (post) => patchPost(qc, post.id, (p) => ({ ...p, is_bookmarked: !p.is_bookmarked })),
    onSettled: () => qc.invalidateQueries({ queryKey: ['feed', 'saved'] }),
  });
}

export function totalReactions(p: Post): number {
  return Object.values(p.reaction_counts).reduce((a, b) => a + b, 0);
}
