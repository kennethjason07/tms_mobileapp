import React, { useState, useEffect } from 'react';
import { TextInput, View, Text, StyleSheet } from 'react-native';

/**
 * FractionalInput Component
 * 
 * Accepts input in various formats:
 * - Decimal: "35.5", "36.75"
 * - Fraction: "35 1/2", "36 3/4", "1/2"
 * - Mixed: "35.5", "35 1/2" both work
 * 
 * Converts everything to decimal for storage but displays user's input format
 */
const FractionalInput = ({
  value = 0,
  onChangeValue,
  placeholder = "0",
  style = {},
  textInputStyle = {},
  keyboardType = "default",
  maxFractionalDigits = 4,
  showDecimalValue = false,
  allowText = false,  // New prop to allow text input mixed with fractions
  numericOnly = false  // New prop to force numeric-only mode
}) => {
  const [displayValue, setDisplayValue] = useState('');
  const [decimalValue, setDecimalValue] = useState(0);

  // Convert decimal to display format on mount/value change
  useEffect(() => {
    if (value === 0 || value === '0' || value === '') {
      setDisplayValue('');
      setDecimalValue(0);
    } else {
      // If it's already a decimal, show it as is
      const numValue = typeof value === 'string' ? parseFloat(value) : value;
      if (!isNaN(numValue)) {
        setDisplayValue(numValue.toString());
        setDecimalValue(numValue);
      }
    }
  }, [value]);

  // Parse various input formats and convert to decimal
  const parseInput = (input) => {
    if (!input || input.trim() === '') {
      return { decimal: 0, isValid: true, text: '' };
    }

    const trimmedInput = input.trim();

    // If allowText is true, check if input contains non-numeric characters
    if (allowText) {
      // Look for numeric patterns within text
      const numericPatterns = [
        /\b(\d+)\s+(\d+)\/(\d+)\b/g,  // Mixed numbers: "35 1/2"
        /\b(\d+\/(\d+))\b/g,          // Pure fractions: "1/2"
        /\b(\d+\.\d+)\b/g,            // Decimals: "35.5"
        /\b(\d+)\b/g                  // Whole numbers: "35"
      ];

      let hasNumericContent = false;
      let processedInput = trimmedInput;

      // Process mixed numbers first
      const mixedMatches = [...trimmedInput.matchAll(/\b(\d+)\s+(\d+)\/(\d+)\b/g)];
      for (const match of mixedMatches) {
        const wholeNumber = parseInt(match[1]);
        const numerator = parseInt(match[2]);
        const denominator = parseInt(match[3]);
        if (denominator !== 0) {
          const decimal = wholeNumber + (numerator / denominator);
          processedInput = processedInput.replace(match[0], decimal.toString());
          hasNumericContent = true;
        }
      }

      // Process pure fractions
      const fractionMatches = [...processedInput.matchAll(/\b(\d+)\/(\d+)\b/g)];
      for (const match of fractionMatches) {
        const numerator = parseInt(match[1]);
        const denominator = parseInt(match[2]);
        if (denominator !== 0) {
          const decimal = numerator / denominator;
          processedInput = processedInput.replace(match[0], decimal.toString());
          hasNumericContent = true;
        }
      }

      return { text: processedInput, isValid: true, hasNumericContent };
    }

    // Original numeric-only parsing for compatibility
    // Handle pure decimal numbers (35.5, 36.75, etc.)
    if (/^\d+(\.\d+)?$/.test(trimmedInput)) {
      const decimal = parseFloat(trimmedInput);
      return { decimal, isValid: !isNaN(decimal) };
    }

    // Handle pure fractions (1/2, 3/4, 1/4, etc.)
    if (/^\d+\/\d+$/.test(trimmedInput)) {
      const [numerator, denominator] = trimmedInput.split('/').map(Number);
      if (denominator === 0) {
        return { decimal: 0, isValid: false };
      }
      const decimal = numerator / denominator;
      return { decimal, isValid: !isNaN(decimal) };
    }

    // Handle mixed numbers (35 1/2, 36 3/4, etc.)
    const mixedNumberRegex = /^(\d+)\s+(\d+)\/(\d+)$/;
    const mixedMatch = trimmedInput.match(mixedNumberRegex);
    if (mixedMatch) {
      const wholeNumber = parseInt(mixedMatch[1]);
      const numerator = parseInt(mixedMatch[2]);
      const denominator = parseInt(mixedMatch[3]);
      
      if (denominator === 0) {
        return { decimal: 0, isValid: false };
      }
      
      const fractionalPart = numerator / denominator;
      const decimal = wholeNumber + fractionalPart;
      return { decimal, isValid: !isNaN(decimal) };
    }

    // Handle just whole numbers
    if (/^\d+$/.test(trimmedInput)) {
      const decimal = parseInt(trimmedInput);
      return { decimal, isValid: !isNaN(decimal) };
    }

    return { decimal: 0, isValid: false };
  };

  // Format decimal as fraction for common fractions
  const formatAsCommonFraction = (decimal) => {
    const tolerance = 0.01;
    const commonFractions = [
      { decimal: 0.125, display: '1/8' },
      { decimal: 0.25, display: '1/4' },
      { decimal: 0.375, display: '3/8' },
      { decimal: 0.5, display: '1/2' },
      { decimal: 0.625, display: '5/8' },
      { decimal: 0.75, display: '3/4' },
      { decimal: 0.875, display: '7/8' }
    ];

    const wholeNumber = Math.floor(decimal);
    const fractionalPart = decimal - wholeNumber;

    // Check if the fractional part matches a common fraction
    const commonFraction = commonFractions.find(
      frac => Math.abs(fractionalPart - frac.decimal) < tolerance
    );

    if (commonFraction) {
      if (wholeNumber === 0) {
        return commonFraction.display;
      } else {
        return `${wholeNumber} ${commonFraction.display}`;
      }
    }

    return decimal.toString();
  };

  const handleTextChange = (text) => {
    setDisplayValue(text);

    const parseResult = parseInput(text);
    
    if (parseResult.isValid) {
      if (allowText) {
        // For text mode, return the processed text
        if (onChangeValue) {
          onChangeValue(parseResult.text || text);
        }
      } else {
        // For numeric mode, return the decimal value
        const roundedDecimal = Math.round(parseResult.decimal * Math.pow(10, maxFractionalDigits)) / Math.pow(10, maxFractionalDigits);
        setDecimalValue(roundedDecimal);
        
        if (onChangeValue) {
          onChangeValue(roundedDecimal);
        }
      }
    } else {
      // Invalid input - for text mode, still allow typing
      if (allowText && onChangeValue) {
        onChangeValue(text);
      } else {
        console.warn('Invalid fractional input:', text);
      }
    }
  };

  const getPlaceholderText = () => {
    if (placeholder !== "0") return placeholder;
    return "";
  };

  return (
    <View style={[styles.container, style]}>
      <TextInput
        style={[styles.input, textInputStyle]}
        value={displayValue}
        onChangeText={handleTextChange}
        placeholder={getPlaceholderText()}
        keyboardType={keyboardType}
        autoCorrect={false}
        selectTextOnFocus={true}
      />
      {showDecimalValue && decimalValue > 0 && (
        <Text style={styles.decimalDisplay}>
          = {decimalValue}
        </Text>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 16,
    backgroundColor: '#fff',
  },
  decimalDisplay: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
    fontStyle: 'italic',
  },
});

// Helper function to convert common decimals to fractions for display
export const formatMeasurement = (decimal) => {
  if (!decimal || decimal === 0) return '';
  
  const tolerance = 0.01;
  const commonFractions = [
    { decimal: 0.125, display: '1/8' },
    { decimal: 0.25, display: '1/4' },
    { decimal: 0.375, display: '3/8' },
    { decimal: 0.5, display: '1/2' },
    { decimal: 0.625, display: '5/8' },
    { decimal: 0.75, display: '3/4' },
    { decimal: 0.875, display: '7/8' }
  ];

  const wholeNumber = Math.floor(decimal);
  const fractionalPart = decimal - wholeNumber;

  const commonFraction = commonFractions.find(
    frac => Math.abs(fractionalPart - frac.decimal) < tolerance
  );

  if (commonFraction) {
    if (wholeNumber === 0) {
      return commonFraction.display;
    } else {
      return `${wholeNumber} ${commonFraction.display}`;
    }
  }

  return decimal.toString();
};

export default FractionalInput;
