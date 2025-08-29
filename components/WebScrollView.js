import React from 'react';
import { View, ScrollView, Platform } from 'react-native';

const WebScrollView = ({ children, style = {}, contentContainerStyle = {}, showsVerticalScrollIndicator = true, horizontal = false, ...props }) => {
  if (Platform.OS === 'web') {
    // For web, create a container with proper CSS scrolling
    const webStyle = {
      flex: 1,
      overflow: horizontal ? 'auto' : 'auto',
      overflowX: horizontal ? 'auto' : 'hidden',
      overflowY: horizontal ? 'hidden' : 'auto',
      WebkitOverflowScrolling: 'touch', // Smooth scrolling on iOS Safari
      ...style,
    };

    const webContentStyle = {
      ...contentContainerStyle,
      // Ensure content can be scrolled
      minHeight: horizontal ? undefined : '100%',
      minWidth: horizontal ? '100%' : undefined,
    };

    return (
      <div style={webStyle}>
        <div style={webContentStyle}>
          {children}
        </div>
      </div>
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
