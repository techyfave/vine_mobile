/**
 * Pages (churches and other organizations): queries and mutations.
 *
 * What the viewer may do on a Page always comes from the server (`/pages/{slug}/me` → permissions);
 * the app never decides permissions itself, it only hides controls the server would refuse.
 */
import { useInfiniteQuery, useMutation, useQuery, useQueryClient, type QueryClient } from '@tanstack/react-query';
import * as ImagePicker from 'expo-image-picker';

import { api, type Schemas, uploadForm } from '@/api/client';
import { unwrap } from '@/api/errors';

export type PageCard = Schemas['PageCardOut'];
export type PageDetail = Schemas['PageDetailOut'];
export type PageMe = Schemas['PageMeOut'];
export type Announcement = Schemas['AnnouncementOut'];
export type Organization = Schemas['OrganizationOut'];
export type BranchLink = Schemas['BranchLinkOut'];
export type Member = Schemas['MemberOut'];
export type MyPages = Schemas['MyPagesOut'];
export type PageType = Schemas['PageTypeOut'];

type Slug = { params: { path: { slug: string } } };
const at = (slug: string): Slug => ({ params: { path: { slug } } });

/** Everything cached about one Page (detail, me, announcements, organization, members, links). */
const pageKey = (slug: string) => ['page', slug] as const;

export function can(me: PageMe | undefined, permission: string): boolean {
  return Boolean(me?.permissions.includes(permission));
}

// --- Reading ----------------------------------------------------------------------------------

export function usePage(slug: string) {
  return useQuery({
    queryKey: [...pageKey(slug), 'detail'],
    queryFn: async () => unwrap(await api.GET('/api/v1/pages/{slug}/', at(slug))),
  });
}

export function usePageMe(slug: string) {
  return useQuery({
    queryKey: [...pageKey(slug), 'me'],
    queryFn: async () => unwrap(await api.GET('/api/v1/pages/{slug}/me', at(slug))),
  });
}

export function useOrganization(slug: string) {
  return useQuery({
    queryKey: [...pageKey(slug), 'org'],
    queryFn: async () => unwrap(await api.GET('/api/v1/pages/{slug}/organization', at(slug))) ?? null,
  });
}

export function useAnnouncements(slug: string, enabled = true) {
  return useQuery({
    queryKey: [...pageKey(slug), 'announcements'],
    enabled,
    queryFn: async () => unwrap(await api.GET('/api/v1/pages/{slug}/announcements', at(slug))),
  });
}

/** The Page's posts. Lives under ['feed'] so likes/saves patch it like every other feed. */
export function usePageFeed(slug: string) {
  return useInfiniteQuery({
    queryKey: ['feed', 'page', slug],
    initialPageParam: undefined as string | undefined,
    queryFn: async ({ pageParam }) =>
      unwrap(
        await api.GET('/api/v1/pages/{slug}/feed', {
          params: { path: { slug }, query: { cursor: pageParam, limit: 20 } },
        }),
      ),
    getNextPageParam: (last) => last.next_cursor ?? undefined,
  });
}

export function useMyPages() {
  return useQuery({
    queryKey: ['pages', 'mine'],
    queryFn: async () => unwrap(await api.GET('/api/v1/pages/mine')),
  });
}

export function usePageTypes() {
  return useQuery({
    queryKey: ['pages', 'types'],
    staleTime: 60 * 60 * 1000,
    queryFn: async () => unwrap(await api.GET('/api/v1/pages/types')),
  });
}

/** Whether a Page type uses an extra profile field (e.g. churches have a denomination). From the server. */
export function useTypeHasField(pageType: string | undefined, field: string): boolean {
  const types = usePageTypes();
  return Boolean(types.data?.find((t) => t.slug === pageType)?.profile_fields?.includes(field));
}

export function usePageSearch(q: string) {
  return useQuery({
    queryKey: ['search', 'pages', q],
    enabled: q.length >= 2,
    queryFn: async () => unwrap(await api.GET('/api/v1/pages/', { params: { query: { q, limit: 20 } } })).results,
  });
}

export function useMembers(slug: string, status: 'approved' | 'pending' | 'banned', enabled = true) {
  return useQuery({
    queryKey: [...pageKey(slug), 'members', status],
    enabled,
    queryFn: async () =>
      unwrap(
        await api.GET('/api/v1/pages/{slug}/members', {
          params: { path: { slug }, query: { status, limit: 100 } },
        }),
      ).results,
  });
}

export function useBranchLinks(slug: string, status: 'pending' | 'accepted', enabled = true) {
  return useQuery({
    queryKey: [...pageKey(slug), 'links', status],
    enabled,
    queryFn: async () =>
      unwrap(await api.GET('/api/v1/pages/{slug}/branch-links', { params: { path: { slug }, query: { status } } })),
  });
}

export function useNotificationPrefs(slug: string) {
  return useQuery({
    queryKey: [...pageKey(slug), 'prefs'],
    queryFn: async () => unwrap(await api.GET('/api/v1/pages/{slug}/notification-preferences', at(slug))),
  });
}

// --- Changing -----------------------------------------------------------------------------------

function refreshPage(qc: QueryClient, slug: string) {
  qc.invalidateQueries({ queryKey: pageKey(slug) });
  qc.invalidateQueries({ queryKey: ['pages', 'mine'] });
}

export function useFollowPage(slug: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (follow: boolean) =>
      unwrap(
        follow
          ? await api.POST('/api/v1/pages/{slug}/follow', at(slug))
          : await api.DELETE('/api/v1/pages/{slug}/follow', at(slug)),
      ),
    onSuccess: (res) => {
      qc.setQueryData<PageMe>([...pageKey(slug), 'me'], (me) => (me ? { ...me, following: res.following } : me));
      qc.setQueryData<PageDetail>([...pageKey(slug), 'detail'], (p) => (p ? { ...p, follower_count: res.follower_count } : p));
      qc.invalidateQueries({ queryKey: ['pages', 'mine'] });
      qc.invalidateQueries({ queryKey: ['feed', 'home'] });
    },
  });
}

export function useJoinPage(slug: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async () => unwrap(await api.POST('/api/v1/pages/{slug}/join', at(slug))),
    onSettled: () => refreshPage(qc, slug),
  });
}

export function useLeavePage(slug: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async () => unwrap(await api.DELETE('/api/v1/pages/{slug}/join', at(slug))),
    onSettled: () => {
      refreshPage(qc, slug);
      qc.invalidateQueries({ queryKey: ['feed', 'page', slug] });
    },
  });
}

export type AudienceInput = Schemas['AudienceSchema'];

export function useCreateAnnouncement(slug: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (body: { title: string; body: string; is_pinned: boolean; audience: AudienceInput }) =>
      unwrap(await api.POST('/api/v1/pages/{slug}/announcements', { ...at(slug), body })),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [...pageKey(slug), 'announcements'] });
      qc.invalidateQueries({ queryKey: ['feed'] });
    },
  });
}

export function useModerateMember(slug: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ userId, status }: { userId: string; status: 'approved' | 'banned' | 'pending' }) =>
      unwrap(
        await api.PATCH('/api/v1/pages/{slug}/members/{user_id}', {
          params: { path: { slug, user_id: userId } },
          body: { status },
        }),
      ),
    onSettled: () => refreshPage(qc, slug),
  });
}

/** Decline a join request, or remove a member. */
export function useRemoveMember(slug: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (userId: string) =>
      unwrap(await api.DELETE('/api/v1/pages/{slug}/members/{user_id}', { params: { path: { slug, user_id: userId } } })),
    onSettled: () => refreshPage(qc, slug),
  });
}

export function useInviteBranch(hqSlug: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (branchSlug: string) =>
      unwrap(await api.POST('/api/v1/pages/{slug}/branch-invites', { ...at(hqSlug), body: { branch_slug: branchSlug, message: '' } })),
    onSettled: () => refreshPage(qc, hqSlug),
  });
}

export function useRequestToJoinHq(branchSlug: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (hqSlug: string) =>
      unwrap(await api.POST('/api/v1/pages/{slug}/branch-requests', { ...at(branchSlug), body: { hq_slug: hqSlug, message: '' } })),
    onSettled: () => refreshPage(qc, branchSlug),
  });
}

/** Accept/decline, cancel, or unlink. `slug` is whichever side the viewer acts for. */
export function useBranchLinkAction(slug: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ link, action }: { link: BranchLink; action: 'accept' | 'decline' | 'cancel' | 'unlink' }) => {
      const path = { params: { path: { slug, link_id: link.id } } };
      if (action === 'cancel') return unwrap(await api.POST('/api/v1/pages/{slug}/branch-links/{link_id}/cancel', path));
      if (action === 'unlink') return unwrap(await api.DELETE('/api/v1/pages/{slug}/branch-links/{link_id}', path));
      return unwrap(
        await api.POST('/api/v1/pages/{slug}/branch-links/{link_id}/decide', { ...path, body: { accept: action === 'accept' } }),
      );
    },
    onSettled: (_, __, { link }) => {
      refreshPage(qc, link.hq.slug);
      refreshPage(qc, link.branch.slug);
    },
  });
}

export function useSetNotificationPrefs(slug: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (body: { announcements?: boolean; live_alerts?: boolean }) =>
      unwrap(await api.PATCH('/api/v1/pages/{slug}/notification-preferences', { ...at(slug), body })),
    onSuccess: (prefs) => qc.setQueryData([...pageKey(slug), 'prefs'], prefs),
  });
}

export type PageFields = Schemas['PageCreateSchema'];

export function useCreatePage() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (body: PageFields) => unwrap(await api.POST('/api/v1/pages/', { body })),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['pages', 'mine'] }),
  });
}

export function useUpdatePage(slug: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (body: Schemas['PagePatchSchema']) =>
      unwrap(await api.PATCH('/api/v1/pages/{slug}/', { ...at(slug), body })),
    onSuccess: (page) => {
      qc.setQueryData([...pageKey(slug), 'detail'], page);
      qc.invalidateQueries({ queryKey: ['pages', 'mine'] });
    },
  });
}

const IMAGE = {
  logo: { aspect: [1, 1] as [number, number], name: 'logo.jpg' },
  cover: { aspect: [16, 9] as [number, number], name: 'cover.jpg' },
};

/** Pick, crop and upload a Page logo or cover. Resolves to false if the user cancelled. */
export async function pickAndUploadPageImage(slug: string, kind: 'logo' | 'cover'): Promise<boolean> {
  const shape = IMAGE[kind];
  const res = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ['images'],
    allowsEditing: true,
    aspect: shape.aspect,
    quality: 0.85,
  });
  const asset = res.canceled ? null : res.assets[0];
  if (!asset) return false;
  await uploadForm(`/api/v1/pages/${encodeURIComponent(slug)}/${kind}`, () => {
    const body = new FormData();
    body.append('file', {
      uri: asset.uri,
      name: asset.fileName ?? shape.name,
      type: asset.mimeType ?? 'image/jpeg',
    } as unknown as Blob);
    return body;
  });
  return true;
}
