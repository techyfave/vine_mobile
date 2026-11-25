import { router } from 'expo-router';
import { Pressable, StyleSheet, View } from 'react-native';

import { useAuth } from '@/auth/AuthProvider';
import { icons } from '@/ui/assets';
import { AppText, Avatar, RingButton } from '@/ui/components';
import { colors, radius, space, stroke } from '@/ui/theme';

/** "What's on your mind?" card at the top of the feed. */
export function Composer() {
  const { user } = useAuth();
  const go = (photo = false) => router.push({ pathname: '/create-post', params: photo ? { photo: '1' } : {} });
  return (
    <View style={styles.card}>
      <Avatar uri={user?.profile_picture} size={42} />
      <Pressable accessibilityRole="button" onPress={() => go()} style={styles.prompt}>
        <AppText color={colors.textMuted} numberOfLines={1}>
          What’s on your mind{user?.first_name ? `, ${user.first_name}` : ''}?
        </AppText>
      </Pressable>
      <RingButton icon={icons.camera} label="Add a photo" iconSize={18} onPress={() => go(true)} />
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.sm,
    backgroundColor: colors.card,
    borderRadius: radius.xl,
    borderWidth: stroke,
    borderColor: colors.outline,
    padding: space.sm,
    paddingLeft: space.md,
  },
  prompt: {
    flex: 1,
    height: 44,
    borderRadius: radius.pill,
    backgroundColor: colors.cardMuted,
    justifyContent: 'center',
    paddingHorizontal: space.lg,
  },
});
