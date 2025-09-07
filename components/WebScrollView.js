import React, { useEffect, useState } from 'react';
import { View, ScrollView, Platform, Dimensions } from 'react-native';

// Add CSS styles for webkit scrollbar
const injectScrollbarStyles = () => {
  if (Platform.OS === 'web' && typeof document !== 'undefined') {
    const styleId = 'webkit-scrollbar-styles';
    if (!document.getElementById(styleId)) {
      const style = document.createElement('style');
      style.id = styleId;
      style.textContent = `
        .custom-scrollview::-webkit-scrollbar {
          width: 8px;
        }
        .custom-scrollview::-webkit-scrollbar-track {
          background: #f1f1f1;
          border-radius: 4px;
        }
        .custom-scrollview::-webkit-scrollbar-thumb {
          background: #c1c1c1;
          border-radius: 4px;
        }
        .custom-scrollview::-webkit-scrollbar-thumb:hover {
          background: #a1a1a1;
        }
      `;
      document.head.appendChild(style);
    }
  }
};

const WebScrollView = ({ children, style = {}, contentContainerStyle = {}, showsVerticalScrollIndicator = true, horizontal = false, ...props }) => {
  const [screenData, setScreenData] = useState(Dimensions.get('window'));

  useEffect(() => {
    const onChange = (result) => {
      setScreenData(result.window);
    };

    const subscription = Dimensions.addEventListener('change', onChange);
    
    // Inject scrollbar styles on component mount
    injectScrollbarStyles();
    
    return () => subscription?.remove();
  }, []);

  if (Platform.OS === 'web') {
    // Responsive calculations
    const isSmallScreen = screenData.width < 768;
    const isMediumScreen = screenData.width >= 768 && screenData.width < 1024;
    const isLargeScreen = screenData.width >= 1024;
    
    // Dynamic height calculation based on screen size
    const getResponsiveHeight = () => {
      if (isSmallScreen) return screenData.height - 60;
      if (isMediumScreen) return screenData.height - 80;
      return screenData.height - 100;
    };

    // For web, create a container with responsive CSS scrolling
    const webStyle = {
      ...style,
      flex: 1,
      height: getResponsiveHeight(),
      maxHeight: screenData.height,
      overflow: 'auto',
      position: 'relative',
    };

    // Responsive content styling
    const webContentStyle = {
      ...contentContainerStyle,
      minHeight: 'max-content',
      paddingBottom: isSmallScreen ? '40px' : isMediumScreen ? '60px' : '80px',
    };

    return (
      <View style={webStyle}>
        <View style={webContentStyle}>
          {children}
        </View>
      </View>
    );
  }

  // For mobile, use native ScrollView
  return (
    <ScrollView
      style={style}
      contentContainerStyle={contentContainerStyle}
      showsVerticalScrollIndicator={showsVerticalScrollIndicator}
      horizontal={horizontal}
      {...props}
    >
      {children}
    </ScrollView>
  );
};

export default WebScrollView;
