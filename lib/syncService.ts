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
  pagesUrl?: string;
}

class SyncService {
  private isPublishing = false; // Prevent multiple simultaneous publishes

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

  async publishAndRefreshGitHubPages(): Promise<SyncResult> {
    // Prevent multiple simultaneous publishes
    if (this.isPublishing) {
      return {
        success: false,
        message: 'Publication already in progress',
        synced: 0,
        errors: ['Another publication is already running']
      };
    }

    this.isPublishing = true;

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

      const errors: string[] = [];
      let synced = 0;

      // Step 1: Clean up any duplicate posts in wrong directories
      try {
        await this.cleanupDuplicatePosts();
      } catch (error) {
        console.warn('Failed to cleanup duplicate posts:', error);
        // Don't fail the entire process for cleanup issues
      }

      // Step 2: Sync Jekyll configuration
      try {
        const jekyllConfig = await configService.getJekyllConfig();
        const result = await this.syncJekyllConfig(jekyllConfig);
        if (!result.success) {
          errors.push('Failed to sync Jekyll configuration');
        } else {
          synced++;
        }
      } catch (error) {
        errors.push(`Jekyll config sync failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }

      // Step 3: Sync homepage (index.md)
      try {
        const homepageConfig = await configService.getHomepageConfig();
        const result = await this.syncHomepage(homepageConfig.content);
        if (!result.success) {
          errors.push('Failed to sync homepage');
        } else {
          synced++;
        }
      } catch (error) {
        errors.push(`Homepage sync failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }

      // Step 4: Sync README.md (automatic, not editable by user)
      try {
        const result = await this.syncReadme();
        if (!result.success) {
          errors.push('Failed to sync README');
        } else {
          synced++;
        }
      } catch (error) {
        errors.push(`README sync failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }

      // Step 5: Sync all posts to _posts directory ONLY
      const localPosts = await localStorageService.getPosts();
      
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

      // Step 6: Enable GitHub Pages if not already enabled
      let pagesUrl = '';
      try {
        const pagesResult = await githubApi.enableGitHubPages();
        pagesUrl = pagesResult.url;
      } catch (error) {
        errors.push(`Failed to enable GitHub Pages: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }

      // Step 7: Trigger a new build
      try {
        await githubApi.triggerPagesBuild();
      } catch (error) {
        errors.push(`Failed to trigger Pages build: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }

      // Update sync settings
      await localStorageService.saveSettings({
        syncEnabled: true,
        lastSync: new Date()
      });

      const successMessage = pagesUrl 
        ? `Published ${synced} items to GitHub and refreshed Pages. Site available at: ${pagesUrl}`
        : `Published ${synced} items to GitHub and triggered Pages refresh`;

      return {
        success: errors.length === 0,
        message: successMessage,
        synced,
        errors,
        pagesUrl
      };

    } catch (error) {
      return {
        success: false,
        message: 'Publish and refresh failed',
        synced: 0,
        errors: [error instanceof Error ? error.message : 'Unknown error']
      };
    } finally {
      this.isPublishing = false;
    }
  }

  private async cleanupDuplicatePosts(): Promise<void> {
    try {
      // Check if there are posts in content/_posts directory and remove them
      const response = await githubApi.api.get(`/repos/${githubApi.owner}/${githubApi.repo}/contents/content/_posts`);
      
      if (Array.isArray(response.data)) {
        for (const file of response.data) {
          if (file.type === 'file' && file.name.endsWith('.md')) {
            try {
              await githubApi.api.delete(`/repos/${githubApi.owner}/${githubApi.repo}/contents/content/_posts/${file.name}`, {
                data: {
                  message: `Remove duplicate post from content/_posts: ${file.name}`,
                  sha: file.sha,
                  committer: {
                    name: 'GitBlog',
                    email: 'gitblog@example.com'
                  }
                }
              });
            } catch (error) {
              console.warn(`Failed to remove duplicate post ${file.name}:`, error);
            }
          }
        }
      }

      // Also try to remove the content directory if it's empty
      try {
        await githubApi.api.delete(`/repos/${githubApi.owner}/${githubApi.repo}/contents/content/_posts`, {
          data: {
            message: 'Remove empty content/_posts directory',
            sha: '', // This might fail, but that's okay
            committer: {
              name: 'GitBlog',
              email: 'gitblog@example.com'
            }
          }
        });
      } catch (error) {
        // Ignore errors when trying to remove directory
      }
    } catch (error) {
      // If content/_posts doesn't exist, that's fine
      if (!error.response || error.response.status !== 404) {
        throw error;
      }
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
    theme: string;
    plugins: string[];
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
      const configContent = githubApi.generateJekyllConfig(jekyllConfig);

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

  async syncHomepage(content: string): Promise<SyncResult> {
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

      // Get existing homepage
      const existingHomepage = await githubApi.getIndexPage();
      
      // Update homepage
      await githubApi.updateIndexPage(content, existingHomepage.sha || undefined);

      return {
        success: true,
        message: 'Homepage updated successfully',
        synced: 1,
        errors: []
      };

    } catch (error) {
      return {
        success: false,
        message: 'Failed to update homepage',
        synced: 0,
        errors: [error instanceof Error ? error.message : 'Unknown error']
      };
    }
  }

  async syncReadme(): Promise<SyncResult> {
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

      // Get existing README
      const existingReadme = await githubApi.getReadme();
      
      // Update README with automatic content
      await githubApi.updateReadme(existingReadme.sha || undefined);

      return {
        success: true,
        message: 'README updated successfully',
        synced: 1,
        errors: []
      };

    } catch (error) {
      return {
        success: false,
        message: 'Failed to update README',
        synced: 0,
        errors: [error instanceof Error ? error.message : 'Unknown error']
      };
    }
  }
}

export const syncService = new SyncService();