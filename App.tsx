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
  const [initialAppColor, setInitialAppColor] = useState<string | null>(null); 
  const [isLoadingStorage, setIsLoadingStorage] = useState(true); 

  useEffect(() => {
    const loadLastColor = async () => {
      try {
        const storedColor = await AsyncStorage.getItem(LAST_SELECTED_COLOR_KEY);
        if (storedColor) {
          setInitialAppColor(storedColor);
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



  if (isLoadingStorage) {
    
    
    return (
      <View style={styles.introContainer}>
        <StatusBar barStyle="light-content" backgroundColor="black" />
      </View>
    );
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
    borderColor: '#FFF', // mudei de ideia no meio do caminho, agora é branco para todos. e vai ficar assim mesmo. preguiça de mudar o código de novo :D
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
  },
});
