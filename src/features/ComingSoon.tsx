import { View } from 'react-native';

import { AppText, Card, Icon } from '@/ui/components';
import { TopBar } from '@/ui/TopBar';
import { colors, space } from '@/ui/theme';

/** Placeholder for tabs the design has but the backend doesn't support yet. */
export function ComingSoon({ icon, title, body }: { icon: number; title: string; body: string }) {
  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <TopBar />
      <View style={{ padding: space.md }}>
        <Card style={{ alignItems: 'center', gap: space.md, paddingVertical: space.xxxl }}>
          <Icon source={icon} size={40} />
          <AppText variant="title">{title}</AppText>
          <AppText color={colors.textMuted} style={{ textAlign: 'center' }}>
            {body}
          </AppText>
        </Card>
      </View>
    </View>
  );
}
