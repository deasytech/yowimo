import clsx from 'clsx';
import { LinearGradient as RNLinearGradient } from 'expo-linear-gradient';
import { Link } from 'expo-router';
import { styled } from 'nativewind';
import { Image, Text, TouchableOpacity, View } from 'react-native';

const LinearGradient = styled(RNLinearGradient);

const QuickDiscoverCard = ({ data }: { data: PartyProps }) => {
  return (
    <Link href='/' asChild>
      <TouchableOpacity
        activeOpacity={0.85}
        className='w-72 mr-4 overflow-hidden bg-[#1C1C26] rounded-3xl'
      >
        <View className='h-44 overflow-hidden'>
          {data.image ? (
            <Image source={data.image} className='absolute inset-0 h-full w-full object-cover' resizeMode="cover" />
          ) : (
            <LinearGradient colors={["#7A1EFF", "#D84CFF"]} className='flex-1' />
          )}
          <LinearGradient
            colors={["transparent", "rgba(13,13,18,0.60)"]}
            style={{ position: "absolute", bottom: 0, left: 0, right: 0, height: 80 }}
          />
          <View className='absolute top-4 left-4 right-4 flex-row items-center justify-between'>
            <View className='rounded-full px-2.5 py-1.5 bg-background/70'>
              <Text className='text-white text-xs font-sans-bold uppercase tracking-wide'>
                {data.isLive ? "🔴 Live" : data.startsIn}
              </Text>
            </View>
            <View className="rounded-full border border-white/10 bg-white/15 px-3 py-1">
              <Text className="text-xs font-sans-semibold uppercase tracking-wide text-white">
                {data.mode}
              </Text>
            </View>
          </View>
        </View>

        <View className="bg-card p-4">
          <Text className="text-sm font-medium text-muted-foreground">
            {data.type}
          </Text>

          <Text className="mt-0.5 text-base font-bold leading-5 text-foreground" numberOfLines={1}>
            {data.title}
          </Text>

          <View className="mt-3 flex-row items-center justify-between">
            <View className='flex-row'>
              {[0, 1, 2].map((i) => (
                <LinearGradient
                  key={i}
                  colors={["#7A1EFF", "#D84CFF"]}
                  className={clsx('w-7 h-7 items-center justify-center rounded-full border-2 border-[#1C1C26]') + (i === 0 ? '' : ' -ml-2')}
                >
                  <Text style={{ color: "#fff", fontSize: 10, fontWeight: "700" }}>
                    {data.hostAvatar?.[i] ?? "+"}
                  </Text>
                </LinearGradient>
              ))}
            </View>

            <Text className="text-xs font-medium text-muted-foreground">
              {data.players}/{data.maxPlayers}
            </Text>
          </View>
        </View>
      </TouchableOpacity>
    </Link>
  )
}

export default QuickDiscoverCard