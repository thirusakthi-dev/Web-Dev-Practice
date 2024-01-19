import React, {useEffect, useRef, useState} from 'react';
import {
  ActivityIndicator,
  Animated,
  Dimensions,
  Image,
  ImageBackground,
  StyleSheet,
  TouchableOpacity,
  View,
} from 'react-native';
import {saveSubmission} from '../api/fetchTodayWordGroup';

import TS from './ToastMessage';

const WordGameResults = ({navigation, route}) => {
  const {statusId, status, duration, gameDate, gameId} = route.params ?? {};

  const screenWidth = Dimensions.get('window').width;
  const imageWidth = screenWidth * 0.8;
  const fadeAnim = useRef(new Animated.Value(0)).current; // Initial opacity
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 1000,
      useNativeDriver: true,
    }).start();
  }, [fadeAnim]);

  const getImageSource = () => {
    console.log(statusId);
    switch (statusId) {
      case 1:
        return require('./../assets/v2/w.png');
      case 2:
        return require('./../assets/v2/failure.png');
      // Add more cases as needed
      default:
        return require('./../assets/v2/skip.png');
    }
  };

  useEffect(() => {
    async function submission() {
      setIsLoading(true);
      try {
        const gameDataResponse = await saveSubmission(
          status,
          duration,
          gameDate,
          gameId,
        );
      } catch (error) {
        console.error(error);
      } finally {
        setIsLoading(false);
      }
    }

    if (statusId === 1 || statusId === 2) {
      submission()
        .then(r => {})
        .catch(error => {});
    }
  }, []);

  return (
    <Animated.View
      style={{
        flex: 1,
        width: '100%',
        height: '100%',
        opacity: fadeAnim,
      }}>
      <View style={styles.container}>
      <TS/>
        <Image
          source={require('./../assets/v2/bg_plain.png')}
          style={styles.backgroundVideo}
        />
        {/<BlurView style={styles.blurView} blurType="light" blurAmount={10} />/}

        <ImageBackground
          source={getImageSource()} // Replace with your image path
          style={{
            width: imageWidth,
            height: undefined,
            aspectRatio: 1,
            justifyContent: 'flex-end', // Aligns child view to the bottom
          }}
          resizeMode="cover" // or "contain" based on your requirement
        >
          {!isLoading && (
            <View style={styles.bottomImageView}>
              <TouchableOpacity
                onPress={() => {
                  navigation.reset({
                    index: 0,
                    routes: [{name: 'WordGameInstructionPage'}],
                  });
                  // navigation.navigate('WordGameInstructionPage');
                }}>
                <Image
                  source={require('./../assets/v2/c.png')} // Replace with your image path
                  style={styles.bottomImage}
                />
              </TouchableOpacity>
            </View>
          )}
        </ImageBackground>
        {isLoading && (
          <View
            style={{
              justifyContent: 'center',
              alignItems: 'center',
              position: 'absolute',
            }}>
              
            <ActivityIndicator size="large" color={'#FFFFFF'} />
          </View>
        )}
      </View>
    </Animated.View>
  );
};


 
export default WordGameResults;
