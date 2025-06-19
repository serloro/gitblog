import React from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { Text, Card, Chip } from 'react-native-paper';
import { format } from 'date-fns';
import Markdown from 'react-native-markdown-display';
import { useTheme } from './ThemeProvider';

interface MarkdownPreviewProps {
  content: string;
  title: string;
  date: Date;
  tags?: string[];
}

export function MarkdownPreview({ content, title, date, tags }: MarkdownPreviewProps) {
  const { isDark, theme } = useTheme();

  const dynamicStyles = StyleSheet.create({
    container: {
      flex: 1,
    },
    header: {
      marginBottom: 24,
      paddingBottom: 16,
      borderBottomWidth: 1,
      borderBottomColor: theme.colors.outline,
    },
    title: {
      fontWeight: '700',
      color: theme.colors.onSurface,
      marginBottom: 8,
    },
    date: {
      color: theme.colors.onSurfaceVariant,
      marginBottom: 12,
    },
    tag: {
      marginRight: 8,
      marginBottom: 4,
      backgroundColor: theme.colors.surfaceVariant,
    },
  });

  const markdownStyles = StyleSheet.create({
    body: {
      fontSize: 16,
      lineHeight: 24,
      color: theme.colors.onSurface,
    },
    heading1: {
      fontSize: 28,
      fontWeight: '700',
      color: theme.colors.onSurface,
      marginBottom: 16,
      marginTop: 24,
    },
    heading2: {
      fontSize: 24,
      fontWeight: '600',
      color: theme.colors.onSurface,
      marginBottom: 12,
      marginTop: 20,
    },
    heading3: {
      fontSize: 20,
      fontWeight: '600',
      color: theme.colors.onSurface,
      marginBottom: 8,
      marginTop: 16,
    },
    paragraph: {
      fontSize: 16,
      lineHeight: 24,
      color: theme.colors.onSurface,
      marginBottom: 12,
    },
    code_inline: {
      backgroundColor: theme.colors.surfaceVariant,
      paddingHorizontal: 4,
      paddingVertical: 2,
      borderRadius: 4,
      fontSize: 14,
      fontFamily: 'monospace',
      color: '#dc2626',
    },
    fence: {
      backgroundColor: theme.colors.surfaceVariant,
      padding: 12,
      borderRadius: 8,
      borderLeftWidth: 4,
      borderLeftColor: theme.colors.primary,
      marginVertical: 8,
    },
    code_block: {
      fontSize: 14,
      fontFamily: 'monospace',
      color: theme.colors.onSurface,
    },
    blockquote: {
      backgroundColor: theme.colors.surfaceVariant,
      paddingHorizontal: 16,
      paddingVertical: 8,
      borderLeftWidth: 4,
      borderLeftColor: theme.colors.outline,
      marginVertical: 8,
    },
    list_item: {
      marginBottom: 4,
      color: theme.colors.onSurface,
    },
    bullet_list: {
      marginBottom: 12,
    },
    ordered_list: {
      marginBottom: 12,
    },
  });

  return (
    <ScrollView style={dynamicStyles.container}>
      <View style={dynamicStyles.header}>
        <Text variant="headlineMedium" style={dynamicStyles.title}>
          {title}
        </Text>
        <Text variant="bodyMedium" style={dynamicStyles.date}>
          {format(date, 'MMMM d, yyyy')}
        </Text>
        {tags && tags.length > 0 && (
          <View style={styles.tags}>
            {tags.map(tag => (
              <Chip key={tag} style={dynamicStyles.tag}>
                {tag}
              </Chip>
            ))}
          </View>
        )}
      </View>
      
      <Markdown style={markdownStyles}>
        {content}
      </Markdown>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  tags: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
});