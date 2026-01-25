import { View, Text, StyleSheet, Pressable, Dimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { COLORS } from '../../lib/constants';

const { height } = Dimensions.get('window');

export default function WelcomeScreen() {
  const router = useRouter();

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <View style={styles.content}>
        {/* Top Section - Wordmark */}
        <View style={styles.header}>
          <Text style={styles.wordmark}>AMARI</Text>
        </View>

        {/* Middle Section - Tagline */}
        <View style={styles.middle}>
          <Text style={styles.tagline}>Excellence.</Text>
          <Text style={styles.tagline}>Community.</Text>
          <Text style={styles.tagline}>Legacy.</Text>
        </View>

        {/* Bottom Section - Actions */}
        <View style={styles.actions}>
          <Text style={styles.memberText}>
            Membership is by invitation only.
          </Text>

          <Pressable
            style={styles.inviteButton}
            onPress={() => router.push('/(auth)/invite')}
            accessibilityLabel="Enter invite code"
          >
            <Text style={styles.inviteButtonText}>I HAVE AN INVITE CODE</Text>
          </Pressable>

          <View style={styles.dividerRow}>
            <View style={styles.divider} />
            <Text style={styles.dividerText}>OR</Text>
            <View style={styles.divider} />
          </View>

          <Pressable
            style={styles.signInButton}
            onPress={() => {
              // TODO: Implement sign in flow
              console.log('Sign in pressed');
            }}
            accessibilityLabel="Sign in to existing account"
          >
            <Text style={styles.signInButtonText}>SIGN IN</Text>
          </Pressable>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.charcoal,
  },
  content: {
    flex: 1,
    paddingHorizontal: 32,
  },
  header: {
    paddingTop: height * 0.1,
    alignItems: 'center',
  },
  wordmark: {
    fontFamily: 'Syne-Bold',
    fontSize: 32,
    letterSpacing: 12,
    color: COLORS.cream,
  },
  middle: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  tagline: {
    fontFamily: 'EBGaramond-Regular',
    fontSize: 28,
    color: COLORS.cream,
    letterSpacing: 2,
    marginVertical: 4,
  },
  actions: {
    paddingBottom: 48,
  },
  memberText: {
    fontFamily: 'DMSans-Regular',
    fontSize: 14,
    color: 'rgba(248, 246, 243, 0.6)',
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 32,
  },
  inviteButton: {
    backgroundColor: COLORS.cream,
    paddingVertical: 18,
    alignItems: 'center',
    marginBottom: 20,
  },
  inviteButtonText: {
    fontFamily: 'DMSans-SemiBold',
    fontSize: 13,
    letterSpacing: 2,
    color: COLORS.charcoal,
  },
  dividerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  divider: {
    flex: 1,
    height: 1,
    backgroundColor: 'rgba(248, 246, 243, 0.15)',
  },
  dividerText: {
    fontFamily: 'DMSans-Medium',
    fontSize: 11,
    letterSpacing: 2,
    color: 'rgba(248, 246, 243, 0.4)',
    marginHorizontal: 16,
  },
  signInButton: {
    borderWidth: 1,
    borderColor: 'rgba(248, 246, 243, 0.3)',
    paddingVertical: 18,
    alignItems: 'center',
  },
  signInButtonText: {
    fontFamily: 'DMSans-SemiBold',
    fontSize: 13,
    letterSpacing: 2,
    color: COLORS.cream,
  },
});
