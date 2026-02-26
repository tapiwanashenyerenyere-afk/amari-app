import { View, Text, StyleSheet } from 'react-native';
import QRCode from 'react-native-qrcode-svg';
import { COLORS, TierType } from '../../lib/constants';

// Design constants - museum artifact aesthetic
const CARD_BLACK = '#000000';
const CREAM_TEXT = '#f8f6f3';
const TIER_ACCENT = '#C9A227'; // Gold accent for tier only

interface MembershipCardProps {
  name: string;
  memberId: string;
  tier: TierType;
  barcodeData?: string;
}

/**
 * Council Seal - Serious, authoritative design
 * CIA/intelligence agency aesthetic, NOT quirky
 */
function CouncilSeal() {
  return (
    <View style={styles.sealOuter}>
      <View style={styles.sealMiddle}>
        <View style={styles.sealInner}>
          <Text style={styles.sealText}>COUNCIL</Text>
          <View style={styles.sealDivider} />
          <Text style={styles.sealYear}>EST. 2024</Text>
        </View>
      </View>
    </View>
  );
}

/**
 * Tier Badge - Restrained, minimal
 */
function TierBadge({ tier }: { tier: string }) {
  // Council members get the seal, not a badge
  if (tier === 'council') return null;

  const displayName = {
    laureate: 'LAUREATE',
    platinum: 'PLATINUM',
    gold: 'GOLD',
    silver: 'SILVER',
  }[tier] || tier.toUpperCase();

  return (
    <View style={styles.tierBadge}>
      <Text style={styles.tierText}>{displayName}</Text>
    </View>
  );
}

export function MembershipCard({ name, memberId, tier, barcodeData }: MembershipCardProps) {
  const isCouncil = false;
  const hasQR = !!barcodeData;

  return (
    <View style={styles.card}>
      {/* AMARI Wordmark - Top */}
      <Text style={styles.wordmark}>AMARI</Text>

      {/* Subtle divider */}
      <View style={styles.headerDivider} />

      {/* Member Name - EB Garamond */}
      <Text style={styles.name}>{name}</Text>

      {/* Member ID - Subdued */}
      <Text style={styles.memberId}>{memberId}</Text>

      {/* QR Code or Council Seal - Centered */}
      <View style={styles.codeContainer}>
        {isCouncil ? (
          <CouncilSeal />
        ) : hasQR ? (
          <View style={styles.qrWrapper}>
            <QRCode
              value={barcodeData}
              size={90}
              backgroundColor={CREAM_TEXT}
              color={CARD_BLACK}
            />
          </View>
        ) : (
          <View style={styles.qrPlaceholder}>
            <View style={styles.qrLines}>
              <View style={styles.qrLine} />
              <View style={styles.qrLine} />
              <View style={styles.qrLine} />
            </View>
          </View>
        )}
      </View>

      {/* Tier Badge - Bottom */}
      {tier && <TierBadge tier={tier} />}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: CARD_BLACK,
    paddingVertical: 36,
    paddingHorizontal: 32,
    width: '100%',
    alignItems: 'center',
    // No border radius - sharp museum artifact
  },
  wordmark: {
    fontFamily: 'Syne-Bold',
    fontSize: 14,
    fontWeight: '600',
    letterSpacing: 6,
    color: CREAM_TEXT,
    textAlign: 'center',
    marginBottom: 12,
  },
  headerDivider: {
    width: 40,
    height: 1,
    backgroundColor: 'rgba(248, 246, 243, 0.15)',
    marginBottom: 24,
  },
  name: {
    fontFamily: 'EBGaramond-Regular',
    fontSize: 22,
    color: CREAM_TEXT,
    textAlign: 'center',
    marginBottom: 6,
    letterSpacing: 1,
  },
  memberId: {
    fontFamily: 'DMSans-Regular',
    fontSize: 11,
    color: 'rgba(248, 246, 243, 0.4)',
    textAlign: 'center',
    letterSpacing: 2,
    marginBottom: 28,
  },
  codeContainer: {
    alignItems: 'center',
    marginBottom: 24,
  },
  qrWrapper: {
    backgroundColor: CREAM_TEXT,
    padding: 12,
  },
  qrPlaceholder: {
    width: 100,
    height: 100,
    backgroundColor: 'rgba(248, 246, 243, 0.05)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  qrLines: {
    gap: 8,
  },
  qrLine: {
    width: 40,
    height: 1,
    backgroundColor: 'rgba(248, 246, 243, 0.2)',
  },
  // Council Seal styles
  sealOuter: {
    width: 100,
    height: 100,
    borderWidth: 1.5,
    borderColor: 'rgba(248, 246, 243, 0.25)',
    borderRadius: 50,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sealMiddle: {
    width: 84,
    height: 84,
    borderWidth: 1,
    borderColor: 'rgba(248, 246, 243, 0.15)',
    borderRadius: 42,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sealInner: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  sealText: {
    fontFamily: 'DMSans-SemiBold',
    fontSize: 9,
    fontWeight: '600',
    letterSpacing: 3,
    color: CREAM_TEXT,
  },
  sealDivider: {
    width: 32,
    height: 1,
    backgroundColor: 'rgba(248, 246, 243, 0.25)',
    marginVertical: 6,
  },
  sealYear: {
    fontFamily: 'DMSans-Regular',
    fontSize: 7,
    letterSpacing: 1.5,
    color: 'rgba(248, 246, 243, 0.5)',
  },
  // Tier badge - restrained
  tierBadge: {
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: 'rgba(201, 162, 39, 0.4)',
  },
  tierText: {
    fontFamily: 'DMSans-Medium',
    fontSize: 10,
    fontWeight: '500',
    letterSpacing: 3,
    color: TIER_ACCENT,
  },
});
