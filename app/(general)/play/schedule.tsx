import GoBack from "@/components/shared/GoBack";
import { router } from "expo-router";
import {
  Bell,
  Calendar,
  Clock,
  Globe
} from "lucide-react-native";
import { styled } from "nativewind";
import { useState } from "react";
import {
  ScrollView,
  Switch,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView as RNSafeAreaView } from "react-native-safe-area-context";

const SafeAreaView = styled(RNSafeAreaView);

export default function ScheduleScreen() {
  const [reminders, setReminders] = useState({
    d1: true,
    h1: true,
    m15: false,
  });

  const dates = Array.from({ length: 7 }).map((_, i) => {
    const d = new Date();
    d.setDate(d.getDate() + i);
    return d;
  });

  const [pickedDate, setPickedDate] = useState(0);
  const [pickedTime, setPickedTime] = useState("21:00");

  return (
    <SafeAreaView className="flex-1 bg-background">
      <ScrollView
        className="flex-1"
        contentContainerStyle={{
          paddingHorizontal: 20,
          paddingTop: 20,
          paddingBottom: 140,
        }}
        showsVerticalScrollIndicator={false}
      >
        <GoBack title="Schedule Party" />
        {/* Date Selection */}
        <View className="mt-5 rounded-3xl border border-white/10 bg-card p-5">
          <View className="mb-3 flex-row items-center">
            <Calendar
              size={16}
              color="#B03BFF"
            />
            <Text className="ml-2 font-sans-semibold text-sm text-white">
              Pick a Date
            </Text>
          </View>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
          >
            {dates.map((date, index) => (
              <TouchableOpacity
                key={index}
                activeOpacity={0.85}
                onPress={() => setPickedDate(index)}
                className={`mr-2 min-w-18 rounded-2xl px-3 py-3 ${pickedDate === index
                  ? "bg-primary"
                  : "bg-secondary"
                  }`}
              >
                <Text
                  className={`text-center text-[10px] uppercase ${pickedDate === index
                    ? "text-white"
                    : "text-muted-foreground"
                    }`}
                >
                  {date.toLocaleDateString(undefined, {
                    weekday: "short",
                  })}
                </Text>
                <Text
                  className={`mt-1 text-center font-sg-bold text-xl ${pickedDate === index
                    ? "text-white"
                    : "text-white"
                    }`}
                >
                  {date.getDate()}
                </Text>
                <Text
                  className={`mt-1 text-center text-[10px] ${pickedDate === index
                    ? "text-white"
                    : "text-muted-foreground"
                    }`}
                >
                  {date.toLocaleDateString(undefined, {
                    month: "short",
                  })}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
        {/* Time Selection */}
        <View className="mt-4 rounded-3xl border border-white/10 bg-card p-5">
          <View className="mb-3 flex-row items-center">
            <Clock
              size={16}
              color="#FF8A2A"
            />
            <Text className="ml-2 font-sans-semibold text-sm text-white">
              Start Time
            </Text>
          </View>
          <View className="flex-row flex-wrap justify-between">
            {[
              "18:00",
              "19:00",
              "20:00",
              "21:00",
              "21:30",
              "22:00",
              "23:00",
              "00:00",
            ].map((time) => (
              <TouchableOpacity
                key={time}
                onPress={() => setPickedTime(time)}
                className={`mb-2 w-[23%] rounded-xl py-3 ${pickedTime === time
                  ? "bg-primary"
                  : "bg-secondary"
                  }`}
              >
                <Text
                  className={`text-center text-sm font-sans-semibold ${pickedTime === time
                    ? "text-white"
                    : "text-white/80"
                    }`}
                >
                  {time}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
        {/* Timezone */}
        <View className="mt-4 rounded-3xl border border-white/10 bg-card p-5">
          <View className="flex-row items-center justify-between">
            <View className="flex-row items-center">
              <Globe
                size={16}
                color="#D84CFF"
              />
              <Text className="ml-2 font-sans-semibold text-sm text-white">
                Timezone
              </Text>
            </View>
            <Text className="text-sm text-muted-foreground">
              GMT+1 • Lagos
            </Text>
          </View>
        </View>
        {/* Reminders */}
        <View className="mt-4 rounded-3xl border border-white/10 bg-card p-5">
          <View className="mb-3 flex-row items-center">
            <Bell
              size={16}
              color="#B03BFF"
            />
            <Text className="ml-2 font-sans-semibold text-sm text-white">
              Reminders
            </Text>
          </View>
          {[
            { key: "d1", label: "1 day before" },
            { key: "h1", label: "1 hour before" },
            { key: "m15", label: "15 minutes before" },
          ].map((item) => (
            <View
              key={item.key}
              className="flex-row items-center justify-between py-3"
            >
              <Text className="text-sm text-white">
                {item.label}
              </Text>
              <Switch
                value={
                  reminders[
                  item.key as keyof typeof reminders
                  ]
                }
                onValueChange={(value) =>
                  setReminders((prev) => ({
                    ...prev,
                    [item.key]: value,
                  }))
                }
                trackColor={{
                  false: "#333",
                  true: "#7A1EFF",
                }}
                thumbColor="#FFFFFF"
              />
            </View>
          ))}
        </View>
      </ScrollView>
      <View className="border-t border-white/10 bg-background px-5 pb-3 pt-2">
        <TouchableOpacity
          activeOpacity={0.9}
          onPress={() =>
            router.push({
              pathname: "/play/invite",
              params: {
                scheduledDate: dates[pickedDate].toISOString(),
                scheduledTime: pickedTime,
                reminders: JSON.stringify(reminders),
              },
            })
          }
          className="mt-6 h-14 items-center justify-center rounded-2xl bg-primary"
        >
          <Text className="font-sans-bold text-base text-white">
            Confirm Schedule
          </Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}