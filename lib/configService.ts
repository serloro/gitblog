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
        description: 'Tema oscuro moderno con tipografía monospace y acentos cyan',
        preview: 'Dark theme: #0f0f0f bg, #64ffda accents, Source Code Pro font'
      },
      { 
        value: 'vintage', 
        label: 'Estilo Vintage', 
        description: 'Terminal retro con colores verdes clásicos y bordes punteados',
        preview: 'Retro terminal: Black bg, #33ff33 text, dashed borders'
      },
      { 
        value: 'msdos', 
        label: 'Estilo MS-DOS', 
        description: 'Inspirado en las terminales clásicas de DOS con verde brillante',
        preview: 'DOS terminal: Black bg, #0f0 bright green, square bullets'
      },
      { 
        value: 'modern', 
        label: 'Estilo Moderno', 
        description: 'Diseño limpio y minimalista para lectura con tipografía Inter',
        preview: 'Clean design: #f9f9f9 bg, #333 text, Inter font, shadows'
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
        return `/* ===========================================
   ESTILO VINTAGE - Terminal Retro Clásico
   =========================================== */

body {
  background-color: #000000;
  color: #33ff33;
  font-family: 'Courier New', 'Monaco', 'Menlo', monospace;
  font-size: 16px;
  line-height: 1.4;
  padding: 2rem;
  margin: 0;
  min-height: 100vh;
}

/* Enlaces estilo terminal */
a {
  color: #00ffff;
  text-decoration: none;
  font-weight: bold;
}
a:hover {
  text-decoration: underline;
  color: #ffffff;
}

/* Cabeceras con bordes punteados */
header h1, h1, h2, h3, h4, h5, h6 {
  color: #33ff33;
  border-bottom: 2px dashed #33ff33;
  padding-bottom: 0.3em;
  margin-top: 2.5rem;
  margin-bottom: 1rem;
  text-transform: uppercase;
  letter-spacing: 1px;
}

header h1 {
  text-align: center;
  font-size: 2.5rem;
  margin-bottom: 2rem;
}

/* Listas con símbolos retro */
ul {
  list-style: none;
  padding-left: 0;
}
ul li:before {
  content: "> ";
  color: #33ff33;
  font-weight: bold;
}

ol {
  padding-left: 1.5rem;
}

/* Código con estilo terminal */
pre, code {
  background-color: #111111;
  color: #00ff00;
  padding: 1rem;
  border-left: 4px solid #33ff33;
  border-radius: 0;
  overflow-x: auto;
  font-family: 'Courier New', monospace;
  font-size: 14px;
}

code {
  padding: 0.2em 0.4em;
  border-left: none;
}

/* Citas con doble borde */
blockquote {
  border-left: 6px double #33ff33;
  padding-left: 1.5rem;
  margin-left: 0;
  color: #90ee90;
  font-style: italic;
  background-color: #001100;
  padding: 1rem 1.5rem;
}

/* Separadores punteados */
hr {
  border: none;
  border-top: 2px dotted #33ff33;
  margin: 3rem 0;
  width: 80%;
  margin-left: auto;
  margin-right: auto;
}

/* Pie de página centrado */
footer {
  text-align: center;
  font-size: 0.8rem;
  color: #33ff33;
  margin-top: 4rem;
  padding-top: 2rem;
  border-top: 1px dashed #33ff33;
}

/* Párrafos con espaciado */
p {
  margin-bottom: 1.2rem;
  line-height: 1.6;
}

/* Tablas estilo terminal */
table {
  border-collapse: collapse;
  width: 100%;
  margin: 1rem 0;
}

th, td {
  border: 1px solid #33ff33;
  padding: 0.5rem;
  text-align: left;
}

th {
  background-color: #001100;
  color: #33ff33;
  font-weight: bold;
}`;

      case 'msdos':
        return `/* ===========================================
   ESTILO MS-DOS - Terminal Clásico DOS
   =========================================== */

body {
  background-color: #000000;
  color: #00ff00;
  font-family: "Courier New", "MS Sans Serif", monospace;
  font-size: 16px;
  line-height: 1.3;
  padding: 1.5rem;
  margin: 0;
  min-height: 100vh;
}

/* Enlaces estilo DOS */
a {
  color: #00ffff;
  text-decoration: none;
  font-weight: normal;
}
a:hover {
  text-decoration: underline;
  background-color: #00ffff;
  color: #000000;
}

/* Cabeceras con líneas DOS */
h1, h2, h3, h4, h5, h6 {
  color: #00ff00;
  border-bottom: 1px solid #00ff00;
  padding-bottom: 0.2em;
  margin-top: 2rem;
  margin-bottom: 1rem;
  text-transform: uppercase;
}

header h1 {
  text-align: center;
  font-size: 2rem;
  border-bottom: 2px solid #00ff00;
  margin-bottom: 2rem;
}

/* Listas con bullets cuadrados */
ul {
  list-style: none;
  padding-left: 1rem;
}
ul li:before {
  content: "■ ";
  color: #00ff00;
}

ol {
  padding-left: 1.5rem;
}

/* Código con borde DOS */
pre, code {
  background-color: #111111;
  color: #00ff00;
  padding: 0.8rem;
  border: 2px solid #00ff00;
  margin: 1rem 0;
  font-family: "Courier New", monospace;
  font-size: 14px;
  overflow-x: auto;
}

code {
  padding: 0.2em 0.4em;
  border: 1px solid #00ff00;
  display: inline;
}

/* Citas estilo DOS */
blockquote {
  color: #ffff00;
  border-left: 4px solid #00ff00;
  padding-left: 1rem;
  margin: 1.5rem 0;
  background-color: #001100;
  padding: 1rem;
  font-style: normal;
}

/* Separadores DOS */
hr {
  border: none;
  border-top: 1px solid #00ff00;
  margin: 2rem 0;
}

/* Pie de página DOS */
footer {
  color: #008800;
  border-top: 2px solid #00ff00;
  margin-top: 3rem;
  padding-top: 1rem;
  text-align: center;
  font-size: 0.9rem;
}

/* Párrafos con espaciado DOS */
p {
  margin-bottom: 1rem;
  line-height: 1.4;
}

/* Tablas estilo DOS */
table {
  border: 2px solid #00ff00;
  border-collapse: collapse;
  width: 100%;
  margin: 1rem 0;
}

th, td {
  border: 1px solid #00ff00;
  padding: 0.4rem;
  text-align: left;
}

th {
  background-color: #003300;
  color: #00ff00;
  font-weight: bold;
}

/* Efectos especiales DOS */
.blink {
  animation: blink 1s infinite;
}

@keyframes blink {
  0%, 50% { opacity: 1; }
  51%, 100% { opacity: 0; }
}`;

      case 'modern':
        return `/* ===========================================
   ESTILO MODERNO - Diseño Limpio y Elegante
   =========================================== */

body {
  background-color: #ffffff;
  color: #2c3e50;
  font-family: 'Inter', 'Segoe UI', 'Roboto', sans-serif;
  font-size: 18px;
  line-height: 1.8;
  margin: 0;
  padding: 0;
  max-width: 900px;
  margin-left: auto;
  margin-right: auto;
  padding: 2rem 3rem;
}

/* Enlaces modernos */
a {
  color: #3498db;
  text-decoration: none;
  font-weight: 500;
  border-bottom: 1px solid transparent;
  transition: all 0.3s ease;
}
a:hover {
  color: #2980b9;
  border-bottom-color: #3498db;
}

/* Cabeceras modernas */
h1, h2, h3, h4, h5, h6 {
  color: #1a1a1a;
  font-weight: 700;
  margin-top: 2.5rem;
  margin-bottom: 1rem;
  line-height: 1.3;
}

header h1 {
  text-align: center;
  font-size: 3rem;
  margin-bottom: 2rem;
  color: #2c3e50;
  font-weight: 800;
}

h1 { font-size: 2.5rem; }
h2 { font-size: 2rem; }
h3 { font-size: 1.5rem; }

/* Listas modernas */
ul {
  padding-left: 2rem;
  margin-bottom: 1.5rem;
}

ul li {
  margin-bottom: 0.5rem;
}

ol {
  padding-left: 2rem;
  margin-bottom: 1.5rem;
}

/* Código con estilo moderno */
pre, code {
  background-color: #f8f9fa;
  border: 1px solid #e9ecef;
  padding: 1rem;
  border-radius: 8px;
  font-family: 'Fira Code', 'Monaco', 'Consolas', monospace;
  font-size: 0.9rem;
  overflow-x: auto;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
}

code {
  padding: 0.2em 0.4em;
  border-radius: 4px;
  font-size: 0.85rem;
  color: #e74c3c;
  background-color: #f8f9fa;
}

/* Citas modernas */
blockquote {
  border-left: 4px solid #3498db;
  padding-left: 2rem;
  margin: 2rem 0;
  color: #5a6c7d;
  background-color: #f8f9fa;
  padding: 1.5rem 2rem;
  border-radius: 0 8px 8px 0;
  font-style: italic;
  box-shadow: 0 2px 8px rgba(0,0,0,0.1);
}

/* Separadores modernos */
hr {
  border: none;
  height: 1px;
  background: linear-gradient(to right, transparent, #bdc3c7, transparent);
  margin: 3rem 0;
}

/* Pie de página moderno */
footer {
  text-align: center;
  font-size: 0.9rem;
  color: #7f8c8d;
  margin-top: 4rem;
  padding-top: 2rem;
  border-top: 1px solid #ecf0f1;
}

/* Párrafos con espaciado moderno */
p {
  margin-bottom: 1.5rem;
  line-height: 1.8;
  color: #34495e;
}

/* Imágenes responsivas con sombra */
img {
  max-width: 100%;
  height: auto;
  border-radius: 12px;
  box-shadow: 0 4px 12px rgba(0,0,0,0.15);
  margin: 2rem auto;
  display: block;
}

/* Tablas modernas */
table {
  border-collapse: collapse;
  width: 100%;
  margin: 2rem 0;
  box-shadow: 0 2px 8px rgba(0,0,0,0.1);
  border-radius: 8px;
  overflow: hidden;
}

th, td {
  padding: 1rem;
  text-align: left;
  border-bottom: 1px solid #ecf0f1;
}

th {
  background-color: #3498db;
  color: white;
  font-weight: 600;
}

tr:hover {
  background-color: #f8f9fa;
}

/* Efectos de hover y transiciones */
* {
  transition: color 0.3s ease, background-color 0.3s ease;
}

/* Responsive design */
@media (max-width: 768px) {
  body {
    padding: 1rem 1.5rem;
    font-size: 16px;
  }
  
  header h1 {
    font-size: 2rem;
  }
  
  h1 { font-size: 1.8rem; }
  h2 { font-size: 1.5rem; }
  h3 { font-size: 1.3rem; }
}`;

      default: // 'default'
        return `/* ===========================================
   ESTILO POR DEFECTO - Tema Oscuro Moderno
   =========================================== */

body {
  background-color: #0f0f0f;
  color: #e0e0e0;
  font-family: 'Source Code Pro', 'Fira Code', 'Monaco', monospace;
  font-size: 16px;
  line-height: 1.6;
  margin: 0;
  padding: 1rem 2rem;
  min-height: 100vh;
}

/* Enlaces con acento cyan */
a {
  color: #64ffda;
  text-decoration: none;
  font-weight: 500;
  transition: all 0.3s ease;
}
a:hover {
  text-decoration: underline;
  color: #80fff4;
  text-shadow: 0 0 8px #64ffda;
}

/* Cabeceras centradas */
header, header h1 {
  text-align: center;
  margin-bottom: 2rem;
}

h1, h2, h3, h4, h5, h6 {
  color: #ffffff;
  font-weight: 700;
  margin-top: 2rem;
  margin-bottom: 1rem;
}

header h1 {
  font-size: 2.5rem;
  color: #64ffda;
  text-shadow: 0 0 10px #64ffda;
}

/* Listado de posts con estilo */
ul.post-list {
  list-style: none;
  padding: 0;
  margin: 2rem 0;
}

ul.post-list li {
  margin: 1rem 0;
  padding: 1rem;
  background-color: #1a1a1a;
  border-left: 4px solid #64ffda;
  border-radius: 6px;
  transition: all 0.3s ease;
  box-shadow: 0 2px 4px rgba(0,0,0,0.3);
}

ul.post-list li:hover {
  background-color: #2a2a2a;
  border-left-color: #80fff4;
  transform: translateX(5px);
  box-shadow: 0 4px 8px rgba(100, 255, 218, 0.2);
}

ul.post-list li a {
  font-size: 1.2rem;
  font-weight: bold;
  display: block;
  margin-bottom: 0.5rem;
}

/* Listas normales */
ul:not(.post-list) {
  padding-left: 2rem;
}

ol {
  padding-left: 2rem;
}

/* Contenido de posts */
article {
  max-width: 900px;
  margin: 2rem auto;
  padding-bottom: 3rem;
}

article h1 {
  font-size: 2.5rem;
  margin-bottom: 1rem;
  color: #64ffda;
  text-align: center;
}

article p, article li {
  font-size: 1rem;
  color: #d0d0d0;
  line-height: 1.7;
}

/* Código con estilo hacker */
code {
  font-family: 'Fira Code', 'Courier New', monospace;
  background-color: #1e1e1e;
  color: #64ffda;
  padding: 0.2em 0.5em;
  border-radius: 4px;
  font-size: 0.9rem;
  border: 1px solid #333;
}

pre {
  background-color: #1e1e1e;
  padding: 1.5rem;
  border-radius: 8px;
  overflow-x: auto;
  margin: 1.5rem 0;
  border: 1px solid #333;
  box-shadow: 0 4px 8px rgba(0,0,0,0.4);
}

pre code {
  background: none;
  border: none;
  padding: 0;
  color: #e0e0e0;
  font-size: 0.9rem;
}

/* Citas destacadas */
blockquote {
  border-left: 4px solid #64ffda;
  padding-left: 1.5rem;
  margin: 2rem 0;
  color: #b0b0b0;
  background-color: #1a1a1a;
  padding: 1rem 1.5rem;
  border-radius: 0 8px 8px 0;
  font-style: italic;
  box-shadow: 0 2px 4px rgba(0,0,0,0.3);
}

/* Imágenes responsivas */
img {
  max-width: 100%;
  height: auto;
  display: block;
  margin: 2rem auto;
  border-radius: 8px;
  box-shadow: 0 4px 12px rgba(0,0,0,0.5);
}

/* Separadores */
hr {
  border: none;
  height: 1px;
  background: linear-gradient(to right, transparent, #64ffda, transparent);
  margin: 3rem 0;
}

/* Botón "Leer más" */
.read-more {
  display: inline-block;
  margin-top: 1rem;
  padding: 0.6rem 1.2rem;
  background-color: #64ffda;
  color: #000000;
  border-radius: 6px;
  font-weight: bold;
  text-decoration: none;
  transition: all 0.3s ease;
  box-shadow: 0 2px 4px rgba(100, 255, 218, 0.3);
}

.read-more:hover {
  background-color: #52c7a6;
  transform: translateY(-2px);
  box-shadow: 0 4px 8px rgba(100, 255, 218, 0.4);
}

/* Pie de página */
footer {
  text-align: center;
  padding: 2rem 0;
  font-size: 0.9rem;
  color: #666666;
  border-top: 1px solid #333333;
  margin-top: 3rem;
}

/* Tablas */
table {
  width: 100%;
  border-collapse: collapse;
  margin: 2rem 0;
  background-color: #1a1a1a;
  border-radius: 8px;
  overflow: hidden;
}

th, td {
  padding: 1rem;
  text-align: left;
  border-bottom: 1px solid #333;
}

th {
  background-color: #64ffda;
  color: #000000;
  font-weight: bold;
}

tr:hover {
  background-color: #2a2a2a;
}

/* Efectos de scroll suave */
html {
  scroll-behavior: smooth;
}

/* Responsive design */
@media (max-width: 768px) {
  body {
    padding: 1rem;
    font-size: 14px;
  }
  
  article {
    margin: 1rem auto;
  }
  
  header h1 {
    font-size: 2rem;
  }
  
  ul.post-list li {
    padding: 0.8rem;
  }
}`;
    }
  }
}

export const configService = new ConfigService();