import AsyncStorage from '@react-native-async-storage/async-storage';
import { BlogPost } from '@/types/BlogPost';

const POSTS_KEY = 'gitblog_posts';
const SETTINGS_KEY = 'gitblog_settings';

interface LocalSettings {
  syncEnabled: boolean;
  lastSync?: Date;
}

class LocalStorageService {
  async getPosts(): Promise<BlogPost[]> {
    try {
      const postsJson = await AsyncStorage.getItem(POSTS_KEY);
      if (!postsJson) return [];
      
      const posts = JSON.parse(postsJson);
      return posts.map((post: any) => ({
        ...post,
        date: new Date(post.date)
      }));
    } catch (error) {
      console.error('Failed to load posts from local storage:', error);
      return [];
    }
  }

  async savePost(post: BlogPost): Promise<void> {
    try {
      const posts = await this.getPosts();
      const existingIndex = posts.findIndex(p => p.filename === post.filename);
      
      if (existingIndex >= 0) {
        posts[existingIndex] = post;
      } else {
        posts.push(post);
      }
      
      await AsyncStorage.setItem(POSTS_KEY, JSON.stringify(posts));
    } catch (error) {
      throw new Error('Failed to save post locally');
    }
  }

  async deletePost(filename: string): Promise<void> {
    try {
      const posts = await this.getPosts();
      const filteredPosts = posts.filter(p => p.filename !== filename);
      await AsyncStorage.setItem(POSTS_KEY, JSON.stringify(filteredPosts));
    } catch (error) {
      throw new Error('Failed to delete post locally');
    }
  }

  async getPost(filename: string): Promise<BlogPost | null> {
    try {
      const posts = await this.getPosts();
      return posts.find(p => p.filename === filename) || null;
    } catch (error) {
      console.error('Failed to get post from local storage:', error);
      return null;
    }
  }

  async getSettings(): Promise<LocalSettings> {
    try {
      const settingsJson = await AsyncStorage.getItem(SETTINGS_KEY);
      if (!settingsJson) {
        return { syncEnabled: false };
      }
      
      const settings = JSON.parse(settingsJson);
      return {
        ...settings,
        lastSync: settings.lastSync ? new Date(settings.lastSync) : undefined
      };
    } catch (error) {
      return { syncEnabled: false };
    }
  }

  async saveSettings(settings: LocalSettings): Promise<void> {
    try {
      await AsyncStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
    } catch (error) {
      throw new Error('Failed to save settings locally');
    }
  }

  async clearAllData(): Promise<void> {
    try {
      await AsyncStorage.multiRemove([POSTS_KEY, SETTINGS_KEY]);
    } catch (error) {
      throw new Error('Failed to clear local data');
    }
  }

  async importPosts(posts: BlogPost[]): Promise<void> {
    try {
      await AsyncStorage.setItem(POSTS_KEY, JSON.stringify(posts));
    } catch (error) {
      throw new Error('Failed to import posts');
    }
  }
}

export const localStorageService = new LocalStorageService();