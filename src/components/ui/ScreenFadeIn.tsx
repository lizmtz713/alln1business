import React, { useEffect } from 'react';
import { ViewStyle } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
  Easing,
} from 'react-native-reanimated';

const DURATION = 280;
const easing = Easing.out(Easing.cubic);

type Props = {
  children: React.ReactNode;
  style?: ViewStyle;
};

export function ScreenFadeIn({ children, style }: Props) {
  const opacity = useSharedValue(0);

  useEffect(() => {
    opacity.value = withTiming(1, { duration: DURATION, easing }, (finished) => {
      if (finished) opacity.value = 1;
    });
  }, [opacity]);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
  }));

  return (
    <Animated.View style={[animatedStyle, style]}>
      {children}
    </Animated.View>
  );
}
