import React, { useState } from 'react';
import { View, StyleSheet } from 'react-native';
import { Text, TextInput, Button, Chip } from 'react-native-paper';
import { useTheme } from './ThemeProvider';
import { t } from '@/lib/i18n';

interface TagsInputProps {
  tags: string[];
  onTagsChange: (tags: string[]) => void;
}

export function TagsInput({ tags, onTagsChange }: TagsInputProps) {
  const [newTag, setNewTag] = useState('');
  const { theme } = useTheme();

  const addTag = () => {
    if (newTag.trim() && !tags.includes(newTag.trim())) {
      onTagsChange([...tags, newTag.trim()]);
      setNewTag('');
    }
  };

  const removeTag = (tagToRemove: string) => {
    onTagsChange(tags.filter(tag => tag !== tagToRemove));
  };

  const dynamicStyles = StyleSheet.create({
    sectionTitle: {
      marginBottom: 8,
      color: theme.colors.onSurface,
      fontWeight: '600',
    },
    tag: {
      marginRight: 8,
      marginBottom: 4,
      backgroundColor: theme.colors.surfaceVariant,
    },
  });

  return (
    <View style={styles.container}>
      <Text variant="titleMedium" style={dynamicStyles.sectionTitle}>
        {t('newPost.tags')}
      </Text>
      <View style={styles.tagInput}>
        <TextInput
          label={t('newPost.addTag')}
          value={newTag}
          onChangeText={setNewTag}
          mode="outlined"
          style={styles.tagTextInput}
          onSubmitEditing={addTag}
          returnKeyType="done"
        />
        <Button mode="contained" onPress={addTag} style={styles.addButton}>
          {t('newPost.add')}
        </Button>
      </View>
      <View style={styles.tagsList}>
        {tags.map(tag => (
          <Chip
            key={tag}
            onClose={() => removeTag(tag)}
            style={dynamicStyles.tag}
          >
            {tag}
          </Chip>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 16,
  },
  tagInput: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  tagTextInput: {
    flex: 1,
    marginRight: 8,
  },
  addButton: {
    backgroundColor: '#3b82f6',
  },
  tagsList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
});