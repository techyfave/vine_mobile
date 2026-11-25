import { View } from 'react-native';

import { AppText, Card, Icon } from '@/ui/components';
import { colors, space } from '@/ui/theme';

/** Placeholder card for parts of the app that aren't built yet. The screen supplies its own header. */
export function ComingSoon({ icon, title, body }: { icon: number; title: string; body: string }) {
  return (
    <View style={{ paddingHorizontal: space.md }}>
      <Card style={{ alignItems: 'center', gap: space.md, paddingVertical: space.xxxl, paddingHorizontal: space.xl }}>
        <View
          style={{
            width: 64,
            height: 64,
            borderRadius: 32,
            backgroundColor: colors.accent,
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Icon source={icon} size={30} tint={colors.ink} />
        </View>
        <AppText variant="title" style={{ textAlign: 'center' }}>
          {title}
        </AppText>
        <AppText color={colors.textMuted} style={{ textAlign: 'center' }}>
          {body}
        </AppText>
      </Card>
    </View>
  );
}
