import React, { useState, useRef } from 'react';
import { View, StyleSheet, ScrollView, TextInput as RNTextInput } from 'react-native';
import { TextInput, IconButton, Card, Divider } from 'react-native-paper';
import { Bold, Italic, Underline, List, ListOrdered, Quote, Code, Link, Image, Heading1, Heading2, Heading3, Eye, CreditCard as Edit3 } from 'lucide-react-native';

interface MarkdownEditorProps {
  value: string;
  onChangeText: (text: string) => void;
  placeholder?: string;
  showPreview?: boolean;
  onTogglePreview?: () => void;
}

export function MarkdownEditor({ 
  value, 
  onChangeText, 
  placeholder = "Write your content in Markdown...",
  showPreview = false,
  onTogglePreview
}: MarkdownEditorProps) {
  const textInputRef = useRef<RNTextInput>(null);
  const [selection, setSelection] = useState({ start: 0, end: 0 });

  const insertText = (before: string, after: string = '', placeholder: string = '') => {
    const beforeText = value.substring(0, selection.start);
    const selectedText = value.substring(selection.start, selection.end);
    const afterText = value.substring(selection.end);
    
    const textToInsert = selectedText || placeholder;
    const newText = beforeText + before + textToInsert + after + afterText;
    
    onChangeText(newText);
    
    // Set cursor position after insertion using controlled selection
    setTimeout(() => {
      const newCursorPos = selection.start + before.length + textToInsert.length;
      setSelection({ start: newCursorPos, end: newCursorPos });
    }, 10);
  };

  const insertAtNewLine = (text: string) => {
    const beforeText = value.substring(0, selection.start);
    const afterText = value.substring(selection.end);
    
    // Check if we need to add a newline before
    const needsNewlineBefore = beforeText.length > 0 && !beforeText.endsWith('\n');
    const prefix = needsNewlineBefore ? '\n' : '';
    
    const newText = beforeText + prefix + text + '\n' + afterText;
    onChangeText(newText);
    
    setTimeout(() => {
      const newCursorPos = selection.start + prefix.length + text.length + 1;
      setSelection({ start: newCursorPos, end: newCursorPos });
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

  return (
    <Card style={styles.container}>
      <View style={styles.toolbar}>
        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.toolbarContent}
        >
          {formatButtons.map((button, index) => (
            <IconButton
              key={index}
              icon={() => <button.icon size={18} color="#374151" />}
              size={20}
              onPress={button.onPress}
              style={styles.toolbarButton}
            />
          ))}
        </ScrollView>
        {onTogglePreview && (
          <>
            <Divider style={styles.divider} />
            <IconButton
              icon={() => showPreview ? <Edit3 size={18} color="#3b82f6" /> : <Eye size={18} color="#374151" />}
              size={20}
              onPress={onTogglePreview}
              style={[styles.toolbarButton, showPreview && styles.activeButton]}
            />
          </>
        )}
      </View>
      
      <Divider />
      
      <TextInput
        ref={textInputRef}
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        multiline
        mode="flat"
        style={styles.textInput}
        contentStyle={styles.textInputContent}
        selection={selection}
        onSelectionChange={(event) => {
          setSelection({
            start: event.nativeEvent.selection.start,
            end: event.nativeEvent.selection.end
          });
        }}
        underlineColor="transparent"
        activeUnderlineColor="transparent"
      />
    </Card>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#ffffff',
    marginBottom: 16,
  },
  toolbar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    backgroundColor: '#f8fafc',
  },
  toolbarContent: {
    paddingRight: 8,
  },
  toolbarButton: {
    margin: 0,
    marginHorizontal: 2,
  },
  activeButton: {
    backgroundColor: '#e0f2fe',
  },
  divider: {
    width: 1,
    height: 24,
    marginHorizontal: 8,
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
  },
});