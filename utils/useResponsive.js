import { useState, useEffect } from 'react';
import { Dimensions } from 'react-native';

export const useResponsive = () => {
  const [screenData, setScreenData] = useState(Dimensions.get('window'));

  useEffect(() => {
    const onChange = (result) => {
      setScreenData(result.window);
    };

    const subscription = Dimensions.addEventListener('change', onChange);
    return () => subscription?.remove();
  }, []);

  const width = screenData.width;
  const height = screenData.height;

  // Breakpoints
  const isExtraSmall = width < 480;  // Mobile portrait
  const isSmall = width >= 480 && width < 768;  // Mobile landscape
  const isMedium = width >= 768 && width < 1024;  // Tablet
  const isLarge = width >= 1024 && width < 1440;  // Desktop
  const isExtraLarge = width >= 1440;  // Large desktop

  // Combined for simplicity
  const isMobile = width < 768;
  const isTablet = width >= 768 && width < 1024;
  const isDesktop = width >= 1024;

  // Responsive values
  const getResponsiveValue = (mobile, tablet, desktop) => {
    if (isMobile) return mobile;
    if (isTablet) return tablet;
    return desktop;
  };

  const getCardWidth = () => {
    if (isExtraSmall) return '100%';  // 1 column on extra small
    if (isSmall) return '47%';  // 2 columns on small
    if (isMedium) return '30%';  // 3 columns on medium
    if (isLarge) return '23%';  // 4 columns on large
    if (isExtraLarge) return '18%';  // 5 columns on extra large
    return '47%';
  };

  const getPadding = () => {
    if (isExtraSmall) return 12;
    if (isSmall) return 15;
    if (isMedium) return 25;
    if (isLarge) return 35;
    return 20;
  };

  const getFontSizes = () => {
    if (isExtraSmall) return { 
      title: 18, 
      heading: 16, 
      subheading: 14, 
      body: 13, 
      caption: 11,
      cardTitle: 15,
      cardDesc: 11
    };
    if (isSmall) return { 
      title: 20, 
      heading: 18, 
      subheading: 16, 
      body: 14, 
      caption: 12,
      cardTitle: 16,
      cardDesc: 12
    };
    if (isMedium) return { 
      title: 24, 
      heading: 20, 
      subheading: 18, 
      body: 15, 
      caption: 13,
      cardTitle: 17,
      cardDesc: 13
    };
    if (isLarge) return { 
      title: 26, 
      heading: 22, 
      subheading: 20, 
      body: 16, 
      caption: 14,
      cardTitle: 18,
      cardDesc: 14
    };
    return { 
      title: 22, 
      heading: 19, 
      subheading: 17, 
      body: 15, 
      caption: 13,
      cardTitle: 17,
      cardDesc: 13
    };
  };

  return {
    width,
    height,
    isExtraSmall,
    isSmall,
    isMedium,
    isLarge,
    isExtraLarge,
    isMobile,
    isTablet,
    isDesktop,
    getResponsiveValue,
    getCardWidth,
    getPadding,
    getFontSizes,
    fontSizes: getFontSizes(),
    padding: getPadding(),
    cardWidth: getCardWidth(),
  };
};

export default useResponsive;
