import { BlogPost } from '@/types/BlogPost';
import { localStorageService } from './localStorageService';
import { githubApi } from './githubApi';
import { configService } from './configService';
import { parsePostMetadata, createPostContent } from './postUtils';

interface SyncResult {
  success: boolean;
  message: string;
  synced: number;
  errors: string[];
}

class SyncService {
  async syncToGitHub(): Promise<SyncResult> {
    try {
      // Check if GitHub is configured
      const config = await configService.getConfig();
      if (!config.repoUrl || !config.token) {
        return {
          success: false,
          message: 'GitHub not configured',
          synced: 0,
          errors: ['Please configure GitHub settings first']
        };
      }

      // Update GitHub API config
      githubApi.setApiConfig({
        repoUrl: config.repoUrl,
        token: config.token,
      });

      // Test connection
      await githubApi.testConnection();

      // Get local posts
      const localPosts = await localStorageService.getPosts();
      
      if (localPosts.length === 0) {
        return {
          success: true,
          message: 'No posts to sync',
          synced: 0,
          errors: []
        };
      }

      const errors: string[] = [];
      let synced = 0;

      // Sync each post
      for (const post of localPosts) {
        try {
          const content = createPostContent({
            title: post.title,
            date: post.date,
            tags: post.tags,
            content: post.content
          });

          // Try to get existing post
          try {
            const existingPost = await githubApi.getPost(post.filename);
            // Update existing post
            await githubApi.updatePost(post.filename, content, existingPost.sha);
          } catch (error) {
            // Post doesn't exist, create new one
            await githubApi.createPost(post.filename, content);
          }
          
          synced++;
        } catch (error) {
          errors.push(`Failed to sync ${post.filename}: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
      }

      // Update sync settings
      await localStorageService.saveSettings({
        syncEnabled: true,
        lastSync: new Date()
      });

      return {
        success: errors.length === 0,
        message: `Synced ${synced} posts to GitHub`,
        synced,
        errors
      };

    } catch (error) {
      return {
        success: false,
        message: 'Sync failed',
        synced: 0,
        errors: [error instanceof Error ? error.message : 'Unknown error']
      };
    }
  }

  async syncFromGitHub(): Promise<SyncResult> {
    try {
      // Check if GitHub is configured
      const config = await configService.getConfig();
      if (!config.repoUrl || !config.token) {
        return {
          success: false,
          message: 'GitHub not configured',
          synced: 0,
          errors: ['Please configure GitHub settings first']
        };
      }

      // Update GitHub API config
      githubApi.setApiConfig({
        repoUrl: config.repoUrl,
        token: config.token,
      });

      // Get GitHub posts
      const githubPosts = await githubApi.getPosts();
      const parsedPosts = githubPosts.map(parsePostMetadata);

      // Import to local storage
      await localStorageService.importPosts(parsedPosts);

      // Update sync settings
      await localStorageService.saveSettings({
        syncEnabled: true,
        lastSync: new Date()
      });

      return {
        success: true,
        message: `Imported ${parsedPosts.length} posts from GitHub`,
        synced: parsedPosts.length,
        errors: []
      };

    } catch (error) {
      return {
        success: false,
        message: 'Import failed',
        synced: 0,
        errors: [error instanceof Error ? error.message : 'Unknown error']
      };
    }
  }

  async syncJekyllConfig(jekyllConfig: {
    title: string;
    description: string;
    url: string;
    baseurl: string;
    authorName: string;
    authorEmail: string;
    authorGithub: string;
    authorTwitter: string;
  }): Promise<SyncResult> {
    try {
      // Check if GitHub is configured
      const config = await configService.getConfig();
      if (!config.repoUrl || !config.token) {
        return {
          success: false,
          message: 'GitHub not configured',
          synced: 0,
          errors: ['Please configure GitHub settings first']
        };
      }

      // Update GitHub API config
      githubApi.setApiConfig({
        repoUrl: config.repoUrl,
        token: config.token,
      });

      // Test connection
      await githubApi.testConnection();

      // Get existing Jekyll config
      const existingConfig = await githubApi.getJekyllConfig();
      
      // Generate new config content
      const configContent = githubApi.generateJekyllConfig({
        title: jekyllConfig.title,
        description: jekyllConfig.description,
        url: jekyllConfig.url,
        baseurl: jekyllConfig.baseurl,
        author: {
          name: jekyllConfig.authorName,
          email: jekyllConfig.authorEmail,
          github: jekyllConfig.authorGithub,
          twitter: jekyllConfig.authorTwitter,
        }
      });

      // Update Jekyll config
      await githubApi.updateJekyllConfig(configContent, existingConfig.sha || undefined);

      return {
        success: true,
        message: 'Jekyll configuration updated successfully',
        synced: 1,
        errors: []
      };

    } catch (error) {
      return {
        success: false,
        message: 'Failed to update Jekyll configuration',
        synced: 0,
        errors: [error instanceof Error ? error.message : 'Unknown error']
      };
    }
  }
}

export const syncService = new SyncService();