import { router } from 'expo-router';
import { Pressable, StyleSheet, View } from 'react-native';

import { useAuth } from '@/auth/AuthProvider';
import { icons } from '@/ui/assets';
import { AppText, Avatar, RingButton } from '@/ui/components';
import { colors, radius, space } from '@/ui/theme';

/** "What do you have in mind?" card at the top of the feed. */
export function Composer() {
  const { user } = useAuth();
  const go = (photo = false) => router.push({ pathname: '/create-post', params: photo ? { photo: '1' } : {} });
  return (
    <View style={styles.card}>
      <View style={styles.row}>
        <Avatar uri={user?.profile_picture} size={40} />
        <Pressable accessibilityRole="button" onPress={() => go()} style={styles.prompt}>
          <AppText variant="caption" color={colors.textMuted} numberOfLines={1}>
            What do you have in mind? {user?.first_name || user?.username}
          </AppText>
        </Pressable>
      </View>
      <View style={styles.addRow}>
        <AppText variant="caption" color={colors.textMuted}>
          Add to your post
        </AppText>
        <View style={{ flexDirection: 'row', gap: space.sm }}>
          <RingButton icon={icons.smiley} label="Add a feeling" size={32} iconSize={16} dashed={false} onPress={() => go()} />
          <RingButton icon={icons.camera} label="Add a photo" size={32} iconSize={16} dashed={false} onPress={() => go(true)} />
          <RingButton icon={icons.live} label="Go live (coming soon)" size={32} iconSize={16} dashed={false} onPress={() => router.push('/live')} />
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: { backgroundColor: colors.card, borderRadius: radius.xl, padding: space.md, gap: space.md },
  row: { flexDirection: 'row', alignItems: 'center', gap: space.sm },
  prompt: {
    flex: 1,
    height: 40,
    borderRadius: radius.md,
    borderWidth: 2,
    borderColor: colors.softBlue,
    justifyContent: 'center',
    paddingHorizontal: space.md,
  },
  addRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.cardMuted,
    borderRadius: radius.md,
    paddingLeft: space.md,
    paddingRight: space.sm,
    paddingVertical: 6,
  },
});
