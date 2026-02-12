import { useEffect, useRef } from 'react';
import { Animated } from 'react-native';
import { colors, borderRadius } from '../../lib/constants';

type Props = {
  width?: number | string;
  height?: number | string;
  style?: object;
};

export function Skeleton({ width = '100%', height = 20, style }: Props) {
  const opacity = useRef(new Animated.Value(0.3)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, { toValue: 0.6, duration: 800, useNativeDriver: true }),
        Animated.timing(opacity, { toValue: 0.3, duration: 800, useNativeDriver: true }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [opacity]);

  return (
    <Animated.View
      style={[
        {
          width,
          height,
          backgroundColor: colors.surfaceAlt,
          borderRadius: borderRadius.sm,
          opacity,
        },
        style,
      ]}
    />
  );
}
