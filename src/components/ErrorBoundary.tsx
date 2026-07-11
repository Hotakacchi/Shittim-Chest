import { Component, ReactNode } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';

type Props = { children: ReactNode };
type State = { error: Error | null; info: string | null };

// Without this, an uncaught render error in production unmounts the whole
// tree with nothing rendered in its place — a plain black screen and no
// crash log, since nothing native ever throws. This surfaces the actual
// error on-screen instead of failing silently.
export class ErrorBoundary extends Component<Props, State> {
  state: State = { error: null, info: null };

  static getDerivedStateFromError(error: Error) {
    return { error };
  }

  componentDidCatch(error: Error, info: { componentStack: string }) {
    this.setState({ error, info: info.componentStack });
  }

  render() {
    if (this.state.error) {
      return (
        <View style={styles.container}>
          <ScrollView contentContainerStyle={styles.scroll}>
            <Text style={styles.title}>エラーが発生しました</Text>
            <Text style={styles.message}>{String(this.state.error.message)}</Text>
            <Text style={styles.stack}>{String(this.state.error.stack ?? '')}</Text>
            <Text style={styles.stack}>{this.state.info ?? ''}</Text>
          </ScrollView>
        </View>
      );
    }
    return this.props.children;
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1a0000',
    paddingTop: 60,
  },
  scroll: {
    padding: 16,
  },
  title: {
    color: '#ff6b6b',
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 12,
  },
  message: {
    color: '#ffffff',
    fontSize: 14,
    marginBottom: 12,
  },
  stack: {
    color: '#cccccc',
    fontSize: 11,
    marginBottom: 8,
  },
});
