interface Translations {
  [key: string]: {
    [key: string]: string;
  };
}

const translations: Translations = {
  en: {
    // Navigation
    'nav.posts': 'Posts',
    'nav.newPost': 'New Post',
    'nav.settings': 'Settings',
    'nav.publish': 'Publish & Refresh Pages',
    
    // Posts Screen
    'posts.title': 'My Blog',
    'posts.postsCount': '{{count}} posts',
    'posts.search': 'Search posts...',
    'posts.welcome': 'Welcome to GitBlog!',
    'posts.welcomeMessage': 'Start by creating your first blog post. All posts are saved locally and you can optionally sync with GitHub later.',
    'posts.noMatching': 'No matching posts',
    'posts.noMatchingMessage': 'Try adjusting your search or filters.',
    'posts.createFirst': 'Create Your First Post',
    
    // New Post Screen
    'newPost.title': 'New Blog Post',
    'newPost.postTitle': 'Post Title',
    'newPost.titlePlaceholder': 'Enter your post title...',
    'newPost.tags': 'Tags',
    'newPost.addTag': 'Add tag',
    'newPost.add': 'Add',
    'newPost.content': 'Content',
    'newPost.contentPlaceholder': 'Write your post content...',
    'newPost.filenamePreview': 'Filename Preview',
    'newPost.cancel': 'Cancel',
    'newPost.save': 'Save Post',
    'newPost.error': 'Error',
    'newPost.fillRequired': 'Please fill in both title and content',
    'newPost.success': 'Success',
    'newPost.saved': 'Post saved successfully!',
    'newPost.saveFailed': 'Failed to save post',
    
    // Editor Screen
    'editor.title': 'Edit Post',
    'editor.edit': 'Edit',
    'editor.preview': 'Preview',
    'editor.titleLabel': 'Title',
    'editor.contentLabel': 'Content',
    'editor.contentPlaceholder': 'Write your content...',
    'editor.delete': 'Delete',
    'editor.cancel': 'Cancel',
    'editor.save': 'Save',
    'editor.deleteConfirm': 'Delete Post',
    'editor.deleteMessage': 'Are you sure you want to delete this post? This action cannot be undone.',
    'editor.updated': 'Post updated successfully!',
    'editor.updateFailed': 'Failed to save post',
    'editor.deleted': 'Post deleted successfully!',
    'editor.deleteFailed': 'Failed to delete post',
    
    // Settings Screen
    'settings.title': 'Settings',
    'settings.subtitle': 'Configure sync and preferences',
    'settings.sync': 'Sync with GitHub',
    'settings.syncDescription': 'All posts are saved locally. Optionally sync with GitHub to backup and share your blog.',
    'settings.syncToGitHub': 'Sync to GitHub',
    'settings.importFromGitHub': 'Import from GitHub',
    'settings.lastSync': 'Last sync: {{date}}',
    'settings.githubConfig': 'GitHub Configuration',
    'settings.connected': 'Connected',
    'settings.connectionFailed': 'Connection failed',
    'settings.repoUrl': 'Repository URL',
    'settings.repoUrlPlaceholder': 'https://github.com/username/repository',
    'settings.token': 'Personal Access Token',
    'settings.tokenPlaceholder': 'ghp_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx',
    'settings.username': 'GitHub Username (Optional)',
    'settings.usernamePlaceholder': 'Your GitHub username',
    'settings.owner': 'Owner',
    'settings.repository': 'Repository',
    'settings.testConnection': 'Test Connection',
    'settings.saveSettings': 'Save Settings',
    'settings.appearance': 'Appearance',
    'settings.darkMode': 'Dark Mode',
    'settings.language': 'Language',
    'settings.setupInstructions': 'Setup Instructions',
    'settings.setupDescription': 'To sync with GitHub, you\'ll need:',
    'settings.setupItem1': '• A GitHub repository (can be public or private)',
    'settings.setupItem2': '• A personal access token with repo permissions',
    'settings.setupItem3': '• A "_posts" directory in your repository',
    'settings.setupItem4': '• Markdown files (.md) for your blog posts',
    'settings.tokenInstructions': 'Creating a Personal Access Token:',
    'settings.tokenStep1': '1. Go to GitHub Settings → Developer settings → Personal access tokens',
    'settings.tokenStep2': '2. Generate new token (classic)',
    'settings.tokenStep3': '3. Select "repo" scope for full repository access',
    'settings.tokenStep4': '4. Copy the generated token and paste it above',
    'settings.dangerZone': 'Danger Zone',
    'settings.dangerDescription': 'Clear all local posts and settings. This action cannot be undone.',
    'settings.clearAll': 'Clear All Data',
    'settings.about': 'About',
    'settings.aboutDescription': 'GitBlog - A beautiful mobile blog editor with local storage and optional GitHub sync',
    'settings.version': 'Version 1.0.0',
    'settings.fillRequired': 'Please fill in repository URL and token',
    'settings.settingsSaved': 'Settings saved successfully!',
    'settings.settingsFailed': 'Failed to save settings',
    'settings.connectionSuccess': 'Connection successful!',
    'settings.syncSuccess': 'Synced {{count}} posts to GitHub',
    'settings.syncFailed': 'Sync failed',
    'settings.importConfirm': 'Import from GitHub',
    'settings.importMessage': 'This will replace all local posts with posts from GitHub. Are you sure?',
    'settings.import': 'Import',
    'settings.imported': 'Imported {{count}} posts from GitHub',
    'settings.importFailed': 'Import failed',
    'settings.clearConfirm': 'Clear All Data',
    'settings.clearMessage': 'This will delete all local posts and settings. This action cannot be undone.',
    'settings.clearAll': 'Clear All',
    'settings.cleared': 'All data cleared successfully',
    'settings.clearFailed': 'Failed to clear data',
    
    // Publish and GitHub Actions
    'publish.publishing': 'Publishing to GitHub Pages...',
    'publish.syncingPosts': 'Syncing posts and configuration',
    'publish.success': 'Publication Successful!',
    'publish.successMessage': 'Your site will be available in a few minutes at:',
    'publish.viewSite': 'View Site',
    'publish.withErrors': 'Publication with Errors',
    'publish.errorsMessage': 'Errors:',
    'publish.failed': 'Publication Error',
    'publish.failedMessage': 'Could not publish the site. Check your GitHub configuration.',
    'publish.cooldownActive': 'Cooldown Active',
    'publish.cooldownMessage': 'You must wait {{seconds}} seconds before publishing again.\n\nThis prevents multiple simultaneous GitHub Actions.',
    'publish.inProgress': 'Publication already in progress',
    'publish.inProgressMessage': 'Another publication is already running. Please wait.',
    
    // Cooldown info
    'cooldown.active': 'Cooldown active: {{seconds}}s remaining',
    'cooldown.description': 'Prevents multiple simultaneous GitHub Actions',
    
    // Common
    'common.ok': 'OK',
    'common.cancel': 'Cancel',
    'common.error': 'Error',
    'common.success': 'Success',
    'common.loading': 'Loading...',
    'common.retry': 'Try Again',
    'common.goToSettings': 'Go to Settings',
    
    // Loading States
    'loading.posts': 'Loading posts...',
    'loading.post': 'Loading post...',
    
    // Error States
    'error.configRequired': 'Configuration Required',
    'error.somethingWrong': 'Something went wrong',
    'error.postNotFound': 'Post not found',
    'error.loadFailed': 'Failed to load',
  },
  es: {
    // Navigation
    'nav.posts': 'Publicaciones',
    'nav.newPost': 'Nueva Publicación',
    'nav.settings': 'Configuración',
    'nav.publish': 'Publicar y Actualizar Pages',
    
    // Posts Screen
    'posts.title': 'Mi Blog',
    'posts.postsCount': '{{count}} publicaciones',
    'posts.search': 'Buscar publicaciones...',
    'posts.welcome': '¡Bienvenido a GitBlog!',
    'posts.welcomeMessage': 'Comienza creando tu primera publicación de blog. Todas las publicaciones se guardan localmente y puedes sincronizar opcionalmente con GitHub más tarde.',
    'posts.noMatching': 'No hay publicaciones coincidentes',
    'posts.noMatchingMessage': 'Intenta ajustar tu búsqueda o filtros.',
    'posts.createFirst': 'Crear Tu Primera Publicación',
    
    // New Post Screen
    'newPost.title': 'Nueva Publicación de Blog',
    'newPost.postTitle': 'Título de la Publicación',
    'newPost.titlePlaceholder': 'Ingresa el título de tu publicación...',
    'newPost.tags': 'Etiquetas',
    'newPost.addTag': 'Agregar etiqueta',
    'newPost.add': 'Agregar',
    'newPost.content': 'Contenido',
    'newPost.contentPlaceholder': 'Escribe el contenido de tu publicación...',
    'newPost.filenamePreview': 'Vista Previa del Nombre de Archivo',
    'newPost.cancel': 'Cancelar',
    'newPost.save': 'Guardar Publicación',
    'newPost.error': 'Error',
    'newPost.fillRequired': 'Por favor completa tanto el título como el contenido',
    'newPost.success': 'Éxito',
    'newPost.saved': '¡Publicación guardada exitosamente!',
    'newPost.saveFailed': 'Error al guardar la publicación',
    
    // Editor Screen
    'editor.title': 'Editar Publicación',
    'editor.edit': 'Editar',
    'editor.preview': 'Vista Previa',
    'editor.titleLabel': 'Título',
    'editor.contentLabel': 'Contenido',
    'editor.contentPlaceholder': 'Escribe tu contenido...',
    'editor.delete': 'Eliminar',
    'editor.cancel': 'Cancelar',
    'editor.save': 'Guardar',
    'editor.deleteConfirm': 'Eliminar Publicación',
    'editor.deleteMessage': '¿Estás seguro de que quieres eliminar esta publicación? Esta acción no se puede deshacer.',
    'editor.updated': '¡Publicación actualizada exitosamente!',
    'editor.updateFailed': 'Error al guardar la publicación',
    'editor.deleted': '¡Publicación eliminada exitosamente!',
    'editor.deleteFailed': 'Error al eliminar la publicación',
    
    // Settings Screen
    'settings.title': 'Configuración',
    'settings.subtitle': 'Configurar sincronización y preferencias',
    'settings.sync': 'Sincronizar con GitHub',
    'settings.syncDescription': 'Todas las publicaciones se guardan localmente. Opcionalmente sincroniza con GitHub para respaldar y compartir tu blog.',
    'settings.syncToGitHub': 'Sincronizar con GitHub',
    'settings.importFromGitHub': 'Importar desde GitHub',
    'settings.lastSync': 'Última sincronización: {{date}}',
    'settings.githubConfig': 'Configuración de GitHub',
    'settings.connected': 'Conectado',
    'settings.connectionFailed': 'Conexión fallida',
    'settings.repoUrl': 'URL del Repositorio',
    'settings.repoUrlPlaceholder': 'https://github.com/usuario/repositorio',
    'settings.token': 'Token de Acceso Personal',
    'settings.tokenPlaceholder': 'ghp_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx',
    'settings.username': 'Nombre de Usuario de GitHub (Opcional)',
    'settings.usernamePlaceholder': 'Tu nombre de usuario de GitHub',
    'settings.owner': 'Propietario',
    'settings.repository': 'Repositorio',
    'settings.testConnection': 'Probar Conexión',
    'settings.saveSettings': 'Guardar Configuración',
    'settings.appearance': 'Apariencia',
    'settings.darkMode': 'Modo Oscuro',
    'settings.language': 'Idioma',
    'settings.setupInstructions': 'Instrucciones de Configuración',
    'settings.setupDescription': 'Para sincronizar con GitHub, necesitarás:',
    'settings.setupItem1': '• Un repositorio de GitHub (puede ser público o privado)',
    'settings.setupItem2': '• Un token de acceso personal con permisos de repositorio',
    'settings.setupItem3': '• Un directorio "_posts" en tu repositorio',
    'settings.setupItem4': '• Archivos Markdown (.md) para tus publicaciones de blog',
    'settings.tokenInstructions': 'Crear un Token de Acceso Personal:',
    'settings.tokenStep1': '1. Ve a Configuración de GitHub → Configuración de desarrollador → Tokens de acceso personal',
    'settings.tokenStep2': '2. Generar nuevo token (clásico)',
    'settings.tokenStep3': '3. Selecciona el alcance "repo" para acceso completo al repositorio',
    'settings.tokenStep4': '4. Copia el token generado y pégalo arriba',
    'settings.dangerZone': 'Zona de Peligro',
    'settings.dangerDescription': 'Borrar todas las publicaciones y configuraciones locales. Esta acción no se puede deshacer.',
    'settings.clearAll': 'Borrar Todos los Datos',
    'settings.about': 'Acerca de',
    'settings.aboutDescription': 'GitBlog - Un hermoso editor de blog móvil con almacenamiento local y sincronización opcional con GitHub',
    'settings.version': 'Versión 1.0.0',
    'settings.fillRequired': 'Por favor completa la URL del repositorio y el token',
    'settings.settingsSaved': '¡Configuración guardada exitosamente!',
    'settings.settingsFailed': 'Error al guardar la configuración',
    'settings.connectionSuccess': '¡Conexión exitosa!',
    'settings.syncSuccess': '{{count}} publicaciones sincronizadas con GitHub',
    'settings.syncFailed': 'Sincronización fallida',
    'settings.importConfirm': 'Importar desde GitHub',
    'settings.importMessage': 'Esto reemplazará todas las publicaciones locales con publicaciones de GitHub. ¿Estás seguro?',
    'settings.import': 'Importar',
    'settings.imported': '{{count}} publicaciones importadas desde GitHub',
    'settings.importFailed': 'Importación fallida',
    'settings.clearConfirm': 'Borrar Todos los Datos',
    'settings.clearMessage': 'Esto eliminará todas las publicaciones y configuraciones locales. Esta acción no se puede deshacer.',
    'settings.clearAll': 'Borrar Todo',
    'settings.cleared': 'Todos los datos borrados exitosamente',
    'settings.clearFailed': 'Error al borrar los datos',
    
    // Publish and GitHub Actions
    'publish.publishing': 'Publicando en GitHub Pages...',
    'publish.syncingPosts': 'Sincronizando publicaciones y configuración',
    'publish.success': '¡Publicación Exitosa!',
    'publish.successMessage': 'Tu sitio estará disponible en unos minutos en:',
    'publish.viewSite': 'Ver Sitio',
    'publish.withErrors': 'Publicación con Errores',
    'publish.errorsMessage': 'Errores:',
    'publish.failed': 'Error de Publicación',
    'publish.failedMessage': 'No se pudo publicar el sitio. Verifica tu configuración de GitHub.',
    'publish.cooldownActive': 'Cooldown Activo',
    'publish.cooldownMessage': 'Debes esperar {{seconds}} segundos antes de publicar de nuevo.\n\nEsto evita múltiples GitHub Actions simultáneos.',
    'publish.inProgress': 'Publicación en progreso',
    'publish.inProgressMessage': 'Ya hay una publicación en curso. Por favor espera.',
    
    // Cooldown info
    'cooldown.active': 'Cooldown activo: {{seconds}}s restantes',
    'cooldown.description': 'Evita múltiples GitHub Actions simultáneos',
    
    // Common
    'common.ok': 'OK',
    'common.cancel': 'Cancelar',
    'common.error': 'Error',
    'common.success': 'Éxito',
    'common.loading': 'Cargando...',
    'common.retry': 'Intentar de Nuevo',
    'common.goToSettings': 'Ir a Configuración',
    
    // Loading States
    'loading.posts': 'Cargando publicaciones...',
    'loading.post': 'Cargando publicación...',
    
    // Error States
    'error.configRequired': 'Configuración Requerida',
    'error.somethingWrong': 'Algo salió mal',
    'error.postNotFound': 'Publicación no encontrada',
    'error.loadFailed': 'Error al cargar',
  }
};

let currentLanguage = 'en';

export const setLanguage = (language: string) => {
  if (translations[language]) {
    currentLanguage = language;
  }
};

export const getCurrentLanguage = () => currentLanguage;

export const t = (key: string, params?: { [key: string]: string | number }): string => {
  const translation = translations[currentLanguage]?.[key] || translations['en']?.[key] || key;
  
  if (params) {
    return Object.keys(params).reduce((str, param) => {
      return str.replace(new RegExp(`{{${param}}}`, 'g'), String(params[param]));
    }, translation);
  }
  
  return translation;
};

export const getAvailableLanguages = () => [
  { code: 'en', name: 'English' },
  { code: 'es', name: 'Español' }
];