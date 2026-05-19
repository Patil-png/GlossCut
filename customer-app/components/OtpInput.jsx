import React, { useState, useRef } from 'react';
import { View, TextInput, StyleSheet, Dimensions } from 'react-native';
import { useTheme } from '../contexts/ThemeContext.jsx';

const { width } = Dimensions.get('window');
const isTablet = width >= 768;

const OtpInput = ({ length = 6, onComplete }) => {
  const { theme } = useTheme();
  const [otp, setOtp] = useState(Array(length).fill(''));
  const inputs = useRef([]);

  const handleChange = (text, index) => {
    const newOtp = [...otp];
    newOtp[index] = text;
    setOtp(newOtp);

    if (text && index < length - 1) {
      inputs.current[index + 1].focus();
    }

    if (newOtp.every((digit) => digit !== '')) {
      onComplete(newOtp.join(''));
    }
  };

  const handleKeyPress = (e, index) => {
    if (e.nativeEvent.key === 'Backspace' && !otp[index] && index > 0) {
      inputs.current[index - 1].focus();
    }
  };

  return (
    <View style={styles.container}>
      {otp.map((_, index) => (
        <TextInput
          key={index}
          style={[
            styles.input,
            {
              color: theme.colors.text,
              borderColor: theme.colors.border,
              backgroundColor: theme.colors.card},
          ]}
          maxLength={1}
          keyboardType="number-pad"
          onChangeText={(text) => handleChange(text, index)}
          onKeyPress={(e) => handleKeyPress(e, index)}
          value={otp[index]}
          ref={(ref) => (inputs.current[index] = ref)}
        />
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 10
  },
  input: {
    width: isTablet ? 56 : 48,
    height: isTablet ? 56 : 48,
    fontSize: 20,
    textAlign: 'center',
    borderRadius: 12,
    borderWidth: 1}});

export default OtpInput;
