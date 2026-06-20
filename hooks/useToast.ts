import { useRef, useState } from "react";
import { Animated } from "react-native";

export interface ToastConfig {
  /** Duration in ms before the toast auto-hides (default 2000) */
  duration?: number;
  /** Animation duration for fade-in (default 200) */
  fadeInDuration?: number;
  /** Animation duration for fade-out (default 300) */
  fadeOutDuration?: number;
}

export function useToast(config: ToastConfig = {}) {
  const {
    duration = 2000,
    fadeInDuration = 200,
    fadeOutDuration = 300,
  } = config;

  const [isVisible, setIsVisible] = useState(false);
  const opacity = useRef(new Animated.Value(0)).current;
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const showToast = () => {
    // Clear any existing timer
    if (timerRef.current) clearTimeout(timerRef.current);

    setIsVisible(true);

    // Reset opacity before fading in (handles case where toast is re-shown while fading out)
    opacity.setValue(0);

    // Fade in
    Animated.timing(opacity, {
      toValue: 1,
      duration: fadeInDuration,
      useNativeDriver: true,
    }).start();

    // Auto-hide after the specified duration
    timerRef.current = setTimeout(() => {
      Animated.timing(opacity, {
        toValue: 0,
        duration: fadeOutDuration,
        useNativeDriver: true,
      }).start(() => setIsVisible(false));
    }, duration);
  };

  const hideToast = () => {
    if (timerRef.current) clearTimeout(timerRef.current);
    Animated.timing(opacity, {
      toValue: 0,
      duration: fadeOutDuration,
      useNativeDriver: true,
    }).start(() => setIsVisible(false));
  };

  return {
    /** Whether the toast is currently displayed */
    isVisible,
    /** The animated opacity value to bind to the toast container */
    opacity,
    /** Show the toast with automatic fade-out */
    showToast,
    /** Immediately hide the toast */
    hideToast,
  };
}