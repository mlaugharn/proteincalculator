import React from 'react';
import { Alert, Image, StyleSheet, Text, View } from 'react-native';
import { Constants, BarCodeScanner, Permissions } from 'expo';
import { createBottomTabNavigator, createAppContainer } from 'react-navigation';
import NumericInput from 'react-native-numeric-input';
import axios from 'axios';

const zero_if_undefined = (grams) => grams === undefined ? 0 : grams;
const zero_if_NaN = (score) => isNaN(score) ? 0 : Math.max(0, score);
const unknown_if_undefined = (name) => name === undefined ? 'Unknown food' : name;

const score_to_color = (score) => 
    score < 1 ?
      [styles.score, styles.low_score] : 
      score < 2 ?
        [styles.score, styles.medium_score] : 
        [styles.score, styles.high_score]

class HomeScreen extends React.Component {
  static navigationOptions = {
    title: 'Scan barcode'
  }
  

  constructor(props) {
    super(props);
    this.state = {
      hasCameraPermission: null,
      barcode: null,
      
      food: null,

      product_name: 'Looking for UPC barcode...',
      serving_size: null,
      proteins_100g: null,
      fat_100g: null,
      carbohydrates_100g: null,
      fiber_100g: null,
      nutrition_data_per: null,
      score: null,
    };
  }

  componentDidMount() {
    this._requestCameraPermission();
  }

  _requestCameraPermission = async () => {
    const { status } = await Permissions.askAsync(Permissions.CAMERA);
    this.setState({
      hasCameraPermission: status === 'granted',
    });
  };

  _handleBarCodeRead = barcode => {
    const API_URL_prefix = 'https://world.openfoodfacts.org/api/v0/product/'
    // if (barcode.type === 'org.gs1.EAN-13') {
      if (this.state.barcode === null || barcode.data != this.state.barcode.data) {
        var barcode_number = barcode.data
        this.setState((state, props) => {
          return {product_name: "Barcode detected... loading food data"}
        })
        axios.get(API_URL_prefix + barcode_number + '.json')
          .then(res => {
            const food = res.data;
            this.setState((state, props) => {
              return {food: res.data,
              barcode: barcode}
            });
            
            if (food != null) {
              this.setState((state, props) => {
                return {product_name: unknown_if_undefined(food.product.product_name), 
                  serving_size: food.product.serving_size,
                  proteins_100g: zero_if_undefined(food.product.nutriments.proteins_100g), 
                  fat_100g: zero_if_undefined(food.product.nutriments.fat_100g), 
                  carbohydrates_100g: zero_if_undefined(food.product.nutriments.carbohydrates_100g), 
                  fiber_100g: zero_if_undefined(food.product.nutriments.fiber_100g), 
                  score: zero_if_NaN(zero_if_undefined(food.product.nutriments.proteins_100g) / (zero_if_undefined(food.product.nutriments.fat_100g) + zero_if_undefined(food.product.nutriments.carbohydrates_100g) - zero_if_undefined(food.product.nutriments.fiber_100g))).toFixed(1),
                  nutrition_data_per: '/ ' + food.product.nutrition_data_per
                }
              });
            } 
          });
        console.log(this.state);
    // } else {
    //   alert("Wrong type of barcode. Please scan a UPC code")
    // }
      }
  };

  render() {
    return (
      <View style={styles.container}>
        {this.state.hasCameraPermission === null ? 
          <Text>Requesting for camera permission</Text> :
          this.state.hasCameraPermission === false ? 
            <Text>Camera permission is not granted</Text> :
            <View>
              <BarCodeScanner
                onBarCodeScanned={this._handleBarCodeRead}
                style={{ height: 256, width: 256 }}
              />
              <View>
                <Text adjustsFontSizeToFit numberOfLines={1} ellipsizeMode={'tail'} style={styles.product_name}>{this.state.product_name}</Text>
                <Text style={score_to_color(this.state.score)}>{this.state.score}</Text>
                <Text style={styles.label}><Text style={styles.number}>{this.state.proteins_100g}</Text> g protein</Text>
                <Text style={styles.label}><Text style={styles.number}>{this.state.fat_100g}</Text> g fat</Text>
                <Text style={styles.label}><Text style={styles.number}>{this.state.carbohydrates_100g}</Text> g carbohydrates</Text>
                <Text style={styles.label}><Text style={styles.number}>{this.state.fiber_100g}</Text> g fiber</Text>
                <Text style={styles.serving_size}>{this.state.nutrition_data_per}</Text>
              </View>
            </View>
        }
      </View>
    );
  }
}


class ManualScreen extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      score: 0,
      protein: 0,
      fat: 0,
      carbohydrates: 0,
      fiber: 0
    }
  }
  render() {
    return (
      <View style={styles.container}>
        <Text style={score_to_color(zero_if_NaN(this.state.protein / (this.state.fat + this.state.carbohydrates - this.state.fiber)))}>{zero_if_NaN(this.state.protein / (this.state.fat + this.state.carbohydrates - this.state.fiber)).toFixed(1)}</Text>
        <Text style={styles.label}>Protein (g)</Text><NumericInput minValue={0} initValue={this.state.protein} value={this.state.protein} onChange={(protein) => this.setState({protein})}/>
        <Text style={styles.label}>Fat (g)</Text><NumericInput minValue={0} initValue={this.state.fat} value={this.state.fat} onChange={(fat) => this.setState({fat})}/>
        <Text style={styles.label}>Carbohydrates (g)</Text><NumericInput minValue={0} initValue={this.state.carbohydrates} value={this.state.carbohydrates} onChange={(carbohydrates) => this.setState({carbohydrates})}/>
        <Text style={styles.label}>Fiber (g)</Text><NumericInput minValue={0} initValue={this.state.fiber} value={this.state.fiber} onChange={(fiber) => this.setState({fiber})}/>
                {/* <Text style={styles.serving_size}>{this.state.nutrition_data_per}</Text> */}
      </View>
    )
  }
}

class ReferenceScreen extends React.Component {
  render() {
    return (
      <View style={styles.container}>
        <Image source={require('./assets/rail.jpg')} style={{width: 256, height: 256}} />
      </View>
    )
  }
}

const TabNavigator = createBottomTabNavigator({
  Manual: ManualScreen,
  Home: HomeScreen,
  Reference: ReferenceScreen
});

export default createAppContainer(TabNavigator);

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: Constants.statusBarHeight,
    backgroundColor: '#ecf0f1'
  },
  product_name: {
    maxWidth: 256,
    fontWeight: 'bold',
    color: 'rgba(17, 14, 64, .9)',
    textAlign: 'center'
  },
  score: {
    fontSize: 60,
    textAlign: 'center'
  },
  high_score: {
    color: "#2DFF42"
  },
  medium_score: {
    color: "#8780FF"
  },
  low_score: {
    color: "#FD333A"
  },
  number: {
    fontSize: 24
  },
  label: {
    fontSize: 17
  },
  serving_size: {
    textAlign: 'right',
    color: 'rgba(0,0,0,.4)'
  },
});
