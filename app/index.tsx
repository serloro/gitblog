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
  const [publishing, setPublishing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [syncEnabled, setSyncEnabled] = useState(false);
  const [cooldownInfo, setCooldownInfo] = useState({ canPublish: true, remainingTime: 0, lastActionTime: null as Date | null });
  const { isDark, theme } = useTheme();

  const loadPosts = async () => {
    try {
      setError(null);
      const localPosts = await localStorageService.getPosts();
      setPosts(localPosts);
      
      // Check sync settings
      const settings = await localStorageService.getSettings();
      setSyncEnabled(settings.syncEnabled);
      
      // Update cooldown info
      const cooldown = syncService.getCooldownStatus();
      setCooldownInfo(cooldown);
    } catch (err) {
      setError(err instanceof Error ? err.message : t('error.loadFailed'));
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadPosts();
    
    // Update cooldown info every second
    const interval = setInterval(() => {
      const cooldown = syncService.getCooldownStatus();
      setCooldownInfo(cooldown);
    }, 1000);
    
    return () => clearInterval(interval);
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

  const handlePublishPress = async () => {
    // Check cooldown before starting
    if (!cooldownInfo.canPublish) {
      Alert.alert(
        '⏰ Cooldown Activo',
        `Debes esperar ${cooldownInfo.remainingTime} segundos antes de publicar de nuevo.\n\nEsto evita múltiples GitHub Actions simultáneos.`,
        [{ text: 'OK' }]
      );
      return;
    }

    setPublishing(true);
    try {
      const result = await syncService.publishAndRefreshGitHubPages();
      
      if (result.success) {
        Alert.alert(
          '🎉 ¡Publicación Exitosa!', 
          result.message + '\n\n' + 
          (result.pagesUrl ? `Tu sitio estará disponible en unos minutos en:\n${result.pagesUrl}` : 'GitHub Pages se está actualizando...'),
          [
            {
              text: 'Ver Sitio',
              onPress: () => {
                if (result.pagesUrl) {
                  // In a real app, you would open the URL in a browser
                  console.log('Opening:', result.pagesUrl);
                }
              },
              style: 'default'
            },
            {
              text: 'OK',
              style: 'cancel'
            }
          ]
        );
      } else {
        Alert.alert(
          '⚠️ Publicación con Errores', 
          result.message + '\n\nErrores:\n' + result.errors.join('\n'),
          [{ text: 'OK' }]
        );
      }
    } catch (error) {
      Alert.alert(
        '❌ Error de Publicación', 
        'No se pudo publicar el sitio. Verifica tu configuración de GitHub.',
        [{ text: 'OK' }]
      );
    } finally {
      setPublishing(false);
      // Update cooldown info after publishing
      const cooldown = syncService.getCooldownStatus();
      setCooldownInfo(cooldown);
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
    publishingOverlay: {
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
      justifyContent: 'center',
      alignItems: 'center',
      zIndex: 1000,
    },
    publishingCard: {
      backgroundColor: theme.colors.surface,
      padding: 24,
      borderRadius: 12,
      margin: 32,
      alignItems: 'center',
    },
    publishingText: {
      color: theme.colors.onSurface,
      textAlign: 'center',
      marginTop: 16,
    },
    cooldownInfo: {
      backgroundColor: theme.colors.surfaceVariant,
      padding: 12,
      borderRadius: 8,
      marginHorizontal: 16,
      marginBottom: 16,
    },
    cooldownText: {
      color: theme.colors.onSurfaceVariant,
      fontSize: 12,
      textAlign: 'center',
    },
  });

  return (
    <SafeAreaView style={dynamicStyles.container}>
      {publishing && (
        <View style={dynamicStyles.publishingOverlay}>
          <Card style={dynamicStyles.publishingCard}>
            <Card.Content style={{ alignItems: 'center' }}>
              <Text variant="titleMedium" style={dynamicStyles.publishingText}>
                🚀 Publicando en GitHub Pages...
              </Text>
              <Text variant="bodyMedium" style={[dynamicStyles.publishingText, { marginTop: 8 }]}>
                Sincronizando posts y configuración
              </Text>
            </Card.Content>
          </Card>
        </View>
      )}

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

      {/* Cooldown Information */}
      {!cooldownInfo.canPublish && (
        <View style={dynamicStyles.cooldownInfo}>
          <Text style={dynamicStyles.cooldownText}>
            ⏰ Cooldown activo: {cooldownInfo.remainingTime}s restantes
          </Text>
          <Text style={[dynamicStyles.cooldownText, { marginTop: 4 }]}>
            Evita múltiples GitHub Actions simultáneos
          </Text>
        </View>
      )}

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

      <FloatingActionButtons onPublishPress={handlePublishPress} />
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