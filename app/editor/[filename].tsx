import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, Alert } from 'react-native';
import { Text, TextInput, Button, Card } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, router } from 'expo-router';
import { WysiwygEditor } from '@/components/WysiwygEditor';
import { LoadingState } from '@/components/LoadingState';
import { ErrorState } from '@/components/ErrorState';
import { localStorageService } from '@/lib/localStorageService';
import { BlogPost } from '@/types/BlogPost';
import { useTheme } from '@/components/ThemeProvider';
import { t } from '@/lib/i18n';

export default function EditorScreen() {
  const { filename } = useLocalSearchParams<{ filename: string }>();
  const [post, setPost] = useState<BlogPost | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [content, setContent] = useState('');
  const [title, setTitle] = useState('');
  const [tags, setTags] = useState<string[]>([]);
  const { isDark, theme } = useTheme();

  useEffect(() => {
    loadPost();
  }, [filename]);

  const loadPost = async () => {
    if (!filename) return;
    
    try {
      setError(null);
      const postData = await localStorageService.getPost(filename);
      
      if (!postData) {
        setError(t('error.postNotFound'));
        return;
      }
      
      setPost(postData);
      setContent(postData.content);
      setTitle(postData.title);
      setTags(postData.tags || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : t('error.loadFailed'));
    } finally {
      setLoading(false);
    }
  };

  const savePost = async () => {
    if (!post || !filename) return;

    setSaving(true);
    try {
      const updatedPost: BlogPost = {
        ...post,
        title,
        content,
        tags: tags.length > 0 ? tags : undefined,
      };

      await localStorageService.savePost(updatedPost);
      
      // Actualizar el estado local
      setPost(updatedPost);
      
      // Navegar de vuelta inmediatamente después de guardar
      router.replace('/');
    } catch (error) {
      Alert.alert(
        t('common.error'),
        error instanceof Error ? error.message : t('editor.updateFailed')
      );
    } finally {
      setSaving(false);
    }
  };

  const deletePost = () => {
    Alert.alert(
      t('editor.deleteConfirm'),
      t('editor.deleteMessage'),
      [
        { text: t('common.cancel'), style: 'cancel' },
        { 
          text: t('editor.delete'), 
          style: 'destructive',
          onPress: confirmDelete
        }
      ]
    );
  };

  const confirmDelete = async () => {
    if (!filename) return;

    setDeleting(true);
    try {
      await localStorageService.deletePost(filename);
      
      // Navegar de vuelta inmediatamente después de eliminar
      router.replace('/');
    } catch (error) {
      Alert.alert(
        t('common.error'),
        error instanceof Error ? error.message : t('editor.deleteFailed')
      );
      setDeleting(false);
    }
  };

  const handleCancel = () => {
    router.replace('/');
  };

  if (loading) {
    return <LoadingState message={t('loading.post')} />;
  }

  if (error) {
    return <ErrorState message={error} onRetry={loadPost} />;
  }

  if (!post) {
    return <ErrorState message={t('error.postNotFound')} onRetry={() => router.replace('/')} />;
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
    filename: {
      color: theme.colors.onSurfaceVariant,
      fontFamily: 'monospace',
    },
    card: {
      backgroundColor: theme.colors.surface,
      marginBottom: 16,
    },
    sectionTitle: {
      marginBottom: 8,
      color: theme.colors.onSurface,
      fontWeight: '600',
    },
    actions: {
      flexDirection: 'row',
      paddingHorizontal: 16,
      paddingVertical: 16,
      backgroundColor: theme.colors.surface,
      borderTopWidth: 1,
      borderTopColor: theme.colors.outline,
    },
  });

  return (
    <SafeAreaView style={dynamicStyles.container}>
      <View style={dynamicStyles.header}>
        <Text variant="headlineMedium" style={dynamicStyles.title}>
          {t('editor.title')}
        </Text>
        <Text variant="bodyMedium" style={dynamicStyles.filename}>
          {filename}
        </Text>
      </View>

      <ScrollView style={styles.content}>
        <Card style={dynamicStyles.card}>
          <Card.Content>
            <TextInput
              label={t('editor.titleLabel')}
              value={title}
              onChangeText={setTitle}
              mode="outlined"
              style={styles.input}
            />
            <Text variant="titleMedium" style={dynamicStyles.sectionTitle}>
              {t('editor.contentLabel')}
            </Text>
            <WysiwygEditor
              value={content}
              onChangeText={setContent}
              placeholder={t('editor.contentPlaceholder')}
              showPreview={true}
              isEditorMode={true}
            />
          </Card.Content>
        </Card>
      </ScrollView>

      <View style={dynamicStyles.actions}>
        <Button
          mode="outlined"
          onPress={deletePost}
          style={styles.deleteButton}
          textColor="#dc2626"
          loading={deleting}
          disabled={deleting || saving}
        >
          {t('editor.delete')}
        </Button>
        <Button
          mode="outlined"
          onPress={handleCancel}
          style={styles.cancelButton}
          disabled={deleting || saving}
        >
          {t('editor.cancel')}
        </Button>
        <Button
          mode="contained"
          onPress={savePost}
          loading={saving}
          disabled={saving || deleting}
          style={styles.saveButton}
        >
          {t('editor.save')}
        </Button>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  content: {
    flex: 1,
    paddingHorizontal: 16,
  },
  input: {
    marginBottom: 16,
  },
  deleteButton: {
    marginRight: 8,
    borderColor: '#dc2626',
  },
  cancelButton: {
    flex: 1,
    marginHorizontal: 8,
  },
  saveButton: {
    flex: 1,
    marginLeft: 8,
    backgroundColor: '#3b82f6',
  },
});