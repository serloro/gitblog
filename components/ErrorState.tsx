import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Text, Button, Card } from 'react-native-paper';
import { CircleAlert as AlertCircle, Settings } from 'lucide-react-native';
import { router } from 'expo-router';
import { useTheme } from './ThemeProvider';

interface ErrorStateProps {
  message: string;
  onRetry?: () => void;
  showSettingsButton?: boolean;
}

export function ErrorState({ message, onRetry, showSettingsButton = false }: ErrorStateProps) {
  const { theme } = useTheme();
  
  const isConfigurationError = message.includes('configuration') || 
                              message.includes('token') || 
                              message.includes('directory not found');

  const dynamicStyles = StyleSheet.create({
    container: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: theme.colors.background,
      padding: 16,
    },
    card: {
      backgroundColor: theme.colors.surface,
      maxWidth: 400,
      width: '100%',
    },
    title: {
      color: theme.colors.onSurface,
      fontWeight: '600',
      marginBottom: 8,
      textAlign: 'center',
    },
    message: {
      color: theme.colors.onSurfaceVariant,
      textAlign: 'center',
      marginBottom: 24,
      lineHeight: 20,
    },
  });

  return (
    <View style={dynamicStyles.container}>
      <Card style={dynamicStyles.card}>
        <Card.Content style={styles.content}>
          <AlertCircle size={48} color="#dc2626" style={styles.icon} />
          <Text variant="titleMedium" style={dynamicStyles.title}>
            {isConfigurationError ? 'Configuration Required' : 'Something went wrong'}
          </Text>
          <Text variant="bodyMedium" style={dynamicStyles.message}>
            {message}
          </Text>
          
          <View style={styles.buttonContainer}>
            {(showSettingsButton || isConfigurationError) && (
              <Button
                mode="contained"
                onPress={() => router.push('/(tabs)/settings')}
                style={[styles.button, styles.settingsButton]}
                icon={() => <Settings size={16} color="#ffffff" />}
              >
                Go to Settings
              </Button>
            )}
            {onRetry && (
              <Button
                mode={isConfigurationError ? "outlined" : "contained"}
                onPress={onRetry}
                style={styles.button}
              >
                Try Again
              </Button>
            )}
          </View>
        </Card.Content>
      </Card>
    </View>
  );
}

const styles = StyleSheet.create({
  content: {
    alignItems: 'center',
  },
  icon: {
    marginBottom: 16,
  },
  buttonContainer: {
    flexDirection: 'column',
    width: '100%',
    gap: 8,
  },
  button: {
    width: '100%',
  },
  settingsButton: {
    backgroundColor: '#3b82f6',
  },
});