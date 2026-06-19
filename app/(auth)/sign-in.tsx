import { useSignIn, useSSO } from "@clerk/expo";
import { LinearGradient } from "expo-linear-gradient";
import * as Linking from "expo-linking";
import { Link, useRouter } from "expo-router";
import { Apple, ArrowLeft } from "lucide-react-native";
import React, { useState } from "react";
import {
  Image,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Text,
  TouchableOpacity,
  View
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import AuthInput from "@/components/shared/AuthInput";
import SocialBtn from "@/components/shared/SocialBtn";
import { posthog } from "@/lib/posthog";
import { navigateHome } from "@/lib/utils";
import * as WebBrowser from "expo-web-browser";

// Required — cleans up the browser session on Android
WebBrowser.maybeCompleteAuthSession();

type SSOStrategy = "oauth_google" | "oauth_apple";

// ─── Google wordmark SVG-ish icon (text-based, no SVG dep needed) ─────────────
const GoogleIcon = () => (
  <Text style={{ fontSize: 14, fontWeight: "700", color: "#fff", letterSpacing: -0.5 }}>G</Text>
);

// ─── Sign In ──────────────────────────────────────────────────────────────────
export default function SignInScreen() {
  const { signIn, errors, fetchStatus } = useSignIn();
  const { startSSOFlow } = useSSO();
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const [emailAddress, setEmailAddress] = useState("");
  const [password, setPassword] = useState("");
  const [code, setCode] = useState("");
  const [authError, setAuthError] = useState("");
  const [ssoLoading, setSsoLoading] = useState(false);

  const isLoading = fetchStatus === "fetching";

  // Validation states
  const [emailTouched, setEmailTouched] = useState(false);
  const [passwordTouched, setPasswordTouched] = useState(false);

  const emailValid =
    emailAddress.length === 0 || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailAddress);
  const passwordValid = password.length > 0;
  const formValid =
    emailAddress.length > 0 && password.length > 0 && emailValid;

  const needsVerification =
    signIn.status === "needs_client_trust" ||
    signIn.status === "needs_first_factor" ||
    signIn.status === "needs_second_factor";

  // ─── Email / password sign-in ────────────────────────────────────────────
  const handleSubmit = async () => {
    if (!formValid) return;

    const { error } = await signIn.password({ emailAddress, password });
    if (error) {
      posthog.capture('sign_in_failed', { method: 'email', error_code: error.code });
      return;
    }

    if (signIn.status === "complete") {
      posthog.identify(emailAddress, { $set: { email: emailAddress } });
      posthog.capture('sign_in_completed', { method: 'email' });
      await signIn.finalize({
        navigate: ({ session }) => {
          console.log(session?.currentTask);
        },
      });
    } else if (signIn.status === "needs_client_trust") {
      const emailCodeFactor = signIn.supportedSecondFactors.find(
        (f) => f.strategy === "email_code"
      );
      if (emailCodeFactor) await signIn.mfa.sendEmailCode();
    } else if (signIn.status === "needs_first_factor" || signIn.status === "needs_second_factor") {
      // Email code challenge as a first/second factor — send the code and show OTP UI
      await signIn.mfa.sendEmailCode();
    } else {
      console.error("Sign-in not complete:", signIn);
    }
  };


  // ─── MFA verification ────────────────────────────────────────────────────
  const handleVerify = async () => {
    const { error } = await signIn.mfa.verifyEmailCode({ code });
    if (error) {
      console.error("MFA verification failed:", error);
      return;
    }
    if (signIn.status === "complete") {
      posthog.identify(emailAddress, { $set: { email: emailAddress } });
      posthog.capture('mfa_verified', { method: 'email_code' });
      posthog.capture('sign_in_completed', { method: 'email_mfa' });
      await signIn.finalize({
        navigate: ({ session, decorateUrl }) => {
          if (session?.currentTask) return;
          navigateHome(decorateUrl);
        },
      });
    } else {
      console.error("Sign-in not complete:", signIn);
    }
  };

  const handleSSO = async (strategy: SSOStrategy) => {
    setAuthError("");
    setSsoLoading(true);
    posthog.capture('sso_sign_in_initiated', { provider: strategy });
    try {
      const { createdSessionId, setActive } = await startSSOFlow({
        strategy,
        redirectUrl: Linking.createURL("/"),
      });
      if (createdSessionId && setActive) {
        await setActive({ session: createdSessionId });
        posthog.capture('sign_in_completed', { method: strategy });
        router.replace("/");
      }
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Unknown SSO sign-in error";
      console.error("SSO sign-in failed", err);
      posthog.capture('sign_in_failed', { method: strategy, error_message: message });
      setAuthError("Couldn't continue with social sign in. Please try again.");
    } finally {
      setSsoLoading(false);
    }
  };

  // ─── Verify screen ───────────────────────────────────────────────────────
  if (needsVerification) {
    return (
      <View className="flex-1 bg-background">
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
              onPress={() => signIn.reset()}
              activeOpacity={0.7}
              className="flex-row items-center gap-1.5 px-5 py-4"
            >
              <ArrowLeft color="rgba(255,255,255,0.70)" size={16} strokeWidth={2} />
              <Text className="text-white/70 text-sm font-medium">Start over</Text>
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
                  We sent a verification code to your email
                </Text>
              </View>
            </View>

            <View className="px-5 gap-3">
              <AuthInput
                placeholder="6-digit verification code"
                value={code}
                onChangeText={setCode}
                keyboardType="number-pad"
                maxLength={6}
              />
              {errors.fields.code && (
                <Text className="text-red-400 text-sm text-center">
                  {errors.fields.code.message}
                </Text>
              )}

              <TouchableOpacity
                onPress={handleVerify}
                activeOpacity={0.85}
                disabled={code.length !== 6 || isLoading}
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
                    opacity: code.length !== 6 || isLoading ? 0.6 : 1,
                  }}
                >
                  <Text className="text-white font-bold text-base">
                    {isLoading ? "Verifying..." : "Verify"}
                  </Text>
                </LinearGradient>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => signIn.mfa.sendEmailCode()}
                activeOpacity={0.7}
                disabled={isLoading}
                className="items-center py-3"
              >
                <Text className="text-violet text-sm font-semibold">Resend code</Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </View>
    );
  }

  // ─── Main sign-in screen ─────────────────────────────────────────────────
  return (
    <View className="flex-1 bg-background">
      <View
        className="absolute -top-12 left-1/2 -ml-48 w-96 h-96 rounded-full bg-primary/20"
      />

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
          {/* Back */}
          <TouchableOpacity
            onPress={() => router.back()}
            activeOpacity={0.7}
            className="flex-row items-center gap-1.5 px-5 py-4"
          >
            <ArrowLeft color="rgba(255,255,255,0.70)" size={16} strokeWidth={2} />
            <Text className="text-white/70 text-sm font-medium">Back</Text>
          </TouchableOpacity>

          {/* Logo + heading */}
          <View className="items-center mt-4 mb-8 px-5 gap-4">
            <Image
              source={require("@/assets/images/yowimo-icon.png")}
              className="w-20 h-20"
              resizeMode="contain"
            />
            <View className="items-center gap-1">
              <Text className="text-white text-3xl font-bold tracking-tight">
                Welcome back
              </Text>
              <Text className="text-white/50 text-sm text-center">
                Your crew has been asking about you.
              </Text>
            </View>
          </View>

          {/* Form */}
          <View className="px-5 gap-3">
            <View>
              <AuthInput
                placeholder="Email or phone"
                value={emailAddress}
                onChangeText={setEmailAddress}
                keyboardType="email-address"
                autoCapitalize="none"
                onBlur={() => setEmailTouched(true)}
              />
              {emailTouched && !emailValid && (
                <Text className="text-red-400 text-xs mt-1 ml-1">
                  Please enter a valid email address
                </Text>
              )}
              {errors.fields.identifier && (
                <Text className="text-red-400 text-xs mt-1 ml-1">
                  {errors.fields.identifier.message}
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
              {passwordTouched && !passwordValid && (
                <Text className="text-red-400 text-xs mt-1 ml-1">
                  Password is required
                </Text>
              )}
              {errors.fields.password && (
                <Text className="text-red-400 text-xs mt-1 ml-1">
                  {errors.fields.password.message}
                </Text>
              )}
            </View>

            {/* Forgot password */}
            <TouchableOpacity activeOpacity={0.7} className="self-end">
              <Text className="text-violet text-sm font-semibold">
                Forgot password?
              </Text>
            </TouchableOpacity>

            {/* Log in button */}
            <TouchableOpacity
              onPress={handleSubmit}
              activeOpacity={0.85}
              disabled={isLoading || !formValid}
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
                  {isLoading ? "Signing in..." : "Sign in"}
                </Text>
              </LinearGradient>
            </TouchableOpacity>

            {/* Divider */}
            <View className="flex-row items-center gap-3 my-2">
              <View className="flex-1 h-px bg-white/10" />
              <Text className="text-white/40 text-xs">or continue with</Text>
              <View className="flex-1 h-px bg-white/10" />
            </View>

            {/* Social buttons */}
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
              <Text className="text-white/50 text-sm">New here?</Text>
              <Link href="/(auth)/sign-up" asChild>
                <TouchableOpacity activeOpacity={0.7}>
                  <Text className="text-white font-bold text-sm">
                    Create an account
                  </Text>
                </TouchableOpacity>
              </Link>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}