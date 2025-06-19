import React, { useState } from 'react';
import { View, StyleSheet, ScrollView, Alert } from 'react-native';
import { Text, TextInput, Button, Card } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { format } from 'date-fns';
import { MarkdownEditor } from '@/components/MarkdownEditor';
import { TagsInput } from '@/components/TagsInput';
import { localStorageService } from '@/lib/localStorageService';
import { BlogPost } from '@/types/BlogPost';
import { useTheme } from '@/components/ThemeProvider';
import { t } from '@/lib/i18n';

export default function NewPostScreen() {
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [tags, setTags] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);
  const { theme } = useTheme();

  const generateFilename = () => {
    const date = format(new Date(), 'yyyy-MM-dd');
    const slug = title.toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .trim();
    return `${date}-${slug}.md`;
  };

  const savePost = async () => {
    if (!title.trim() || !content.trim()) {
      Alert.alert(t('newPost.error'), t('newPost.fillRequired'));
      return;
    }

    setSaving(true);
    try {
      const filename = generateFilename();
      const newPost: BlogPost = {
        filename,
        title: title.trim(),
        date: new Date(),
        content: content.trim(),
        tags: tags.length > 0 ? tags : undefined,
      };

      await localStorageService.savePost(newPost);
      
      // Navegar de vuelta inmediatamente después de guardar
      router.replace('/');
    } catch (error) {
      Alert.alert(
        t('newPost.error'),
        error instanceof Error ? error.message : t('newPost.saveFailed')
      );
    } finally {
      setSaving(false);
    }
  };

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
    },
    content: {
      flex: 1,
      paddingHorizontal: 16,
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
    preview: {
      padding: 12,
      backgroundColor: theme.colors.surfaceVariant,
      borderRadius: 8,
      marginTop: 16,
    },
    filename: {
      fontFamily: 'monospace',
      color: theme.colors.onSurfaceVariant,
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
          {t('newPost.title')}
        </Text>
      </View>

      <ScrollView style={dynamicStyles.content}>
        <Card style={dynamicStyles.card}>
          <Card.Content>
            <TextInput
              label={t('newPost.postTitle')}
              value={title}
              onChangeText={setTitle}
              mode="outlined"
              style={styles.input}
              placeholder={t('newPost.titlePlaceholder')}
            />

            <TagsInput
              tags={tags}
              onTagsChange={setTags}
            />

            <Text variant="titleMedium" style={dynamicStyles.sectionTitle}>
              {t('newPost.content')}
            </Text>
            
            <MarkdownEditor
              value={content}
              onChangeText={setContent}
              placeholder={t('newPost.contentPlaceholder')}
              title={title}
              date={new Date()}
              tags={tags}
            />

            {title && (
              <View style={dynamicStyles.preview}>
                <Text variant="titleMedium" style={dynamicStyles.sectionTitle}>
                  {t('newPost.filenamePreview')}
                </Text>
                <Text variant="bodyMedium" style={dynamicStyles.filename}>
                  {generateFilename()}
                </Text>
              </View>
            )}
          </Card.Content>
        </Card>
      </ScrollView>

      <View style={dynamicStyles.actions}>
        <Button
          mode="outlined"
          onPress={() => router.replace('/')}
          style={styles.cancelButton}
          disabled={saving}
        >
          {t('newPost.cancel')}
        </Button>
        <Button
          mode="contained"
          onPress={savePost}
          loading={saving}
          disabled={!title.trim() || !content.trim() || saving}
          style={styles.saveButton}
        >
          {t('newPost.save')}
        </Button>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  input: {
    marginBottom: 16,
  },
  cancelButton: {
    flex: 1,
    marginRight: 8,
  },
  saveButton: {
    flex: 1,
    marginLeft: 8,
    backgroundColor: '#3b82f6',
  },
});