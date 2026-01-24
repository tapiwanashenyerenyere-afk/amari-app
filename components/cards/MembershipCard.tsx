import { View, Text, StyleSheet } from 'react-native';
import QRCode from 'react-native-qrcode-svg';
import { COLORS, TIER_DISPLAY_NAMES, TierType } from '../../lib/constants';
import { shouldHaveQRCode } from '../../lib/barcode';

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
      <View style={styles.sealInner}>
        <Text style={styles.sealText}>COUNCIL</Text>
        <View style={styles.sealDivider} />
        <Text style={styles.sealYear}>EST. 2024</Text>
      </View>
    </View>
  );
}

export function MembershipCard({ name, memberId, tier, barcodeData }: MembershipCardProps) {
  const isCouncil = tier === 'council';
  const hasQR = shouldHaveQRCode(tier);

  return (
    <View style={styles.card}>
      {/* AMARI Wordmark */}
      <Text style={styles.wordmark}>AMARI</Text>

      {/* Member Name */}
      <Text style={styles.name}>{name}</Text>

      {/* Member ID */}
      <Text style={styles.memberId}>{memberId}</Text>

      {/* QR Code or Council Seal */}
      <View style={styles.codeContainer}>
        {isCouncil ? (
          <CouncilSeal />
        ) : hasQR && barcodeData ? (
          <View style={styles.qrWrapper}>
            <QRCode
              value={barcodeData}
              size={80}
              backgroundColor={COLORS.white}
              color={COLORS.charcoal}
            />
          </View>
        ) : (
          <View style={styles.qrPlaceholder}>
            <Text style={styles.qrPlaceholderText}>[QR Code]</Text>
          </View>
        )}
      </View>

      {/* Tier Badge */}
      {tier && (
        <View style={styles.tierContainer}>
          <TierBadge tier={tier} />
        </View>
      )}
    </View>
  );
}

function TierBadge({ tier }: { tier: string }) {
  const isCouncil = tier === 'council';

  // Different styling for different tiers
  const getBadgeStyle = () => {
    switch (tier) {
      case 'laureate':
        return { backgroundColor: '#D4AF37' }; // Gold
      case 'platinum':
        return { backgroundColor: '#E5E4E2' }; // Platinum
      case 'gold':
        return { backgroundColor: '#FFD700' };
      case 'silver':
        return { backgroundColor: '#C0C0C0' };
      default:
        return { backgroundColor: 'rgba(255,255,255,0.1)' };
    }
  };

  if (isCouncil) {
    // Council seal is already shown above, just show text
    return null;
  }

  return (
    <View style={[styles.tierBadge, getBadgeStyle()]}>
      <Text style={styles.tierText}>{TIER_DISPLAY_NAMES[tier] || tier}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: COLORS.charcoal,
    padding: 32,
    margin: 24,
    // Sharp corners for luxury feel
    borderRadius: 0,
  },
  wordmark: {
    fontSize: 14,
    fontWeight: '600',
    letterSpacing: 4,
    color: COLORS.white,
    textAlign: 'center',
    marginBottom: 24,
  },
  name: {
    fontSize: 20,
    color: COLORS.white,
    textAlign: 'center',
    marginBottom: 4,
  },
  memberId: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.5)',
    textAlign: 'center',
    marginBottom: 20,
  },
  codeContainer: {
    alignItems: 'center',
    marginBottom: 20,
  },
  qrWrapper: {
    backgroundColor: COLORS.white,
    padding: 10,
  },
  qrPlaceholder: {
    backgroundColor: COLORS.white,
    padding: 10,
    width: 100,
    height: 100,
    justifyContent: 'center',
    alignItems: 'center',
  },
  qrPlaceholderText: {
    fontSize: 10,
    color: COLORS.warmGray,
  },
  sealOuter: {
    width: 100,
    height: 100,
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.3)',
    borderRadius: 50,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sealInner: {
    width: 80,
    height: 80,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
    borderRadius: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sealText: {
    fontSize: 10,
    fontWeight: '600',
    letterSpacing: 3,
    color: COLORS.white,
  },
  sealDivider: {
    width: 40,
    height: 1,
    backgroundColor: 'rgba(255,255,255,0.3)',
    marginVertical: 6,
  },
  sealYear: {
    fontSize: 8,
    letterSpacing: 1,
    color: 'rgba(255,255,255,0.5)',
  },
  tierContainer: {
    alignItems: 'center',
  },
  tierBadge: {
    paddingHorizontal: 20,
    paddingVertical: 8,
  },
  tierText: {
    fontSize: 10,
    fontWeight: '600',
    letterSpacing: 2,
    color: COLORS.charcoal,
    textTransform: 'uppercase',
  },
});
