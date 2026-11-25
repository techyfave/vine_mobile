import { View } from 'react-native';

import { ComingSoon } from '@/features/ComingSoon';
import { icons } from '@/ui/assets';
import { colors } from '@/ui/theme';
import { ScreenTitle } from '@/ui/TopBar';

export default function Grapevine() {
  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <ScreenTitle title="Grapevine" subtitle="Worth your time, from people you trust" />
      <ComingSoon
        icon={icons.tabGrapevineOn}
        title="Recommendations are coming"
        body="Shows, books, music and films your friends love, picked for you. Save what you want to watch, read or listen to next."
      />
    </View>
  );
}
