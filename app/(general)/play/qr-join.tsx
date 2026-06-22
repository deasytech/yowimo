import GoBack from "@/components/shared/GoBack";
import { BarcodeScanningResult, CameraView, useCameraPermissions } from "expo-camera";
import { router } from "expo-router";
import { ArrowLeft, Camera } from "lucide-react-native";
import { styled } from "nativewind";
import { useState } from "react";
import {
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from "react-native";
import QRCode from "react-native-qrcode-svg";
import { SafeAreaView as RNSafeAreaView } from "react-native-safe-area-context";

const SafeAreaView = styled(RNSafeAreaView);
const PARTY_CODE = "FRD9X2";

export default function QRJoinScreen() {
  const [code, setCode] = useState("");
  const [error, setError] = useState("");
  const [isScanning, setIsScanning] = useState(false);
  const [permission, requestPermission] = useCameraPermissions();

  const joinParty = (value = code) => {
    const normalizedCode = value.trim().split("/").filter(Boolean).at(-1)?.toUpperCase();

    if (normalizedCode !== PARTY_CODE) {
      setIsScanning(false);
      setError("Party code not found");
      return;
    }

    setIsScanning(false);
    router.push("/lobby/p1");
  };

  const openScanner = async () => {
    const cameraPermission = permission?.granted
      ? permission
      : await requestPermission();

    if (!cameraPermission.granted) {
      setError("Camera permission is required to scan a QR code");
      return;
    }

    setError("");
    setIsScanning(true);
  };

  const handleBarcodeScanned = ({ data }: BarcodeScanningResult) => {
    joinParty(data);
  };

  if (isScanning) {
    return (
      <SafeAreaView className="flex-1 bg-background">
        <View className="flex-row items-center px-5 py-3">
          <TouchableOpacity
            onPress={() => setIsScanning(false)}
            className="h-10 w-10 items-center justify-center rounded-full bg-black/40"
          >
            <ArrowLeft size={18} color="#FFFFFF" />
          </TouchableOpacity>
          <Text className="ml-4 font-sg-bold text-lg text-white">Scan party QR</Text>
        </View>
        <CameraView
          style={{ flex: 1 }}
          facing="back"
          barcodeScannerSettings={{ barcodeTypes: ["qr"] }}
          onBarcodeScanned={handleBarcodeScanned}
        />
        <Text className="px-5 py-5 text-center text-sm text-muted-foreground">
          Point your camera at a Yowimo party QR code
        </Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-background">
      <ScrollView
        className="flex-1"
        contentContainerStyle={{
          paddingHorizontal: 20,
          paddingBottom: 100,
        }}
        showsVerticalScrollIndicator={false}
      >
        <GoBack title="Join with QR" />
        {/* QR Section */}
        <View className="mt-8 items-center">
          <View className="relative h-64 w-64 items-center justify-center rounded-3xl border border-primary/40 bg-background">
            <QRCode
              value={`https://yowimo.app/join/${PARTY_CODE}`}
              size={200}
              backgroundColor="transparent"
              color="#FFFFFF"
            />
            {/* Scanner Corners */}
            <View className="absolute left-2 top-2 h-8 w-8 rounded-tl-xl border-l-4 border-t-4 border-primary" />
            <View className="absolute right-2 top-2 h-8 w-8 rounded-tr-xl border-r-4 border-t-4 border-[#D84CFF]" />
            <View className="absolute bottom-2 left-2 h-8 w-8 rounded-bl-xl border-b-4 border-l-4 border-accent" />
            <View className="absolute bottom-2 right-2 h-8 w-8 rounded-br-xl border-b-4 border-r-4 border-[#D84CFF]" />
          </View>
          <Text className="mt-5 font-sg-extrabold text-3xl text-white">
            {PARTY_CODE}
          </Text>
          <Text className="mt-2 text-center text-sm text-muted-foreground">
            Show this to friends or scan one yourself
          </Text>
        </View>
        {/* Enter Code */}
        <View className="mt-8 rounded-3xl border border-white/10 bg-card p-5">
          <Text className="font-sg-bold text-base text-white">
            Have a code?
          </Text>
          <TextInput
            value={code}
            onChangeText={(value) => {
              setCode(value);
              setError("");
            }}
            onSubmitEditing={() => joinParty()}
            placeholder="Enter party code"
            placeholderTextColor="rgba(255,255,255,0.40)"
            autoCapitalize="characters"
            autoCorrect={false}
            maxLength={PARTY_CODE.length}
            returnKeyType="go"
            className="mt-3 h-12 rounded-2xl border border-white/10 bg-secondary px-4 text-lg text-white"
          />
          {error ? (
            <Text className="mt-2 text-center text-xs text-red-400">{error}</Text>
          ) : null}
          <TouchableOpacity
            disabled={!code.trim()}
            activeOpacity={0.9}
            onPress={() => joinParty()}
            className={`mt-3 h-12 items-center justify-center rounded-2xl bg-primary ${!code.trim() ? "opacity-50" : ""}`}
          >
            <Text className="font-sans-bold text-sm text-white">
              Join Party
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
      <View className="border-t border-white/10 bg-background px-5 pb-3 pt-2">
        <TouchableOpacity
          onPress={openScanner}
          activeOpacity={0.9}
          className="mt-4 flex-row items-center justify-center rounded-2xl border border-white/10 bg-secondary py-3"
        >
          <Camera
            size={16}
            color="#FFFFFF"
          />
          <Text className="ml-2 font-sans-semibold text-sm text-white">
            Scan with Camera
          </Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}
