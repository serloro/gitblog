import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Card, Text, Chip } from 'react-native-paper';
import { format } from 'date-fns';
import { BlogPost } from '@/types/BlogPost';
import { useTheme } from './ThemeProvider';

interface PostCardProps {
  post: BlogPost;
  onPress: () => void;
}

export function PostCard({ post, onPress }: PostCardProps) {
  const excerpt = post.content.substring(0, 150) + '...';
  const { isDark, theme } = useTheme();

  const dynamicStyles = StyleSheet.create({
    card: {
      marginBottom: 12,
      backgroundColor: theme.colors.surface,
      elevation: 2,
    },
    title: {
      fontWeight: '600',
      color: theme.colors.onSurface,
      marginBottom: 4,
    },
    date: {
      color: theme.colors.onSurfaceVariant,
      marginBottom: 8,
    },
    excerpt: {
      color: theme.colors.onSurfaceVariant,
      lineHeight: 20,
      marginBottom: 12,
    },
    tag: {
      marginRight: 6,
      marginBottom: 4,
      backgroundColor: theme.colors.surfaceVariant,
    },
    tagText: {
      fontSize: 12,
      color: theme.colors.onSurfaceVariant,
    },
    moreTags: {
      fontSize: 12,
      color: theme.colors.onSurfaceVariant,
      fontStyle: 'italic',
    },
  });

  return (
    <Card style={dynamicStyles.card} onPress={onPress}>
      <Card.Content>
        <Text variant="titleMedium" style={dynamicStyles.title}>
          {post.title}
        </Text>
        <Text variant="bodySmall" style={dynamicStyles.date}>
          {format(post.date, 'MMMM d, yyyy')}
        </Text>
        <Text variant="bodyMedium" style={dynamicStyles.excerpt}>
          {excerpt}
        </Text>
        {post.tags && post.tags.length > 0 && (
          <View style={styles.tags}>
            {post.tags.slice(0, 3).map(tag => (
              <Chip key={tag} style={dynamicStyles.tag} textStyle={dynamicStyles.tagText}>
                {tag}
              </Chip>
            ))}
            {post.tags.length > 3 && (
              <Text style={dynamicStyles.moreTags}>+{post.tags.length - 3} more</Text>
            )}
          </View>
        )}
      </Card.Content>
    </Card>
  );
}

const styles = StyleSheet.create({
  tags: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
  },
});