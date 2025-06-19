import React, { useState, useEffect } from 'react';
import { View, ScrollView, StyleSheet, RefreshControl, Alert } from 'react-native';
import { Text, Card, Searchbar, Chip, Button } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useFocusEffect } from 'expo-router';
import { PostCard } from '@/components/PostCard';
import { LoadingState } from '@/components/LoadingState';
import { ErrorState } from '@/components/ErrorState';
import { FloatingActionButtons } from '@/components/FloatingActionButtons';
import { localStorageService } from '@/lib/localStorageService';
import { syncService } from '@/lib/syncService';
import { BlogPost } from '@/types/BlogPost';
import { Cloud, CloudOff } from 'lucide-react-native';
import { useTheme } from '@/components/ThemeProvider';
import { t } from '@/lib/i18n';

export default function PostsScreen() {
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [syncEnabled, setSyncEnabled] = useState(false);
  const { isDark, theme } = useTheme();

  const loadPosts = async () => {
    try {
      setError(null);
      const localPosts = await localStorageService.getPosts();
      setPosts(localPosts);
      
      // Check sync settings
      const settings = await localStorageService.getSettings();
      setSyncEnabled(settings.syncEnabled);
    } catch (err) {
      setError(err instanceof Error ? err.message : t('error.loadFailed'));
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadPosts();
  }, []);

  // Recargar posts cada vez que la pantalla recibe foco
  useFocusEffect(
    React.useCallback(() => {
      loadPosts();
    }, [])
  );

  const onRefresh = () => {
    setRefreshing(true);
    loadPosts();
  };

  const handleSyncPress = async () => {
    setSyncing(true);
    try {
      const result = await syncService.syncToGitHub();
      
      if (result.success) {
        Alert.alert(t('common.success'), result.message);
      } else {
        Alert.alert(t('settings.syncFailed'), result.message + '\n\n' + result.errors.join('\n'));
      }
    } catch (error) {
      Alert.alert(t('common.error'), t('settings.syncFailed'));
    } finally {
      setSyncing(false);
    }
  };

  const filteredPosts = posts.filter(post => {
    const matchesSearch = post.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         post.content.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesTags = selectedTags.length === 0 || 
                       selectedTags.some(tag => post.tags?.includes(tag));
    return matchesSearch && matchesTags;
  });

  const allTags = [...new Set(posts.flatMap(post => post.tags || []))];

  const toggleTag = (tag: string) => {
    setSelectedTags(prev => 
      prev.includes(tag) 
        ? prev.filter(t => t !== tag)
        : [...prev, tag]
    );
  };

  if (loading) {
    return <LoadingState message={t('loading.posts')} />;
  }

  if (error) {
    return <ErrorState message={error} onRetry={loadPosts} />;
  }

  const dynamicStyles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.colors.background,
    },
    header: {
      paddingHorizontal: 16,
      paddingVertical: 16,
      backgroundColor: theme.colors.background,
    },
    title: {
      fontWeight: '700',
      color: theme.colors.onBackground,
      marginBottom: 4,
    },
    subtitle: {
      color: theme.colors.onSurfaceVariant,
    },
    searchBar: {
      marginHorizontal: 16,
      marginBottom: 16,
      backgroundColor: theme.colors.surface,
    },
    emptyCard: {
      marginTop: 32,
      backgroundColor: theme.colors.surface,
    },
    emptyTitle: {
      textAlign: 'center',
      marginBottom: 8,
      color: theme.colors.onSurface,
    },
    emptyText: {
      textAlign: 'center',
      color: theme.colors.onSurfaceVariant,
      lineHeight: 20,
      marginBottom: 16,
    },
  });

  return (
    <SafeAreaView style={dynamicStyles.container}>
      <View style={dynamicStyles.header}>
        <View style={styles.titleRow}>
          <View>
            <Text variant="headlineMedium" style={dynamicStyles.title}>
              {t('posts.title')}
            </Text>
            <Text variant="bodyMedium" style={dynamicStyles.subtitle}>
              {t('posts.postsCount', { count: posts.length })}
            </Text>
          </View>
          <View style={styles.syncIndicator}>
            {syncEnabled ? (
              <Cloud size={24} color="#10b981" />
            ) : (
              <CloudOff size={24} color={theme.colors.onSurfaceVariant} />
            )}
          </View>
        </View>
      </View>

      {posts.length > 0 && (
        <>
          <Searchbar
            placeholder={t('posts.search')}
            onChangeText={setSearchQuery}
            value={searchQuery}
            style={dynamicStyles.searchBar}
          />

          {allTags.length > 0 && (
            <ScrollView 
              horizontal 
              showsHorizontalScrollIndicator={false}
              style={styles.tagsContainer}
              contentContainerStyle={styles.tagsContent}
            >
              {allTags.map(tag => (
                <Chip
                  key={tag}
                  mode={selectedTags.includes(tag) ? 'flat' : 'outlined'}
                  onPress={() => toggleTag(tag)}
                  style={styles.tagChip}
                >
                  {tag}
                </Chip>
              ))}
            </ScrollView>
          )}
        </>
      )}

      <ScrollView
        style={styles.content}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {filteredPosts.length === 0 ? (
          <Card style={dynamicStyles.emptyCard}>
            <Card.Content>
              <Text variant="titleMedium" style={dynamicStyles.emptyTitle}>
                {posts.length === 0 ? t('posts.welcome') : t('posts.noMatching')}
              </Text>
              <Text variant="bodyMedium" style={dynamicStyles.emptyText}>
                {posts.length === 0 
                  ? t('posts.welcomeMessage')
                  : t('posts.noMatchingMessage')
                }
              </Text>
              {posts.length === 0 && (
                <Button
                  mode="contained"
                  onPress={() => router.push('/new-post')}
                  style={styles.createButton}
                >
                  {t('posts.createFirst')}
                </Button>
              )}
            </Card.Content>
          </Card>
        ) : (
          filteredPosts.map(post => (
            <PostCard 
              key={post.filename}
              post={post}
              onPress={() => router.push({
                pathname: '/editor/[filename]',
                params: { filename: post.filename }
              })}
            />
          ))
        )}
      </ScrollView>

      <FloatingActionButtons onSyncPress={handleSyncPress} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  titleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  syncIndicator: {
    padding: 8,
  },
  tagsContainer: {
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  tagsContent: {
    paddingRight: 16,
  },
  tagChip: {
    marginRight: 8,
  },
  content: {
    flex: 1,
    paddingHorizontal: 16,
  },
  createButton: {
    backgroundColor: '#3b82f6',
    alignSelf: 'center',
  },
});