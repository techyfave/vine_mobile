import { router } from 'expo-router';
import { View } from 'react-native';

import { ComingSoon } from '@/features/ComingSoon';
import { icons } from '@/ui/assets';
import { RingButton } from '@/ui/components';
import { colors } from '@/ui/theme';
import { ScreenTitle } from '@/ui/TopBar';

export default function Watch() {
  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <ScreenTitle
        title="Watch"
        right={<RingButton icon={icons.search} label="Search" onPress={() => router.push('/search')} />}
      />
      <ComingSoon
        icon={icons.tabWatchOn}
        title="Videos, podcasts and live"
        body="Shows, talks, music and live streams from the people and Pages you follow, all in one place. Coming soon."
      />
    </View>
  );
}
