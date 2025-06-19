import { format } from 'date-fns';
import { BlogPost } from '@/types/BlogPost';

export function parsePostMetadata(post: { name: string; content: string; sha?: string }): BlogPost {
  const content = post.content;
  const frontmatterMatch = content.match(/^---\n([\s\S]*?)\n---\n([\s\S]*)$/);
  
  if (!frontmatterMatch) {
    return {
      filename: post.name,
      title: post.name.replace(/\.md$/, ''),
      date: new Date(),
      content: content,
      sha: post.sha,
    };
  }

  const frontmatter = frontmatterMatch[1];
  const bodyContent = frontmatterMatch[2].trim();

  const title = extractFrontmatterValue(frontmatter, 'title') || post.name.replace(/\.md$/, '');
  const dateStr = extractFrontmatterValue(frontmatter, 'date');
  const tagsStr = extractFrontmatterValue(frontmatter, 'tags');
  
  let date = new Date();
  if (dateStr) {
    date = new Date(dateStr);
  } else {
    // Try to extract date from filename (YYYY-MM-DD format)
    const dateMatch = post.name.match(/^(\d{4}-\d{2}-\d{2})/);
    if (dateMatch) {
      date = new Date(dateMatch[1]);
    }
  }

  let tags: string[] = [];
  if (tagsStr) {
    // Handle both array format [tag1, tag2] and comma-separated format
    if (tagsStr.startsWith('[') && tagsStr.endsWith(']')) {
      tags = tagsStr
        .slice(1, -1)
        .split(',')
        .map(tag => tag.trim().replace(/["']/g, ''))
        .filter(tag => tag.length > 0);
    } else {
      tags = tagsStr.split(',').map(tag => tag.trim()).filter(tag => tag.length > 0);
    }
  }

  return {
    filename: post.name,
    title,
    date,
    content: bodyContent,
    tags,
    sha: post.sha,
  };
}

export function parsePostContent(content: string): Omit<BlogPost, 'filename' | 'sha'> {
  const frontmatterMatch = content.match(/^---\n([\s\S]*?)\n---\n([\s\S]*)$/);
  
  if (!frontmatterMatch) {
    return {
      title: 'Untitled Post',
      date: new Date(),
      content: content,
    };
  }

  const frontmatter = frontmatterMatch[1];
  const bodyContent = frontmatterMatch[2].trim();

  const title = extractFrontmatterValue(frontmatter, 'title') || 'Untitled Post';
  const dateStr = extractFrontmatterValue(frontmatter, 'date');
  const tagsStr = extractFrontmatterValue(frontmatter, 'tags');
  
  let date = new Date();
  if (dateStr) {
    date = new Date(dateStr);
  }

  let tags: string[] = [];
  if (tagsStr) {
    if (tagsStr.startsWith('[') && tagsStr.endsWith(']')) {
      tags = tagsStr
        .slice(1, -1)
        .split(',')
        .map(tag => tag.trim().replace(/["']/g, ''))
        .filter(tag => tag.length > 0);
    } else {
      tags = tagsStr.split(',').map(tag => tag.trim()).filter(tag => tag.length > 0);
    }
  }

  return {
    title,
    date,
    content: bodyContent,
    tags,
  };
}

export function createPostContent(post: {
  title: string;
  date: Date;
  tags?: string[];
  content: string;
}): string {
  const frontmatter = [
    '---',
    `title: "${post.title}"`,
    `date: ${format(post.date, 'yyyy-MM-dd')}`,
    post.tags && post.tags.length > 0 ? `tags: [${post.tags.map(tag => `"${tag}"`).join(', ')}]` : '',
    '---',
    '',
    post.content
  ].filter(line => line !== '').join('\n');

  return frontmatter;
}

function extractFrontmatterValue(frontmatter: string, key: string): string | undefined {
  const regex = new RegExp(`^${key}:\\s*(.*)$`, 'm');
  const match = frontmatter.match(regex);
  return match ? match[1].replace(/["']/g, '').trim() : undefined;
}

export function generateSlug(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .trim();
}