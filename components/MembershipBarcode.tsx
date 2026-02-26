import { View, Text, StyleSheet, Pressable } from 'react-native';
import { MotiView } from 'moti';
import { QrCode } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import { COLORS } from '../lib/constants';

interface MembershipBarcodeProps {
  memberId: string;
  memberName: string;
  onPressQR?: () => void;
}

export default function MembershipBarcode({
  memberId,
  memberName,
  onPressQR,
}: MembershipBarcodeProps) {
  // Generate unique barcode pattern from member ID
  const generateBars = (id: string): { width: number; height: number; opacity: number }[] => {
    const seed = id.split('').reduce((acc, char, i) => acc + char.charCodeAt(0) * (i + 1), 0);

    return Array.from({ length: 45 }, (_, i) => {
      const pseudoRandom = ((seed * (i + 1) * 7) % 100) / 100;
      return {
        width: ((seed * (i + 1)) % 3) + 1,
        height: 45 + (pseudoRandom * 20),
        opacity: 0.7 + (pseudoRandom * 0.3),
      };
    });
  };

  const bars = generateBars(memberId);

  const handlePress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onPressQR?.();
  };

  return (
    <MotiView
      from={{ opacity: 0, translateY: 20 }}
      animate={{ opacity: 1, translateY: 0 }}
      transition={{ type: 'timing', duration: 500 }}
      style={styles.container}
    >
      {/* Card header */}
      <View style={styles.header}>
        <Text style={styles.headerText}>MEMBERSHIP CARD</Text>
        <View style={styles.logoMark}>
          <Text style={styles.logoText}>A</Text>
        </View>
      </View>

      {/* Barcode visualization */}
      <View style={styles.barcodeContainer}>
        {bars.map((bar, i) => (
          <MotiView
            key={i}
            from={{ scaleY: 0 }}
            animate={{ scaleY: 1 }}
            transition={{
              type: 'timing',
              duration: 400,
              delay: i * 8,
            }}
            style={[
              styles.bar,
              {
                width: bar.width,
                height: bar.height,
                opacity: bar.opacity,
              },
            ]}
          />
        ))}
      </View>

      {/* Member ID */}
      <Text style={styles.memberId}>{memberId}</Text>

      {/* Member Name */}
      <Text style={styles.memberName}>{memberName.toUpperCase()}</Text>

      {/* Divider */}
      <View style={styles.divider} />

      {/* QR Code prompt */}
      <Pressable
        style={({ pressed }) => [
          styles.qrPrompt,
          pressed && styles.qrPromptPressed,
        ]}
        onPress={handlePress}
        accessibilityLabel="Tap to show QR code"
      >
        <QrCode size={16} color={COLORS.warmGray} strokeWidth={1.5} />
        <Text style={styles.qrText}>TAP TO SHOW QR CODE</Text>
      </Pressable>
    </MotiView>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: COLORS.white,
    borderRadius: 12,
    padding: 24,
    shadowColor: COLORS.charcoal,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 4,
    alignItems: 'center',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
    marginBottom: 24,
  },
  headerText: {
    fontFamily: 'DMSans-Medium',
    fontSize: 10,
    letterSpacing: 2,
    color: COLORS.warmGray,
  },
  logoMark: {
    width: 28,
    height: 28,
    borderWidth: 1.5,
    borderColor: COLORS.charcoal,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoText: {
    fontFamily: 'Syne-Bold',
    fontSize: 14,
    color: COLORS.charcoal,
  },
  barcodeContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'center',
    height: 65,
    gap: 1.5,
    marginBottom: 16,
  },
  bar: {
    backgroundColor: COLORS.charcoal,
    borderRadius: 0.5,
  },
  memberId: {
    fontFamily: 'DMSans-Medium',
    fontSize: 13,
    letterSpacing: 3,
    color: COLORS.charcoal,
    marginBottom: 4,
  },
  memberName: {
    fontFamily: 'Syne-SemiBold',
    fontSize: 16,
    letterSpacing: 2,
    color: COLORS.charcoal,
  },
  divider: {
    width: '100%',
    height: 1,
    backgroundColor: COLORS.border,
    marginVertical: 20,
  },
  qrPrompt: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 4,
  },
  qrPromptPressed: {
    backgroundColor: 'rgba(0, 0, 0, 0.03)',
  },
  qrText: {
    fontFamily: 'DMSans-Medium',
    fontSize: 10,
    letterSpacing: 1.5,
    color: COLORS.warmGray,
  },
});
