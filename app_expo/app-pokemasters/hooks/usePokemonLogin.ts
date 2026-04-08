import * as Haptics from 'expo-haptics';
import { useRef, useState } from 'react';
import { Animated } from 'react-native';
import { LightningRef } from '@/components/LightOverlay';

const EASTER_EGG_WORD = 'PIKACHU';

export function usePokemonLogin() {
  const shakeAnim    = useRef(new Animated.Value(0)).current;
  const lightningRef = useRef<LightningRef>(null);

  const [easterEgg,   setEasterEgg]   = useState(false);
  const [easterCount, setEasterCount] = useState(0);

  // ── Pokéball shake on error ──
  const shakePokeball = () => {
    Animated.sequence([
      Animated.timing(shakeAnim, { toValue:  10, duration: 60, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: -10, duration: 60, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue:   8, duration: 60, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue:  -8, duration: 60, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue:   4, duration: 60, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue:   0, duration: 60, useNativeDriver: true }),
    ]).start();
  };

  // ── Haptics ──
  const hapticLight   = () => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  const hapticMedium  = () => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
  const hapticSuccess = () => Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  const hapticError   = () => Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);

  // ── Son au login réussi (optionnel, silencieux si fichier absent) ──
  const playSuccessSound = async () => {
    try {
      const { Audio } = await import('expo-av');
      const { sound } = await Audio.Sound.createAsync(
        require('@/assets/sounds/pokemon_catch.mp3'),
        { shouldPlay: true, volume: 0.4 }
      );
      sound.setOnPlaybackStatusUpdate(status => {
        if (status.isLoaded && status.didJustFinish) sound.unloadAsync();
      });
    } catch {
      // silencieux si expo-av absent ou fichier manquant
    }
  };

  // ── Éclair au submit ──
  const triggerLightning = () => {
    lightningRef.current?.flash();
    hapticMedium();
  };

  // ── Easter egg PIKACHU ──
  const checkEasterEgg = (text: string) => {
    if (text.toUpperCase() === EASTER_EGG_WORD) {
      setEasterEgg(true);
      setEasterCount(c => c + 1);
      hapticSuccess();
      setTimeout(() => setEasterEgg(false), 3000);
    }
  };

  return {
    shakeAnim,
    lightningRef,
    easterEgg,
    easterCount,
    shakePokeball,
    hapticLight,
    hapticMedium,
    hapticSuccess,
    hapticError,
    playSuccessSound,
    triggerLightning,
    checkEasterEgg,
  };
}