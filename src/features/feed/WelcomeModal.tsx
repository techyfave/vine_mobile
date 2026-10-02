import { Image } from 'expo-image';
import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { Modal, StyleSheet, View } from 'react-native';

import { useAuth } from '@/auth/AuthProvider';
import { hasSeen, markSeen } from '@/lib/onboarding';
import { icons, images } from '@/ui/assets';
import { AppText, Button, Icon } from '@/ui/components';
import { colors, radius, space } from '@/ui/theme';

/** "WELCOME DOTMOND! SET UP YOUR PROFILE" — shown once while the profile is still empty. */
export function WelcomeModal() {
  const { user } = useAuth();
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (!user || user.profile_picture || user.bio) return;
    hasSeen(user.id, 'welcome').then((seen) => setVisible(!seen)).catch(() => {});
  }, [user]);

  function close(setup: boolean) {
    if (user) markSeen(user.id, 'welcome').catch(() => {});
    setVisible(false);
    if (setup) router.push('/profile/edit');
  }

  if (!user) return null;
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={() => close(false)}>
      <View style={styles.backdrop}>
        <View style={styles.card}>
          <AppText variant="display" style={{ textAlign: 'center' }}>
            WELCOME {(user.first_name || user.username).toUpperCase()}!
          </AppText>
          <AppText variant="heading" style={{ textAlign: 'center' }}>
            SET UP YOUR PROFILE
          </AppText>
          <View style={styles.art}>
            <Image source={images.welcomeModalBg} style={StyleSheet.absoluteFill} contentFit="contain" />
            <View style={styles.badge}>
              <Icon source={icons.welcomeStar} size={88} />
              <View style={StyleSheet.absoluteFill}>
                <View style={styles.check}>
                  <Icon source={icons.checkMark} size={32} />
                </View>
              </View>
            </View>
          </View>
          <View style={styles.buttons}>
            <Button title="Skip" variant="outline" onPress={() => close(false)} style={{ flex: 1 }} />
            <Button title="Get Started" onPress={() => close(true)} style={{ flex: 1 }} />
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: colors.overlay, justifyContent: 'center', padding: space.xl },
  card: { backgroundColor: colors.white, borderRadius: radius.xxl, padding: space.xl, gap: space.md },
  art: { height: 140, alignItems: 'center', justifyContent: 'center' },
  badge: { width: 88, height: 88 },
  check: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  buttons: { flexDirection: 'row', gap: space.md },
});
