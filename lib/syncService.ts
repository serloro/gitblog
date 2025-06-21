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
  private lastPublishTime = 0; // Prevent rapid successive publishes
  private readonly PUBLISH_COOLDOWN = 10000; // 10 seconds cooldown (increased)

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
        errors: ['Another publication is already running. Please wait.']
      };
    }

    // Prevent rapid successive publishes
    const now = Date.now();
    if (now - this.lastPublishTime < this.PUBLISH_COOLDOWN) {
      const remainingTime = Math.ceil((this.PUBLISH_COOLDOWN - (now - this.lastPublishTime)) / 1000);
      return {
        success: false,
        message: `Please wait ${remainingTime} seconds before publishing again`,
        synced: 0,
        errors: [`Cooldown active. Wait ${remainingTime} seconds.`]
      };
    }

    this.isPublishing = true;
    this.lastPublishTime = now;

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

      // Update GitHub API config ONCE
      githubApi.setApiConfig({
        repoUrl: config.repoUrl,
        token: config.token,
      });

      // Test connection ONCE
      await githubApi.testConnection();

      const errors: string[] = [];
      let synced = 0;

      console.log('🚀 Starting publication process...');

      // Step 1: Get all required configurations in parallel
      console.log('📋 Loading configurations...');
      const [jekyllConfig, homepageConfig, localPosts] = await Promise.all([
        configService.getJekyllConfig(),
        configService.getHomepageConfig(),
        localStorageService.getPosts()
      ]);

      // Step 2: Get existing files from GitHub in parallel (only what we need)
      console.log('📥 Fetching existing files from GitHub...');
      const [existingJekyllConfig, existingHomepage, existingReadme] = await Promise.all([
        githubApi.getJekyllConfig().catch(() => ({ name: '_config.yml', content: '', sha: '', path: '_config.yml' })),
        githubApi.getIndexPage().catch(() => ({ name: 'index.md', content: '', sha: '', path: 'index.md' })),
        githubApi.getReadme().catch(() => ({ name: 'README.md', content: '', sha: '', path: 'README.md' }))
      ]);

      // Step 3: Prepare all content updates
      console.log('⚙️ Preparing content updates...');
      const jekyllConfigContent = githubApi.generateJekyllConfig({
        title: jekyllConfig.title,
        description: jekyllConfig.description,
        url: jekyllConfig.url,
        baseurl: jekyllConfig.baseurl,
        authorName: jekyllConfig.authorName,
        authorEmail: jekyllConfig.authorEmail,
        authorGithub: jekyllConfig.authorGithub,
        authorTwitter: jekyllConfig.authorTwitter,
        theme: jekyllConfig.theme,
        plugins: jekyllConfig.plugins,
      });

      // Step 4: Execute all updates in sequence to avoid conflicts
      console.log('📝 Updating Jekyll configuration...');
      try {
        // Update Jekyll config
        await githubApi.updateJekyllConfig(jekyllConfigContent, existingJekyllConfig.sha || undefined);
        synced++;
        console.log('✅ Jekyll config updated');
      } catch (error) {
        console.error('❌ Jekyll config failed:', error);
        errors.push(`Jekyll config: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }

      console.log('🏠 Updating homepage...');
      try {
        // Update homepage
        await githubApi.updateIndexPage(homepageConfig.content, existingHomepage.sha || undefined);
        synced++;
        console.log('✅ Homepage updated');
      } catch (error) {
        console.error('❌ Homepage failed:', error);
        errors.push(`Homepage: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }

      console.log('📖 Updating README...');
      try {
        // Update README (automatic content)
        await githubApi.updateReadme(existingReadme.sha || undefined);
        synced++;
        console.log('✅ README updated');
      } catch (error) {
        console.error('❌ README failed:', error);
        errors.push(`README: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }

      // Step 5: Sync posts (get existing posts info first)
      console.log('📚 Syncing posts...');
      const existingPosts = new Map();
      try {
        const githubPosts = await githubApi.getPosts();
        githubPosts.forEach(post => {
          existingPosts.set(post.name, post.sha);
        });
        console.log(`📋 Found ${githubPosts.length} existing posts`);
      } catch (error) {
        // If we can't get existing posts, we'll create them as new
        console.warn('⚠️ Could not fetch existing posts:', error);
      }

      // Update posts one by one with delay to avoid rate limiting
      for (let i = 0; i < localPosts.length; i++) {
        const post = localPosts[i];
        try {
          console.log(`📝 Processing post ${i + 1}/${localPosts.length}: ${post.filename}`);
          
          const content = createPostContent({
            title: post.title,
            date: post.date,
            tags: post.tags,
            content: post.content
          });

          const existingSha = existingPosts.get(post.filename);
          if (existingSha) {
            // Update existing post
            await githubApi.updatePost(post.filename, content, existingSha);
            console.log(`✅ Updated: ${post.filename}`);
          } else {
            // Create new post
            await githubApi.createPost(post.filename, content);
            console.log(`✅ Created: ${post.filename}`);
          }
          
          synced++;
          
          // Add small delay between posts to avoid overwhelming GitHub API
          if (i < localPosts.length - 1) {
            await new Promise(resolve => setTimeout(resolve, 300));
          }
        } catch (error) {
          console.error(`❌ Post ${post.filename} failed:`, error);
          errors.push(`Post ${post.filename}: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
      }

      // Step 6: Handle GitHub Pages (only if everything else succeeded)
      let pagesUrl = '';
      console.log('🌐 Setting up GitHub Pages...');
      try {
        const pagesResult = await githubApi.enableGitHubPages();
        pagesUrl = pagesResult.url;
        console.log(`✅ GitHub Pages enabled: ${pagesUrl}`);
        
        // Only trigger build if Pages was successfully enabled/configured
        // and if there were no major errors
        if (errors.length === 0) {
          console.log('🔄 Triggering Pages build (if needed)...');
          const buildTriggered = await githubApi.triggerPagesBuildIfNeeded();
          if (buildTriggered) {
            console.log('✅ Pages build triggered');
          } else {
            console.log('ℹ️ Pages build skipped (recent build found)');
          }
        } else {
          console.log('⚠️ Skipping build trigger due to errors');
        }
      } catch (error) {
        // Don't fail the entire process for Pages issues
        console.warn('⚠️ GitHub Pages setup warning:', error);
        errors.push(`Pages setup: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }

      // Update sync settings
      await localStorageService.saveSettings({
        syncEnabled: true,
        lastSync: new Date()
      });

      console.log(`🎉 Publication completed! Synced: ${synced}, Errors: ${errors.length}`);

      const successMessage = pagesUrl 
        ? `Published ${synced} items to GitHub. Site: ${pagesUrl}`
        : `Published ${synced} items to GitHub`;

      return {
        success: errors.length === 0,
        message: successMessage,
        synced,
        errors,
        pagesUrl
      };

    } catch (error) {
      console.error('💥 Publication failed:', error);
      return {
        success: false,
        message: 'Publish failed',
        synced: 0,
        errors: [error instanceof Error ? error.message : 'Unknown error']
      };
    } finally {
      this.isPublishing = false;
      console.log('🏁 Publication process finished');
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