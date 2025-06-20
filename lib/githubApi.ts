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

interface JekyllConfig {
  title: string;
  description: string;
  url: string;
  baseurl: string;
  author: {
    name: string;
    email: string;
    github: string;
    twitter: string;
  };
  theme: string;
  permalink: string;
  paginate: number;
  paginate_path: string;
  plugins: string[];
  exclude: string[];
  feed: {
    path: string;
  };
  seo: {
    type: string;
    twitter: {
      username: string;
      card: string;
    };
  };
  social_links: Array<{
    name: string;
    url: string;
  }>;
  markdown: string;
  kramdown: {
    input: string;
    hard_wrap: boolean;
  };
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
      // Try to get posts from _posts directory (standard Jekyll structure)
      let response;
      try {
        response = await this.api.get(`/repos/${this.owner}/${this.repo}/contents/_posts`);
      } catch (error) {
        // If _posts doesn't exist, try to create the directory structure
        throw new Error('Posts directory not found. Please create "_posts" directory in your repository.');
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
          throw new Error('Posts directory not found. Please create "_posts" directory in your repository.');
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
      const response = await this.api.get(`/repos/${this.owner}/${this.repo}/contents/_posts/${filename}`);
      
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
      
      await this.api.put(`/repos/${this.owner}/${this.repo}/contents/_posts/${filename}`, {
        message: `Create post: ${filename}`,
        content: encodedContent,
        committer: {
          name: 'GitBlog',
          email: 'gitblog@example.com'
        }
      });
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
      
      await this.api.put(`/repos/${this.owner}/${this.repo}/contents/_posts/${filename}`, {
        message: `Update post: ${filename}`,
        content: encodedContent,
        sha: sha,
        committer: {
          name: 'GitBlog',
          email: 'gitblog@example.com'
        }
      });
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
    } catch (error) {
      throw new Error('Failed to delete post');
    }
  }

  async getJekyllConfig(): Promise<GitHubFile> {
    try {
      const response = await this.api.get(`/repos/${this.owner}/${this.repo}/contents/_config.yml`);
      
      return {
        name: response.data.name,
        content: decode(response.data.content),
        sha: response.data.sha,
        path: response.data.path,
      };
    } catch (error) {
      if (axios.isAxiosError(error) && error.response?.status === 404) {
        // If _config.yml doesn't exist, return a default configuration
        return {
          name: '_config.yml',
          content: this.getDefaultJekyllConfig(),
          sha: '',
          path: '_config.yml',
        };
      }
      throw new Error('Failed to fetch Jekyll configuration');
    }
  }

  async updateJekyllConfig(content: string, sha?: string): Promise<void> {
    try {
      const encodedContent = encode(content);
      
      const payload: any = {
        message: 'Update Jekyll configuration',
        content: encodedContent,
        committer: {
          name: 'GitBlog',
          email: 'gitblog@example.com'
        }
      };

      if (sha) {
        payload.sha = sha;
      }
      
      await this.api.put(`/repos/${this.owner}/${this.repo}/contents/_config.yml`, payload);
    } catch (error) {
      throw new Error('Failed to update Jekyll configuration');
    }
  }

  private getDefaultJekyllConfig(): string {
    return `# ----------------------------------------
# Información básica del sitio
# ----------------------------------------
title: "Mi Blog"
description: "Un blog sobre desarrollo web, software y tecnología"
url: "https://${this.owner}.github.io"
baseurl: ""

# ----------------------------------------
# Datos del autor
# ----------------------------------------
author:
  name: "${this.owner}"
  email: "tu@email.com"
  github: "https://github.com/${this.owner}"
  twitter: "@${this.owner}"

# ----------------------------------------
# Tema y apariencia
# ----------------------------------------
theme: minima
permalink: /:categories/:title/
paginate: 5
paginate_path: "/page:num"

# ----------------------------------------
# Plugins
# ----------------------------------------
plugins:
  - jekyll-feed
  - jekyll-seo-tag
  - jekyll-sitemap
  - jekyll-paginate
  - jekyll-archives
  - jekyll-relative-links
  - jekyll-include-cache

# ----------------------------------------
# Excluir del build
# ----------------------------------------
exclude:
  - Gemfile
  - Gemfile.lock
  - node_modules
  - vendor
  - README.md

# ----------------------------------------
# Configuración del feed
# ----------------------------------------
feed:
  path: rss.xml

# ----------------------------------------
# SEO tags
# ----------------------------------------
seo:
  type: Blog
  twitter:
    username: "@${this.owner}"
    card: "summary_large_image"

# ----------------------------------------
# Datos extra para _data/*.yml
# ----------------------------------------
social_links:
  - name: GitHub
    url: https://github.com/${this.owner}
  - name: Twitter
    url: https://twitter.com/${this.owner}

# ----------------------------------------
# Markdown
# ----------------------------------------
markdown: kramdown
kramdown:
  input: GFM
  hard_wrap: false
`;
  }

  parseJekyllConfig(content: string): Partial<JekyllConfig> {
    const config: any = {};
    const lines = content.split('\n');
    
    for (const line of lines) {
      const trimmed = line.trim();
      if (trimmed.startsWith('#') || trimmed === '') continue;
      
      const colonIndex = trimmed.indexOf(':');
      if (colonIndex === -1) continue;
      
      const key = trimmed.substring(0, colonIndex).trim();
      const value = trimmed.substring(colonIndex + 1).trim().replace(/^["']|["']$/g, '');
      
      if (key === 'title') config.title = value;
      if (key === 'description') config.description = value;
      if (key === 'url') config.url = value;
      if (key === 'baseurl') config.baseurl = value;
    }
    
    return config;
  }

  generateJekyllConfig(config: Partial<JekyllConfig>): string {
    return `# ----------------------------------------
# Información básica del sitio
# ----------------------------------------
title: "${config.title || 'Mi Blog'}"
description: "${config.description || 'Un blog sobre desarrollo web, software y tecnología'}"
url: "${config.url || `https://${this.owner}.github.io`}"
baseurl: "${config.baseurl || ''}"

# ----------------------------------------
# Datos del autor
# ----------------------------------------
author:
  name: "${config.author?.name || this.owner}"
  email: "${config.author?.email || 'tu@email.com'}"
  github: "${config.author?.github || `https://github.com/${this.owner}`}"
  twitter: "${config.author?.twitter || `@${this.owner}`}"

# ----------------------------------------
# Tema y apariencia
# ----------------------------------------
theme: ${config.theme || 'minima'}
permalink: ${config.permalink || '/:categories/:title/'}
paginate: ${config.paginate || 5}
paginate_path: "${config.paginate_path || '/page:num'}"

# ----------------------------------------
# Plugins
# ----------------------------------------
plugins:
  - jekyll-feed
  - jekyll-seo-tag
  - jekyll-sitemap
  - jekyll-paginate
  - jekyll-archives
  - jekyll-relative-links
  - jekyll-include-cache

# ----------------------------------------
# Excluir del build
# ----------------------------------------
exclude:
  - Gemfile
  - Gemfile.lock
  - node_modules
  - vendor
  - README.md

# ----------------------------------------
# Configuración del feed
# ----------------------------------------
feed:
  path: ${config.feed?.path || 'rss.xml'}

# ----------------------------------------
# SEO tags
# ----------------------------------------
seo:
  type: ${config.seo?.type || 'Blog'}
  twitter:
    username: "${config.seo?.twitter?.username || `@${this.owner}`}"
    card: "${config.seo?.twitter?.card || 'summary_large_image'}"

# ----------------------------------------
# Datos extra para _data/*.yml
# ----------------------------------------
social_links:
  - name: GitHub
    url: ${config.author?.github || `https://github.com/${this.owner}`}
  - name: Twitter
    url: ${config.author?.twitter?.replace('@', 'https://twitter.com/') || `https://twitter.com/${this.owner}`}

# ----------------------------------------
# Markdown
# ----------------------------------------
markdown: ${config.markdown || 'kramdown'}
kramdown:
  input: ${config.kramdown?.input || 'GFM'}
  hard_wrap: ${config.kramdown?.hard_wrap || false}
`;
  }
}

export const githubApi = new GitHubApiService();