import { router } from 'expo-router';
import { ArrowLeft } from 'lucide-react-native';
import { Text, TouchableOpacity, View } from 'react-native';

const GoBack = ({ title, showTitle = true, rightIcon: Icon, rightAction }: GoBackProps) => {
  return (
    <View className="flex-row items-center justify-between py-3">
      <TouchableOpacity
        onPress={() => router.back()}
        activeOpacity={0.8}
        className="h-10 w-10 items-center justify-center rounded-full bg-card border border-border"
      >
        <ArrowLeft color="#fff" size={16} strokeWidth={2} />
      </TouchableOpacity>
      {showTitle && <>
        <Text className="text-foreground text-lg font-bold">{title}</Text>
        {!Icon && <View className="w-10" />}
      </>}
      {Icon && <TouchableOpacity
        onPress={rightAction}
        activeOpacity={0.8}
        className="h-10 w-10 items-center justify-center rounded-full bg-card border border-border"
      >
        <Icon color="#fff" size={16} strokeWidth={2} />
      </TouchableOpacity>}
    </View>
  )
}

export default GoBack