import { TextInput } from 'react-native';

const AuthInput = ({
  placeholder,
  value,
  onChangeText,
  secureTextEntry,
  keyboardType,
  autoCapitalize,
  onBlur,
  maxLength,
}: {
  placeholder: string;
  value: string;
  onChangeText: (v: string) => void;
  secureTextEntry?: boolean;
  keyboardType?: "email-address" | "default" | "numeric" | "phone-pad" | "number-pad";
  autoCapitalize?: "none" | "sentences" | "words";
  onBlur?: () => void;
  maxLength?: number;
}) => (
  <TextInput
    className="w-full rounded-2xl px-4 py-4 text-white text-base"
    style={{
      backgroundColor: "rgba(255,255,255,0.08)",
      borderWidth: 1,
      borderColor: "rgba(255,255,255,0.10)",
    }}
    placeholder={placeholder}
    placeholderTextColor="rgba(255,255,255,0.35)"
    value={value}
    onChangeText={onChangeText}
    secureTextEntry={secureTextEntry}
    onBlur={onBlur}
    keyboardType={keyboardType ?? "default"}
    autoCapitalize={autoCapitalize ?? (secureTextEntry ? "none" : "sentences")}
    autoCorrect={false}
    maxLength={maxLength}
  />
);

export default AuthInput