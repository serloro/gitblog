import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, Alert } from 'react-native';
import { Text, TextInput, Button, Card, Switch, Divider, Menu, IconButton, SegmentedButtons } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Github, ExternalLink, User, CircleCheck as CheckCircle, CircleAlert as AlertCircle, Cloud, Download, Upload, Trash2, Moon, Sun, Globe, ArrowLeft, Settings as SettingsIcon } from 'lucide-react-native';
import { router } from 'expo-router';
import { configService } from '@/lib/configService';
import { githubApi } from '@/lib/githubApi';
import { syncService } from '@/lib/syncService';
import { localStorageService } from '@/lib/localStorageService';
import { useTheme } from '@/components/ThemeProvider';
import { useLanguage } from '@/components/LanguageProvider';
import { t } from '@/lib/i18n';

export default function SettingsScreen() {
  const [activeTab, setActiveTab] = useState('github');
  const [repoUrl, setRepoUrl] = useState('');
  const [token, setToken] = useState('');
  const [username, setUsername] = useState('');
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [syncEnabled, setSyncEnabled] = useState(false);
  const [lastSync, setLastSync] = useState<Date | undefined>();
  const [languageMenuVisible, setLanguageMenuVisible] = useState(false);
  
  // Jekyll configuration
  const [jekyllTitle, setJekyllTitle] = useState('');
  const [jekyllDescription, setJekyllDescription] = useState('');
  const [jekyllUrl, setJekyllUrl] = useState('');
  const [jekyllBaseurl, setJekyllBaseurl] = useState('');
  const [jekyllAuthorName, setJekyllAuthorName] = useState('');
  const [jekyllAuthorEmail, setJekyllAuthorEmail] = useState('');
  const [jekyllAuthorGithub, setJekyllAuthorGithub] = useState('');
  const [jekyllAuthorTwitter, setJekyllAuthorTwitter] = useState('');
  const [savingJekyll, setSavingJekyll] = useState(false);
  
  const { isDark, toggleTheme, theme } = useTheme();
  const { currentLanguage, changeLanguage, availableLanguages } = useLanguage();

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      const config = await configService.getConfig();
      setRepoUrl(config.repoUrl || '');
      setToken(config.token || '');
      setUsername(config.username || '');
      
      const localSettings = await localStorageService.getSettings();
      setSyncEnabled(localSettings.syncEnabled);
      setLastSync(localSettings.lastSync);
      
      // Load Jekyll configuration
      const jekyllConfig = await configService.getJekyllConfig();
      setJekyllTitle(jekyllConfig.title);
      setJekyllDescription(jekyllConfig.description);
      setJekyllUrl(jekyllConfig.url);
      setJekyllBaseurl(jekyllConfig.baseurl);
      setJekyllAuthorName(jekyllConfig.authorName);
      setJekyllAuthorEmail(jekyllConfig.authorEmail);
      setJekyllAuthorGithub(jekyllConfig.authorGithub);
      setJekyllAuthorTwitter(jekyllConfig.authorTwitter);
      
      // Test connection if config exists
      if (config.repoUrl && config.token) {
        testConnectionSilently(config);
      }
    } catch (error) {
      console.error('Failed to load settings:', error);
    }
  };

  const testConnectionSilently = async (config: { repoUrl: string; token: string }) => {
    try {
      githubApi.setApiConfig({
        repoUrl: config.repoUrl,
        token: config.token,
      });
      await githubApi.testConnection();
      setConnectionStatus('success');
    } catch (error) {
      setConnectionStatus('error');
    }
  };

  const saveSettings = async () => {
    if (!repoUrl.trim() || !token.trim()) {
      Alert.alert(t('common.error'), t('settings.fillRequired'));
      return;
    }

    setSaving(true);
    try {
      await configService.saveConfig({
        repoUrl: repoUrl.trim(),
        token: token.trim(),
        username: username.trim(),
      });
      
      githubApi.setApiConfig({
        repoUrl: repoUrl.trim(),
        token: token.trim(),
      });

      // Test connection after saving
      await testConnection();
      
      Alert.alert(t('common.success'), t('settings.settingsSaved'));
    } catch (error) {
      Alert.alert(t('common.error'), t('settings.settingsFailed'));
    } finally {
      setSaving(false);
    }
  };

  const saveJekyllConfig = async () => {
    setSavingJekyll(true);
    try {
      // Save locally
      await configService.saveJekyllConfig({
        title: jekyllTitle,
        description: jekyllDescription,
        url: jekyllUrl,
        baseurl: jekyllBaseurl,
        authorName: jekyllAuthorName,
        authorEmail: jekyllAuthorEmail,
        authorGithub: jekyllAuthorGithub,
        authorTwitter: jekyllAuthorTwitter,
      });

      // Sync to GitHub if connected
      if (connectionStatus === 'success') {
        const result = await syncService.syncJekyllConfig({
          title: jekyllTitle,
          description: jekyllDescription,
          url: jekyllUrl,
          baseurl: jekyllBaseurl,
          authorName: jekyllAuthorName,
          authorEmail: jekyllAuthorEmail,
          authorGithub: jekyllAuthorGithub,
          authorTwitter: jekyllAuthorTwitter,
        });

        if (result.success) {
          Alert.alert(t('common.success'), 'Jekyll configuration saved and synced to GitHub!');
        } else {
          Alert.alert(t('common.success'), 'Jekyll configuration saved locally. Sync to GitHub failed: ' + result.errors.join(', '));
        }
      } else {
        Alert.alert(t('common.success'), 'Jekyll configuration saved locally!');
      }
    } catch (error) {
      Alert.alert(t('common.error'), 'Failed to save Jekyll configuration');
    } finally {
      setSavingJekyll(false);
    }
  };

  const testConnection = async () => {
    if (!repoUrl.trim() || !token.trim()) {
      Alert.alert(t('common.error'), t('settings.fillRequired'));
      return;
    }

    setTesting(true);
    setConnectionStatus('idle');
    
    try {
      githubApi.setApiConfig({
        repoUrl: repoUrl.trim(),
        token: token.trim(),
      });

      await githubApi.testConnection();
      setConnectionStatus('success');
      Alert.alert(t('common.success'), t('settings.connectionSuccess'));
    } catch (error) {
      setConnectionStatus('error');
      Alert.alert(
        t('settings.connectionFailed'),
        error instanceof Error ? error.message : t('settings.connectionFailed')
      );
    } finally {
      setTesting(false);
    }
  };

  const syncToGitHub = async () => {
    setSyncing(true);
    try {
      const result = await syncService.syncToGitHub();
      
      if (result.success) {
        Alert.alert(t('common.success'), result.message);
        setLastSync(new Date());
        setSyncEnabled(true);
      } else {
        Alert.alert(t('settings.syncFailed'), result.message + '\n\n' + result.errors.join('\n'));
      }
    } catch (error) {
      Alert.alert(t('common.error'), t('settings.syncFailed'));
    } finally {
      setSyncing(false);
    }
  };

  const syncFromGitHub = async () => {
    Alert.alert(
      t('settings.importConfirm'),
      t('settings.importMessage'),
      [
        { text: t('common.cancel'), style: 'cancel' },
        { text: t('settings.import'), style: 'destructive', onPress: confirmSyncFromGitHub }
      ]
    );
  };

  const confirmSyncFromGitHub = async () => {
    setSyncing(true);
    try {
      const result = await syncService.syncFromGitHub();
      
      if (result.success) {
        Alert.alert(t('common.success'), result.message);
        setLastSync(new Date());
        setSyncEnabled(true);
      } else {
        Alert.alert(t('settings.importFailed'), result.message + '\n\n' + result.errors.join('\n'));
      }
    } catch (error) {
      Alert.alert(t('common.error'), t('settings.importFailed'));
    } finally {
      setSyncing(false);
    }
  };

  const clearAllData = () => {
    Alert.alert(
      t('settings.clearConfirm'),
      t('settings.clearMessage'),
      [
        { text: t('common.cancel'), style: 'cancel' },
        { text: t('settings.clearAll'), style: 'destructive', onPress: confirmClearData }
      ]
    );
  };

  const confirmClearData = async () => {
    try {
      await localStorageService.clearAllData();
      await configService.clearConfig();
      
      // Reset state
      setRepoUrl('');
      setToken('');
      setUsername('');
      setSyncEnabled(false);
      setLastSync(undefined);
      setConnectionStatus('idle');
      
      Alert.alert(t('common.success'), t('settings.cleared'));
    } catch (error) {
      Alert.alert(t('common.error'), t('settings.clearFailed'));
    }
  };

  const extractRepoInfo = (url: string) => {
    const match = url.match(/github\.com\/([^\/]+)\/([^\/]+)/);
    return match ? { owner: match[1], repo: match[2] } : null;
  };

  const repoInfo = extractRepoInfo(repoUrl);

  const getConnectionStatusIcon = () => {
    switch (connectionStatus) {
      case 'success':
        return <CheckCircle size={20} color="#10b981" />;
      case 'error':
        return <AlertCircle size={20} color="#dc2626" />;
      default:
        return null;
    }
  };

  const getConnectionStatusText = () => {
    switch (connectionStatus) {
      case 'success':
        return t('settings.connected');
      case 'error':
        return t('settings.connectionFailed');
      default:
        return '';
    }
  };

  const getCurrentLanguageName = () => {
    return availableLanguages.find(lang => lang.code === currentLanguage)?.name || 'English';
  };

  const handleBackPress = () => {
    router.replace('/');
  };

  const dynamicStyles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.colors.background,
    },
    header: {
      paddingHorizontal: 16,
      paddingVertical: 16,
      backgroundColor: theme.colors.background,
      flexDirection: 'row',
      alignItems: 'center',
    },
    backButton: {
      marginRight: 8,
    },
    headerContent: {
      flex: 1,
    },
    title: {
      fontWeight: '700',
      color: theme.colors.onBackground,
      marginBottom: 4,
    },
    subtitle: {
      color: theme.colors.onSurfaceVariant,
    },
    card: {
      backgroundColor: theme.colors.surface,
      marginBottom: 16,
    },
    sectionTitle: {
      marginLeft: 8,
      color: theme.colors.onSurface,
      fontWeight: '600',
      flex: 1,
    },
    helpText: {
      marginBottom: 8,
      color: theme.colors.onSurfaceVariant,
    },
    bulletPoint: {
      marginBottom: 4,
      marginLeft: 8,
      color: theme.colors.onSurfaceVariant,
    },
    repoInfo: {
      backgroundColor: theme.colors.surfaceVariant,
      padding: 12,
      borderRadius: 8,
      marginBottom: 16,
    },
    repoInfoText: {
      color: theme.colors.onSurfaceVariant,
      marginBottom: 4,
    },
    aboutText: {
      color: theme.colors.onSurfaceVariant,
      marginBottom: 8,
    },
    versionText: {
      color: theme.colors.onSurfaceVariant,
      fontStyle: 'italic',
    },
    segmentedButtons: {
      marginHorizontal: 16,
      marginBottom: 16,
    },
  });

  const renderGitHubSettings = () => (
    <>
      <Card style={dynamicStyles.card}>
        <Card.Content>
          <View style={styles.sectionHeader}>
            <Cloud size={24} color="#3b82f6" />
            <Text variant="titleMedium" style={dynamicStyles.sectionTitle}>
              {t('settings.sync')}
            </Text>
          </View>
          
          <Text variant="bodyMedium" style={dynamicStyles.helpText}>
            {t('settings.syncDescription')}
          </Text>

          {connectionStatus === 'success' && (
            <View style={styles.syncActions}>
              <Button
                mode="contained"
                onPress={syncToGitHub}
                loading={syncing}
                disabled={syncing}
                style={styles.syncButton}
                icon={() => <Upload size={16} color="#ffffff" />}
              >
                {t('settings.syncToGitHub')}
              </Button>
              <Button
                mode="outlined"
                onPress={syncFromGitHub}
                loading={syncing}
                disabled={syncing}
                style={styles.syncButton}
                icon={() => <Download size={16} color="#3b82f6" />}
              >
                {t('settings.importFromGitHub')}
              </Button>
            </View>
          )}

          {lastSync && (
            <Text variant="bodySmall" style={styles.lastSyncText}>
              {t('settings.lastSync', { date: lastSync.toLocaleString() })}
            </Text>
          )}
        </Card.Content>
      </Card>

      <Card style={dynamicStyles.card}>
        <Card.Content>
          <View style={styles.sectionHeader}>
            <Github size={24} color="#3b82f6" />
            <Text variant="titleMedium" style={dynamicStyles.sectionTitle}>
              {t('settings.githubConfig')}
            </Text>
            {connectionStatus !== 'idle' && (
              <View style={styles.connectionStatus}>
                {getConnectionStatusIcon()}
                <Text style={[
                  styles.connectionStatusText,
                  { color: connectionStatus === 'success' ? '#10b981' : '#dc2626' }
                ]}>
                  {getConnectionStatusText()}
                </Text>
              </View>
            )}
          </View>

          <TextInput
            label={t('settings.repoUrl')}
            value={repoUrl}
            onChangeText={setRepoUrl}
            mode="outlined"
            style={styles.input}
            placeholder={t('settings.repoUrlPlaceholder')}
            autoCapitalize="none"
            autoCorrect={false}
          />

          <TextInput
            label={t('settings.token')}
            value={token}
            onChangeText={setToken}
            mode="outlined"
            style={styles.input}
            placeholder={t('settings.tokenPlaceholder')}
            secureTextEntry
            autoCapitalize="none"
            autoCorrect={false}
          />

          <TextInput
            label={t('settings.username')}
            value={username}
            onChangeText={setUsername}
            mode="outlined"
            style={styles.input}
            placeholder={t('settings.usernamePlaceholder')}
            autoCapitalize="none"
            autoCorrect={false}
          />

          {repoInfo && (
            <View style={dynamicStyles.repoInfo}>
              <Text variant="bodyMedium" style={dynamicStyles.repoInfoText}>
                {t('settings.owner')}: <Text style={styles.repoInfoValue}>{repoInfo.owner}</Text>
              </Text>
              <Text variant="bodyMedium" style={dynamicStyles.repoInfoText}>
                {t('settings.repository')}: <Text style={styles.repoInfoValue}>{repoInfo.repo}</Text>
              </Text>
            </View>
          )}

          <View style={styles.buttonRow}>
            <Button
              mode="outlined"
              onPress={testConnection}
              loading={testing}
              disabled={testing || !repoUrl.trim() || !token.trim()}
              style={styles.testButton}
              icon="check-circle"
            >
              {t('settings.testConnection')}
            </Button>
            <Button
              mode="contained"
              onPress={saveSettings}
              loading={saving}
              disabled={saving || !repoUrl.trim() || !token.trim()}
              style={styles.saveButton}
            >
              {t('settings.saveSettings')}
            </Button>
          </View>
        </Card.Content>
      </Card>
    </>
  );

  const renderJekyllSettings = () => (
    <>
      <Card style={dynamicStyles.card}>
        <Card.Content>
          <View style={styles.sectionHeader}>
            <SettingsIcon size={24} color="#3b82f6" />
            <Text variant="titleMedium" style={dynamicStyles.sectionTitle}>
              Configuración del Sitio Jekyll
            </Text>
          </View>
          
          <Text variant="bodyMedium" style={dynamicStyles.helpText}>
            Configura los datos básicos de tu sitio Jekyll que se sincronizarán con el archivo _config.yml
          </Text>

          <TextInput
            label="Título del Sitio"
            value={jekyllTitle}
            onChangeText={setJekyllTitle}
            mode="outlined"
            style={styles.input}
            placeholder="Mi Blog Técnico"
          />

          <TextInput
            label="Descripción"
            value={jekyllDescription}
            onChangeText={setJekyllDescription}
            mode="outlined"
            style={styles.input}
            placeholder="Un blog sobre desarrollo web, software y tecnología"
            multiline
            numberOfLines={3}
          />

          <TextInput
            label="URL del Sitio"
            value={jekyllUrl}
            onChangeText={setJekyllUrl}
            mode="outlined"
            style={styles.input}
            placeholder="https://tuusuario.github.io"
            autoCapitalize="none"
          />

          <TextInput
            label="Base URL (opcional)"
            value={jekyllBaseurl}
            onChangeText={setJekyllBaseurl}
            mode="outlined"
            style={styles.input}
            placeholder="/blog (deja vacío si está en la raíz)"
            autoCapitalize="none"
          />
        </Card.Content>
      </Card>

      <Card style={dynamicStyles.card}>
        <Card.Content>
          <View style={styles.sectionHeader}>
            <User size={24} color="#3b82f6" />
            <Text variant="titleMedium" style={dynamicStyles.sectionTitle}>
              Información del Autor
            </Text>
          </View>

          <TextInput
            label="Nombre"
            value={jekyllAuthorName}
            onChangeText={setJekyllAuthorName}
            mode="outlined"
            style={styles.input}
            placeholder="Tu Nombre"
          />

          <TextInput
            label="Email"
            value={jekyllAuthorEmail}
            onChangeText={setJekyllAuthorEmail}
            mode="outlined"
            style={styles.input}
            placeholder="tu@email.com"
            autoCapitalize="none"
            keyboardType="email-address"
          />

          <TextInput
            label="GitHub URL"
            value={jekyllAuthorGithub}
            onChangeText={setJekyllAuthorGithub}
            mode="outlined"
            style={styles.input}
            placeholder="https://github.com/tuusuario"
            autoCapitalize="none"
          />

          <TextInput
            label="Twitter"
            value={jekyllAuthorTwitter}
            onChangeText={setJekyllAuthorTwitter}
            mode="outlined"
            style={styles.input}
            placeholder="@tuusuario"
            autoCapitalize="none"
          />

          <Button
            mode="contained"
            onPress={saveJekyllConfig}
            loading={savingJekyll}
            disabled={savingJekyll}
            style={styles.saveButton}
          >
            Guardar Configuración Jekyll
          </Button>
        </Card.Content>
      </Card>
    </>
  );

  const renderGeneralSettings = () => (
    <>
      <Card style={dynamicStyles.card}>
        <Card.Content>
          <View style={styles.sectionHeader}>
            {isDark ? <Moon size={24} color="#3b82f6" /> : <Sun size={24} color="#3b82f6" />}
            <Text variant="titleMedium" style={dynamicStyles.sectionTitle}>
              {t('settings.appearance')}
            </Text>
          </View>
          <View style={styles.themeRow}>
            <Text variant="bodyMedium" style={{ color: theme.colors.onSurface }}>
              {t('settings.darkMode')}
            </Text>
            <Switch value={isDark} onValueChange={toggleTheme} />
          </View>
          <Divider style={styles.divider} />
          <View style={styles.languageRow}>
            <Globe size={20} color={theme.colors.onSurface} />
            <Text variant="bodyMedium" style={[styles.languageLabel, { color: theme.colors.onSurface }]}>
              {t('settings.language')}
            </Text>
            <Menu
              visible={languageMenuVisible}
              onDismiss={() => setLanguageMenuVisible(false)}
              anchor={
                <Button
                  mode="outlined"
                  onPress={() => setLanguageMenuVisible(true)}
                  style={styles.languageButton}
                >
                  {getCurrentLanguageName()}
                </Button>
              }
            >
              {availableLanguages.map((language) => (
                <Menu.Item
                  key={language.code}
                  onPress={() => {
                    changeLanguage(language.code);
                    setLanguageMenuVisible(false);
                  }}
                  title={language.name}
                />
              ))}
            </Menu>
          </View>
        </Card.Content>
      </Card>

      <Card style={styles.dangerCard}>
        <Card.Content>
          <View style={styles.sectionHeader}>
            <Trash2 size={24} color="#dc2626" />
            <Text variant="titleMedium" style={[dynamicStyles.sectionTitle, { color: '#dc2626' }]}>
              {t('settings.dangerZone')}
            </Text>
          </View>
          
          <Text variant="bodyMedium" style={dynamicStyles.helpText}>
            {t('settings.dangerDescription')}
          </Text>
          
          <Button
            mode="outlined"
            onPress={clearAllData}
            style={styles.dangerButton}
            textColor="#dc2626"
          >
            {t('settings.clearAll')}
          </Button>
        </Card.Content>
      </Card>

      <Card style={dynamicStyles.card}>
        <Card.Content>
          <View style={styles.sectionHeader}>
            <User size={24} color="#3b82f6" />
            <Text variant="titleMedium" style={dynamicStyles.sectionTitle}>
              {t('settings.about')}
            </Text>
          </View>
          <Text variant="bodyMedium" style={dynamicStyles.aboutText}>
            {t('settings.aboutDescription')}
          </Text>
          <Text variant="bodySmall" style={dynamicStyles.versionText}>
            {t('settings.version')}
          </Text>
        </Card.Content>
      </Card>
    </>
  );

  return (
    <SafeAreaView style={dynamicStyles.container}>
      <View style={dynamicStyles.header}>
        <IconButton
          icon={() => <ArrowLeft size={24} color={theme.colors.onBackground} />}
          onPress={handleBackPress}
          style={dynamicStyles.backButton}
        />
        <View style={dynamicStyles.headerContent}>
          <Text variant="headlineMedium" style={dynamicStyles.title}>
            {t('settings.title')}
          </Text>
          <Text variant="bodyMedium" style={dynamicStyles.subtitle}>
            {t('settings.subtitle')}
          </Text>
        </View>
      </View>

      <SegmentedButtons
        value={activeTab}
        onValueChange={setActiveTab}
        buttons={[
          { value: 'github', label: 'GitHub' },
          { value: 'jekyll', label: 'Jekyll' },
          { value: 'general', label: 'General' },
        ]}
        style={dynamicStyles.segmentedButtons}
      />

      <ScrollView style={styles.content}>
        {activeTab === 'github' && renderGitHubSettings()}
        {activeTab === 'jekyll' && renderJekyllSettings()}
        {activeTab === 'general' && renderGeneralSettings()}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  content: {
    flex: 1,
    paddingHorizontal: 16,
  },
  dangerCard: {
    backgroundColor: '#ffffff',
    marginBottom: 16,
    borderColor: '#fecaca',
    borderWidth: 1,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  connectionStatus: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  connectionStatusText: {
    marginLeft: 4,
    fontSize: 12,
    fontWeight: '500',
  },
  input: {
    marginBottom: 16,
  },
  repoInfoValue: {
    fontWeight: '600',
    fontFamily: 'monospace',
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 8,
  },
  testButton: {
    flex: 1,
  },
  saveButton: {
    flex: 1,
    backgroundColor: '#3b82f6',
  },
  syncActions: {
    flexDirection: 'column',
    gap: 8,
    marginBottom: 16,
  },
  syncButton: {
    backgroundColor: '#3b82f6',
  },
  lastSyncText: {
    color: '#64748b',
    fontStyle: 'italic',
    textAlign: 'center',
  },
  themeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
  },
  languageRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
  },
  languageLabel: {
    flex: 1,
    marginLeft: 12,
  },
  languageButton: {
    minWidth: 120,
  },
  boldText: {
    fontWeight: '600',
  },
  divider: {
    marginVertical: 16,
  },
  dangerButton: {
    borderColor: '#dc2626',
    marginTop: 8,
  },
});