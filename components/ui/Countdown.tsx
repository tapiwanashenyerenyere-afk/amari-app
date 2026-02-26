import { useEffect, useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { MotiView } from 'moti';
import { COLORS } from '../../lib/constants';

interface CountdownProps {
  targetDate: Date;
  label?: string;
}

interface TimeLeft {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
}

function calculateTimeLeft(target: Date): TimeLeft {
  const difference = target.getTime() - Date.now();

  if (difference <= 0) {
    return { days: 0, hours: 0, minutes: 0, seconds: 0 };
  }

  return {
    days: Math.floor(difference / (1000 * 60 * 60 * 24)),
    hours: Math.floor((difference / (1000 * 60 * 60)) % 24),
    minutes: Math.floor((difference / 1000 / 60) % 60),
    seconds: Math.floor((difference / 1000) % 60),
  };
}

export default function Countdown({ targetDate, label }: CountdownProps) {
  const [timeLeft, setTimeLeft] = useState<TimeLeft>(calculateTimeLeft(targetDate));

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft(calculateTimeLeft(targetDate));
    }, 1000);

    return () => clearInterval(timer);
  }, [targetDate]);

  const formatNumber = (num: number): string => {
    return num.toString().padStart(2, '0');
  };

  const units: { value: number; label: string; key: keyof TimeLeft }[] = [
    { value: timeLeft.days, label: 'DAYS', key: 'days' },
    { value: timeLeft.hours, label: 'HRS', key: 'hours' },
    { value: timeLeft.minutes, label: 'MIN', key: 'minutes' },
    { value: timeLeft.seconds, label: 'SEC', key: 'seconds' },
  ];

  return (
    <MotiView
      from={{ opacity: 0, translateY: 15 }}
      animate={{ opacity: 1, translateY: 0 }}
      transition={{ type: 'timing', duration: 500 }}
      style={styles.container}
    >
      {label && <Text style={styles.label}>{label}</Text>}

      <View style={styles.unitsContainer}>
        {units.map((unit, index) => (
          <View key={unit.key} style={styles.unitWrapper}>
            <View style={styles.unitBox}>
              <MotiView
                key={`${unit.key}-${unit.value}`}
                from={{ opacity: 0.6, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ type: 'spring', damping: 15, stiffness: 200 }}
              >
                <Text style={styles.value}>
                  {unit.key === 'days' ? unit.value : formatNumber(unit.value)}
                </Text>
              </MotiView>
            </View>
            <Text style={styles.unitLabel}>{unit.label}</Text>

            {/* Separator colon */}
            {index < units.length - 1 && (
              <MotiView
                animate={{
                  opacity: [1, 0.3, 1],
                }}
                transition={{
                  type: 'timing',
                  duration: 1000,
                  loop: true,
                }}
                style={styles.separatorContainer}
              >
                <Text style={styles.separator}>:</Text>
              </MotiView>
            )}
          </View>
        ))}
      </View>
    </MotiView>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
  },
  label: {
    fontFamily: 'DMSans-Medium',
    fontSize: 11,
    letterSpacing: 2,
    color: COLORS.warmGray,
    marginBottom: 12,
    textTransform: 'uppercase',
  },
  unitsContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'center',
  },
  unitWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  unitBox: {
    alignItems: 'center',
    minWidth: 48,
  },
  value: {
    fontFamily: 'Syne-Bold',
    fontSize: 32,
    color: COLORS.cream,
    letterSpacing: 1,
  },
  unitLabel: {
    fontFamily: 'DMSans-Medium',
    fontSize: 9,
    letterSpacing: 1.5,
    color: COLORS.gold,
    marginTop: 4,
    position: 'absolute',
    bottom: -18,
    alignSelf: 'center',
    left: 0,
    right: 0,
    textAlign: 'center',
  },
  separatorContainer: {
    paddingHorizontal: 4,
    paddingBottom: 4,
  },
  separator: {
    fontFamily: 'Syne-Bold',
    fontSize: 24,
    color: COLORS.gold,
  },
});
