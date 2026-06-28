import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";

export default function RootLayout() {
  return (
    <>
      <StatusBar style="light" />
      <Stack
        screenOptions={{
          headerStyle: { backgroundColor: "#1F2940" },
          headerTintColor: "#fff",
          contentStyle: { backgroundColor: "#F9F9FB" },
        }}
      >
        <Stack.Screen name="index" options={{ headerShown: false }} />
        <Stack.Screen name="login" options={{ title: "Entrar" }} />
        <Stack.Screen name="protocolos" options={{ title: "Protocolos" }} />
        <Stack.Screen name="protocolo/[id]" options={{ title: "Coleta" }} />
      </Stack>
    </>
  );
}
