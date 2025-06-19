import React, { useState, useRef } from 'react';
import { View, StyleSheet, ScrollView, TextInput as RNTextInput, Text, TouchableOpacity } from 'react-native';
import { IconButton, Card, Divider } from 'react-native-paper';
import { Bold, Italic, Underline, List, ListOrdered, Quote, Code, Link, Image, Heading1, Heading2, Heading3 } from 'lucide-react-native';
import { useTheme } from './ThemeProvider';

interface TextSegment {
  text: string;
  styles: {
    bold?: boolean;
    italic?: boolean;
    underline?: boolean;
    code?: boolean;
    heading?: 1 | 2 | 3;
    quote?: boolean;
    list?: boolean;
  };
}

interface WysiwygEditorProps {
  value: string;
  onChangeText: (text: string) => void;
  placeholder?: string;
  showPreview?: boolean;
  onTogglePreview?: () => void;
  isEditorMode?: boolean;
}

export function WysiwygEditor({ 
  value, 
  onChangeText, 
  placeholder = "Write your content...",
  showPreview = false,
  onTogglePreview,
  isEditorMode = false
}: WysiwygEditorProps) {
  const textInputRef = useRef<RNTextInput>(null);
  const [selection, setSelection] = useState({ start: 0, end: 0 });
  const [activeFormats, setActiveFormats] = useState<Set<string>>(new Set());
  const { isDark, theme } = useTheme();

  const parseTextToSegments = (text: string): TextSegment[] => {
    const lines = text.split('\n');
    const segments: TextSegment[] = [];

    lines.forEach((line, lineIndex) => {
      if (lineIndex > 0) {
        segments.push({ text: '\n', styles: {} });
      }

      let currentLine = line;
      let lineStyles: TextSegment['styles'] = {};

      // Check for line-level formatting
      if (line.startsWith('### ')) {
        lineStyles.heading = 3;
        currentLine = line.substring(4);
      } else if (line.startsWith('## ')) {
        lineStyles.heading = 2;
        currentLine = line.substring(3);
      } else if (line.startsWith('# ')) {
        lineStyles.heading = 1;
        currentLine = line.substring(2);
      } else if (line.startsWith('> ')) {
        lineStyles.quote = true;
        currentLine = line.substring(2);
      } else if (line.startsWith('- ') || line.match(/^\d+\. /)) {
        lineStyles.list = true;
      }

      // Parse inline formatting
      let lastIndex = 0;
      const inlineRegex = /(\*\*.*?\*\*|\*.*?\*|`.*?`|<u>.*?<\/u>)/g;
      let match;

      while ((match = inlineRegex.exec(currentLine)) !== null) {
        // Add text before the match
        if (match.index > lastIndex) {
          segments.push({
            text: currentLine.substring(lastIndex, match.index),
            styles: { ...lineStyles }
          });
        }

        // Add the formatted text
        const matchedText = match[0];
        let innerText = matchedText;
        let segmentStyles = { ...lineStyles };

        if (matchedText.startsWith('**') && matchedText.endsWith('**')) {
          innerText = matchedText.slice(2, -2);
          segmentStyles.bold = true;
        } else if (matchedText.startsWith('*') && matchedText.endsWith('*')) {
          innerText = matchedText.slice(1, -1);
          segmentStyles.italic = true;
        } else if (matchedText.startsWith('`') && matchedText.endsWith('`')) {
          innerText = matchedText.slice(1, -1);
          segmentStyles.code = true;
        } else if (matchedText.startsWith('<u>') && matchedText.endsWith('</u>')) {
          innerText = matchedText.slice(3, -4);
          segmentStyles.underline = true;
        }

        segments.push({
          text: innerText,
          styles: segmentStyles
        });

        lastIndex = match.index + matchedText.length;
      }

      // Add remaining text
      if (lastIndex < currentLine.length) {
        segments.push({
          text: currentLine.substring(lastIndex),
          styles: { ...lineStyles }
        });
      }
    });

    return segments;
  };

  const getTextStyleForSegment = (segment: TextSegment) => {
    const baseStyle = [
      styles.baseText,
      { color: theme.colors.onSurface }
    ];

    if (segment.styles.heading === 1) {
      baseStyle.push(styles.heading1);
    } else if (segment.styles.heading === 2) {
      baseStyle.push(styles.heading2);
    } else if (segment.styles.heading === 3) {
      baseStyle.push(styles.heading3);
    }

    if (segment.styles.bold) {
      baseStyle.push(styles.bold);
    }

    if (segment.styles.italic) {
      baseStyle.push(styles.italic);
    }

    if (segment.styles.underline) {
      baseStyle.push(styles.underline);
    }

    if (segment.styles.code) {
      baseStyle.push([styles.code, { backgroundColor: theme.colors.surfaceVariant }]);
    }

    if (segment.styles.quote) {
      baseStyle.push([styles.quote, { 
        backgroundColor: theme.colors.surfaceVariant,
        borderLeftColor: theme.colors.outline 
      }]);
    }

    if (segment.styles.list) {
      baseStyle.push(styles.listItem);
    }

    return baseStyle;
  };

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
      tooltip: 'Bold',
      active: activeFormats.has('bold')
    },
    {
      icon: Italic,
      onPress: () => insertText('*', '*', 'italic text'),
      tooltip: 'Italic',
      active: activeFormats.has('italic')
    },
    {
      icon: Underline,
      onPress: () => insertText('<u>', '</u>', 'underlined text'),
      tooltip: 'Underline',
      active: activeFormats.has('underline')
    },
    {
      icon: Heading1,
      onPress: () => insertAtNewLine('# Heading 1'),
      tooltip: 'Heading 1',
      active: activeFormats.has('h1')
    },
    {
      icon: Heading2,
      onPress: () => insertAtNewLine('## Heading 2'),
      tooltip: 'Heading 2',
      active: activeFormats.has('h2')
    },
    {
      icon: Heading3,
      onPress: () => insertAtNewLine('### Heading 3'),
      tooltip: 'Heading 3',
      active: activeFormats.has('h3')
    },
    {
      icon: List,
      onPress: () => insertAtNewLine('- List item'),
      tooltip: 'Bullet List',
      active: activeFormats.has('list')
    },
    {
      icon: ListOrdered,
      onPress: () => insertAtNewLine('1. Numbered item'),
      tooltip: 'Numbered List',
      active: activeFormats.has('orderedList')
    },
    {
      icon: Quote,
      onPress: () => insertAtNewLine('> Quote'),
      tooltip: 'Quote',
      active: activeFormats.has('quote')
    },
    {
      icon: Code,
      onPress: () => insertText('`', '`', 'code'),
      tooltip: 'Inline Code',
      active: activeFormats.has('code')
    },
    {
      icon: Link,
      onPress: () => insertText('[', '](https://example.com)', 'link text'),
      tooltip: 'Link',
      active: false
    },
    {
      icon: Image,
      onPress: () => insertText('![', '](https://example.com/image.jpg)', 'alt text'),
      tooltip: 'Image',
      active: false
    }
  ];

  const renderWysiwygContent = () => {
    const segments = parseTextToSegments(value);
    
    return (
      <TouchableOpacity 
        style={styles.wysiwygContent}
        activeOpacity={1}
        onPress={() => textInputRef.current?.focus()}
      >
        {segments.map((segment, index) => (
          <Text key={index} style={getTextStyleForSegment(segment)}>
            {segment.text}
          </Text>
        ))}
        {value === '' && (
          <Text style={[styles.placeholder, { color: theme.colors.onSurfaceVariant }]}>
            {placeholder}
          </Text>
        )}
      </TouchableOpacity>
    );
  };

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
    wysiwygContainer: {
      minHeight: 300,
      backgroundColor: theme.colors.surface,
      position: 'relative',
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
  });

  return (
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
              icon={() => <button.icon size={18} color={button.active ? theme.colors.primary : theme.colors.onSurfaceVariant} />}
              size={20}
              onPress={button.onPress}
              style={[
                styles.toolbarButton,
                button.active && { backgroundColor: theme.colors.primaryContainer }
              ]}
            />
          ))}
        </ScrollView>
      </View>
      
      <Divider />
      
      <View style={dynamicStyles.wysiwygContainer}>
        <ScrollView style={styles.wysiwygScrollView}>
          <View style={styles.wysiwygContentContainer}>
            {renderWysiwygContent()}
          </View>
        </ScrollView>
        
        {/* TextInput transparente para manejar la entrada de texto y el cursor */}
        <RNTextInput
          ref={textInputRef}
          value={value}
          onChangeText={onChangeText}
          multiline
          style={[styles.overlayTextInput, dynamicStyles.textInputContent]}
          selection={selection}
          onSelectionChange={(event) => {
            setSelection({
              start: event.nativeEvent.selection.start,
              end: event.nativeEvent.selection.end
            });
          }}
          placeholder=""
          placeholderTextColor="transparent"
          selectionColor={theme.colors.primary}
          autoFocus={isEditorMode}
        />
      </View>
    </Card>
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
  divider: {
    width: 1,
    height: 24,
    marginHorizontal: 8,
  },
  wysiwygScrollView: {
    flex: 1,
  },
  wysiwygContentContainer: {
    padding: 16,
    minHeight: 268,
  },
  wysiwygContent: {
    flex: 1,
    minHeight: 268,
  },
  overlayTextInput: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    fontSize: 16,
    lineHeight: 24,
    padding: 16,
    backgroundColor: 'transparent',
    color: 'transparent',
    textAlignVertical: 'top',
  },
  baseText: {
    fontSize: 16,
    lineHeight: 24,
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
  bold: {
    fontWeight: '700',
  },
  italic: {
    fontStyle: 'italic',
  },
  underline: {
    textDecorationLine: 'underline',
  },
  code: {
    fontFamily: 'monospace',
    paddingHorizontal: 4,
    paddingVertical: 2,
    borderRadius: 4,
    fontSize: 14,
  },
  quote: {
    fontStyle: 'italic',
    paddingLeft: 16,
    paddingVertical: 8,
    borderLeftWidth: 4,
    marginVertical: 4,
  },
  listItem: {
    marginLeft: 16,
  },
  placeholder: {
    fontSize: 16,
    lineHeight: 24,
    fontStyle: 'italic',
  },
});