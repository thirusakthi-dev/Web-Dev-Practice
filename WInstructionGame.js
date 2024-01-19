import React, {useEffect, useRef, useState} from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  ImageBackground,
  Dimensions,
  TouchableOpacity,
  ActivityIndicator,
  BackHandler,
  Animated,
} from 'react-native';
import {fetchTodayWordGroup} from '../api/fetchTodayWordGroup';
import {
  clearAsyncData,
  getData,
  storeData,
  user_access_token,
  user_email,
  user_id,
  user_name,
  user_refresh_token,
} from '../utils/storageUtil';
import {
  GoogleSignin,
  statusCodes,
} from '@react-native-google-signin/google-signin';
import fetchToken from '../api/fetchToken';
import {useIsFocused} from '@react-navigation/native';
import Snackbar from 'react-native-snackbar';

import {zappleAuth} from '@invertase/react-native-apple-authentication';

import AsyncStorage from '@react-native-async-storage/async-storage';

const WordGameInstructionPage = ({navigation}) => {
  const isFocused = useIsFocused();
  const screenWidth = Dimensions.get('window').width;
  const logoWidth = screenWidth * 0.3;
  const instructionWidth = screenWidth * 0.65;
  const [images, setImages] = useState([]);
  const [userName, setUserName] = useState('');
  const [isUserLoggedIn, setIsUserLoggedIn] = useState(false);
  const [isGameDataUpdate, setIsGameDataUpdate] = useState(false);
  const [authenticateUser, setAuthenticateUser] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [successfulGames, setSuccessfulGames] = useState([]);
  const [failedGames, setFailedGames] = useState([]);
  const [unPlayedGames, setUnPlayedGames] = useState([]);
  const [playedGames, setPlayedGames] = useState(0);
  const [unPlayedGamesData, setUnPlayedGamesData] = useState([]);
  const [totalGames, setTotalGames] = useState(0);
  const fadeAnim = useRef(new Animated.Value(0)).current; // Initial opacity
  const [gameDate, setGameDate] = useState(null);
  const [refreshLogin, setRefreshLogin] = useState(null);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 1000,
      useNativeDriver: true,
    }).start();
  }, [fadeAnim]);

  useEffect(() => {
    GoogleSignin.configure({
      webClientId:
        '583361389065-s9aiamqp96mtjab3rn2i9l1btdq1bg9d.apps.googleusercontent.com',
    });
  }, []);

  useEffect(() => {
    const backAction = () => {
      if (isFocused) {
        BackHandler.exitApp();
        return true;
      }
      return false;
    };

    const backHandler = BackHandler.addEventListener(
      'hardwareBackPress',
      backAction,
    );

    return () => backHandler.remove();
  }, [isFocused]);

  const getImageForAvailability = availability => {
    return availability
      ? require('../assets/v2/available.png')
      : require('../assets/v2/unavailable.png');
  };
  /**
   * Code to Fetch Game Data
   */
  useEffect(() => {
    async function getWordData() {
      try {
        console.log('getWordData' + 'begin');
        setIsLoading(true);
        const name = await getData(user_name);
        const {gameData, userPlays, currentDate} = await fetchTodayWordGroup();
        const allGames = gameData?.allGames ?? [];
        const userPlaysData = userPlays?.allGamesOfDate || [];
        const successfulGamesSet = new Set();
        const failedGamesSet = new Set();
        const playedGameIds = new Set();
        const unPlayedGamesSet = new Set();
        const gamesToPlay = [];
        console.log('userPlays' + JSON.stringify(userPlays));

        userPlaysData.forEach(userGame => {
          userGame.plays.forEach(play => {
            playedGameIds.add(userGame.gameId);
            if (play.statusId === 'success') {
              successfulGamesSet.add(userGame.gameId);
            } else if (play.statusId === 'failure') {
              failedGamesSet.add(userGame.gameId);
            }
          });
        });

        allGames.forEach(game => {
          if (!playedGameIds.has(game._id)) {
            unPlayedGamesSet.add(game._id);
            gamesToPlay.push(game);
          }
        });
        console.log('allGames Lenght' + allGames.length);
        const playStatus = allGames.map(game => unPlayedGamesSet.has(game._id));
        console.log('Play stutus' + JSON.stringify(playStatus));
        setImages(playStatus.sort((a, b) => b - a));

        setSuccessfulGames(Array.from(successfulGamesSet));
        setFailedGames(Array.from(failedGamesSet));

        console.log('Failed Games: ', JSON.stringify(failedGames));

        setUnPlayedGames(Array.from(unPlayedGamesSet));
        setPlayedGames(
          Array.from(successfulGamesSet).length +
            Array.from(failedGamesSet).length,
        );
        setUnPlayedGamesData(gamesToPlay);
        setTotalGames(allGames.length);
        setUserName(name);
        setIsGameDataUpdate(true);
        setGameDate(currentDate);

        console.log('AllGames', JSON.stringify(allGames));
        console.log('playStatus', JSON.stringify(playStatus));
        console.log(
          'gameData.successfulGames',
          JSON.stringify(successfulGames),
        );
        console.log('gameData.failedGames', JSON.stringify(failedGames));
        console.log('gameData.totalGames', JSON.stringify(allGames.length));
        console.log(
          'gameData.unPlayedGames',
          JSON.stringify(unPlayedGames.length),
        );
        console.log(
          'gameData.unPlayedGames-gamesToPlay',
          JSON.stringify(gamesToPlay),
        );
        //console.log('gameData.gamesToPlay', JSON.stringify(gamesToPlay));
        console.log('gameData.userName', userName);
      } catch (error) {
        navigation.navigate('WordGameResults', {
          statusId: 3,
          status: null,
          gameDate: null,
          duration: null,
          gameId: null,
        });
        console.error(error);
      } finally {
        setIsLoading(false);
        console.log('getWordData' + 'End');
      }
    }

    if (isUserLoggedIn) {
      getWordData().then(result => {});
    }
  }, [isUserLoggedIn]);

  useEffect(() => {
    async function authentication() {
      try {
        console.log('AuthenticateUserUsingGoogld' + 'begin');
        setIsLoading(true);
        await GoogleSignin.hasPlayServices();
        console.log('userinfo -signin clicked before userinfo');
        const userInfo = await GoogleSignin.signIn();
        console.log('userinfo', userInfo);
        const name = userInfo.user.name;
        const email = userInfo.user.email;
        const userId = userInfo.user.id;
        await fetchToken(name, email, userId)
          .then(token => {
            console.log('Token:', token.token);
            storeData(user_access_token, token.token);
            storeData(user_refresh_token, token.refreshToken);
            storeData(user_name, name);
            storeData(user_email, email);
            storeData(user_id, userId);
            setIsUserLoggedIn(true);
          })
          .catch(error => {
            console.log(error);
          });
      } catch (error) {
        if (error.code === statusCodes.SIGN_IN_CANCELLED) {
          console.log(error);
        } else if (error.code === statusCodes.IN_PROGRESS) {
          console.log(error);
        } else if (error.code === statusCodes.PLAY_SERVICES_NOT_AVAILABLE) {
          console.log(error);
        } else {
          Snackbar.show({
            text: error.toString(),
            duration: Snackbar.LENGTH_SHORT,
          });
          console.log(JSON.stringify(error));
        }
      } finally {
        setIsLoading(false);
        console.log('AuthenticateUserUsingGoogld' + 'End');
      }
    }

    if (authenticateUser) {
      authentication().then(result => {});
      setAuthenticateUser(false);
    }
  }, [authenticateUser]);

  /**
   * Code to Sign User In
   */

  const handleLogin = async () => {
    if (Platform.OS === 'ios') {
      handleAppleLogin();
    } else {
      setAuthenticateUser(true);
    }
  };

  const handleAppleLogin = async () => {
    try {
      const appleAuthRequestResponse = await appleAuth.performRequest({
        requestedOperation: appleAuth.Operation.LOGIN,
        requestedScopes: [appleAuth.Scope.FULL_NAME, appleAuth.Scope.EMAIL],
      });

      const {email, fullName} = appleAuthRequestResponse;

      const userId = email;

      await fetchToken(fullName, email, userId).then(token => {
        console.log('Token:', token.token);
        storeData(user_access_token, token.token);
        storeData(user_refresh_token, token.refreshToken);
        storeData(user_name, fullName);
        storeData(user_email, email);
        storeData(user_id, userId);
        setIsUserLoggedIn(true);
      });
    } catch (error) {
      console.error('Apple Login Error:', error);
    }
  };

  const generateRandomEmail = () => {
    const uniqueString = Math.random().toString(36).substring(2, 8);
    return `guest_${uniqueString}@guest.com`;
  };

  const GuestUserLogin = async () => {
    const name = 'Guest User';
    const email = generateRandomEmail();
    const userId = email;
    await fetchToken(name, email, userId).then(token => {
      console.log('Token:', token.token);
      storeData(user_access_token, token.token);
      storeData(user_refresh_token, token.refreshToken);
      storeData(user_name, name);
      storeData(user_email, email);
      storeData(user_id, userId);
      setIsUserLoggedIn(true);
    });
  };

  const HandleGoogleLogin = async () => {
    setAuthenticateUser(true);
  };

  useEffect(() => {
    async function checkUserLogin() {
      const userEmail = await getData(user_id);
      const accessToken = await getData(user_access_token);
      if (
        userEmail !== null &&
        userEmail !== undefined &&
        accessToken !== null &&
        accessToken !== undefined
      ) {
        console.log('checkUserLogin=>' + 'userLoggedIn');
        setIsUserLoggedIn(true);
      } else {
        console.log('checkUserLogin=>' + 'userNotLoggedIn');
        //setAuthenticateUser(true);
      }
    }

    checkUserLogin().then(r => {});
  }, [refreshLogin]);

  return (
    <Animated.View
      style={{
        flex: 1,
        width: '100%',
        height: '100%',
        opacity: fadeAnim,
      }}>
      <View style={styles.container}>
        <Image
          source={require('./../assets/v2/bg_plain.png')}
          style={styles.backgroundVideo}
        />
        <View style={styles.center_container}>
          <ImageBackground
            source={require('../assets/v2/center_container1.png')}
            style={styles.container}>
            <View style={styles.bodyContainer}>
              <View style={styles.titleContainer}>
                <Image
                  source={require('../assets/v2/app_icon_2.png')}
                  style={{
                    width: logoWidth,
                    height: undefined,
                    marginTop: 20,
                    aspectRatio: 1,
                    resizeMode: 'contain',
                    justifyContent: 'center',
                    alignItems: 'center',
                  }}></Image>
                {isUserLoggedIn && (
                  <TouchableOpacity
                    onPress={async () => {
                      await clearAsyncData();
                      await GoogleSignin.signOut();
                      setRefreshLogin(true);
                      navigation.reset({
                        index: 0,
                        routes: [{name: 'SplashScreen'}],
                      });
                    }}
                    style={styles.rightAlignedImage}>
                    <View style={styles.backButton}>
                      <Image
                        source={require('./../assets/logout.png')}
                        style={styles.iconImage}
                      />
                    </View>
                  </TouchableOpacity>
                )}
              </View>
              <View>
                <Text style={styles.userName}>{userName}</Text>
              </View>
              <View>
                <Image
                  source={require('../assets/v2/game_intro.png')}
                  style={{
                    width: instructionWidth,
                    height: undefined,
                    aspectRatio: 1,
                    marginTop: 10,
                    resizeMode: 'contain',
                  }}></Image>
              </View>
              <View>
                {!isUserLoggedIn && (
                  <View style={styles.buttonContainer}>
                    <TouchableOpacity
                      style={styles.buttonLog}
                      onPress={handleLogin}>
                      <Text style={styles.buttonText}>LOGIN</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={styles.buttonLog}
                      onPress={GuestUserLogin}>
                      <Text style={styles.buttonText}>GUEST</Text>
                    </TouchableOpacity>
                  </View>
                )}
              </View>

              <View
                style={
                  totalGames > 1 ? {flexDirection: 'row'} : styles.invisible
                }>
                {images.map((value, index) => (
                  <View key={index} style={{paddingRight: 10}}>
                    <Image
                      key={index}
                      source={getImageForAvailability(value)}
                      style={{
                        width: 80,
                        height: undefined,
                        marginTop: 5,
                        aspectRatio: 1,
                        resizeMode: 'contain',
                      }}
                    />
                  </View>
                ))}
              </View>
              <View>
                <Text
                  style={totalGames > 1 ? styles.userName : styles.invisible}>
                  {totalGames - playedGames} / {totalGames}
                </Text>
              </View>
              <View>
                <Image
                  source={require('../assets/v2/remaining.png')}
                  style={
                    totalGames > 1
                      ? {
                          marginTop: 8,
                          marginHorizontal: 20,
                        }
                      : styles.invisible
                  }></Image>
              </View>

              <View>
                {isGameDataUpdate && !isLoading && (
                  <TouchableOpacity
                    style={styles.button}
                    onPress={() => {
                      if (unPlayedGames.length > 0) {
                        navigation.navigate('WordGame', {
                          unPlayedGame: unPlayedGamesData[0],
                          currentDate: gameDate,
                        });
                      } else {
                        navigation.navigate('WordGameResults', {
                          statusId: 3,
                          status: null,
                          gameDate: null,
                          duration: null,
                          gameId: null,
                        });
                      }
                    }}>
                    <Image
                      source={require('../assets/v2/thodara.png')}
                      style={{
                        width: 200,
                        height: 100,
                        marginTop: 10,
                        resizeMode: 'stretch',
                      }}></Image>
                  </TouchableOpacity>
                )}
              </View>
            </View>
          </ImageBackground>
        </View>
        {isLoading && (
          <View
            style={{
              flex: 1,
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

const styles = StyleSheet.create({
  background: {
    flex: 1,
    width: '100%', // Ensure full width
    height: '100%', // Ensure full height
    alignItems: 'center',
    justifyContent: 'center',
  },
  blurView: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.65)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  center_container: {
    margin: 10,
    width: '90%',
    alignContent: 'flex-start',
    alignItems: 'center',
    height: '85%',
  },
  titleContainer: {
    width: '100%', // Ensure it stretches across the full width
    flexDirection: 'row', // Align children in a row
    justifyContent: 'center', // Center the children
    position: 'relative', // Needed for absolute positioning of children
  },
  rightAlignedImage: {
    position: 'absolute', // Position absolutely within the container
    top: 20, // Align to the top
    right: 20, // Align to the right
    width: 50, // Set your desired width
    height: 50, // Set your desired height
  },
  container: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    resizeMode: 'center',
    alignItems: 'center',
  },

  bodyContainer: {
    width: '100%',
    height: '100%',
    justifyContent: 'flex-start',
    alignItems: 'center',
  },
  backgroundVideo: {
    position: 'absolute',
    top: 0,
    left: 0,
    bottom: 0,
    right: 0,
  },
  logo: {
    margin: 8,
    marginTop: 30,
    width: 104,
    height: 114,
  },
  userName: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginTop: 10,
    textShadowColor: 'blue',
    textShadowRadius: 10,
  },
  backButton: {
    backgroundColor: '#FFFFFF', // Button background color
    borderWidth: 1,
    width: 40,
    height: 40,
    margin: 10,
    alignItems: 'center',
    justifyContent: 'center',
    borderColor: '#0f2042',
    borderRadius: 45, // Adjust as needed for roundness
    // Remove alignSelf if not needed
  },
  invisible: {
    opacity: 0,
  },
  iconImage: {
    width: 30, // Set the width and height of your image
    height: 30,
    alignSelf: 'center',
  },
  buttonContainer: {
    flexDirection: 'column', // Change direction to column
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 20,
  },
  buttonLog: {
    backgroundColor: '#00bbf9',
    paddingVertical: 10,
    paddingHorizontal: 45,
    marginVertical: 5, // Add vertical margin between buttons
    borderRadius: 5,
  },
  buttonText: {
    color: '#e0fbfc',
    fontWeight: 'bold',
  },
});
export default WordGameInstructionPage;
