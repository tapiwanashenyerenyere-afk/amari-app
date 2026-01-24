import * as Crypto from 'expo-crypto';

export interface MemberBarcode {
  memberId: string;
  tier: string | null;
  issuedAt: number;  // timestamp
  signature: string; // HMAC for verification
}

/**
 * Generate unique barcode data for a member
 * Council members do NOT get barcodes - they get the SEAL
 */
export async function generateMemberBarcode(
  memberId: string,
  tier: string | null,
  secretKey: string
): Promise<string> {
  // Council members don't get barcodes
  if (tier === 'council') {
    throw new Error('Council members do not have barcodes');
  }

  const payload = {
    memberId,
    tier,
    issuedAt: Date.now(),
  };

  const payloadString = JSON.stringify(payload);

  // Create HMAC signature for verification
  const signature = await Crypto.digestStringAsync(
    Crypto.CryptoDigestAlgorithm.SHA256,
    `${payloadString}:${secretKey}`
  );

  const barcodeData: MemberBarcode = {
    ...payload,
    signature: signature.substring(0, 16), // Truncate for QR size
  };

  // Encode as base64 for QR
  // Note: In React Native, we use btoa or a polyfill
  const jsonString = JSON.stringify(barcodeData);
  const base64 = Buffer.from(jsonString).toString('base64');
  return base64;
}

/**
 * Verify barcode at event (can work offline with cached secret)
 */
export async function verifyMemberBarcode(
  barcodeString: string,
  secretKey: string
): Promise<{ valid: boolean; memberId?: string; tier?: string | null }> {
  try {
    // Decode base64
    const jsonString = Buffer.from(barcodeString, 'base64').toString('utf-8');
    const data: MemberBarcode = JSON.parse(jsonString);

    // Reconstruct expected signature
    const payloadForSigning = JSON.stringify({
      memberId: data.memberId,
      tier: data.tier,
      issuedAt: data.issuedAt,
    });

    const expectedSig = await Crypto.digestStringAsync(
      Crypto.CryptoDigestAlgorithm.SHA256,
      `${payloadForSigning}:${secretKey}`
    );

    if (expectedSig.substring(0, 16) !== data.signature) {
      return { valid: false };
    }

    return {
      valid: true,
      memberId: data.memberId,
      tier: data.tier,
    };
  } catch {
    return { valid: false };
  }
}

/**
 * Check if a member should have a QR code or SEAL
 */
export function shouldHaveQRCode(tier: string | null): boolean {
  return tier !== 'council';
}
