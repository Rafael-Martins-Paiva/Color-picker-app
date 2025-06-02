import React, { useState, useEffect, useCallback } from 'react';
import { View, ScrollView, TouchableOpacity, StyleSheet, Text, Dimensions, StatusBar } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withDelay,
  Easing,
  runOnJS,
  interpolateColor,
} from 'react-native-reanimated';
import AsyncStorage from '@react-native-async-storage/async-storage'; 


const introBallInitialColors = ['#FF3B30', '#4CD964', '#0579FF']; 
const appColors = ['#FF3B30', '#FF9500', '#FFCC00', '#4CD964', '#5AC8FA', '#0579FF', '#5856D6', '#FF2D55'];

const APP_BALL_SIZE = 50;
const INTRO_BALL_DIAMETER = 40;
const MERGED_WHITE_BALL_INITIAL_DIAMETER = INTRO_BALL_DIAMETER * 0.8;

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');
const WHITE_REVEAL_MAX_SCALE_FACTOR = Math.sqrt(SCREEN_WIDTH ** 2 + SCREEN_HEIGHT ** 2) / (MERGED_WHITE_BALL_INITIAL_DIAMETER / 2);

const INACTIVE_BALL_COLOR = '#555555';
const LAST_SELECTED_COLOR_KEY = '@MyApp:lastSelectedColor'; 


const IntroAnimation = ({ onAnimationEnd }: { onAnimationEnd: () => void }) => {
  const ball1TranslateX = useSharedValue(-INTRO_BALL_DIAMETER * 1.8);
  const ball2TranslateX = useSharedValue(0);
  const ball3TranslateX = useSharedValue(INTRO_BALL_DIAMETER * 1.8);

  const colorProgress = useSharedValue(0);
  const coloredBallsOpacity = useSharedValue(1);

  const whiteRevealBallScale = useSharedValue(0);
  const whiteRevealBallOpacity = useSharedValue(0);

  const animationDurationMoveAndColor = 800;
  const animationDurationMergeAndReveal = 1000;
  const animationTrigger = useSharedValue(0);

  useEffect(() => {
    'worklet';
    animationTrigger.value = withDelay(200,
      withTiming(1, { duration: 0 }, () => {
        'worklet';
        const moveAndColorParams = { duration: animationDurationMoveAndColor, easing: Easing.inOut(Easing.ease) };
        ball1TranslateX.value = withTiming(0, moveAndColorParams);
        ball3TranslateX.value = withTiming(0, moveAndColorParams);
        ball2TranslateX.value = withTiming(0, moveAndColorParams, (finishedMove) => {
          'worklet';
          if (!finishedMove) return;

          coloredBallsOpacity.value = withTiming(0, { duration: animationDurationMergeAndReveal * 0.3 });

          whiteRevealBallOpacity.value = withDelay(
            animationDurationMergeAndReveal * 0.1,
            withTiming(1, { duration: animationDurationMergeAndReveal * 0.2 })
          );
          whiteRevealBallScale.value = withDelay(
            animationDurationMergeAndReveal * 0.1,
            withTiming(WHITE_REVEAL_MAX_SCALE_FACTOR, {
              duration: animationDurationMergeAndReveal * 0.9,
              easing: Easing.bezier(0.60, 0.00, 0.40, 1.00),
            }, (finishedReveal) => {
              'worklet';
              if (!finishedReveal) return;
              runOnJS(onAnimationEnd)();
            })
          );
        });
        colorProgress.value = withTiming(1, { duration: animationDurationMoveAndColor * 0.8, easing: Easing.linear });
      })
    );
  
  }, [onAnimationEnd]);

  const animatedBallStyle = (
    translateX: Animated.SharedValue<number>,
    targetColor: string
  ) =>
    useAnimatedStyle(() => {
      'worklet';
      const currentBgColor = interpolateColor(
        colorProgress.value,
        [0, 1],
        [INACTIVE_BALL_COLOR, targetColor]
      );
      return {
        transform: [{ translateX: translateX.value }],
        opacity: coloredBallsOpacity.value,
        backgroundColor: currentBgColor,
      };
    });

  const whiteRevealBallAnimatedStyle = useAnimatedStyle(() => {
    'worklet';
    return {
      transform: [{ scale: whiteRevealBallScale.value }],
      opacity: whiteRevealBallOpacity.value,
    };
  });

  return (
    <View style={styles.introContainer}>
      <StatusBar barStyle="light-content" backgroundColor="black" />
      <Animated.View
        style={[
          styles.whiteRevealBall,
          whiteRevealBallAnimatedStyle,
          { zIndex: 2 }
        ]}
      />
      <View style={[styles.movingBallsContainer, { zIndex: 1 }]}>
        <Animated.View
          style={[
            styles.introBall,
            animatedBallStyle(ball1TranslateX, introBallInitialColors[0]),
          ]}
        />
        <Animated.View
          style={[
            styles.introBall,
            animatedBallStyle(ball2TranslateX, introBallInitialColors[1]),
          ]}
        />
        <Animated.View
          style={[
            styles.introBall,
            animatedBallStyle(ball3TranslateX, introBallInitialColors[2]),
          ]}
        />
      </View>
    </View>
  );
};


const ColorPickerApp = ({ initialColor }: { initialColor: string }) => {
  const [selectedColor, setSelectedColor] = useState(initialColor); 
  const isLightColor = selectedColor === '#FFCC00' || selectedColor === '#4CD964' || selectedColor === '#5AC8FA' || selectedColor === '#FFFFFF';

  const handleColorPress = async (color: string) => {
    setSelectedColor(color);
    try {
      await AsyncStorage.setItem(LAST_SELECTED_COLOR_KEY, color);
    } catch (error) {
      console.error("Failed to save color:", error);
    }
  };

  
  useEffect(() => {
    StatusBar.setBackgroundColor(selectedColor, true);
    StatusBar.setBarStyle(isLightColor ? "dark-content" : "light-content", true);
  }, [selectedColor, isLightColor]);


  return (
    <View style={styles.appContainer}>
      {}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.colorSelector}
      >
        {appColors.map((color) => (
          <TouchableOpacity
            key={color}
            style={[
              styles.colorBallApp,
              { backgroundColor: color },
              selectedColor === color && (isLightColor ? styles.selectedBallDark : styles.selectedBallLight),
            ]}
            onPress={() => handleColorPress(color)} 
          />
        ))}
      </ScrollView>
      <View style={[styles.colorPreview, { backgroundColor: selectedColor }]}>
        <Text style={[styles.previewText, { color: isLightColor ? '#000' : '#FFF' }]}>
          Cor selecionada: {selectedColor}
        </Text>
      </View>
    </View>
  );
}

export default function App() {
  const [introFinished, setIntroFinished] = useState(false);
  const [initialAppColor, setInitialAppColor] = useState<string | null>(null); 
  const [isLoadingStorage, setIsLoadingStorage] = useState(true); 

  useEffect(() => {
    const loadLastColor = async () => {
      try {
        const storedColor = await AsyncStorage.getItem(LAST_SELECTED_COLOR_KEY);
        if (storedColor) {
          setInitialAppColor(storedColor);
          setIntroFinished(true); 
        } else {
          setInitialAppColor(appColors[0]); 
          
        }
      } catch (error) {
        console.error("Failed to load color from storage:", error);
        setInitialAppColor(appColors[0]); 
      } finally {
        setIsLoadingStorage(false);
      }
    };

    loadLastColor();
  }, []);

  const handleIntroEnd = useCallback(() => {
    setIntroFinished(true);
    
    
    
    
    
  }, []);

  if (isLoadingStorage) {
    
    
    return (
      <View style={styles.introContainer}>
        <StatusBar barStyle="light-content" backgroundColor="black" />
      </View>
    );
  }

  if (!introFinished) {
    return <IntroAnimation onAnimationEnd={handleIntroEnd} />;
  }

  
  
  if (!initialAppColor) {
     
     
    return (
      <View style={styles.introContainer}>
          <Text style={{color: 'white'}}>Error: Initial color not set.</Text>
          <StatusBar barStyle="light-content" backgroundColor="black" />
      </View>
    );
  }

  return <ColorPickerApp initialColor={initialAppColor} />;
}

const styles = StyleSheet.create({
  introContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'black',
  },
  movingBallsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    position: 'absolute',
  },
  introBall: {
    width: INTRO_BALL_DIAMETER,
    height: INTRO_BALL_DIAMETER,
    borderRadius: INTRO_BALL_DIAMETER / 2,
    marginHorizontal: 5,
  },
  whiteRevealBall: {
    width: MERGED_WHITE_BALL_INITIAL_DIAMETER,
    height: MERGED_WHITE_BALL_INITIAL_DIAMETER,
    borderRadius: MERGED_WHITE_BALL_INITIAL_DIAMETER / 2,
    backgroundColor: 'white',
    position: 'absolute',
  },
  appContainer: {
    flex: 1,
    
  },
  colorSelector: {
    paddingVertical: 20,
    paddingHorizontal: 10,
    alignItems: 'center',
    
    
  },
  colorBallApp: {
    width: APP_BALL_SIZE,
    height: APP_BALL_SIZE,
    borderRadius: APP_BALL_SIZE / 2,
    marginHorizontal: 8,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  selectedBallDark: {
    borderColor: '#000',
  },
  selectedBallLight: {
    borderColor: '#FFF',
  },
  colorPreview: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  previewText: {
    fontSize: 18,
    fontWeight: 'bold',
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },
});
