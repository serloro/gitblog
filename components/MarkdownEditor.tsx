import React, { useState, useRef } from 'react';
import { View, StyleSheet, ScrollView, TextInput as RNTextInput } from 'react-native';
import { TextInput, IconButton, Card, Divider, SegmentedButtons } from 'react-native-paper';
import { Bold, Italic, Underline, List, ListOrdered, Quote, Code, Link, Image, Heading1, Heading2, Heading3 } from 'lucide-react-native';
import { MarkdownPreview } from './MarkdownPreview';
import { useTheme } from './ThemeProvider';
import { t } from '@/lib/i18n';

interface MarkdownEditorProps {
  value: string;
  onChangeText: (text: string) => void;
  placeholder?: string;
  title?: string;
  date?: Date;
  tags?: string[];
}

export function MarkdownEditor({ 
  value, 
  onChangeText, 
  placeholder = "Write your content...",
  title = '',
  date = new Date(),
  tags = []
}: MarkdownEditorProps) {
  const textInputRef = useRef<RNTextInput>(null);
  const [selection, setSelection] = useState({ start: 0, end: 0 });
  const [mode, setMode] = useState('edit');
  const { theme } = useTheme();

  const insertText = (before: string, after: string = '', placeholder: string = '') => {
    const beforeText = value.substring(0, selection.start);
    const selectedText = value.substring(selection.start, selection.end);
    const afterText = value.substring(selection.end);
    
    const textToInsert = selectedText || placeholder;
    const newText = beforeText + before + textToInsert + after + afterText;
    
    onChangeText(newText);
    
    setTimeout(() => {
      const newCursorPos = selection.start + before.length + textToInsert.length;
      setSelection({ start: newCursorPos, end: newCursorPos });
      textInputRef.current?.focus();
    }, 10);
  };

  const insertAtNewLine = (text: string) => {
    const beforeText = value.substring(0, selection.start);
    const afterText = value.substring(selection.end);
    
    const needsNewlineBefore = beforeText.length > 0 && !beforeText.endsWith('\n');
    const prefix = needsNewlineBefore ? '\n' : '';
    
    const newText = beforeText + prefix + text + '\n' + afterText;
    onChangeText(newText);
    
    setTimeout(() => {
      const newCursorPos = selection.start + prefix.length + text.length + 1;
      setSelection({ start: newCursorPos, end: newCursorPos });
      textInputRef.current?.focus();
    }, 10);
  };

  const formatButtons = [
    {
      icon: Bold,
      onPress: () => insertText('**', '**', 'bold text'),
      tooltip: 'Bold'
    },
    {
      icon: Italic,
      onPress: () => insertText('*', '*', 'italic text'),
      tooltip: 'Italic'
    },
    {
      icon: Underline,
      onPress: () => insertText('<u>', '</u>', 'underlined text'),
      tooltip: 'Underline'
    },
    {
      icon: Heading1,
      onPress: () => insertAtNewLine('# Heading 1'),
      tooltip: 'Heading 1'
    },
    {
      icon: Heading2,
      onPress: () => insertAtNewLine('## Heading 2'),
      tooltip: 'Heading 2'
    },
    {
      icon: Heading3,
      onPress: () => insertAtNewLine('### Heading 3'),
      tooltip: 'Heading 3'
    },
    {
      icon: List,
      onPress: () => insertAtNewLine('- List item'),
      tooltip: 'Bullet List'
    },
    {
      icon: ListOrdered,
      onPress: () => insertAtNewLine('1. Numbered item'),
      tooltip: 'Numbered List'
    },
    {
      icon: Quote,
      onPress: () => insertAtNewLine('> Quote'),
      tooltip: 'Quote'
    },
    {
      icon: Code,
      onPress: () => insertText('`', '`', 'code'),
      tooltip: 'Inline Code'
    },
    {
      icon: Link,
      onPress: () => insertText('[', '](https://example.com)', 'link text'),
      tooltip: 'Link'
    },
    {
      icon: Image,
      onPress: () => insertText('![', '](https://example.com/image.jpg)', 'alt text'),
      tooltip: 'Image'
    }
  ];

  const dynamicStyles = StyleSheet.create({
    container: {
      backgroundColor: theme.colors.surface,
      marginBottom: 16,
    },
    toolbar: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 8,
      paddingVertical: 4,
      backgroundColor: theme.colors.surfaceVariant,
    },
    textInput: {
      backgroundColor: 'transparent',
      minHeight: 300,
    },
    textInputContent: {
      paddingHorizontal: 16,
      paddingVertical: 16,
      fontSize: 16,
      lineHeight: 24,
      fontFamily: 'monospace',
      color: theme.colors.onSurface,
    },
    segmentedButtons: {
      marginBottom: 16,
    },
  });

  return (
    <View>
      <SegmentedButtons
        value={mode}
        onValueChange={setMode}
        buttons={[
          { value: 'edit', label: t('editor.edit') },
          { value: 'preview', label: t('editor.preview') },
        ]}
        style={dynamicStyles.segmentedButtons}
      />

      {mode === 'edit' ? (
        <Card style={dynamicStyles.container}>
          <View style={dynamicStyles.toolbar}>
            <ScrollView 
              horizontal 
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.toolbarContent}
            >
              {formatButtons.map((button, index) => (
                <IconButton
                  key={index}
                  icon={() => <button.icon size={18} color={theme.colors.onSurfaceVariant} />}
                  size={20}
                  onPress={button.onPress}
                  style={styles.toolbarButton}
                />
              ))}
            </ScrollView>
          </View>
          
          <Divider />
          
          <TextInput
            ref={textInputRef}
            value={value}
            onChangeText={onChangeText}
            placeholder={placeholder}
            multiline
            mode="flat"
            style={dynamicStyles.textInput}
            contentStyle={dynamicStyles.textInputContent}
            selection={selection}
            onSelectionChange={(event) => {
              setSelection({
                start: event.nativeEvent.selection.start,
                end: event.nativeEvent.selection.end
              });
            }}
            underlineColor="transparent"
            activeUnderlineColor="transparent"
            placeholderTextColor={theme.colors.onSurfaceVariant}
            autoFocus
          />
        </Card>
      ) : (
        <Card style={dynamicStyles.container}>
          <Card.Content>
            <MarkdownPreview 
              content={value}
              title={title || 'Preview'}
              date={date}
              tags={tags}
            />
          </Card.Content>
        </Card>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  toolbarContent: {
    paddingRight: 8,
  },
  toolbarButton: {
    margin: 0,
    marginHorizontal: 2,
  },
});