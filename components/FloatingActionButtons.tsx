import React, { useState } from 'react';
import { View, StyleSheet, Animated, TouchableOpacity, Text } from 'react-native';
import { Plus, Settings, Globe, Menu } from 'lucide-react-native';
import { router } from 'expo-router';
import { useTheme } from './ThemeProvider';
import { t } from '@/lib/i18n';

interface FloatingActionButtonsProps {
  onPublishPress?: () => void;
}

export function FloatingActionButtons({ onPublishPress }: FloatingActionButtonsProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [animation] = useState(new Animated.Value(0));
  const { theme } = useTheme();

  const toggleExpanded = () => {
    const toValue = isExpanded ? 0 : 1;
    
    Animated.spring(animation, {
      toValue,
      useNativeDriver: true,
      tension: 100,
      friction: 8,
    }).start();
    
    setIsExpanded(!isExpanded);
  };

  const handleNewPost = () => {
    setIsExpanded(false);
    Animated.spring(animation, {
      toValue: 0,
      useNativeDriver: true,
      tension: 100,
      friction: 8,
    }).start();
    router.push('/new-post');
  };

  const handleSettings = () => {
    setIsExpanded(false);
    Animated.spring(animation, {
      toValue: 0,
      useNativeDriver: true,
      tension: 100,
      friction: 8,
    }).start();
    router.push('/settings');
  };

  const handlePublish = () => {
    setIsExpanded(false);
    Animated.spring(animation, {
      toValue: 0,
      useNativeDriver: true,
      tension: 100,
      friction: 8,
    }).start();
    onPublishPress?.();
  };

  const dynamicStyles = StyleSheet.create({
    container: {
      position: 'absolute',
      bottom: 20,
      right: 20,
      alignItems: 'center',
    },
    fab: {
      width: 56,
      height: 56,
      borderRadius: 28,
      backgroundColor: theme.colors.primary,
      justifyContent: 'center',
      alignItems: 'center',
      elevation: 8,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.3,
      shadowRadius: 8,
    },
    secondaryFab: {
      width: 48,
      height: 48,
      borderRadius: 24,
      backgroundColor: theme.colors.surface,
      justifyContent: 'center',
      alignItems: 'center',
      elevation: 6,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.2,
      shadowRadius: 4,
      marginBottom: 12,
      borderWidth: 1,
      borderColor: theme.colors.outline,
    },
    tooltip: {
      position: 'absolute',
      right: 60,
      backgroundColor: theme.colors.inverseSurface,
      paddingHorizontal: 12,
      paddingVertical: 8,
      borderRadius: 8,
      elevation: 4,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.2,
      shadowRadius: 4,
      minWidth: 120,
    },
    tooltipText: {
      color: theme.colors.inverseOnSurface,
      fontSize: 12,
      fontWeight: '500',
      textAlign: 'center',
    },
  });

  const secondaryButtons = [
    {
      icon: Globe,
      onPress: handlePublish,
      tooltip: 'Publish & Refresh Pages',
      color: theme.colors.onSurface,
    },
    {
      icon: Settings,
      onPress: handleSettings,
      tooltip: t('nav.settings'),
      color: theme.colors.onSurface,
    },
    {
      icon: Plus,
      onPress: handleNewPost,
      tooltip: t('nav.newPost'),
      color: theme.colors.onSurface,
    },
  ];

  return (
    <View style={dynamicStyles.container}>
      {secondaryButtons.map((button, index) => {
        const translateY = animation.interpolate({
          inputRange: [0, 1],
          outputRange: [0, -(60 * (index + 1))],
        });

        const scale = animation.interpolate({
          inputRange: [0, 1],
          outputRange: [0, 1],
        });

        const opacity = animation.interpolate({
          inputRange: [0, 0.5, 1],
          outputRange: [0, 0, 1],
        });

        return (
          <Animated.View
            key={index}
            style={[
              styles.secondaryButtonContainer,
              {
                transform: [{ translateY }, { scale }],
                opacity,
              },
            ]}
          >
            <View style={styles.buttonWithTooltip}>
              <Animated.View style={dynamicStyles.tooltip}>
                <Text style={dynamicStyles.tooltipText}>{button.tooltip}</Text>
              </Animated.View>
              <TouchableOpacity
                style={dynamicStyles.secondaryFab}
                onPress={button.onPress}
                activeOpacity={0.8}
              >
                <button.icon size={24} color={button.color} />
              </TouchableOpacity>
            </View>
          </Animated.View>
        );
      })}

      <TouchableOpacity
        style={dynamicStyles.fab}
        onPress={toggleExpanded}
        activeOpacity={0.8}
      >
        <Animated.View
          style={{
            transform: [
              {
                rotate: animation.interpolate({
                  inputRange: [0, 1],
                  outputRange: ['0deg', '90deg'],
                }),
              },
            ],
          }}
        >
          <Menu size={24} color="#ffffff" />
        </Animated.View>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  secondaryButtonContainer: {
    position: 'absolute',
    bottom: 0,
  },
  buttonWithTooltip: {
    flexDirection: 'row',
    alignItems: 'center',
  },
});