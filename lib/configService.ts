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
  theme: string;
  plugins: string[];
  cssStyle: string; // New field for CSS style selection
}

interface HomepageConfig {
  content: string;
}

const STORAGE_KEY = 'gitblog_config';
const JEKYLL_CONFIG_KEY = 'gitblog_jekyll_config';
const HOMEPAGE_CONFIG_KEY = 'gitblog_homepage_config';

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
        localStorage.removeItem(HOMEPAGE_CONFIG_KEY);
      } else {
        await SecureStore.deleteItemAsync(STORAGE_KEY);
        await SecureStore.deleteItemAsync(JEKYLL_CONFIG_KEY);
        await SecureStore.deleteItemAsync(HOMEPAGE_CONFIG_KEY);
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
          description: 'Un blog sobre desarrollo web, software y tecnologia',
          url: '',
          baseurl: '',
          authorName: '',
          authorEmail: '',
          authorGithub: '',
          authorTwitter: '',
          theme: 'minima',
          plugins: ['jekyll-feed', 'jekyll-seo-tag', 'jekyll-sitemap'],
          cssStyle: 'default', // Default CSS style
        };
      }

      const config = JSON.parse(configStr);
      // Ensure cssStyle exists for backward compatibility
      if (!config.cssStyle) {
        config.cssStyle = 'default';
      }

      return config;
    } catch (error) {
      return {
        title: 'Mi Blog',
        description: 'Un blog sobre desarrollo web, software y tecnologia',
        url: '',
        baseurl: '',
        authorName: '',
        authorEmail: '',
        authorGithub: '',
        authorTwitter: '',
        theme: 'minima',
        plugins: ['jekyll-feed', 'jekyll-seo-tag', 'jekyll-sitemap'],
        cssStyle: 'default',
      };
    }
  }

  async saveHomepageConfig(config: HomepageConfig): Promise<void> {
    try {
      if (Platform.OS === 'web') {
        localStorage.setItem(HOMEPAGE_CONFIG_KEY, JSON.stringify(config));
      } else {
        await SecureStore.setItemAsync(HOMEPAGE_CONFIG_KEY, JSON.stringify(config));
      }
    } catch (error) {
      throw new Error('Failed to save homepage configuration');
    }
  }

  async getHomepageConfig(): Promise<HomepageConfig> {
    try {
      let configStr: string | null = null;
      
      if (Platform.OS === 'web') {
        configStr = localStorage.getItem(HOMEPAGE_CONFIG_KEY);
      } else {
        configStr = await SecureStore.getItemAsync(HOMEPAGE_CONFIG_KEY);
      }

      if (!configStr) {
        return {
          content: `---
layout: default
title: "Inicio"
---

# Bienvenido a mi blog

Este es mi blog personal donde comparto mis pensamientos, experiencias y conocimientos sobre desarrollo web, tecnologia y otros temas que me interesan.

## Ultimas publicaciones

<ul>
  {% for post in site.posts %}
    <li>
      <a href="{{ post.url | relative_url }}">{{ post.title }}</a> - {{ post.date | date: "%d/%m/%Y" }}
    </li>
  {% endfor %}
</ul>

## Sobre mi

Soy un desarrollador apasionado por la tecnologia y el aprendizaje continuo. Me gusta compartir lo que aprendo y conectar con otros desarrolladores.

---

*Gracias por visitar mi blog!*`
        };
      }

      return JSON.parse(configStr);
    } catch (error) {
      return {
        content: `---
layout: default
title: "Inicio"
---

# Bienvenido a mi blog

Este es mi blog personal donde comparto mis pensamientos, experiencias y conocimientos sobre desarrollo web, tecnologia y otros temas que me interesan.

## Ultimas publicaciones

<ul>
  {% for post in site.posts %}
    <li>
      <a href="{{ post.url | relative_url }}">{{ post.title }}</a> - {{ post.date | date: "%d/%m/%Y" }}
    </li>
  {% endfor %}
</ul>

## Sobre mi

Soy un desarrollador apasionado por la tecnologia y el aprendizaje continuo. Me gusta compartir lo que aprendo y conectar con otros desarrolladores.

---

*Gracias por visitar mi blog!*`
      };
    }
  }

  getAvailableThemes() {
    // Keep this for backward compatibility but not used in UI
    return [
      { value: 'minima', label: 'Minima (Por defecto)', description: 'Tema limpio y minimalista' },
    ];
  }

  getAvailableCssStyles() {
    return [
      { 
        value: 'default', 
        label: 'Estilo por Defecto', 
        description: 'Tema oscuro moderno con tipografía monospace',
        preview: '#0f0f0f background, #64ffda accents'
      },
      { 
        value: 'vintage', 
        label: 'Estilo Vintage', 
        description: 'Terminal retro con colores verdes clásicos',
        preview: 'Black background, #33ff33 text'
      },
      { 
        value: 'msdos', 
        label: 'Estilo MS-DOS', 
        description: 'Inspirado en las terminales clásicas de DOS',
        preview: 'Black background, #0f0 terminal style'
      },
      { 
        value: 'modern', 
        label: 'Estilo Moderno', 
        description: 'Diseño limpio y minimalista para lectura',
        preview: '#f9f9f9 background, clean typography'
      }
    ];
  }

  getAvailablePlugins() {
    return [
      {
        category: '🔍 SEO y metadatos',
        plugins: [
          { value: 'jekyll-seo-tag', label: 'SEO Tag', description: 'Añade metaetiquetas para SEO, OG, Twitter' },
          { value: 'jekyll-sitemap', label: 'Sitemap', description: 'Genera sitemap.xml automático' },
          { value: 'jekyll-feed', label: 'Feed RSS', description: 'Crea feed RSS automático' },
        ]
      },
      {
        category: '📂 Organización y navegación',
        plugins: [
          { value: 'jekyll-paginate', label: 'Paginación', description: 'Paginación entre posts' },
          { value: 'jekyll-archives', label: 'Archivos', description: 'Agrupa por año/mes/categoría' },
          { value: 'jekyll-toc', label: 'Índice', description: 'Genera índice (table of contents)' },
          { value: 'jekyll-redirect-from', label: 'Redirecciones', description: 'Redirecciones de URLs antiguas' },
        ]
      },
      {
        category: '✨ Contenido y funcionalidad',
        plugins: [
          { value: 'jekyll-include-cache', label: 'Cache de Includes', description: 'Mejora rendimiento de includes' },
          { value: 'jekyll-relative-links', label: 'Enlaces Relativos', description: 'Convierte enlaces relativos a válidos' },
          { value: 'jekyll-multiple-languages-plugin', label: 'Multilenguaje', description: 'Soporte multilenguaje' },
          { value: 'jekyll-assets', label: 'Gestión de Assets', description: 'Gestión avanzada de CSS, JS, imágenes' },
          { value: 'jekyll-analytics', label: 'Analytics', description: 'Añade Google Analytics fácilmente' },
        ]
      }
    ];
  }

  getCssContent(styleName: string): string {
    switch (styleName) {
      case 'vintage':
        return `/* retro.css */

body {
  background-color: black;
  color: #33ff33;
  font-family: 'Courier New', monospace;
  font-size: 16px;
  padding: 1rem;
}

a {
  color: #00ffff;
  text-decoration: none;
}
a:hover {
  text-decoration: underline;
}

header, h1, h2, h3 {
  color: #33ff33;
  border-bottom: 1px dashed #33ff33;
  padding-bottom: 0.2em;
  margin-top: 2rem;
}

ul {
  list-style-type: "> ";
}

pre, code {
  background-color: #111;
  color: #00ff00;
  padding: 0.5rem;
  border-left: 3px solid #33ff33;
  overflow-x: auto;
}

blockquote {
  border-left: 4px double #33ff33;
  padding-left: 1rem;
  color: #90ee90;
  font-style: italic;
}

hr {
  border: none;
  border-top: 1px dotted #33ff33;
  margin: 2rem 0;
}

footer {
  text-align: center;
  font-size: 0.8rem;
  color: #33ff33;
  margin-top: 4rem;
}`;

      case 'msdos':
        return `/* msdos.css - Retro Terminal Style */

body {
  background-color: #000;
  color: #0f0;
  font-family: "Courier New", monospace;
  font-size: 16px;
  padding: 1rem;
}

a {
  color: #0ff;
  text-decoration: none;
}
a:hover {
  text-decoration: underline;
}

h1, h2, h3 {
  border-bottom: 1px dashed #0f0;
  color: #0f0;
}

ul {
  list-style: square;
}

pre, code {
  background-color: #111;
  color: #0f0;
  padding: 0.5rem;
  display: block;
  border: 1px solid #0f0;
  margin: 1rem 0;
}

blockquote {
  color: #ff0;
  border-left: 3px solid #0f0;
  padding-left: 1rem;
  margin: 1rem 0;
}

footer {
  color: #080;
  border-top: 1px dashed #0f0;
  margin-top: 2rem;
  padding-top: 1rem;
  text-align: center;
}`;

      case 'modern':
        return `/* modern.css */

body {
  background-color: #f9f9f9;
  color: #333;
  font-family: 'Inter', sans-serif;
  font-size: 17px;
  line-height: 1.7;
  margin: 0;
  padding: 2rem;
  max-width: 800px;
  margin-left: auto;
  margin-right: auto;
}

a {
  color: #0066cc;
  text-decoration: none;
  font-weight: 500;
}
a:hover {
  text-decoration: underline;
}

h1, h2, h3 {
  color: #111;
  margin-top: 2rem;
}

pre, code {
  background-color: #f0f0f0;
  border: 1px solid #ddd;
  padding: 0.8rem;
  border-radius: 5px;
  font-family: 'Fira Code', monospace;
  font-size: 0.95rem;
  overflow-x: auto;
}

blockquote {
  border-left: 4px solid #ccc;
  padding-left: 1rem;
  margin-left: 0;
  color: #555;
  background: #f5f5f5;
}

ul {
  padding-left: 1.5rem;
}

img {
  max-width: 100%;
  border-radius: 8px;
  box-shadow: 0 2px 6px rgba(0,0,0,0.1);
}

footer {
  text-align: center;
  font-size: 0.9rem;
  color: #aaa;
  margin-top: 3rem;
}`;

      default: // 'default'
        return `/* style.css */

/* --- Tipografía y colores base --- */
body {
  background-color: #0f0f0f;
  color: #e0e0e0;
  font-family: 'Source Code Pro', monospace;
  line-height: 1.6;
  margin: 0;
  padding: 0 1rem;
}

/* --- Enlaces --- */
a {
  color: #64ffda;
  text-decoration: none;
}
a:hover {
  text-decoration: underline;
}

/* --- Cabecera principal --- */
header, h1, h2 {
  color: #ffffff;
  text-align: center;
  margin-bottom: 1rem;
}

/* --- Listado de posts --- */
ul.post-list {
  list-style: none;
  padding: 0;
}
ul.post-list li {
  margin: 0.5rem 0;
  padding: 0.75rem;
  background-color: #1a1a1a;
  border-left: 4px solid #64ffda;
  border-radius: 4px;
  transition: background-color 0.2s;
}
ul.post-list li:hover {
  background-color: #333;
}
ul.post-list li a {
  font-size: 1.1rem;
  font-weight: bold;
}

/* --- Contenido de post individual --- */
article {
  max-width: 800px;
  margin: 1.5rem auto;
  padding-bottom: 2rem;
}
article h1 {
  font-size: 2rem;
  margin-bottom: 0.5rem;
}
article p, article li {
  font-size: 1rem;
  color: #ddd;
}
article code {
  font-family: 'Courier New', monospace;
  background-color: #222;
  padding: 0.2em 0.4em;
  border-radius: 3px;
}

/* --- Bloques de código --- */
pre code {
  display: block;
  padding: 1rem;
  background-color: #1e1e1e;
  border-radius: 6px;
  overflow-x: auto;
}
pre {
  margin: 1rem 0;
}

/* --- Bloques de cita --- */
blockquote {
  border-left: 4px solid #64ffda;
  padding-left: 1rem;
  margin-left: 0;
  color: #ccc;
  background-color: #1a1a1a;
  border-radius: 4px;
}

/* --- Imágenes responsivas --- */
img {
  max-width: 100%;
  height: auto;
  display: block;
  margin: 1rem auto;
  border-radius: 4px;
}

/* --- Botón 'Leer más' --- */
.read-more {
  display: inline-block;
  margin-top: 0.5rem;
  padding: 0.4rem 0.8rem;
  background-color: #64ffda;
  color: #000;
  border-radius: 3px;
  font-weight: bold;
  text-decoration: none;
}
.read-more:hover {
  background-color: #52c7a6;
}

/* --- Pie de página --- */
footer {
  text-align: center;
  padding: 1rem 0;
  font-size: 0.9rem;
  color: #666;
  border-top: 1px solid #333;
  margin-top: 2rem;
}`;
    }
  }
}

export const configService = new ConfigService();