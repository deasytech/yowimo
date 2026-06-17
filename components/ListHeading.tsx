import { Link } from 'expo-router';
import { Text, TouchableOpacity, View } from 'react-native';

const ListHeading = ({ title, actionText, iconSet }: ListHeadingProps) => {
  return (
    <View className='flex-1 flex-row items-center justify-between my-5'>
      <View className='flex-row items-center gap-2'>
        {iconSet && <View className='h-2 w-2 rounded-full bg-accent' />}
        <Text className='font-sg-medium text-2xl text-white'>{title}</Text>
      </View>
      <Link href="/" asChild>
        <TouchableOpacity>
          <Text className='font-sans text-md text-muted-foreground'>{actionText}</Text>
        </TouchableOpacity>
      </Link>
    </View>
  )
}

export default ListHeading