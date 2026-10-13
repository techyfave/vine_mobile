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

/** Remove a post from every cached feed (home, profile, saved) right away. */
function dropPost(qc: QueryClient, id: string) {
  qc.setQueriesData<InfiniteData<Page>>({ queryKey: ['feed'] }, (data) =>
    data ? { ...data, pages: data.pages.map((pg) => ({ ...pg, results: pg.results.filter((p) => p.id !== id) })) } : data,
  );
  qc.removeQueries({ queryKey: ['post', id] });
}

export function useDeletePost() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (post: Post) =>
      unwrap(await api.DELETE('/api/v1/feed/posts/{post_id}/', { params: { path: { post_id: post.id } } })),
    onSuccess: (_, post) => dropPost(qc, post.id),
  });
}

export type Audience = 'public' | 'followers';

export function useSetAudience() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ post, visibility }: { post: Post; visibility: Audience }) =>
      unwrap(
        await api.PATCH('/api/v1/feed/posts/{post_id}/', {
          params: { path: { post_id: post.id } },
          body: { visibility },
        }),
      ),
    onMutate: ({ post, visibility }) => patchPost(qc, post.id, (p) => ({ ...p, visibility })),
    onError: () => qc.invalidateQueries({ queryKey: ['feed'] }),
  });
}

export function useEditPost() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, content, visibility }: { id: string; content: string; visibility: Audience }) =>
      unwrap(
        await api.PATCH('/api/v1/feed/posts/{post_id}/', {
          params: { path: { post_id: id } },
          body: { content, visibility },
        }),
      ),
    onSuccess: (updated) => patchPost(qc, updated.id, () => updated),
  });
}

export const REPORT_REASONS = [
  { value: 'spam', label: 'Spam or scam' },
  { value: 'harassment', label: 'Bullying or harassment' },
  { value: 'hate', label: "Hate or mocking someone's beliefs" },
  { value: 'violence', label: 'Violence or threats' },
  { value: 'sexual', label: 'Sexual content' },
  { value: 'self_harm', label: 'Self-harm' },
  { value: 'false_info', label: 'False information' },
  { value: 'other', label: 'Something else' },
] as const;

export type ReportReason = (typeof REPORT_REASONS)[number]['value'];

export async function reportPost(post: Post, reason: ReportReason): Promise<string> {
  const res = unwrap(
    await api.POST('/api/v1/feed/posts/{post_id}/report/', {
      params: { path: { post_id: post.id } },
      body: { reason, details: '' },
    }),
  ) as unknown as { detail?: string } | undefined;
  return res?.detail ?? 'Thanks for letting us know.';
}

export function useMuteOrBlock() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ username, action }: { username: string; action: 'mute' | 'block' }) => {
      const path = { params: { path: { username } } };
      if (action === 'mute') unwrap(await api.POST('/api/v1/users/{username}/mute/', path));
      else unwrap(await api.POST('/api/v1/users/{username}/block/', path));
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['feed'] }),
  });
}

// --- Lift: asking people to pray for you or stand with you ------------------------------

export type Lift = Schemas['LiftSchema'];
export type LiftKind = 'pray' | 'with_you';
export type LiftMode = Lift['mode'];

type LiftResult = { lift: Lift };

/** Answer a Lift ("I'll pray" / "I'm with you"), change the answer, or take it back (kind: null). */
export function useLiftRespond() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ post, kind }: { post: Post; kind: LiftKind | null }) => {
      const path = { params: { path: { post_id: post.id } } };
      const res = kind
        ? unwrap(await api.POST('/api/v1/feed/posts/{post_id}/lift/', { ...path, body: { kind } }))
        : unwrap(await api.DELETE('/api/v1/feed/posts/{post_id}/lift/', path));
      return (res as unknown as LiftResult).lift;
    },
    onMutate: ({ post, kind }) =>
      patchPost(qc, post.id, (p) => {
        if (!p.lift) return p;
        const l = { ...p.lift };
        const bump = (k: LiftKind | null | undefined, by: number) => {
          if (k === 'pray') l.pray_count = Math.max(0, l.pray_count + by);
          if (k === 'with_you') l.with_you_count = Math.max(0, l.with_you_count + by);
        };
        bump(l.my_response, -1);
        bump(kind, 1);
        l.my_response = kind;
        return { ...p, lift: l };
      }),
    onSuccess: (lift, { post }) => patchPost(qc, post.id, (p) => ({ ...p, lift })),
    onError: () => qc.invalidateQueries({ queryKey: ['feed'] }),
  });
}

/** The author shares an update, or a testimony when it's answered. */
export function useLiftUpdate() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ postId, body, testimony }: { postId: string; body: string; testimony: boolean }) => {
      const res = unwrap(
        await api.POST('/api/v1/feed/posts/{post_id}/lift/updates/', {
          params: { path: { post_id: postId } },
          body: { body, is_testimony: testimony },
        }),
      );
      return (res as unknown as LiftResult).lift;
    },
    onSuccess: (lift, { postId }) => {
      patchPost(qc, postId, (p) => ({ ...p, lift }));
      qc.invalidateQueries({ queryKey: ['feed', 'lifts'] });
    },
  });
}

export function useDeleteLiftUpdate() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ postId, updateId }: { postId: string; updateId: string }) => {
      const res = unwrap(
        await api.DELETE('/api/v1/feed/posts/{post_id}/lift/updates/{update_id}/', {
          params: { path: { post_id: postId, update_id: updateId } },
        }),
      );
      return (res as unknown as LiftResult).lift;
    },
    onSuccess: (lift, { postId }) => patchPost(qc, postId, (p) => ({ ...p, lift })),
  });
}
