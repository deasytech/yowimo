import { AlertTriangle } from "lucide-react-native";
import { styled } from "nativewind";
import { Component, ReactNode } from "react";
import { DevSettings, Text, TouchableOpacity } from "react-native";
import { SafeAreaView as RNSafeAreaView } from "react-native-safe-area-context";

const SafeAreaView = styled(RNSafeAreaView);

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
}

/** Catches any render-time crash anywhere in the app (the PostHog network-error crash was one
 * instance of this, but this net is deliberately general) and shows a recoverable screen
 * instead of a hard crash. Must be a class component — React only supports error boundaries
 * via getDerivedStateFromError/componentDidCatch, there's no hook equivalent. */
export default class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false };

  static getDerivedStateFromError(): State {
    return { hasError: true };
  }

  componentDidCatch(error: Error, info: { componentStack?: string }) {
    if (__DEV__) console.error("[ErrorBoundary] caught a render error", error, info.componentStack);
  }

  // There's no expo-updates in this project yet, so DevSettings.reload() (dev/dev-client only)
  // is the only real reload path available. Clearing hasError when it's NOT available would
  // just re-render the same still-broken tree — worse than leaving the error screen up, since
  // the failure wasn't actually fixed.
  canReload = typeof DevSettings.reload === "function";

  handleReload = () => {
    if (!this.canReload) return;
    this.setState({ hasError: false });
    DevSettings.reload();
  };

  render() {
    if (!this.state.hasError) return this.props.children;

    return (
      <SafeAreaView className="flex-1 items-center justify-center gap-4 bg-background px-8">
        <AlertTriangle color="#EF4444" size={40} strokeWidth={1.8} />
        <Text className="text-center text-lg font-sans-semibold text-foreground">
          Something went wrong
        </Text>
        <Text className="text-center text-sm text-muted-foreground">
          {this.canReload
            ? "Give it another try — if this keeps happening, let us know."
            : "Please close and reopen the app to continue."}
        </Text>
        {this.canReload && (
          <TouchableOpacity
            onPress={this.handleReload}
            activeOpacity={0.85}
            className="rounded-2xl bg-primary px-6 py-3"
          >
            <Text className="text-sm font-semibold text-white">Reload</Text>
          </TouchableOpacity>
        )}
      </SafeAreaView>
    );
  }
}
