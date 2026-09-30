import Avatar from "@/components/shared/Avatar";
import { Text, View } from "react-native";

interface CrewOnlineProps {
  id: number;
  name: string;
  initials: string;
  avatarUrl?: string | null;
}

// No presence/online data exists server-side (see the API implementation plan's note on this
// rail) — this just previews a real friend, with no online dot pretending to know status.
const CrewOnline = ({ name, initials, avatarUrl }: CrewOnlineProps) => {
  return (
    <View className="w-16 items-center">
      <Avatar avatarUrl={avatarUrl} initials={initials} size={56} />
      <Text
        numberOfLines={1}
        className="mt-2 text-[10px] font-sans-medium text-muted-foreground"
      >
        {name.split(" ")[0]}
      </Text>
    </View>
  );
};

export default CrewOnline;
