import React, { useState, useRef } from 'react';
import { View, StyleSheet, ScrollView, TextInput as RNTextInput } from 'react-native';
import { TextInput, IconButton, Card, Divider, Text } from 'react-native-paper';
import { Bold, Italic, Underline, List, ListOrdered, Quote, Code, Link, Image, Heading1, Heading2, Heading3, Eye, CreditCard as Edit3 } from 'lucide-react-native';
import { useTheme } from './ThemeProvider';

interface RichTextEditorProps {
  value: string;
  onChangeText: (text: string) => void;
  placeholder?: string;
  showPreview?: boolean;
  onTogglePreview?: () => void;
}

export function RichTextEditor({ 
  value, 
  onChangeText, 
  placeholder = "Write your content...",
  showPreview = false,
  onTogglePreview
}: RichTextEditorProps) {
  const textInputRef = useRef<RNTextInput>(null);
  const [selection, setSelection] = useState({ start: 0, end: 0 });
  const { isDark } = useTheme();

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

  const renderFormattedText = () => {
    const lines = value.split('\n');
    return lines.map((line, index) => {
      let formattedLine = line;
      let style = styles.normalText;

      // Headers
      if (line.startsWith('### ')) {
        formattedLine = line.substring(4);
        style = [styles.normalText, styles.heading3, isDark && styles.darkText];
      } else if (line.startsWith('## ')) {
        formattedLine = line.substring(3);
        style = [styles.normalText, styles.heading2, isDark && styles.darkText];
      } else if (line.startsWith('# ')) {
        formattedLine = line.substring(2);
        style = [styles.normalText, styles.heading1, isDark && styles.darkText];
      } else if (line.startsWith('> ')) {
        formattedLine = line.substring(2);
        style = [styles.normalText, styles.quote, isDark && styles.darkText];
      } else if (line.startsWith('- ') || line.match(/^\d+\. /)) {
        style = [styles.normalText, styles.listItem, isDark && styles.darkText];
      } else {
        style = [styles.normalText, isDark && styles.darkText];
      }

      // Bold and italic formatting
      formattedLine = formattedLine
        .replace(/\*\*(.*?)\*\*/g, '$1') // Remove bold markers for display
        .replace(/\*(.*?)\*/g, '$1') // Remove italic markers for display
        .replace(/`(.*?)`/g, '$1'); // Remove code markers for display

      return (
        <Text key={index} style={style}>
          {formattedLine || ' '}
        </Text>
      );
    });
  };

  const themeStyles = isDark ? darkStyles : lightStyles;

  return (
    <Card style={[styles.container, themeStyles.container]}>
      <View style={[styles.toolbar, themeStyles.toolbar]}>
        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.toolbarContent}
        >
          {formatButtons.map((button, index) => (
            <IconButton
              key={index}
              icon={() => <button.icon size={18} color={isDark ? '#e2e8f0' : '#374151'} />}
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
              icon={() => showPreview ? <Edit3 size={18} color="#3b82f6" /> : <Eye size={18} color={isDark ? '#e2e8f0' : '#374151'} />}
              size={20}
              onPress={onTogglePreview}
              style={[styles.toolbarButton, showPreview && styles.activeButton]}
            />
          </>
        )}
      </View>
      
      <Divider />
      
      {showPreview ? (
        <ScrollView style={[styles.previewContainer, themeStyles.previewContainer]}>
          <View style={styles.previewContent}>
            {renderFormattedText()}
          </View>
        </ScrollView>
      ) : (
        <TextInput
          ref={textInputRef}
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          multiline
          mode="flat"
          style={[styles.textInput, themeStyles.textInput]}
          contentStyle={[styles.textInputContent, themeStyles.textInputContent]}
          selection={selection}
          onSelectionChange={(event) => {
            setSelection({
              start: event.nativeEvent.selection.start,
              end: event.nativeEvent.selection.end
            });
          }}
          underlineColor="transparent"
          activeUnderlineColor="transparent"
          placeholderTextColor={isDark ? '#94a3b8' : '#64748b'}
        />
      )}
    </Card>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 16,
  },
  toolbar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
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
  previewContainer: {
    minHeight: 300,
    maxHeight: 400,
  },
  previewContent: {
    padding: 16,
  },
  normalText: {
    fontSize: 16,
    lineHeight: 24,
    marginBottom: 8,
    color: '#374151',
  },
  heading1: {
    fontSize: 28,
    fontWeight: '700',
    marginBottom: 16,
    marginTop: 8,
  },
  heading2: {
    fontSize: 24,
    fontWeight: '600',
    marginBottom: 12,
    marginTop: 8,
  },
  heading3: {
    fontSize: 20,
    fontWeight: '600',
    marginBottom: 8,
    marginTop: 8,
  },
  quote: {
    fontStyle: 'italic',
    paddingLeft: 16,
    borderLeftWidth: 4,
    borderLeftColor: '#d1d5db',
    backgroundColor: '#f9fafb',
    paddingVertical: 8,
  },
  listItem: {
    marginLeft: 16,
  },
  darkText: {
    color: '#e2e8f0',
  },
});

const lightStyles = StyleSheet.create({
  container: {
    backgroundColor: '#ffffff',
  },
  toolbar: {
    backgroundColor: '#f8fafc',
  },
  textInput: {
    backgroundColor: 'transparent',
  },
  textInputContent: {
    color: '#374151',
  },
  previewContainer: {
    backgroundColor: '#ffffff',
  },
});

const darkStyles = StyleSheet.create({
  container: {
    backgroundColor: '#1e293b',
  },
  toolbar: {
    backgroundColor: '#334155',
  },
  textInput: {
    backgroundColor: 'transparent',
  },
  textInputContent: {
    color: '#e2e8f0',
  },
  previewContainer: {
    backgroundColor: '#1e293b',
  },
});