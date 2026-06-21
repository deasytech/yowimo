import clsx from 'clsx';
import { Href, Link } from 'expo-router';
import { Text, TouchableOpacity, View } from 'react-native';

const ListHeading = ({ title, titleSize, link, actionText, actionTextSize, iconSet, lucideIcon: Icon, iconColor, iconSize, iconStroke, verticalPadding }: ListHeadingProps) => {
  return (
    <View className={clsx('flex-1 flex-row items-center justify-between', verticalPadding ?? 'my-5')}>
      <View className='flex-row items-center gap-2'>
        {iconSet ? (
          <View className="h-2 w-2 rounded-full bg-accent" />
        ) : Icon ? (
          <Icon
            size={iconSize}
            color={iconColor}
            strokeWidth={iconStroke}
          />
        ) : null}
        <Text
          className={clsx(
            "font-sg-bold text-white",
            titleSize ?? "text-2xl"
          )}
        >{title}</Text>
      </View>
      {actionText && link &&
        <Link href={link as Href} asChild>
          <TouchableOpacity>
            <Text className={clsx('font-sans text-muted-foreground', actionTextSize ?? 'text-md')}>{actionText}</Text>
          </TouchableOpacity>
        </Link>
      }
    </View>
  )
}

export default ListHeading