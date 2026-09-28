import GoBack from "@/components/shared/GoBack";
import { useJoinParty, useLookupPartyByRoomCode } from "@/hooks/api/useParties";
import { ApiError } from "@/lib/api/types";
import { BarcodeScanningResult, CameraView, useCameraPermissions } from "expo-camera";
import { useRouter } from "expo-router";
import { ArrowLeft, Camera } from "lucide-react-native";
import { styled } from "nativewind";
import { useState } from "react";
import {
  ActivityIndicator,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from "react-native";
import { SafeAreaView as RNSafeAreaView } from "react-native-safe-area-context";

const SafeAreaView = styled(RNSafeAreaView);
const ROOM_CODE_MAX_LENGTH = 10;

// A party's own QR/room code belongs to that specific party (see the lobby's Copy/Share row and
// play/invite.tsx, both backed by the real room_code) — this screen is purely the *receiving*
// side: resolve whatever code someone hands you, then join.
export default function QRJoinScreen() {
  const router = useRouter();
  const [code, setCode] = useState("");
  const [error, setError] = useState("");
  const [isScanning, setIsScanning] = useState(false);
  const [isJoining, setIsJoining] = useState(false);
  const [permission, requestPermission] = useCameraPermissions();
  const lookupParty = useLookupPartyByRoomCode();
  const joinParty = useJoinParty();

  const joinWithCode = async (rawValue: string) => {
    // Accepts a bare code, or the last path segment of a shared link (e.g. .../p/ABC123).
    const normalizedCode = rawValue.trim().split("/").filter(Boolean).at(-1)?.toUpperCase();
    if (!normalizedCode) return;

    setIsScanning(false);
    setIsJoining(true);
    setError("");
    try {
      const party = await lookupParty.mutateAsync(normalizedCode);
      await joinParty.mutateAsync({ partyId: party.id, roomCode: normalizedCode });
      router.replace(`/lobby/${party.id}`);
    } catch (err) {
      setError(
        err instanceof ApiError && err.status === 404
          ? "Party code not found"
          : err instanceof ApiError
            ? err.message
            : "Couldn't join — please try again",
      );
    } finally {
      setIsJoining(false);
    }
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
    if (isJoining) return;
    joinWithCode(data);
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
        <GoBack title="Join with code" />

        <View className="mt-10 items-center px-4">
          <Text className="text-center text-sm text-muted-foreground">
            Ask the host for their party&apos;s room code, or scan the QR code they shared.
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
            onSubmitEditing={() => joinWithCode(code)}
            editable={!isJoining}
            placeholder="Enter party code"
            placeholderTextColor="rgba(255,255,255,0.40)"
            autoCapitalize="characters"
            autoCorrect={false}
            maxLength={ROOM_CODE_MAX_LENGTH}
            returnKeyType="go"
            className="mt-3 h-12 rounded-2xl border border-white/10 bg-secondary px-4 text-lg text-white"
          />
          {error ? (
            <Text className="mt-2 text-center text-xs text-red-400">{error}</Text>
          ) : null}
          <TouchableOpacity
            disabled={!code.trim() || isJoining}
            activeOpacity={0.9}
            onPress={() => joinWithCode(code)}
            className={`mt-3 h-12 items-center justify-center rounded-2xl bg-primary ${!code.trim() || isJoining ? "opacity-50" : ""}`}
          >
            {isJoining ? (
              <ActivityIndicator color="#fff" size={16} />
            ) : (
              <Text className="font-sans-bold text-sm text-white">
                Join Party
              </Text>
            )}
          </TouchableOpacity>
        </View>
      </ScrollView>
      <View className="border-t border-white/10 bg-background px-5 pb-3 pt-2">
        <TouchableOpacity
          onPress={openScanner}
          disabled={isJoining}
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
