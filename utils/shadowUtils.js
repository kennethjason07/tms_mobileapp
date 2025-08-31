import { Platform } from 'react-native';

/**
 * Creates cross-platform shadow styles
 * @param {Object} options - Shadow configuration
 * @param {number} options.elevation - Android elevation (default: 3)
 * @param {string} options.shadowColor - Shadow color (default: '#000')
 * @param {number} options.shadowOpacity - Shadow opacity (default: 0.1)
 * @param {number} options.shadowRadius - Shadow blur radius (default: 4)
 * @param {Object} options.shadowOffset - Shadow offset (default: { width: 0, height: 2 })
 * @returns {Object} Platform-specific shadow styles
 */
export const createShadowStyle = ({
  elevation = 3,
  shadowColor = '#000',
  shadowOpacity = 0.1,
  shadowRadius = 4,
  shadowOffset = { width: 0, height: 2 }
} = {}) => {
  if (Platform.OS === 'web') {
    // Use boxShadow for web
    const { width, height } = shadowOffset;
    return {
      boxShadow: `${width}px ${height}px ${shadowRadius}px rgba(${hexToRgb(shadowColor)}, ${shadowOpacity})`,
    };
  } else if (Platform.OS === 'android') {
    // Use elevation for Android
    return {
      elevation,
    };
  } else {
    // Use shadow properties for iOS
    return {
      shadowColor,
      shadowOpacity,
      shadowRadius,
      shadowOffset,
    };
  }
};

/**
 * Convert hex color to RGB values
 * @param {string} hex - Hex color (e.g., '#000000' or '#000')
 * @returns {string} RGB values (e.g., '0, 0, 0')
 */
const hexToRgb = (hex) => {
  // Remove # if present
  hex = hex.replace('#', '');
  
  // Handle 3-character hex
  if (hex.length === 3) {
    hex = hex.split('').map(char => char + char).join('');
  }
  
  const r = parseInt(hex.slice(0, 2), 16);
  const g = parseInt(hex.slice(2, 4), 16);
  const b = parseInt(hex.slice(4, 6), 16);
  
  return `${r}, ${g}, ${b}`;
};

// Common shadow presets
export const shadowPresets = {
  small: {
    elevation: 2,
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 1 }
  },
  medium: {
    elevation: 4,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 }
  },
  large: {
    elevation: 6,
    shadowColor: '#000',
    shadowOpacity: 0.12,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 }
  },
  card: {
    elevation: 3,
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 }
  }
};
