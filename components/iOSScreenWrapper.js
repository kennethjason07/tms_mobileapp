import React from 'react';
import { View, Platform, StatusBar, SafeAreaView, KeyboardAvoidingView } from 'react-native';

const IOSScreenWrapper = ({ children, statusBarStyle = 'light-content', backgroundColor = '#2980b9' }) => {
  if (Platform.OS !== 'ios') {
    return <>{children}</>;
  }

  return (
    <View style={{ flex: 1, backgroundColor }}>
      <SafeAreaView style={{ flex: 1, backgroundColor }}>
        <StatusBar 
          barStyle={statusBarStyle} 
          backgroundColor={backgroundColor} 
          translucent={false}
        />
        <KeyboardAvoidingView 
          style={{ flex: 1 }} 
          behavior="padding"
          keyboardVerticalOffset={0}
        >
          {children}
        </KeyboardAvoidingView>
      </SafeAreaView>
    </View>
  );
};

export default IOSScreenWrapper;
