import GoBack from '@/components/shared/GoBack';
import InviteQrModal from '@/components/shared/InviteQrModal';
import Toast from '@/components/shared/Toast';
import { useToast } from '@/hooks/useToast';
import * as Clipboard from 'expo-clipboard';
import * as Contacts from 'expo-contacts';
import { LinearGradient as RNLinearGradient } from 'expo-linear-gradient';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Copy, Link2, MessageCircle, QrCode, Search, Send, Share2, Users } from 'lucide-react-native';
import { styled } from 'nativewind';
import { useEffect, useMemo, useState } from 'react';
import { Linking, Platform, ScrollView, Share, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { SafeAreaView as RNSafeAreaView } from 'react-native-safe-area-context';

const SafeAreaView = styled(RNSafeAreaView);
const LinearGradient = styled(RNLinearGradient);

const channels = [
  { id: "wa", label: "WhatsApp", icon: MessageCircle, colors: ["#10B981", "#059669"] as const },
  { id: "tg", label: "Telegram", icon: Send, colors: ["#0EA5E9", "#0284C7"] as const },
  { id: "sms", label: "SMS", icon: MessageCircle, colors: ["#7A1EFF", "#A855F7"] as const },
  { id: "link", label: "Copy link", icon: Link2, colors: ["#D84CFF", "#FF8A2A"] as const },
  { id: "qr", label: "QR code", icon: QrCode, colors: ["#312E81", "#7A1EFF"] as const },
  { id: "more", label: "Share", icon: Share2, colors: ["#FF8A2A", "#D84CFF"] as const },
];

interface DeviceContact {
  id: string;
  name: string;
  initials: string;
  /** Digits (and leading +) only — good enough for sms:/whatsapp:// deep links. */
  phoneNumber: string;
}

type ContactsState = "loading" | "granted" | "denied";

function toInitials(name: string) {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");
}

const InviteFriendsScreen = () => {
  const router = useRouter();
  const { roomCode, title } = useLocalSearchParams<{
    roomCode?: string;
    title?: string;
    partyId?: string;
  }>();
  const hasLink = Boolean(roomCode);
  const inviteLink = hasLink ? `https://yowimo.app/p/${roomCode}` : '';
  const [picked, setPicked] = useState<string[]>([]);
  const [showQr, setShowQr] = useState(false);
  const [search, setSearch] = useState('');
  const [contactsState, setContactsState] = useState<ContactsState>("loading");
  const [contacts, setContacts] = useState<DeviceContact[]>([]);
  const [waCursor, setWaCursor] = useState(0);
  const [toastMessage, setToastMessage] = useState('Invite link copied');
  const toast = useToast();

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const { status } = await Contacts.requestPermissionsAsync();
        if (cancelled) return;
        if (status !== Contacts.PermissionStatus.GRANTED) {
          setContactsState("denied");
          return;
        }
        const { data } = await Contacts.getContactsAsync({
          fields: [Contacts.Fields.PhoneNumbers],
          sort: Contacts.SortTypes.FirstName,
        });
        if (cancelled) return;
        const withPhones = data.reduce<DeviceContact[]>((acc, c) => {
          const number = c.phoneNumbers?.find((p) => p.number)?.number;
          if (c.name && number) {
            acc.push({
              id: c.id ?? `${c.name}-${number}`,
              name: c.name,
              initials: toInitials(c.name),
              phoneNumber: number.replace(/[^\d+]/g, ''),
            });
          }
          return acc;
        }, []);
        setContacts(withPhones);
        setContactsState("granted");
      } catch {
        // Treat any permission/lookup failure the same as "no access" — the denied state
        // already offers a way out (Settings) rather than leaving the screen stuck loading.
        if (!cancelled) setContactsState("denied");
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const filteredContacts = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return contacts;
    return contacts.filter((c) => c.name.toLowerCase().includes(q));
  }, [contacts, search]);

  const pickedContacts = useMemo(
    () => contacts.filter((c) => picked.includes(c.id)),
    [contacts, picked],
  );

  const toggle = (id: string) => setPicked((p) => p.includes(id) ? p.filter(x => x !== id) : [...p, id]);

  const copyInviteLink = async () => {
    if (!hasLink) return;
    await Clipboard.setStringAsync(inviteLink);
    setToastMessage('Invite link copied');
    toast.showToast();
  };

  const buildMessage = () =>
    title
      ? `Join my Yowimo party "${title}": ${inviteLink}`
      : `Join my Yowimo party: ${inviteLink}`;

  /** iOS accepts a comma-joined recipient list in one `sms:` intent (a real group text); Android
   * only reliably honours the first recipient, but still opens Messages pre-filled with the body,
   * which beats the generic share sheet. */
  const sendSms = (numbers: string[]) => {
    const body = encodeURIComponent(buildMessage());
    const recipients = numbers.join(',');
    const separator = Platform.OS === 'ios' ? '&' : '?';
    return Linking.openURL(`sms:${recipients}${separator}body=${body}`).catch(() => {
      setToastMessage("Couldn't open Messages");
      toast.showToast();
    });
  };

  /** WhatsApp's deep link only ever targets one chat — cycle through the picked contacts one tap
   * at a time rather than pretending we can fan this out in a single action. */
  const sendWhatsApp = async () => {
    if (pickedContacts.length === 0) {
      return Share.share({ message: buildMessage(), url: inviteLink });
    }
    const index = waCursor % pickedContacts.length;
    const contact = pickedContacts[index];
    const phone = contact.phoneNumber.replace(/[^\d]/g, '');
    const text = encodeURIComponent(buildMessage());
    try {
      await Linking.openURL(`whatsapp://send?phone=${phone}&text=${text}`);
    } catch {
      setToastMessage('WhatsApp not installed');
      toast.showToast();
      return;
    }
    setWaCursor(index + 1);
    if (pickedContacts.length > 1) {
      const next = pickedContacts[(index + 1) % pickedContacts.length];
      setToastMessage(`Opened chat with ${contact.name}. Tap WhatsApp again for ${next.name}.`);
      toast.showToast();
    }
  };

  const shareInvite = (channel: string) => {
    if (!hasLink) return;
    if (channel === 'link') return copyInviteLink();
    if (channel === 'qr') {
      setShowQr(true);
      return;
    }
    if (channel === 'sms') {
      return sendSms(pickedContacts.length > 0 ? pickedContacts.map((c) => c.phoneNumber) : []);
    }
    if (channel === 'wa') {
      return sendWhatsApp();
    }
    // Telegram has no phone-targeted deep link, and "Share" is intentionally generic either way.
    return Share.share({ message: buildMessage(), url: inviteLink });
  };

  return (
    <SafeAreaView className="flex-1 bg-background">
      <Toast
        opacity={toast.opacity}
        isVisible={toast.isVisible}
        message={toastMessage}
      />
      {hasLink && (
        <InviteQrModal
          visible={showQr}
          onClose={() => setShowQr(false)}
          inviteLink={inviteLink}
          roomCode={roomCode ?? ""}
          title={title}
        />
      )}
      <ScrollView
        className="flex-1"
        contentContainerStyle={{
          paddingHorizontal: 20,
          paddingBottom: 24,
        }}
        showsVerticalScrollIndicator={false}
      >
        <GoBack title='Invite Friends' />

        {/* Party Hero Card */}
        <LinearGradient
          colors={["#7A1EFF", "#D84CFF", "#FF8A2A"]}
          className="mt-4 overflow-hidden rounded-3xl p-5"
        >
          <View className="absolute -right-10 -top-10 h-40 w-40 rounded-full bg-white/10" />

          <Text className="text-xs font-sans-bold uppercase tracking-wider text-white/80">
            Inviting to
          </Text>

          <Text
            numberOfLines={1}
            className="mt-1 text-2xl font-sans-bold text-white"
          >
            {title || 'Your party'}
          </Text>

          <View className="mt-3 flex-row items-center justify-between">
            <Text
              numberOfLines={1}
              className="flex-1 text-sm text-white/70"
            >
              {hasLink ? inviteLink.replace('https://', '') : 'Link unavailable for this party'}
            </Text>

            <TouchableOpacity
              onPress={copyInviteLink}
              disabled={!hasLink}
              style={{ opacity: hasLink ? 1 : 0.5 }}
              className="ml-3 h-10 w-10 items-center justify-center rounded-xl border border-white/15 bg-white/10"
            >
              <Copy color="#fff" size={16} />
            </TouchableOpacity>
          </View>
        </LinearGradient>

        {/* Share Channels */}
        <View className="mt-6">
          <Text className="mb-1 text-lg font-sans-bold text-white">
            Share Via
          </Text>
          {pickedContacts.length > 0 && (
            <Text className="mb-3 text-xs text-muted-foreground">
              WhatsApp and SMS will go straight to your {pickedContacts.length} selected contact{pickedContacts.length === 1 ? '' : 's'}.
            </Text>
          )}

          <View className="mt-3 flex-row flex-wrap">
            {channels.map((item) => (
              <TouchableOpacity
                key={item.id}
                onPress={() => shareInvite(item.id)}
                disabled={!hasLink}
                activeOpacity={0.8}
                style={{ opacity: hasLink ? 1 : 0.4 }}
                className="mb-5 w-1/3 items-center"
              >
                <LinearGradient
                  colors={item.colors}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  className="h-16 w-16 items-center justify-center rounded-2xl"
                >
                  <item.icon
                    color="#fff"
                    size={24}
                    strokeWidth={2.3}
                  />
                </LinearGradient>

                <Text className="mt-2 text-center text-xs text-white/80">
                  {item.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Contacts List */}
        <View className="mt-4">
          <View className="mb-4 flex-row items-center justify-between">
            <Text className="text-lg font-sans-bold text-white">
              From Your Contacts
            </Text>

            <Text className="text-sm text-muted-foreground">
              {picked.length} selected
            </Text>
          </View>

          {contactsState === "denied" && (
            <View className="items-center rounded-2xl border border-white/10 bg-card p-6">
              <Users color="rgba(255,255,255,0.4)" size={28} />
              <Text className="mt-2 text-center text-sm text-muted-foreground">
                Allow contacts access to invite people straight from your phone book.
              </Text>
              <TouchableOpacity
                onPress={() => Linking.openSettings()}
                activeOpacity={0.8}
                className="mt-3 rounded-xl border border-white/15 bg-white/10 px-4 py-2"
              >
                <Text className="text-xs font-sans-semibold text-white">Open Settings</Text>
              </TouchableOpacity>
            </View>
          )}

          {contactsState === "loading" && (
            <Text className="text-center text-sm text-muted-foreground">Loading contacts…</Text>
          )}

          {contactsState === "granted" && contacts.length === 0 && (
            <Text className="text-center text-sm text-muted-foreground">
              No contacts with phone numbers found.
            </Text>
          )}

          {contactsState === "granted" && contacts.length > 0 && (
            <>
              <View className="mb-4 flex-row items-center rounded-2xl border border-white/10 bg-secondary px-3">
                <Search color="rgba(255,255,255,0.4)" size={16} />
                <TextInput
                  value={search}
                  onChangeText={setSearch}
                  placeholder="Search contacts"
                  placeholderTextColor="rgba(255,255,255,0.40)"
                  className="ml-2 h-11 flex-1 text-sm text-white"
                />
              </View>

              {filteredContacts.map((contact) => {
                const selected = picked.includes(contact.id);

                return (
                  <TouchableOpacity
                    key={contact.id}
                    onPress={() => toggle(contact.id)}
                    activeOpacity={0.8}
                    className={`mb-3 flex-row items-center rounded-2xl border p-3 ${selected
                      ? "border-violet-bright bg-violet/20"
                      : "border-transparent bg-card"
                      }`}
                  >
                    <LinearGradient
                      colors={["#7A1EFF", "#D84CFF"]}
                      className="h-11 w-11 items-center justify-center rounded-full"
                    >
                      <Text className="font-sans-bold text-white">
                        {contact.initials}
                      </Text>
                    </LinearGradient>

                    <View className="ml-3 flex-1">
                      <Text className="font-sans-semibold text-white">
                        {contact.name}
                      </Text>

                      <Text className="text-xs text-muted-foreground">
                        {contact.phoneNumber}
                      </Text>
                    </View>

                    <View
                      className={`h-6 w-6 items-center justify-center rounded-full border-2 ${selected
                        ? "border-violet-bright bg-violet-bright"
                        : "border-muted"
                        }`}
                    >
                      {selected && (
                        <Text className="text-xs font-bold text-white">
                          ✓
                        </Text>
                      )}
                    </View>
                  </TouchableOpacity>
                );
              })}
            </>
          )}
        </View>

      </ScrollView>

      {/* CTA Button */}
      <View className="border-t border-white/10 bg-background px-5 pb-3 pt-4">
        <LinearGradient
          colors={["#7A1EFF", "#D84CFF", "#FF8A2A"]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          className="overflow-hidden rounded-2xl"
        >
          <TouchableOpacity
            className="h-14 items-center justify-center"
            activeOpacity={0.9}
            onPress={async () => {
              if (picked.length > 0 && hasLink) {
                // Stay put so the success/failure toast is actually visible instead of being
                // immediately covered by whatever screen we navigate back to.
                await sendSms(pickedContacts.map((c) => c.phoneNumber));
                return;
              }
              router.back();
            }}
          >
            <Text className="text-base font-sans-bold text-white">
              Send Invites ({picked.length || "Skip"})
            </Text>
          </TouchableOpacity>
        </LinearGradient>
      </View>
    </SafeAreaView>
  )
}

export default InviteFriendsScreen
