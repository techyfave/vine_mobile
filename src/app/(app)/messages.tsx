import { View } from 'react-native';

import { ComingSoon } from '@/features/ComingSoon';
import { icons } from '@/ui/assets';
import { space } from '@/ui/theme';

export default function Messages() {
  return (
    <View style={{ paddingTop: space.md }}>
      <ComingSoon icon={icons.chatOutline} title="Messages are coming" body="Private conversations with your friends are on the way." />
    </View>
  );
}
