import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

interface AppConfig {
  repoUrl: string;
  token: string;
  username?: string;
}

const STORAGE_KEY = 'gitblog_config';

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
      } else {
        await SecureStore.deleteItemAsync(STORAGE_KEY);
      }
    } catch (error) {
      throw new Error('Failed to clear configuration');
    }
  }
}

export const configService = new ConfigService();