import {
  Dimensions,
  Image,
  ImageBackground,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import Video from 'react-native-video';
import React, {useEffect, useState} from 'react';
import Snackbar from 'react-native-snackbar';

import ToastSolution from './ToastMessage';

const MAX_LIVES = 5;
const groupColors = ['#D1F38D', '#FFFF87', '#CEF0FF', '#F8D5FF'];
const borderColors = ['#A8D847', '#FCE342', '#9ED5EE', '#E3AEEE'];

const WordGame = ({navigation, route}) => {
  const [lives, setLives] = useState(3);
  const [groupedWords, setGroupedWords] = useState([]);
  const [gridColumns, setGridColumns] = useState(4);
  const [data, setData] = useState([]);
  const [selectedWords, setSelectedWords] = useState([]);
  const [totalwordGroups, setTotalwordGroups] = useState([]);
  const [seconds, setSeconds] = useState(0);
  const [isEnabled, setIsEnabled] = useState(true);
  const [currentDate, setCurrentDate] = useState(null);
  const [currentWordGroupId, setCurrentWordGroupId] = useState(null);

  useEffect(() => {
    console.log('unPlayedGamew3233', JSON.stringify(route.params.unPlayedGame));
    console.log('Lives', JSON.stringify(route.params.lives));

    setCurrentDate(route.params.currentDate);
    setCurrentWordGroupId(route.params.unPlayedGame._id);
    setTotalwordGroups(route.params.unPlayedGame.wordGroups);
    setLives(route.params.lives ?? MAX_LIVES);
    
  }, []);

  useEffect(() => {
    if (lives === 0) {
      navigation.navigate('WordGameResults', {
        statusId: 2,
        status: 'failure',
        gameDate: currentDate,
        duration: seconds.toString(10),
        gameId: currentWordGroupId,
      });
    }
  }, [lives]);

  useEffect(() => {
    if (groupedWords.length === 4) {
      navigation.navigate('WordGameResults', {
        statusId: 1,
        status: 'success',
        gameDate: currentDate,
        duration: seconds.toString(10),
        gameId: currentWordGroupId,
      });
    }
  }, [groupedWords]);

  useEffect(() => {
    let interval = setInterval(() => {
      setSeconds(seconds => seconds + 1);
    }, 1000);

    return () => clearInterval(interval);
  }, [seconds]);

  useEffect(() => {
    setIsEnabled(selectedWords.length === 4 && lives > 0);
  }, [selectedWords]);

  const renderHearts = () => {
    let hearts = [];
    for (let i = 0; i < MAX_LIVES; i++) {
      hearts.push(
        i < lives ? (
          <Image
            key={i}
            style={{width: 30, height: 30, padding: 5, marginHorizontal: 2}}
            source={require('./../assets/v2/filled.png')}
          />
        ) : (
          <Image
            key={i}
            style={{width: 30, height: 30, padding: 5, marginHorizontal: 2}}
            source={require('./../assets/v2/empty.png')}
          />
        ),
      );
    }
    return hearts;
  };
  const showSnackbar = message => {
    Snackbar.show({
      text: message,
      duration: Snackbar.LENGTH_SHORT,
    });
  };

  const selectWord = word => {
    if (selectedWords.includes(word)) {
      setSelectedWords(selectedWords.filter(w => w !== word));
    } else if (selectedWords.length < 4) {
      setSelectedWords([...selectedWords, word]);
    }
  };

  useEffect(() => {
    console.log('TOTal words' + JSON.stringify(totalwordGroups));
    let words = totalwordGroups
      .filter(
        group =>
          !groupedWords.some(obj2 => obj2.objectName === group.wordGroupTitle),
      )
      .flatMap(group => {
        console.log('roup-flatmap' + JSON.stringify(group));
        return group.wordGroupContent.map(word => ({
          word,
          groupId: group._id,
        }));
      });

    words = shuffleArray(words);
    setData(words);
  }, [totalwordGroups]);

  const shuffleWords = () => {
    let words = totalwordGroups
      .filter(
        group =>
          !groupedWords.some(obj2 => obj2.objectName === group.wordGroupTitle),
      )
      .flatMap(group => {
        console.log('roup' + JSON.stringify(group));
        return group.wordGroupContent.map(word => ({word, groupId: group._id}));
      });

    words = shuffleArray(words);
    setData(words);
    setGridColumns(4); // Set columns based on number of words
  };

  const shuffleArray = array => {
    for (let i = array.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
  };

  const formatTimeForTimer = totalSeconds => {
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${minutes.toString().padStart(2, '0')}:${seconds
      .toString()
      .padStart(2, '0')}`;
  };

  const submitSelection = () => {
    if (selectedWords.length === 0) {
      showSnackbar('தயவுசெய்து முதலில் 4 வார்த்தைகளை தேர்ந்தெடுக்கவும்.');
      return;
    }

    const groupIds = selectedWords.map(
      word => data.find(w => w.word === word).groupId,
    );
    if (new Set(groupIds).size === 1) {
      console.log('Finding word' + JSON.stringify(totalwordGroups));
      const groupName = totalwordGroups.find(
        group => group._id === groupIds[0],
      ).wordGroupTitle;
      setGroupedWords([
        ...groupedWords,
        {objectName: groupName, elements: selectedWords},
      ]);
      setData(data.filter(word => !selectedWords.includes(word.word)));
      setSelectedWords([]);
    } else {
      console.log('lives' + lives);
      showSnackbar(
        'தேர்வு செய்த வார்த்தைகள் ஒரே குழுவில் இல்லை.',
        Snackbar.LENGTH_SHORT,
      );
      setSelectedWords([]);
      if (lives > 0) {
        setLives(lives - 1);
      }
    }
  };

  return (
    <ImageBackground
      source={require('./../assets/v2/bg_plain.png')}
      style={styles.background}>
      <View style={styles.container}>
        <Video
          source={require('./../assets/v2/bg_with_tick.mp4')} // Can be a URL or a local file.
          style={styles.backgroundVideo}
          muted={false}
          volume={0.4}
          repeat={true}
          resizeMode={'cover'} // Cover the whole screen at aspect ratio.
          rate={1.0}
          ignoreSilentSwitch={'obey'}
        />
        <View style={styles.toolbar}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Image
              source={require('./../assets/v2/back.png')}
              style={styles.iconImage}
            />
          </TouchableOpacity>
          <Image
            source={require('./../assets/v2/game_title.png')}
            style={styles.title}
          />
          <View style={styles.iconImage} />
        </View>
        <View style={styles.center_container}>
          <View style={styles.topSection}>
            <Text style={styles.header}>நான்கு குழுக்களாக பொருத்துக</Text>
            <View style={styles.livesContainer}>
              <Text style={styles.labelStyle}>மீதமுள்ள வாய்ப்புகள் </Text>
              <View style={styles.imagesContainer}>{renderHearts()}</View>
            </View>
          </View>
          <View style={styles.middleSection}>
            <View style={styles.gridContainer}>
              <View style={styles.grid}>
                {/* Display all grouped words */}
                {groupedWords.map((group, index) => (
                  <View key={index} style={styles.groupRow(gridColumns, index)}>
                    {/* Left Side: Text Content */}
                    <View style={styles.groupContent}>
                      <Text style={styles.groupTitle}>{group.objectName}</Text>
                      <Text style={styles.groupWords}>
                        {group.elements.join(', ')}
                      </Text>
                    </View>

                    {/* Right Side: Image */}
                    <Image
                      source={require('./../assets/success.png')}
                      style={styles.groupImage}
                    />
                  </View>
                ))}

                {/* Display remaining words */}
                {data.map((item, index) => (
                  <TouchableOpacity
                    key={index}
                    style={[
                      styles.cell(gridColumns),
                      selectedWords.includes(item.word)
                        ? styles.selectedCell
                        : null,
                    ]}
                    onPress={() => selectWord(item.word)}>
                    <Text
                      style={[
                        styles.cellText,
                        selectedWords.includes(item.word)
                          ? styles.selectedCellText
                          : null,
                      ]}>
                      {item.word}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          </View>
          <View style={styles.bottomSection}>
            <Text style={styles.timerText}>{formatTimeForTimer(seconds)}</Text>

            <View style={styles.button_container}>
              <TouchableOpacity onPress={() => shuffleWords()}>
                <Image
                  source={require('./../assets/v2/suffle.png')} // Replace with your image path
                  style={styles.buttonImage}
                />
              </TouchableOpacity>
              <TouchableOpacity
                disabled={!isEnabled}
                onPress={() => submitSelection()}>
                <Image
                  source={require('./../assets/v2/submit.png')} // Replace with your image path
                  style={styles.buttonImage}
                />
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </View>
    </ImageBackground>
  );
};

const styles = StyleSheet.create({
  background: {
    flex: 1, // Fill the entire screen
    width: '100%', // Ensure full width
    height: '100%', // Ensure full height
    color: '#2b9acb',
  },
  center_container: {
    margin: 10,
    width: '90%',
    alignContent: 'flex-start',
    flexDirection: 'column',
    flex: 1,
    alignItems: 'center',
    height: '90%',
  },
  topSection: {
    flex: 1.5, // 20% of the space
    justifyContent: 'center',
    alignItems: 'center',
    // Add additional styling as needed
  },
  middleSection: {
    flex: 6.5, // 60% of the space
    justifyContent: 'center',
    alignItems: 'center',
    // Add additional styling as needed
  },
  bottomSection: {
    flex: 2, // 20% of the space
    justifyContent: 'center',
    alignItems: 'center',
    // Add additional styling as needed
  },
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  backgroundVideo: {
    position: 'absolute',
    top: 0,
    left: 0,
    bottom: 0,
    right: 0,
  },
  toolbar: {
    flexDirection: 'row',
    width: '100%',
    marginTop: 36,
    height: 72, // Adjust as needed
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  iconImage: {
    width: 40, // Set the width and height of your image
    height: 40,
    padding: 10,
    margin: 10,
    alignSelf: 'center',
  },
  title: {
    width: 180, // Set the width and height of your image
    height: undefined,
    justifyContent: 'center',
    resizeMode: 'contain',
    aspectRatio: 1,
    alignSelf: 'center',
  },
  header: {
    color: '#FFFFFF',
    fontFamily: 'st_170.ttf',
  },
  livesContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 10,
    // Add additional styling as needed
  },
  labelStyle: {
    color: '#FFFFFF',
    fontFamily: 'st_170.ttf',
  },
  imagesContainer: {
    flexDirection: 'row',
    marginTop: 10,
    // Add additional styling as needed
  },
  imageStyle: {
    width: 20, // Adjust based on your requirement
    height: 20, // Adjust based on your requirement
    marginLeft: 2, // Adjust spacing between images
  },
  button_container: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    // Add additional styling as needed
  },
  buttonImage: {
    width: 80, // Adjust based on your requirement
    height: 80, // Adjust based on your requirement
    padding: 10, // Adjust spacing between buttons
    margin: 20,
    // Add additional styling as needed
  },

  gridContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    // Match grid width with container's padding
    width: Dimensions.get('window').width - 30,
  },
  groupRow: (columns, index) => ({
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    width: '100%', // Full width of the grid
    height: Dimensions.get('window').width / columns - 12,
    borderWidth: 1,
    paddingLeft: 10,
    paddingRight: 10,
    borderRadius: 4,
    borderColor: borderColors[index],
    backgroundColor: groupColors[index],
    marginBottom: 2, // Align margin with grid cell margin
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.1,
    shadowRadius: 3,

    // Elevation for Android
    elevation: 3,
  }),
  groupContent: {
    flex: 1,
  },
  groupTitle: {
    fontWeight: 'bold',
    color: '#000000',
    fontSize: 14,
  },
  groupWords: {
    color: '#000000',
    fontSize: 12,
  },
  cell: columns => ({
    width: Dimensions.get('window').width / columns - 12,
    height: Dimensions.get('window').width / columns - 12,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#00D4FF',
    backgroundColor: '#FFFFFF',
    margin: 2,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.1,
    shadowRadius: 3,
    borderRadius: 4,

    // Elevation for Android
    elevation: 3,
  }),
  cellText: {
    color: '#000000',
    fontSize: 12,
  },
  selectedCellText: {
    color: '#FFFFFF',
  },
  selectedCell: {
    backgroundColor: '#48AEF2',
    borderColor: '#00D4FF',
    borderWidth: 2,
    shadowColor: '#000',
    borderRadius: 4,
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.1,
    shadowRadius: 3,

    // Elevation for Android
    elevation: 3,
  },
  timerText: {
    color: '#FFFFFF',
    padding: 4,
    fontSize: 20,
    fontWeight: 'bold',
    textShadowColor: '#93de00',
    textShadowOffset: {width: 2, height: 2},
    textShadowRadius: 10,
  },
});

export default WordGame;
