import { Link, Stack } from 'expo-router';
import { View, StyleSheet } from 'react-native';
import { Text, Button, Card } from 'react-native-paper';
import { Home } from 'lucide-react-native';

export default function NotFoundScreen() {
  return (
    <>
      <Stack.Screen options={{ title: 'Page Not Found' }} />
      <View style={styles.container}>
        <Card style={styles.card}>
          <Card.Content style={styles.content}>
            <Home size={48} color="#64748b" style={styles.icon} />
            <Text variant="headlineSmall" style={styles.title}>
              Page Not Found
            </Text>
            <Text variant="bodyMedium" style={styles.message}>
              The page you're looking for doesn't exist.
            </Text>
            <Link href="/" asChild>
              <Button mode="contained" style={styles.button}>
                Go to Home
              </Button>
            </Link>
          </Card.Content>
        </Card>
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f8fafc',
    padding: 16,
  },
  card: {
    backgroundColor: '#ffffff',
    maxWidth: 400,
    width: '100%',
  },
  content: {
    alignItems: 'center',
  },
  icon: {
    marginBottom: 16,
  },
  title: {
    color: '#1e293b',
    fontWeight: '600',
    marginBottom: 8,
    textAlign: 'center',
  },
  message: {
    color: '#64748b',
    textAlign: 'center',
    marginBottom: 24,
  },
  button: {
    backgroundColor: '#3b82f6',
  },
});