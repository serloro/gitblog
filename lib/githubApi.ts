import axios, { AxiosInstance } from 'axios';
import { encode, decode } from 'base-64';

interface GitHubConfig {
  repoUrl: string;
  token: string;
}

interface GitHubFile {
  name: string;
  content: string;
  sha: string;
  path: string;
}

class GitHubApiService {
  private api: AxiosInstance;
  private owner: string = '';
  private repo: string = '';
  private token: string = '';

  constructor() {
    this.api = axios.create({
      baseURL: 'https://api.github.com',
      timeout: 10000,
    });
  }

  setApiConfig(config: GitHubConfig) {
    const { owner, repo } = this.parseRepoUrl(config.repoUrl);
    this.owner = owner;
    this.repo = repo;
    this.token = config.token;

    this.api.defaults.headers.common['Authorization'] = `token ${config.token}`;
    this.api.defaults.headers.common['Accept'] = 'application/vnd.github.v3+json';
  }

  private parseRepoUrl(url: string): { owner: string; repo: string } {
    const match = url.match(/github\.com\/([^\/]+)\/([^\/]+)/);
    if (!match) {
      throw new Error('Invalid GitHub repository URL');
    }
    return { owner: match[1], repo: match[2].replace('.git', '') };
  }

  async testConnection(): Promise<void> {
    if (!this.owner || !this.repo || !this.token) {
      throw new Error('GitHub configuration not set');
    }

    try {
      await this.api.get(`/repos/${this.owner}/${this.repo}`);
    } catch (error) {
      if (axios.isAxiosError(error)) {
        if (error.response?.status === 401) {
          throw new Error('Invalid GitHub token');
        } else if (error.response?.status === 404) {
          throw new Error('Repository not found');
        }
      }
      throw new Error('Failed to connect to GitHub');
    }
  }

  async getPosts(): Promise<GitHubFile[]> {
    if (!this.owner || !this.repo || !this.token) {
      throw new Error('GitHub configuration not set. Please configure your repository in Settings.');
    }

    try {
      // First try the standard Jekyll posts directory
      let response;
      try {
        response = await this.api.get(`/repos/${this.owner}/${this.repo}/contents/content/_posts`);
      } catch (error) {
        // If content/_posts doesn't exist, try _posts
        try {
          response = await this.api.get(`/repos/${this.owner}/${this.repo}/contents/_posts`);
        } catch (secondError) {
          // If neither exists, try to create the directory structure
          throw new Error('Posts directory not found. Please create either "content/_posts" or "_posts" directory in your repository.');
        }
      }
      
      if (!Array.isArray(response.data)) {
        throw new Error('Invalid response from GitHub API');
      }

      const markdownFiles = response.data.filter(
        (file: any) => file.type === 'file' && file.name.endsWith('.md')
      );

      return markdownFiles.map((file: any) => ({
        name: file.name,
        content: file.content ? decode(file.content) : '',
        sha: file.sha,
        path: file.path,
      }));
    } catch (error) {
      if (axios.isAxiosError(error)) {
        if (error.response?.status === 401) {
          throw new Error('Invalid GitHub token. Please check your settings.');
        } else if (error.response?.status === 403) {
          throw new Error('Access denied. Please check your token permissions.');
        } else if (error.response?.status === 404) {
          throw new Error('Posts directory not found. Please create either "content/_posts" or "_posts" directory in your repository.');
        }
      }
      
      if (error instanceof Error) {
        throw error;
      }
      
      throw new Error('Failed to fetch posts from GitHub');
    }
  }

  async getPost(filename: string): Promise<GitHubFile> {
    try {
      // Try content/_posts first, then _posts
      let response;
      try {
        response = await this.api.get(`/repos/${this.owner}/${this.repo}/contents/content/_posts/${filename}`);
      } catch (error) {
        response = await this.api.get(`/repos/${this.owner}/${this.repo}/contents/_posts/${filename}`);
      }
      
      return {
        name: response.data.name,
        content: decode(response.data.content),
        sha: response.data.sha,
        path: response.data.path,
      };
    } catch (error) {
      if (axios.isAxiosError(error)) {
        if (error.response?.status === 404) {
          throw new Error('Post not found');
        }
      }
      throw new Error('Failed to fetch post from GitHub');
    }
  }

  async createPost(filename: string, content: string): Promise<void> {
    try {
      const encodedContent = encode(content);
      
      // Try to create in content/_posts first
      try {
        await this.api.put(`/repos/${this.owner}/${this.repo}/contents/content/_posts/${filename}`, {
          message: `Create post: ${filename}`,
          content: encodedContent,
          committer: {
            name: 'GitBlog',
            email: 'gitblog@example.com'
          }
        });
      } catch (error) {
        // If content/_posts doesn't exist, try _posts
        await this.api.put(`/repos/${this.owner}/${this.repo}/contents/_posts/${filename}`, {
          message: `Create post: ${filename}`,
          content: encodedContent,
          committer: {
            name: 'GitBlog',
            email: 'gitblog@example.com'
          }
        });
      }
    } catch (error) {
      if (axios.isAxiosError(error)) {
        if (error.response?.status === 422) {
          throw new Error('A post with this filename already exists');
        }
      }
      throw new Error('Failed to create post');
    }
  }

  async updatePost(filename: string, content: string, sha: string): Promise<void> {
    try {
      const encodedContent = encode(content);
      
      // Try content/_posts first, then _posts
      try {
        await this.api.put(`/repos/${this.owner}/${this.repo}/contents/content/_posts/${filename}`, {
          message: `Update post: ${filename}`,
          content: encodedContent,
          sha: sha,
          committer: {
            name: 'GitBlog',
            email: 'gitblog@example.com'
          }
        });
      } catch (error) {
        await this.api.put(`/repos/${this.owner}/${this.repo}/contents/_posts/${filename}`, {
          message: `Update post: ${filename}`,
          content: encodedContent,
          sha: sha,
          committer: {
            name: 'GitBlog',
            email: 'gitblog@example.com'
          }
        });
      }
    } catch (error) {
      if (axios.isAxiosError(error)) {
        if (error.response?.status === 409) {
          throw new Error('Post has been modified by someone else. Please refresh and try again.');
        }
      }
      throw new Error('Failed to update post');
    }
  }

  async deletePost(filename: string, sha: string): Promise<void> {
    try {
      // Try content/_posts first, then _posts
      try {
        await this.api.delete(`/repos/${this.owner}/${this.repo}/contents/content/_posts/${filename}`, {
          data: {
            message: `Delete post: ${filename}`,
            sha: sha,
            committer: {
              name: 'GitBlog',
              email: 'gitblog@example.com'
            }
          }
        });
      } catch (error) {
        await this.api.delete(`/repos/${this.owner}/${this.repo}/contents/_posts/${filename}`, {
          data: {
            message: `Delete post: ${filename}`,
            sha: sha,
            committer: {
              name: 'GitBlog',
              email: 'gitblog@example.com'
            }
          }
        });
      }
    } catch (error) {
      throw new Error('Failed to delete post');
    }
  }

  async getConfig(): Promise<GitHubFile> {
    try {
      const response = await this.api.get(`/repos/${this.owner}/${this.repo}/contents/_config.yml`);
      
      return {
        name: response.data.name,
        content: decode(response.data.content),
        sha: response.data.sha,
        path: response.data.path,
      };
    } catch (error) {
      throw new Error('Failed to fetch Jekyll configuration');
    }
  }

  async updateJekyllConfig(content: string, sha: string): Promise<void> {
    try {
      const encodedContent = encode(content);
      
      await this.api.put(`/repos/${this.owner}/${this.repo}/contents/_config.yml`, {
        message: 'Update Jekyll configuration',
        content: encodedContent,
        sha: sha,
        committer: {
          name: 'GitBlog',
          email: 'gitblog@example.com'
        }
      });
    } catch (error) {
      throw new Error('Failed to update Jekyll configuration');
    }
  }
}

export const githubApi = new GitHubApiService();