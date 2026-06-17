import React from "react";
import { Image } from "react-native";

import iconMark from "@/assets/images/yowimo-icon.png";
import logoFull from "@/assets/images/yowimo-logo.png";

interface YowimoLogoProps {
  size?: number;
  showWordmark?: boolean;
}

export function YowimoLogo({
  size = 48,
  showWordmark = false,
}: YowimoLogoProps) {
  if (showWordmark) {
    return (
      <Image
        source={logoFull}
        resizeMode="contain"
        style={{
          width: size,
          height: size,
        }}
      />
    );
  }

  return (
    <Image
      source={iconMark}
      resizeMode="contain"
      style={{
        width: size,
        height: size,
      }}
    />
  );
}