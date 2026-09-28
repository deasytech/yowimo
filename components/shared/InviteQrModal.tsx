import { X } from "lucide-react-native";
import { Modal, Text, TouchableOpacity, View } from "react-native";
import QRCode from "react-native-qrcode-svg";

interface InviteQrModalProps {
  visible: boolean;
  onClose: () => void;
  inviteLink: string;
  roomCode: string;
  title?: string;
}

/** An actual scannable QR code for a party's invite link — shared between the lobby's "Show QR"
 * card and the invite screen's "QR code" share option, so there's finally something real for
 * qr-join.tsx's camera scanner to point at. */
export default function InviteQrModal({ visible, onClose, inviteLink, roomCode, title }: InviteQrModalProps) {
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View
        style={{ flex: 1, backgroundColor: "rgba(0,0,0,0.75)" }}
        className="items-center justify-center px-8"
      >
        <View className="w-full items-center rounded-3xl border border-border bg-card p-6">
          <TouchableOpacity
            onPress={onClose}
            activeOpacity={0.8}
            className="self-end h-8 w-8 items-center justify-center rounded-full bg-white/10"
          >
            <X color="#fff" size={16} />
          </TouchableOpacity>

          {title ? (
            <Text
              className="mt-1 text-foreground text-base font-semibold text-center"
              numberOfLines={1}
            >
              {title}
            </Text>
          ) : null}

          <View className="mt-4 rounded-2xl bg-white p-4">
            <QRCode value={inviteLink} size={220} backgroundColor="#fff" color="#000" />
          </View>

          <Text className="mt-4 text-violet-bright text-2xl font-black" style={{ letterSpacing: 6 }}>
            {roomCode}
          </Text>
          <Text className="mt-1 text-muted-foreground text-xs text-center">
            Have a friend scan this, or enter the code in Play → Join with code
          </Text>
        </View>
      </View>
    </Modal>
  );
}
