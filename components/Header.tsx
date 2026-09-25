import { TokenBadge } from "@/components/brand/TokenBadge";
import { YowimoLogo } from "@/components/brand/YowimoLogo";
import { useWallet } from "@/hooks/api/useWallet";
import { BlurView as RNBlurView } from "expo-blur";
import { Link } from "expo-router";
import { Bell, Search } from "lucide-react-native";
import { styled } from "nativewind";
import { Text, TouchableOpacity, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const BlurView = styled(RNBlurView);

// Logo row height (size passed to YowimoLogo below) + the header's own bottom padding (pb-3).
// Kept in sync with the BlurView's content below — used by screens that render this floating
// header to offset content/pull-to-refresh so it isn't drawn underneath the blur.
const HEADER_CONTENT_HEIGHT = 56 + 12;

/** Total on-screen height of the floating header, including the device's safe-area top inset. */
export const useHeaderHeight = () => {
  const insets = useSafeAreaInsets();
  return Math.max(insets.top, 16) + HEADER_CONTENT_HEIGHT;
};

const IconBtn = ({ children }: { children: React.ReactNode }) => (
  <View
    className="h-10 w-10 items-center justify-center rounded-full border border-white/10"
    style={{ backgroundColor: "rgba(255,255,255,0.10)" }}
  >
    {children}
  </View>
);

const Header = ({
  title,
  showLogo = true,
}: AppHeaderProps) => {
  const insets = useSafeAreaInsets();
  const { data: wallet } = useWallet();

  return (
    <BlurView
      intensity={60}
      className="absolute left-0 right-0 top-0 z-50 flex-row items-center justify-between px-5 pb-3 bg-primary/20"
      style={{
        paddingTop: Math.max(insets.top, 16),
      }}
    >
      <View className="flex-row items-center gap-2">
        {showLogo && <YowimoLogo showWordmark={true} size={56} />}
        {title && !showLogo && (
          <Text className="text-2xl font-bold text-white">{title}</Text>
        )}
      </View>

      <View className="flex-row items-center gap-2">

        <Link href="/wallet" asChild>
          <TouchableOpacity activeOpacity={0.8}>
            <TokenBadge amount={wallet?.balance ?? 0} />
          </TouchableOpacity>
        </Link>

        <Link href="/discover" asChild>
          <TouchableOpacity activeOpacity={0.8}>
            <IconBtn>
              <Search color="#fff" size={16} strokeWidth={2} />
            </IconBtn>
          </TouchableOpacity>
        </Link>

        <Link href="/notifications" asChild>
          <TouchableOpacity activeOpacity={0.8}>
            <IconBtn>
              <Bell color="#fff" size={16} strokeWidth={2} />
              <View
                className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-accent border-2 border-accent"
              />
            </IconBtn>
          </TouchableOpacity>
        </Link>

      </View>
    </BlurView>
  )
}

export default Header