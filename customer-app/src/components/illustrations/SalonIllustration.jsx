import React from 'react';
import { View } from 'react-native';
import Svg, { Path, Circle, Rect } from 'react-native-svg';
import { Colors } from '../../theme/colors';

const SalonIllustration = ({ size = 160 }) => {
  return (
    <View style={{ width: size, height: size, justifyContent: 'center', alignItems: 'center' }}>
      {/* Background soft circle */}
      <View style={{ 
        position: 'absolute', 
        width: size, 
        height: size, 
        borderRadius: size / 2, 
        backgroundColor: 'rgba(0,0,0,0.08)' 
      }} />
      
      <Svg width={size * 0.7} height={size * 0.7} viewBox="0 0 100 100">
        {/* Person (Client) */}
        <Path
          d="M30 85 C30 70, 70 70, 70 85"
          stroke={Colors.CHARCOAL}
          strokeWidth="2.5"
          strokeLinecap="round"
          fill="none"
        />
        <Circle
          cx="50"
          cy="45"
          r="15"
          stroke={Colors.CHARCOAL}
          strokeWidth="2.5"
          fill="none"
        />
        
        {/* Barber's Hands/Scissors Style */}
        <Path
          d="M20 30 L35 45 M20 45 L35 30"
          stroke={Colors.CHARCOAL}
          strokeWidth="2.5"
          strokeLinecap="round"
        />
        <Path
          d="M65 30 L80 45 M65 45 L80 30"
          stroke={Colors.CHARCOAL}
          strokeWidth="2.5"
          strokeLinecap="round"
        />
        
        {/* Decorative elements */}
        <Circle cx="85" cy="15" r="3" fill={Colors.LIME_PRIMARY} />
        <Rect x="10" y="10" width="6" height="6" rx="1" fill={Colors.LIME_PRIMARY} opacity="0.5" />
      </Svg>
    </View>
  );
};

export default SalonIllustration;
