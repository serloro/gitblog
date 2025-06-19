import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Text, ActivityIndicator } from 'react-native-paper';
import { useTheme } from './ThemeProvider';

interface LoadingStateProps {
  message?: string;
}

export function LoadingState({ message = 'Loading...' }: LoadingStateProps) {
  const { theme } = useTheme();

  const dynamicStyles = StyleSheet.create({
    container: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: theme.colors.background,
    },
    message: {
      marginTop: 16,
      color: theme.colors.onSurfaceVariant,
    },
  });

  return (
    <View style={dynamicStyles.container}>
      <ActivityIndicator size="large" color={theme.colors.primary} />
      <Text variant="bodyMedium" style={dynamicStyles.message}>
        {message}
      </Text>
    </View>
  );
}