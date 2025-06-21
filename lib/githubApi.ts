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
  public api: AxiosInstance;
  public owner: string = '';
  public repo: string = '';
  private token: string = '';
  private requestQueue: Promise<any> = Promise.resolve();
  private lastRequestTime = 0;
  private readonly MIN_REQUEST_INTERVAL = 200; // 200ms between requests

  constructor() {
    this.api = axios.create({
      baseURL: 'https://api.github.com',
      timeout: 30000,
    });

    // Enhanced request interceptor with better rate limiting
    this.api.interceptors.request.use(async (config) => {
      const now = Date.now();
      const timeSinceLastRequest = now - this.lastRequestTime;
      
      if (timeSinceLastRequest < this.MIN_REQUEST_INTERVAL) {
        const delay = this.MIN_REQUEST_INTERVAL - timeSinceLastRequest;
        await new Promise(resolve => setTimeout(resolve, delay));
      }
      
      this.lastRequestTime = Date.now();
      return config;
    });
  }

  setApiConfig(config: GitHubConfig) {
    const { owner, repo } = this.parseRepoUrl(config.repoUrl);
    this.owner = owner;
    this.repo = repo;
    this.token = config.token;

    this.api.defaults.headers.common['Authorization'] = `token ${config.token}`;
    this.api.defaults.headers.common['Accept'] = 'application/vnd.github.v3+json';
    this.api.defaults.headers.common['User-Agent'] = 'GitBlog-App/1.0.0';
  }

  private parseRepoUrl(url: string): { owner: string; repo: string } {
    const match = url.match(/github\.com\/([^\/]+)\/([^\/]+)/);
    if (!match) {
      throw new Error('Invalid GitHub repository URL');
    }
    return { owner: match[1], repo: match[2].replace('.git', '') };
  }

  // Improved queue system with better error handling
  private queueRequest<T>(requestFn: () => Promise<T>): Promise<T> {
    this.requestQueue = this.requestQueue
      .then(
        async () => {
          try {
            return await requestFn();
          } catch (error) {
            // Log error but don't break the queue
            console.warn('Queued request failed:', error);
            throw error;
          }
        },
        async () => {
          // Even if previous request failed, execute this one
          return await requestFn();
        }
      );
    return this.requestQueue;
  }

  async testConnection(): Promise<void> {
    if (!this.owner || !this.repo || !this.token) {
      throw new Error('GitHub configuration not set');
    }

    return this.queueRequest(async () => {
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
    });
  }

  async getPosts(): Promise<GitHubFile[]> {
    if (!this.owner || !this.repo || !this.token) {
      throw new Error('GitHub configuration not set. Please configure your repository in Settings.');
    }

    return this.queueRequest(async () => {
      try {
        const response = await this.api.get(`/repos/${this.owner}/${this.repo}/contents/_posts`);
        
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
    });
  }

  async getPost(filename: string): Promise<GitHubFile> {
    return this.queueRequest(async () => {
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
    });
  }

  async createPost(filename: string, content: string): Promise<void> {
    return this.queueRequest(async () => {
      try {
        const cleanContent = this.sanitizeContent(content);
        const encodedContent = encode(cleanContent);
        
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
    });
  }

  async updatePost(filename: string, content: string, sha: string): Promise<void> {
    return this.queueRequest(async () => {
      try {
        const cleanContent = this.sanitizeContent(content);
        const encodedContent = encode(cleanContent);
        
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
    });
  }

  async deletePost(filename: string, sha: string): Promise<void> {
    return this.queueRequest(async () => {
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
    });
  }

  async enableGitHubPages(): Promise<{ url: string; status: string }> {
    return this.queueRequest(async () => {
      try {
        // First, try to get current Pages configuration
        let currentConfig;
        try {
          const response = await this.api.get(`/repos/${this.owner}/${this.repo}/pages`);
          currentConfig = response.data;
        } catch (error) {
          // Pages not configured yet
          currentConfig = null;
        }

        // If Pages is not enabled, configure it
        if (!currentConfig) {
          // Enable GitHub Pages with source from main/master branch
          try {
            await this.api.post(`/repos/${this.owner}/${this.repo}/pages`, {
              source: {
                branch: 'main',
                path: '/'
              }
            });
          } catch (error) {
            // Try with 'master' branch if 'main' doesn't exist
            if (axios.isAxiosError(error) && error.response?.status === 422) {
              await this.api.post(`/repos/${this.owner}/${this.repo}/pages`, {
                source: {
                  branch: 'master',
                  path: '/'
                }
              });
            } else {
              throw error;
            }
          }
        }

        // Get the Pages configuration
        const pagesResponse = await this.api.get(`/repos/${this.owner}/${this.repo}/pages`);
        
        return {
          url: pagesResponse.data.html_url,
          status: pagesResponse.data.status
        };
      } catch (error) {
        if (axios.isAxiosError(error)) {
          if (error.response?.status === 404) {
            throw new Error('Repository not found or Pages not available for this repository');
          }
        }
        throw new Error('Failed to enable GitHub Pages');
      }
    });
  }

  // CRITICAL: Only trigger build if absolutely necessary
  async triggerPagesBuildIfNeeded(): Promise<boolean> {
    return this.queueRequest(async () => {
      try {
        // Check if there's already a recent build in progress
        const buildsResponse = await this.api.get(`/repos/${this.owner}/${this.repo}/pages/builds`);
        const builds = buildsResponse.data;
        
        if (builds && builds.length > 0) {
          const latestBuild = builds[0];
          const buildTime = new Date(latestBuild.created_at).getTime();
          const now = Date.now();
          const timeDiff = now - buildTime;
          
          // If there's a build from the last 2 minutes, don't trigger another
          if (timeDiff < 120000 && (latestBuild.status === 'building' || latestBuild.status === 'built')) {
            console.log('Recent build found, skipping trigger');
            return false;
          }
        }
        
        // Only trigger if no recent build
        await this.api.post(`/repos/${this.owner}/${this.repo}/pages/builds`);
        return true;
      } catch (error) {
        if (axios.isAxiosError(error)) {
          if (error.response?.status === 404) {
            throw new Error('GitHub Pages not enabled for this repository');
          }
        }
        throw new Error('Failed to trigger Pages build');
      }
    });
  }

  async getPagesBuildStatus(): Promise<{ status: string; url?: string }> {
    return this.queueRequest(async () => {
      try {
        const response = await this.api.get(`/repos/${this.owner}/${this.repo}/pages/builds/latest`);
        return {
          status: response.data.status,
          url: response.data.url
        };
      } catch (error) {
        throw new Error('Failed to get Pages build status');
      }
    });
  }

  async getIndexPage(): Promise<GitHubFile> {
    return this.queueRequest(async () => {
      try {
        const response = await this.api.get(`/repos/${this.owner}/${this.repo}/contents/index.md`);
        
        return {
          name: response.data.name,
          content: decode(response.data.content),
          sha: response.data.sha,
          path: response.data.path,
        };
      } catch (error) {
        if (axios.isAxiosError(error) && error.response?.status === 404) {
          // If index.md doesn't exist, return a default homepage
          return {
            name: 'index.md',
            content: this.getDefaultIndexPage(),
            sha: '',
            path: 'index.md',
          };
        }
        throw new Error('Failed to fetch homepage');
      }
    });
  }

  async updateIndexPage(content: string, sha?: string): Promise<void> {
    return this.queueRequest(async () => {
      try {
        const cleanContent = this.sanitizeContent(content);
        const encodedContent = encode(cleanContent);
        
        const payload: any = {
          message: 'Update homepage (index.md)',
          content: encodedContent,
          committer: {
            name: 'GitBlog',
            email: 'gitblog@example.com'
          }
        };

        if (sha) {
          payload.sha = sha;
        }
        
        await this.api.put(`/repos/${this.owner}/${this.repo}/contents/index.md`, payload);
      } catch (error) {
        throw new Error('Failed to update homepage');
      }
    });
  }

  async getReadme(): Promise<GitHubFile> {
    return this.queueRequest(async () => {
      try {
        const response = await this.api.get(`/repos/${this.owner}/${this.repo}/contents/README.md`);
        
        return {
          name: response.data.name,
          content: decode(response.data.content),
          sha: response.data.sha,
          path: response.data.path,
        };
      } catch (error) {
        if (axios.isAxiosError(error) && error.response?.status === 404) {
          // If README.md doesn't exist, return a default README
          return {
            name: 'README.md',
            content: this.getDefaultReadme(),
            sha: '',
            path: 'README.md',
          };
        }
        throw new Error('Failed to fetch README');
      }
    });
  }

  async updateReadme(sha?: string): Promise<void> {
    return this.queueRequest(async () => {
      try {
        const readmeContent = this.getDefaultReadme();
        const cleanContent = this.sanitizeContent(readmeContent);
        const encodedContent = encode(cleanContent);
        
        const payload: any = {
          message: 'Update README.md (Generated by GitBlog)',
          content: encodedContent,
          committer: {
            name: 'GitBlog',
            email: 'gitblog@example.com'
          }
        };

        if (sha) {
          payload.sha = sha;
        }
        
        await this.api.put(`/repos/${this.owner}/${this.repo}/contents/README.md`, payload);
      } catch (error) {
        throw new Error('Failed to update README');
      }
    });
  }

  private sanitizeContent(content: string): string {
    if (!content) return '';
    
    // Remove BOM (Byte Order Mark) characters
    content = content.replace(/^\uFEFF/, '');
    
    // Normalize line endings to Unix style
    content = content.replace(/\r\n/g, '\n').replace(/\r/g, '\n');
    
    // Remove null characters and other problematic control characters
    content = content.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '');
    
    // Remove any non-printable Unicode characters that might cause issues
    content = content.replace(/[\uFFF0-\uFFFF]/g, '');
    
    // Convert problematic characters to ASCII equivalents
    content = content
      .replace(/[""]/g, '"')
      .replace(/['']/g, "'")
      .replace(/[–—]/g, '-')
      .replace(/[…]/g, '...')
      .replace(/[áàâäã]/gi, 'a')
      .replace(/[éèêë]/gi, 'e')
      .replace(/[íìîï]/gi, 'i')
      .replace(/[óòôöõ]/gi, 'o')
      .replace(/[úùûü]/gi, 'u')
      .replace(/[ñ]/gi, 'n')
      .replace(/[ç]/gi, 'c');
    
    // Remove any remaining non-ASCII characters except basic punctuation
    content = content.replace(/[^\x20-\x7E\n\r\t]/g, '');
    
    // Ensure proper UTF-8 encoding by testing encode/decode
    try {
      const testEncoded = encode(content);
      const testDecoded = decode(testEncoded);
      if (testDecoded !== content) {
        // If there's a mismatch, clean more aggressively
        content = content.replace(/[^\x20-\x7E\n\r\t]/g, '');
      }
    } catch (error) {
      // If encoding fails, remove all non-ASCII characters
      content = content.replace(/[^\x20-\x7E\n\r\t]/g, '');
    }
    
    // Ensure the content ends with a newline
    if (!content.endsWith('\n')) {
      content += '\n';
    }
    
    return content;
  }

  private getDefaultIndexPage(): string {
    return `---
layout: home
title: "Inicio"
---

# Bienvenido a mi blog

Este es mi blog personal donde comparto mis pensamientos, experiencias y conocimientos sobre desarrollo web, tecnologia y otros temas que me interesan.

## Ultimas publicaciones

Los posts aparecen automaticamente aqui gracias al layout 'home' de Jekyll.

## Sobre mi

Soy un desarrollador apasionado por la tecnologia y el aprendizaje continuo. Me gusta compartir lo que aprendo y conectar con otros desarrolladores.

---

*Gracias por visitar mi blog!*
`;
  }

  private getDefaultReadme(): string {
    const currentDate = new Date().toLocaleDateString('es-ES');
    
    return `# Mi Blog Personal

Bienvenido a mi blog personal! Este sitio web ha sido creado y gestionado utilizando **GitBlog**, una herramienta moderna y elegante para la creacion de blogs.

## Acerca de este blog

Este blog esta construido con:
- **Jekyll** - Generador de sitios estaticos
- **GitHub Pages** - Hosting gratuito y confiable
- **GitBlog** - Editor de blog movil y web

## Creado con GitBlog

Este blog ha sido desarrollado utilizando [**GitBlog**](https://bolt.new), una herramienta innovadora creada por **Sergio Lopez** que permite:

**Caracteristicas principales:**
- Editor movil y web intuitivo
- Sincronizacion automatica con GitHub
- Multiples temas de Jekyll
- Editor Markdown con vista previa
- Sistema de etiquetas
- Publicacion automatica en GitHub Pages
- Configuracion Jekyll integrada

### Por que GitBlog?

GitBlog simplifica el proceso de creacion y mantenimiento de blogs tecnicos, permitiendo a los desarrolladores enfocarse en escribir contenido de calidad sin preocuparse por la configuracion tecnica.

## Enlaces utiles

- **Sitio web:** [Ver blog en vivo](https://${this.owner}.github.io)
- **Repositorio:** [GitHub](https://github.com/${this.owner}/${this.repo})
- **Herramienta:** [GitBlog en Bolt.new](https://bolt.new)

## Informacion tecnica

- **Generado:** ${currentDate}
- **Herramienta:** GitBlog v1.0.0
- **Creador de GitBlog:** Sergio Lopez
- **Plataforma:** Bolt.new
- **Hosting:** GitHub Pages
- **Framework:** Jekyll

---

> *"La mejor manera de aprender es ensenando y compartiendo conocimiento."*

**Gracias por visitar mi blog!**

---

**Creado con GitBlog por Sergio Lopez**

[Crea tu blog con GitBlog](https://bolt.new)
`;
  }

  async getJekyllConfig(): Promise<GitHubFile> {
    return this.queueRequest(async () => {
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
    });
  }

  async updateJekyllConfig(content: string, sha?: string): Promise<void> {
    return this.queueRequest(async () => {
      try {
        const cleanContent = this.sanitizeContent(content);
        const encodedContent = encode(cleanContent);
        
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
    });
  }

  private getDefaultJekyllConfig(): string {
    return `# ========================================
# CONFIGURACION BASICA DEL SITIO
# ========================================
title: "Mi Blog"
description: "Un blog sobre desarrollo web, software y tecnologia"
url: "https://${this.owner}.github.io"
baseurl: ""

# ========================================
# INFORMACION DEL AUTOR
# ========================================
author:
  name: "${this.owner}"
  email: "tu@email.com"
  github: "https://github.com/${this.owner}"
  twitter: "@${this.owner}"

# ========================================
# CONFIGURACION DE JEKYLL
# ========================================
theme: minima
permalink: /:categories/:year/:month/:day/:title/

# ========================================
# CONFIGURACION CRITICA PARA MOSTRAR POSTS
# ========================================
# IMPORTANTE: Esta configuracion es ESENCIAL para que los posts aparezcan
show_excerpts: true
paginate: 10
paginate_path: "/page:num/"

# ========================================
# PLUGINS ESENCIALES PARA POSTS
# ========================================
plugins:
  - jekyll-feed
  - jekyll-seo-tag
  - jekyll-sitemap
  - jekyll-paginate

# ========================================
# CONFIGURACION DE MARKDOWN
# ========================================
markdown: kramdown
kramdown:
  input: GFM
  hard_wrap: false
  syntax_highlighter: rouge

# ========================================
# CONFIGURACION DE COLECCIONES Y POSTS
# ========================================
collections:
  posts:
    output: true
    permalink: /:categories/:year/:month/:day/:title/

# ========================================
# DEFAULTS PARA POSTS (CRITICO)
# ========================================
defaults:
  - scope:
      path: ""
      type: "posts"
    values:
      layout: "post"
      author: "${this.owner}"
      comments: true
      published: true
  - scope:
      path: ""
    values:
      layout: "default"

# ========================================
# CONFIGURACION ESPECIFICA DE MINIMA
# ========================================
minima:
  # CRITICO: Configuracion para mostrar posts en home
  show_excerpts: true
  
  # Enlaces sociales
  social_links:
    github: ${this.owner}
    twitter: ${this.owner}
  
  # Configuracion de header
  header_pages:
    - about.md

# ========================================
# CONFIGURACION DE FECHA Y IDIOMA
# ========================================
date_format: "%B %d, %Y"
timezone: Europe/Madrid
lang: es-ES

# ========================================
# ARCHIVOS A EXCLUIR
# ========================================
exclude:
  - Gemfile
  - Gemfile.lock
  - node_modules
  - vendor/bundle/
  - vendor/cache/
  - vendor/gems/
  - vendor/ruby/
  - README.md
  - .sass-cache/
  - .jekyll-cache/
  - gemfiles/

# ========================================
# CONFIGURACION DE FEEDS Y SEO
# ========================================
feed:
  path: feed.xml

# SEO y metadatos
seo:
  type: Blog
  twitter:
    username: "@${this.owner}"
    card: "summary_large_image"

# ========================================
# ENLACES SOCIALES
# ========================================
social_links:
  - name: GitHub
    url: https://github.com/${this.owner}
  - name: Twitter
    url: https://twitter.com/${this.owner}

# ========================================
# CONFIGURACION ADICIONAL PARA POSTS
# ========================================
# Habilitar resaltado de sintaxis
highlighter: rouge

# Configuracion de posts
future: false
unpublished: false

# IMPORTANTE: Asegurar que los posts se procesen correctamente
keep_files: [".git", ".svn"]
encoding: "utf-8"

# Configuracion de build
safe: true
incremental: false
profile: false
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
      if (key === 'theme') config.theme = value;
    }
    
    return config;
  }

  generateJekyllConfig(config: {
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
  }): string {
    // Sanitize all input values to avoid YAML issues and ensure ASCII-only content
    const sanitize = (str: string) => {
      if (!str) return '';
      return str
        .replace(/[^\w\s\-\.@/:]/g, '')
        .replace(/[áéíóúñü]/g, (match) => {
          const replacements: { [key: string]: string } = {
            'á': 'a', 'é': 'e', 'í': 'i', 'ó': 'o', 'ú': 'u', 'ñ': 'n', 'ü': 'u'
          };
          return replacements[match] || match;
        })
        .trim();
    };

    const title = sanitize(config.title) || 'Mi Blog';
    const description = sanitize(config.description) || 'Un blog sobre desarrollo web, software y tecnologia';
    const url = sanitize(config.url) || `https://${this.owner}.github.io`;
    const baseurl = sanitize(config.baseurl) || '';
    const authorName = sanitize(config.authorName) || this.owner;
    const authorEmail = sanitize(config.authorEmail) || 'tu@email.com';
    const authorGithub = sanitize(config.authorGithub) || `https://github.com/${this.owner}`;
    const authorTwitter = sanitize(config.authorTwitter) || `@${this.owner}`;
    const theme = sanitize(config.theme) || 'minima';
    
    // Ensure plugins array is valid and contains only safe plugin names
    const validPlugins = config.plugins
      .filter(plugin => plugin && typeof plugin === 'string')
      .map(plugin => sanitize(plugin))
      .filter(plugin => plugin.length > 0);
    
    // Always include essential plugins for posts display
    const essentialPlugins = ['jekyll-feed', 'jekyll-seo-tag', 'jekyll-sitemap', 'jekyll-paginate'];
    const allPlugins = [...new Set([...essentialPlugins, ...validPlugins])];
    
    const pluginsYaml = allPlugins.map(plugin => `  - ${plugin}`).join('\n');
    
    return `# ========================================
# CONFIGURACION BASICA DEL SITIO
# ========================================
title: "${title}"
description: "${description}"
url: "${url}"
baseurl: "${baseurl}"

# ========================================
# INFORMACION DEL AUTOR
# ========================================
author:
  name: "${authorName}"
  email: "${authorEmail}"
  github: "${authorGithub}"
  twitter: "${authorTwitter}"

# ========================================
# CONFIGURACION DE JEKYLL
# ========================================
theme: ${theme}
permalink: /:categories/:year/:month/:day/:title/

# ========================================
# CONFIGURACION CRITICA PARA MOSTRAR POSTS
# ========================================
# IMPORTANTE: Esta configuracion es ESENCIAL para que los posts aparezcan
show_excerpts: true
paginate: 10
paginate_path: "/page:num/"

# ========================================
# PLUGINS ESENCIALES PARA POSTS
# ========================================
plugins:
${pluginsYaml}

# ========================================
# CONFIGURACION DE MARKDOWN
# ========================================
markdown: kramdown
kramdown:
  input: GFM
  hard_wrap: false
  syntax_highlighter: rouge

# ========================================
# CONFIGURACION DE COLECCIONES Y POSTS
# ========================================
collections:
  posts:
    output: true
    permalink: /:categories/:year/:month/:day/:title/

# ========================================
# DEFAULTS PARA POSTS (CRITICO)
# ========================================
defaults:
  - scope:
      path: ""
      type: "posts"
    values:
      layout: "post"
      author: "${authorName}"
      comments: true
      published: true
  - scope:
      path: ""
    values:
      layout: "default"

# ========================================
# CONFIGURACION ESPECIFICA DE MINIMA
# ========================================
minima:
  # CRITICO: Configuracion para mostrar posts en home
  show_excerpts: true
  
  # Enlaces sociales
  social_links:
    github: ${this.owner}
    twitter: ${this.owner}
  
  # Configuracion de header
  header_pages:
    - about.md

# ========================================
# CONFIGURACION DE FECHA Y IDIOMA
# ========================================
date_format: "%B %d, %Y"
timezone: Europe/Madrid
lang: es-ES

# ========================================
# ARCHIVOS A EXCLUIR
# ========================================
exclude:
  - Gemfile
  - Gemfile.lock
  - node_modules
  - vendor/bundle/
  - vendor/cache/
  - vendor/gems/
  - vendor/ruby/
  - README.md
  - .sass-cache/
  - .jekyll-cache/
  - gemfiles/

# ========================================
# CONFIGURACION DE FEEDS Y SEO
# ========================================
feed:
  path: feed.xml

# SEO y metadatos
seo:
  type: Blog
  twitter:
    username: "${authorTwitter}"
    card: "summary_large_image"

# ========================================
# ENLACES SOCIALES
# ========================================
social_links:
  - name: GitHub
    url: ${authorGithub}
  - name: Twitter
    url: ${authorTwitter.replace('@', 'https://twitter.com/')}

# ========================================
# CONFIGURACION ADICIONAL PARA POSTS
# ========================================
# Habilitar resaltado de sintaxis
highlighter: rouge

# Configuracion de posts
future: false
unpublished: false

# IMPORTANTE: Asegurar que los posts se procesen correctamente
keep_files: [".git", ".svn"]
encoding: "utf-8"

# Configuracion de build
safe: true
incremental: false
profile: false
`;
  }
}

export const githubApi = new GitHubApiService();