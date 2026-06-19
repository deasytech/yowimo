import AuthInput from "@/components/shared/AuthInput";
import SocialBtn from "@/components/shared/SocialBtn";
import { navigateHome } from "@/lib/utils";
import { useAuth, useSignUp, useSSO } from "@clerk/expo";
import { LinearGradient } from "expo-linear-gradient";
import * as Linking from "expo-linking";
import { Link, useRouter } from "expo-router";
import * as WebBrowser from "expo-web-browser";
import { Apple, ArrowLeft } from "lucide-react-native";
import React, { useState } from "react";
import {
  Image,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

WebBrowser.maybeCompleteAuthSession();

type SSOStrategy = "oauth_google" | "oauth_apple";

// ─── Google icon ──────────────────────────────────────────────────────────────
const GoogleIcon = () => (
  <Text style={{ fontSize: 14, fontWeight: "700", color: "#fff" }}>G</Text>
);

// ─── Sign Up ──────────────────────────────────────────────────────────────────
export default function SignUpScreen() {
  const { signUp, errors, fetchStatus } = useSignUp();
  const { isSignedIn } = useAuth();
  const { startSSOFlow } = useSSO();
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [code, setCode] = useState("");
  const [authError, setAuthError] = useState("");
  const [ssoLoading, setSsoLoading] = useState(false);

  const isLoading = fetchStatus === "fetching";

  // Validation
  const [emailTouched, setEmailTouched] = useState(false);
  const [passwordTouched, setPasswordTouched] = useState(false);
  const emailValid =
    email.length === 0 || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  const passwordValid = password.length === 0 || password.length >= 8;
  const formValid = email.length > 0 && password.length >= 8 && emailValid;

  // ─── Determine current step from Clerk status (single source of truth) ───
  const isVerifyStep =
    signUp.status === "missing_requirements" &&
    signUp.unverifiedFields.includes("email_address") &&
    signUp.missingFields.length === 0;

  // ─── Step 1: Create account ───────────────────────────────────────────────
  const handleSubmit = async () => {
    if (!formValid) return;

    const { error } = await signUp.password({
      emailAddress: email,
      password,
    });

    if (error) {
      console.error(JSON.stringify(error, null, 2));
      return;
    }

    await signUp.verifications.sendEmailCode();
    // No setStep needed — signUp.status will now be "missing_requirements"
    // which flips isVerifyStep to true and shows the verify screen automatically
  };

  // ─── Step 2: Verify email ─────────────────────────────────────────────────
  const handleVerify = async () => {
    const { error } = await signUp.verifications.verifyEmailCode({ code });
    if (error) {
      console.error("Email verification failed:", error);
      return;
    }

    if (signUp.status === "complete") {
      await signUp.finalize({
        navigate: ({ session, decorateUrl }) => {
          if (session?.currentTask) return;
          navigateHome(decorateUrl);
        },
      });
    } else {
      console.error("Sign-in not complete:", signUp);
    }
  };

  const handleSSO = async (strategy: SSOStrategy) => {
    setAuthError("");
    setSsoLoading(true);
    try {
      const { createdSessionId, setActive } = await startSSOFlow({
        strategy,
        redirectUrl: Linking.createURL("/"),
      });
      if (createdSessionId && setActive) {
        await setActive({ session: createdSessionId });
        router.replace("/");
      }
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Unknown SSO sign-up error";
      console.log(message)
      console.error("SSO sign-up failed", err);
      setAuthError("Couldn't continue with social sign up. Please try again.");
    } finally {
      setSsoLoading(false);
    }
  };

  if (signUp.status === "complete" || isSignedIn) return null;

  // ── Purple glow (shared between both steps) ───────────────────────────────
  const PurpleGlow = () => (
    <View
      style={{
        position: "absolute",
        top: -60,
        left: "50%",
        marginLeft: -180,
        width: 360,
        height: 360,
        borderRadius: 180,
        backgroundColor: "#4C1D95",
        opacity: 0.55,
      }}
    />
  );

  // ── Verify screen ─────────────────────────────────────────────────────────
  if (isVerifyStep) {
    return (
      <View className="flex-1 bg-background">
        <PurpleGlow />
        <KeyboardAvoidingView
          className="flex-1"
          behavior={Platform.OS === "ios" ? "padding" : "height"}
        >
          <ScrollView
            contentContainerStyle={{
              flexGrow: 1,
              paddingTop: insets.top,
              paddingBottom: insets.bottom + 24,
            }}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            {/* Back — resets signUp so status goes back to null */}
            <TouchableOpacity
              onPress={() => signUp.reset?.()}
              activeOpacity={0.7}
              className="flex-row items-center gap-1.5 px-5 py-4"
            >
              <ArrowLeft color="rgba(255,255,255,0.70)" size={16} strokeWidth={2} />
              <Text className="text-white/70 text-sm font-medium">Back</Text>
            </TouchableOpacity>

            <View className="items-center mt-4 mb-8 px-5 gap-4">
              <Image
                source={require("@/assets/images/yowimo-icon.png")}
                className="w-20 h-20"
                resizeMode="contain"
              />
              <View className="items-center gap-1">
                <Text className="text-white text-3xl font-bold tracking-tight">
                  Check your email
                </Text>
                <Text className="text-white/50 text-sm text-center">
                  We sent a code to {email}
                </Text>
              </View>
            </View>

            <View className="px-5 gap-3">
              <AuthInput
                placeholder="6-digit verification code"
                value={code}
                onChangeText={setCode}
                keyboardType="numeric"
              />
              {errors.fields.code && (
                <Text className="text-red-400 text-xs ml-1">
                  {errors.fields.code.message}
                </Text>
              )}

              <TouchableOpacity
                onPress={handleVerify}
                activeOpacity={0.85}
                disabled={code.length < 6 || fetchStatus === "fetching"}
                style={{ marginTop: 4 }}
              >
                <LinearGradient
                  colors={["#7A1EFF", "#D84CFF", "#FF8A2A"]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={{
                    borderRadius: 16,
                    paddingVertical: 16,
                    alignItems: "center",
                    opacity:
                      fetchStatus === "fetching" || code.length < 6 ? 0.6 : 1,
                  }}
                >
                  <Text className="text-white font-bold text-base">
                    {fetchStatus === "fetching" ? "Verifying..." : "Verify email"}
                  </Text>
                </LinearGradient>
              </TouchableOpacity>

              <TouchableOpacity
                activeOpacity={0.7}
                className="items-center py-3"
                onPress={() => signUp.verifications.sendEmailCode()}
                disabled={isLoading}
              >
                <Text className="text-violet text-sm font-semibold">
                  Resend code
                </Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </View>
    );
  }

  // ── Details screen (default) ──────────────────────────────────────────────
  return (
    <View className="flex-1 bg-background">
      <PurpleGlow />
      <KeyboardAvoidingView
        className="flex-1"
        behavior={Platform.OS === "ios" ? "padding" : "height"}
      >
        <ScrollView
          contentContainerStyle={{
            flexGrow: 1,
            paddingTop: insets.top,
            paddingBottom: insets.bottom + 24,
          }}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <TouchableOpacity
            onPress={() => router.back()}
            activeOpacity={0.7}
            className="flex-row items-center gap-1.5 px-5 py-4"
          >
            <ArrowLeft color="rgba(255,255,255,0.70)" size={16} strokeWidth={2} />
            <Text className="text-white/70 text-sm font-medium">Back</Text>
          </TouchableOpacity>

          <View className="items-center mt-4 mb-8 px-5 gap-4">
            <Image
              source={require("@/assets/images/yowimo-icon.png")}
              className="w-20 h-20"
              resizeMode="contain"
            />
            <View className="items-center gap-1">
              <Text className="text-white text-3xl font-bold tracking-tight">
                Create account
              </Text>
              <Text className="text-white/50 text-sm text-center">
                Join the crew. It only takes a minute.
              </Text>
            </View>
          </View>

          <View className="px-5 gap-3">
            <View>
              <AuthInput
                placeholder="Email address"
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
                onBlur={() => setEmailTouched(true)}
              />
              {emailTouched && !emailValid && (
                <Text className="text-red-400 text-xs mt-1 ml-1">
                  Please enter a valid email address
                </Text>
              )}
              {errors.fields.emailAddress && (
                <Text className="text-red-400 text-xs mt-1 ml-1">
                  {errors.fields.emailAddress.message}
                </Text>
              )}
            </View>

            <View>
              <AuthInput
                placeholder="Password"
                value={password}
                onChangeText={setPassword}
                secureTextEntry
                onBlur={() => setPasswordTouched(true)}
              />
              {passwordTouched && !passwordValid ? (
                <Text className="text-red-400 text-xs mt-1 ml-1">
                  Password must be at least 8 characters
                </Text>
              ) : (
                !passwordTouched && (
                  <Text className="text-white/30 text-xs mt-1 ml-1">
                    Minimum 8 characters required
                  </Text>
                )
              )}
              {errors.fields.password && (
                <Text className="text-red-400 text-xs mt-1 ml-1">
                  {errors.fields.password.message}
                </Text>
              )}
            </View>

            <TouchableOpacity
              onPress={handleSubmit}
              activeOpacity={0.85}
              disabled={!formValid || isLoading}
              style={{ marginTop: 4 }}
            >
              <LinearGradient
                colors={["#7A1EFF", "#D84CFF", "#FF8A2A"]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={{
                  borderRadius: 16,
                  paddingVertical: 16,
                  alignItems: "center",
                  opacity: isLoading || !formValid ? 0.6 : 1,
                }}
              >
                <Text className="text-white font-bold text-base">
                  {isLoading
                    ? "Creating account..."
                    : "Create account"}
                </Text>
              </LinearGradient>
            </TouchableOpacity>

            <View nativeID="clerk-captcha" />

            {/* Divider */}
            <View className="flex-row items-center gap-3 my-2">
              <View className="flex-1 h-px bg-white/10" />
              <Text className="text-white/40 text-xs">or continue with</Text>
              <View className="flex-1 h-px bg-white/10" />
            </View>

            {/* Social */}
            <View className="flex-row gap-3">
              <SocialBtn
                label="Google"
                icon={<GoogleIcon />}
                onPress={() => handleSSO("oauth_google")}
                loading={ssoLoading}
              />
              <SocialBtn
                label="Apple"
                icon={<Apple color="#fff" size={16} strokeWidth={2} />}
                onPress={() => handleSSO("oauth_apple")}
                loading={ssoLoading}
              />
            </View>

            {authError ? (
              <Text className="text-sm text-red-500 mb-2">{authError}</Text>
            ) : null}
          </View>

          {/* Footer */}
          <View className="flex-1 justify-end px-5 mt-10 gap-2">
            <Text className="text-white/40 text-xs text-center">
              {"By continuing you agree to Yowimo's "}
              <Text className="text-violet">Terms</Text>
              {" & "}
              <Text className="text-violet">Privacy</Text>.
            </Text>
            <View className="flex-row justify-center gap-1">
              <Text className="text-white/50 text-sm">
                Already have an account?
              </Text>
              <Link href="/(auth)/sign-in" asChild>
                <TouchableOpacity activeOpacity={0.7}>
                  <Text className="text-white font-bold text-sm">Sign in</Text>
                </TouchableOpacity>
              </Link>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}