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

    setAuthError("");
    setCode("");

    console.warn(
      "[sign-in debug] handleSubmit fired, current status before password():",
      signIn.status
    );

    const { error } = await signIn.password({ emailAddress, password });

    if (error) {
      console.warn(
        "[sign-in debug] password() error:",
        JSON.stringify(error),
        "status now:",
        signIn.status
      );
      posthog.capture("sign_in_failed", {
        method: "email",
        error_code: error.code,
      });
      setAuthError(error.message ?? "Unable to sign in. Please try again.");
      return;
    }

    console.warn("[sign-in debug] password() succeeded, status now:", signIn.status);
    console.warn(
      "[sign-in debug] factors:",
      JSON.stringify({
        first: signIn.supportedFirstFactors,
        second: signIn.supportedSecondFactors,
      })
    );

    if (signIn.status === "complete") {
      posthog.identify(emailAddress, { $set: { email: emailAddress } });
      posthog.capture("sign_in_completed", { method: "email" });
      await signIn.finalize({
        navigate: ({ session }) => {
          console.log(session?.currentTask);
        },
      });
      return;
    }

    if (signIn.status === "needs_first_factor") {
      const emailFactor = signIn.supportedFirstFactors.find(
        (factor) => factor.strategy === "email_code"
      );

      if (!emailFactor) {
        console.error(
          "[sign-in debug] email_code is not a supported first factor:",
          JSON.stringify(signIn.supportedFirstFactors)
        );
        setAuthError(
          "This account does not support email-code verification. Check the Clerk test-user authentication factors."
        );
        return;
      }

      const { error: sendError } = await signIn.emailCode.sendCode();

      if (sendError) {
        console.error("[sign-in debug] first-factor code send failed:", sendError);
        setAuthError(sendError.message ?? "Could not start email verification.");
      }

      return;
    }

    if (
      signIn.status === "needs_second_factor" ||
      signIn.status === "needs_client_trust"
    ) {
      const emailFactor = signIn.supportedSecondFactors.find(
        (factor) => factor.strategy === "email_code"
      );

      if (!emailFactor) {
        console.error(
          "[sign-in debug] email_code is not a supported second factor:",
          JSON.stringify(signIn.supportedSecondFactors)
        );
        setAuthError(
          "This account does not support email-code MFA verification."
        );
        return;
      }

      const { error: sendError } = await signIn.mfa.sendEmailCode();

      if (sendError) {
        console.error("[sign-in debug] MFA code send failed:", sendError);
        setAuthError(sendError.message ?? "Could not start MFA verification.");
      }

      return;
    }

    setAuthError(`Unsupported sign-in state: ${signIn.status}`);
  };

  // ─── Verification ────────────────────────────────────────────────────────
  const handleVerify = async () => {
    // Reading status through a function call resets TS's control-flow narrowing,
    // since signIn.status can change at runtime across the awaits below even
    // though TS otherwise treats it as fixed to the branch it was last checked in.
    const getStatus = () => signIn.status;

    console.warn(
      "[sign-in debug] handleVerify fired, current status:",
      getStatus()
    );

    setAuthError("");

    let error;

    if (signIn.status === "needs_first_factor") {
      const emailFactor = signIn.supportedFirstFactors.find(
        (factor) => factor.strategy === "email_code"
      );

      if (!emailFactor) {
        console.error(
          "[sign-in debug] Cannot verify email code. Supported first factors:",
          JSON.stringify(signIn.supportedFirstFactors)
        );
        setAuthError(
          "Email code is not a valid verification method for this account."
        );
        return;
      }

      ({ error } = await signIn.emailCode.verifyCode({ code }));
    } else if (
      signIn.status === "needs_second_factor" ||
      signIn.status === "needs_client_trust"
    ) {
      const emailFactor = signIn.supportedSecondFactors.find(
        (factor) => factor.strategy === "email_code"
      );

      if (!emailFactor) {
        console.error(
          "[sign-in debug] Cannot verify MFA email code. Supported second factors:",
          JSON.stringify(signIn.supportedSecondFactors)
        );
        setAuthError(
          "Email code is not a valid MFA method for this account."
        );
        return;
      }

      ({ error } = await signIn.mfa.verifyEmailCode({ code }));
    } else {
      setAuthError(`Unexpected verification state: ${signIn.status}`);
      return;
    }

    if (error) {
      console.error("[sign-in debug] verification failed:", error);
      setAuthError(error.message ?? "Verification failed. Please try again.");
      return;
    }

    console.warn(
      "[sign-in debug] verification succeeded, status now:",
      getStatus()
    );

    if (getStatus() === "complete") {
      posthog.identify(emailAddress, { $set: { email: emailAddress } });
      posthog.capture("mfa_verified", { method: "email_code" });
      posthog.capture("sign_in_completed", {
        method: "email_password_with_code",
      });

      await signIn.finalize({
        navigate: ({ session }) => {
          console.log(session?.currentTask);
        },
      });

      return;
    }

    console.error(
      "[sign-in debug] verification returned non-complete status:",
      getStatus()
    );
    setAuthError(`Verification requires another step: ${getStatus()}`);
  };

  const handleResendCode = async () => {
    setAuthError("");

    if (signIn.status === "needs_first_factor") {
      const emailFactor = signIn.supportedFirstFactors.find(
        (factor) => factor.strategy === "email_code"
      );

      if (!emailFactor) {
        setAuthError("Email code is not available for this account.");
        return;
      }

      const { error } = await signIn.emailCode.sendCode();
      if (error) {
        setAuthError(error.message ?? "Could not resend the code.");
      }
      return;
    }

    if (
      signIn.status === "needs_second_factor" ||
      signIn.status === "needs_client_trust"
    ) {
      const emailFactor = signIn.supportedSecondFactors.find(
        (factor) => factor.strategy === "email_code"
      );

      if (!emailFactor) {
        setAuthError("Email MFA is not available for this account.");
        return;
      }

      const { error } = await signIn.mfa.sendEmailCode();
      if (error) {
        setAuthError(error.message ?? "Could not resend the code.");
      }
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

              {authError ? (
                <Text className="text-red-400 text-sm text-center">
                  {authError}
                </Text>
              ) : null}

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
                onPress={handleResendCode}
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
            className="h-10 w-10 items-center justify-center rounded-full bg-card border border-border"
          >
            <ArrowLeft color="#fff" size={16} strokeWidth={2} />
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