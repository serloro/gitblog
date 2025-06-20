import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

interface AppConfig {
  repoUrl: string;
  token: string;
  username?: string;
}

interface JekyllSiteConfig {
  title: string;
  description: string;
  url: string;
  baseurl: string;
  authorName: string;
  authorEmail: string;
  authorGithub: string;
  authorTwitter: string;
}

const STORAGE_KEY = 'gitblog_config';
const JEKYLL_CONFIG_KEY = 'gitblog_jekyll_config';

class ConfigService {
  async saveConfig(config: AppConfig): Promise<void> {
    try {
      if (Platform.OS === 'web') {
        // Use localStorage for web
        localStorage.setItem(STORAGE_KEY, JSON.stringify(config));
      } else {
        // Use SecureStore for mobile
        await SecureStore.setItemAsync(STORAGE_KEY, JSON.stringify(config));
      }
    } catch (error) {
      throw new Error('Failed to save configuration');
    }
  }

  async getConfig(): Promise<AppConfig> {
    try {
      let configStr: string | null = null;
      
      if (Platform.OS === 'web') {
        configStr = localStorage.getItem(STORAGE_KEY);
      } else {
        configStr = await SecureStore.getItemAsync(STORAGE_KEY);
      }

      if (!configStr) {
        return {
          repoUrl: '',
          token: '',
          username: '',
        };
      }

      return JSON.parse(configStr);
    } catch (error) {
      throw new Error('Failed to load configuration');
    }
  }

  async clearConfig(): Promise<void> {
    try {
      if (Platform.OS === 'web') {
        localStorage.removeItem(STORAGE_KEY);
        localStorage.removeItem(JEKYLL_CONFIG_KEY);
      } else {
        await SecureStore.deleteItemAsync(STORAGE_KEY);
        await SecureStore.deleteItemAsync(JEKYLL_CONFIG_KEY);
      }
    } catch (error) {
      throw new Error('Failed to clear configuration');
    }
  }

  async saveJekyllConfig(config: JekyllSiteConfig): Promise<void> {
    try {
      if (Platform.OS === 'web') {
        localStorage.setItem(JEKYLL_CONFIG_KEY, JSON.stringify(config));
      } else {
        await SecureStore.setItemAsync(JEKYLL_CONFIG_KEY, JSON.stringify(config));
      }
    } catch (error) {
      throw new Error('Failed to save Jekyll configuration');
    }
  }

  async getJekyllConfig(): Promise<JekyllSiteConfig> {
    try {
      let configStr: string | null = null;
      
      if (Platform.OS === 'web') {
        configStr = localStorage.getItem(JEKYLL_CONFIG_KEY);
      } else {
        configStr = await SecureStore.getItemAsync(JEKYLL_CONFIG_KEY);
      }

      if (!configStr) {
        return {
          title: 'Mi Blog',
          description: 'Un blog sobre desarrollo web, software y tecnología',
          url: '',
          baseurl: '',
          authorName: '',
          authorEmail: '',
          authorGithub: '',
          authorTwitter: '',
        };
      }

      return JSON.parse(configStr);
    } catch (error) {
      return {
        title: 'Mi Blog',
        description: 'Un blog sobre desarrollo web, software y tecnología',
        url: '',
        baseurl: '',
        authorName: '',
        authorEmail: '',
        authorGithub: '',
        authorTwitter: '',
      };
    }
  }
}

export const configService = new ConfigService();