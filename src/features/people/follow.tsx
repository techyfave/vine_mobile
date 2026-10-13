import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useEffect, useState } from 'react';
import { Alert, type StyleProp, type ViewStyle } from 'react-native';

import { api } from '@/api/client';
import { errorMessage, unwrap } from '@/api/errors';
import { ActionSheet } from '@/ui/ActionSheet';
import { Button } from '@/ui/components';

/** Follow or unfollow someone, then refresh everything that shows follow state or follower counts. */
export function useFollow() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ username, follow }: { username: string; follow: boolean }) => {
      const path = { params: { path: { username } } };
      if (follow) unwrap(await api.POST('/api/v1/users/{username}/follow/', path));
      else unwrap(await api.DELETE('/api/v1/users/{username}/follow/', path));
    },
    onSettled: () => {
      for (const key of [['profile'], ['search'], ['people'], ['notifications', 'list'], ['feed', 'home']]) {
        qc.invalidateQueries({ queryKey: key });
      }
    },
  });
}

/**
 * The one Follow button used everywhere (profiles, search, follower lists, notifications).
 * Changes instantly on tap. "Following" asks before unfollowing, so it can't happen by accident.
 */
export function FollowButton({
  username,
  following,
  followedBy = false,
  size = 'md',
  style,
}: {
  username: string;
  following: boolean;
  followedBy?: boolean;
  size?: 'sm' | 'md';
  style?: StyleProp<ViewStyle>;
}) {
  const follow = useFollow();
  const [on, setOn] = useState(following);
  const [confirm, setConfirm] = useState(false);
  useEffect(() => setOn(following), [following]);

  const set = (next: boolean) => {
    setOn(next);
    follow.mutate(
      { username, follow: next },
      {
        onError: (err) => {
          setOn(!next);
          Alert.alert("Couldn't update", errorMessage(err));
        },
      },
    );
  };

  return (
    <>
      <Button
        title={on ? 'Following ✓' : followedBy ? 'Follow back' : 'Follow'}
        variant={on ? 'outline' : 'primary'}
        size={size}
        style={style}
        onPress={() => (on ? setConfirm(true) : set(true))}
      />
      <ActionSheet
        visible={confirm}
        title={`@${username}`}
        actions={[
          {
            label: `Unfollow @${username}`,
            hint: "Their posts won't show in your Home feed anymore.",
            destructive: true,
            onPress: () => set(false),
          },
        ]}
        onClose={() => setConfirm(false)}
      />
    </>
  );
}
