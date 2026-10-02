import { router } from 'expo-router';
import { ArrowLeft } from 'lucide-react-native';
import { Text, TouchableOpacity, View } from 'react-native';

// Several flows land here via router.replace(...) (e.g. create-party -> lobby), which drops the
// screen that would normally be "back" — calling router.back() with nothing left in the stack
// throws the unhandled GO_BACK warning. Fall back to home instead of assuming a prior screen.
const goBack = () => (router.canGoBack() ? router.back() : router.replace("/(tabs)"));

const GoBack = ({ title, showTitle = true, rightIcon: Icon, rightAction, rightText }: GoBackProps) => {
  return (
    <View className="relative flex-row items-center py-3">
      <TouchableOpacity
        onPress={goBack}
        activeOpacity={0.8}
        accessibilityRole="button"
        accessibilityLabel="Go back"
        className="h-10 w-10 items-center justify-center rounded-full bg-card border border-border"
      >
        <ArrowLeft color="#fff" size={16} strokeWidth={2} />
      </TouchableOpacity>
      {showTitle && (
        <View
          pointerEvents="none"
          className="absolute inset-0 items-center justify-center px-12"
        >
          <Text numberOfLines={1} className="text-foreground text-lg font-bold">
            {title}
          </Text>
        </View>
      )}
      <View className="ml-auto items-end">
        {Icon ? (
          <TouchableOpacity
            onPress={rightAction}
            activeOpacity={0.8}
            accessibilityRole="button"
            accessibilityLabel="Header action"
            disabled={!rightAction}
            className="h-10 w-10 items-center justify-center rounded-full bg-card border border-border"
          >
            <Icon color="#fff" size={16} strokeWidth={2} />
          </TouchableOpacity>
        ) : rightText ? (
          <Text className="text-xs text-muted-foreground">{rightText}</Text>
        ) : null}
      </View>
    </View>
  )
}

export default GoBack
