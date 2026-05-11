import React from 'react';
import { View, ViewStyle } from 'react-native';
import { MotiView } from 'moti';

interface StaggerRevealProps {
  children: React.ReactNode;
  delay?: number;
  style?: ViewStyle;
}

export function StaggerReveal({ children, delay = 40, style }: StaggerRevealProps) {
  const items = React.Children.toArray(children);

  return (
    <View style={style}>
      {items.map((child, index) => (
        <MotiView
          key={index}
          from={{ opacity: 0, translateY: 8 }}
          animate={{ opacity: 1, translateY: 0 }}
          transition={{
            type: 'timing',
            duration: 300,
            delay: 30 + index * delay,
          }}
        >
          {child}
        </MotiView>
      ))}
    </View>
  );
}
