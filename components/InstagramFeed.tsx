import { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  Dimensions,
  Linking,
  ActivityIndicator,
} from 'react-native';
import { WebView } from 'react-native-webview';
import { MotiView } from 'moti';
import { Instagram, ExternalLink, RefreshCw, ArrowRight } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import { COLORS } from '../lib/constants';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const INSTAGRAM_URL = 'https://www.instagram.com/amari.gala/';

interface InstagramFeedProps {
  height?: number;
  showHeader?: boolean;
}

export default function InstagramFeed({
  height = 450,
  showHeader = true,
}: InstagramFeedProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const [key, setKey] = useState(0);

  const handleOpenInstagram = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    Linking.openURL(INSTAGRAM_URL);
  }, []);

  const handleRetry = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setHasError(false);
    setIsLoading(true);
    setKey((prev) => prev + 1);
  }, []);

  // Instagram embed HTML with proper styling
  const embedHTML = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
        <style>
          * { margin: 0; padding: 0; box-sizing: border-box; }
          html, body {
            background: #f8f6f3;
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            overflow-x: hidden;
            -webkit-overflow-scrolling: touch;
          }
          .container {
            padding: 12px;
            min-height: 100vh;
          }
          .instagram-media {
            width: 100% !important;
            min-width: 100% !important;
            max-width: 100% !important;
            margin: 0 !important;
            border: none !important;
            border-radius: 8px !important;
            box-shadow: 0 2px 8px rgba(0,0,0,0.06) !important;
          }
          iframe {
            width: 100% !important;
            border: none !important;
            border-radius: 8px !important;
          }
          .loading {
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            padding: 40px 20px;
            color: #9a9590;
            font-size: 14px;
            text-align: center;
          }
          .loading-icon {
            font-size: 32px;
            margin-bottom: 12px;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <blockquote
            class="instagram-media"
            data-instgrm-permalink="${INSTAGRAM_URL}"
            data-instgrm-version="14"
            style="width:100%;">
            <div class="loading">
              <div class="loading-icon">📸</div>
              <div>Loading @amari.gala...</div>
            </div>
          </blockquote>
          <script async src="//www.instagram.com/embed.js"></script>
        </div>
      </body>
    </html>
  `;

  return (
    <MotiView
      from={{ opacity: 0, translateY: 20 }}
      animate={{ opacity: 1, translateY: 0 }}
      transition={{ type: 'timing', duration: 500 }}
      style={styles.container}
    >
      {/* Section Header */}
      {showHeader && (
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <View style={styles.iconWrapper}>
              <Instagram size={18} color={COLORS.charcoal} strokeWidth={1.5} />
            </View>
            <View>
              <Text style={styles.headerTitle}>AMARI ON INSTAGRAM</Text>
              <Text style={styles.headerSubtitle}>@amari.gala</Text>
            </View>
          </View>
          <Pressable
            style={({ pressed }) => [
              styles.followButton,
              pressed && styles.followButtonPressed,
            ]}
            onPress={handleOpenInstagram}
            accessibilityLabel="Follow on Instagram"
          >
            <Text style={styles.followButtonText}>FOLLOW</Text>
            <ExternalLink size={12} color={COLORS.cream} strokeWidth={2} />
          </Pressable>
        </View>
      )}

      {/* Feed Content */}
      <View style={[styles.feedContainer, { height }]}>
        {isLoading && !hasError && (
          <View style={styles.loadingOverlay}>
            <MotiView
              from={{ opacity: 0.5, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ type: 'timing', duration: 600, loop: true }}
            >
              <Instagram size={32} color={COLORS.warmGray} strokeWidth={1} />
            </MotiView>
            <Text style={styles.loadingText}>Loading feed...</Text>
          </View>
        )}

        {hasError ? (
          <View style={styles.errorContainer}>
            <Instagram size={48} color={COLORS.warmGray} strokeWidth={1} />
            <Text style={styles.errorTitle}>Couldn't load feed</Text>
            <Text style={styles.errorText}>
              Check your connection or view directly on Instagram
            </Text>
            <View style={styles.errorActions}>
              <Pressable
                style={({ pressed }) => [
                  styles.retryButton,
                  pressed && styles.retryButtonPressed,
                ]}
                onPress={handleRetry}
              >
                <RefreshCw size={14} color={COLORS.charcoal} strokeWidth={2} />
                <Text style={styles.retryText}>Retry</Text>
              </Pressable>
              <Pressable
                style={({ pressed }) => [
                  styles.openIGButton,
                  pressed && styles.openIGButtonPressed,
                ]}
                onPress={handleOpenInstagram}
              >
                <Text style={styles.openIGText}>Open Instagram</Text>
              </Pressable>
            </View>
          </View>
        ) : (
          <WebView
            key={key}
            source={{ html: embedHTML }}
            style={styles.webview}
            onLoadStart={() => setIsLoading(true)}
            onLoadEnd={() => setIsLoading(false)}
            onError={() => {
              setIsLoading(false);
              setHasError(true);
            }}
            scrollEnabled={true}
            showsVerticalScrollIndicator={false}
            showsHorizontalScrollIndicator={false}
            javaScriptEnabled={true}
            domStorageEnabled={true}
            startInLoadingState={false}
            scalesPageToFit={true}
            allowsInlineMediaPlayback={true}
            mediaPlaybackRequiresUserAction={false}
          />
        )}
      </View>

      {/* View All CTA */}
      <Pressable
        style={({ pressed }) => [
          styles.ctaButton,
          pressed && styles.ctaButtonPressed,
        ]}
        onPress={handleOpenInstagram}
      >
        <Text style={styles.ctaText}>View all posts on Instagram</Text>
        <ArrowRight size={14} color={COLORS.charcoal} strokeWidth={2} />
      </Pressable>
    </MotiView>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: COLORS.white,
    borderRadius: 12,
    overflow: 'hidden',
    shadowColor: COLORS.charcoal,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  iconWrapper: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(26, 26, 26, 0.04)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontFamily: 'DMSans-SemiBold',
    fontSize: 11,
    letterSpacing: 1,
    color: COLORS.charcoal,
  },
  headerSubtitle: {
    fontFamily: 'DMSans-Regular',
    fontSize: 13,
    color: COLORS.warmGray,
    marginTop: 1,
  },
  followButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: COLORS.charcoal,
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 4,
  },
  followButtonPressed: {
    backgroundColor: COLORS.charcoalLight,
  },
  followButtonText: {
    fontFamily: 'DMSans-SemiBold',
    fontSize: 10,
    letterSpacing: 1,
    color: COLORS.cream,
  },
  feedContainer: {
    backgroundColor: COLORS.cream,
    position: 'relative',
  },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: COLORS.cream,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
  },
  loadingText: {
    fontFamily: 'DMSans-Regular',
    fontSize: 13,
    color: COLORS.warmGray,
    marginTop: 12,
  },
  webview: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  errorTitle: {
    fontFamily: 'DMSans-SemiBold',
    fontSize: 16,
    color: COLORS.charcoal,
    marginTop: 16,
  },
  errorText: {
    fontFamily: 'DMSans-Regular',
    fontSize: 14,
    color: COLORS.warmGray,
    marginTop: 6,
    textAlign: 'center',
    lineHeight: 20,
  },
  errorActions: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 24,
  },
  retryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 4,
  },
  retryButtonPressed: {
    backgroundColor: 'rgba(0, 0, 0, 0.02)',
  },
  retryText: {
    fontFamily: 'DMSans-Medium',
    fontSize: 13,
    color: COLORS.charcoal,
  },
  openIGButton: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    backgroundColor: COLORS.charcoal,
    borderRadius: 4,
  },
  openIGButtonPressed: {
    backgroundColor: COLORS.charcoalLight,
  },
  openIGText: {
    fontFamily: 'DMSans-Medium',
    fontSize: 13,
    color: COLORS.cream,
  },
  ctaButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    padding: 14,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  ctaButtonPressed: {
    backgroundColor: 'rgba(0, 0, 0, 0.02)',
  },
  ctaText: {
    fontFamily: 'DMSans-Medium',
    fontSize: 13,
    color: COLORS.charcoal,
  },
});
