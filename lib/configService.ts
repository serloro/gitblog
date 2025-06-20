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
          description: 'Un blog sobre desarrollo web, software y tecnología',
          url: '',
          baseurl: '',
          authorName: '',
          authorEmail: '',
          authorGithub: '',
          authorTwitter: '',
          theme: 'minima',
          plugins: ['jekyll-feed', 'jekyll-seo-tag', 'jekyll-sitemap'],
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
        theme: 'minima',
        plugins: ['jekyll-feed', 'jekyll-seo-tag', 'jekyll-sitemap'],
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
layout: home
title: "Inicio"
---

# Bienvenido a mi blog

Este es mi blog personal donde comparto mis pensamientos, experiencias y conocimientos sobre desarrollo web, tecnología y otros temas que me interesan.

## Últimas publicaciones

Aquí encontrarás mis artículos más recientes. Explora las diferentes categorías y no dudes en dejar tus comentarios.

## Sobre mí

Soy un desarrollador apasionado por la tecnología y el aprendizaje continuo. Me gusta compartir lo que aprendo y conectar con otros desarrolladores.

---

*¡Gracias por visitar mi blog!*`
        };
      }

      return JSON.parse(configStr);
    } catch (error) {
      return {
        content: `---
layout: home
title: "Inicio"
---

# Bienvenido a mi blog

Este es mi blog personal donde comparto mis pensamientos, experiencias y conocimientos sobre desarrollo web, tecnología y otros temas que me interesan.

## Últimas publicaciones

Aquí encontrarás mis artículos más recientes. Explora las diferentes categorías y no dudes en dejar tus comentarios.

## Sobre mí

Soy un desarrollador apasionado por la tecnología y el aprendizaje continuo. Me gusta compartir lo que aprendo y conectar con otros desarrolladores.

---

*¡Gracias por visitar mi blog!*`
      };
    }
  }

  getAvailableThemes() {
    return [
      { value: 'minima', label: 'Minima (Por defecto)', description: 'Tema limpio y minimalista' },
      { value: 'jekyll-theme-cayman', label: 'Cayman', description: 'Tema moderno con header destacado' },
      { value: 'jekyll-theme-merlot', label: 'Merlot', description: 'Tema elegante y sofisticado' },
      { value: 'jekyll-theme-hacker', label: 'Hacker', description: 'Estilo terminal retro' },
      { value: 'jekyll-theme-slate', label: 'Slate', description: 'Tema oscuro profesional' },
      { value: 'jekyll-theme-modernist', label: 'Modernist', description: 'Diseño moderno y limpio' },
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
}

export const configService = new ConfigService();