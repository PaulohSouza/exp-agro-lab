import { useEffect } from "react";
import { View, ActivityIndicator } from "react-native";
import { router } from "expo-router";
import { getToken } from "../lib/api";

export default function Index() {
  useEffect(() => {
    getToken().then((t) => router.replace(t ? "/protocolos" : "/login"));
  }, []);
  return (
    <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
      <ActivityIndicator color="#1F2940" />
    </View>
  );
}
