import React from 'react';
import { Text, TouchableOpacity } from 'react-native';

const SocialBtn = ({
  label,
  icon,
  onPress,
  loading,
}: {
  label: string;
  icon: React.ReactNode;
  onPress: () => void;
  loading: boolean;
}) => (
  <TouchableOpacity
    onPress={onPress}
    activeOpacity={0.75}
    disabled={loading}
    className="flex-1 flex-row items-center justify-center gap-2 rounded-2xl py-3.5"
    style={{
      backgroundColor: "rgba(255,255,255,0.08)",
      borderWidth: 1,
      borderColor: "rgba(255,255,255,0.10)",
      opacity: loading ? 0.6 : 1,
    }}
  >
    {icon}
    <Text className="text-white font-semibold text-sm">
      {loading ? "Loading..." : label}
    </Text>
  </TouchableOpacity>
);

export default SocialBtn