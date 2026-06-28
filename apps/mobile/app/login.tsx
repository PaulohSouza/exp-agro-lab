import { useState } from "react";
import { View, Text, TextInput, Pressable, StyleSheet, ActivityIndicator } from "react-native";
import { router } from "expo-router";
import { login, API_BASE } from "../lib/api";

export default function Login() {
  const [email, setEmail] = useState("analista@demo.com");
  const [senha, setSenha] = useState("analista123");
  const [erro, setErro] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function entrar() {
    setBusy(true);
    setErro(null);
    try {
      await login(email.trim(), senha);
      router.replace("/protocolos");
    } catch (e) {
      setErro(e instanceof Error ? e.message : "Falha no login");
    } finally {
      setBusy(false);
    }
  }

  return (
    <View style={s.container}>
      <Text style={s.titulo}>EXP-AGROLAB</Text>
      <Text style={s.sub}>Coleta de campo (offline-first)</Text>

      <Text style={s.label}>E-mail</Text>
      <TextInput style={s.input} value={email} onChangeText={setEmail} autoCapitalize="none" keyboardType="email-address" />
      <Text style={s.label}>Senha</Text>
      <TextInput style={s.input} value={senha} onChangeText={setSenha} secureTextEntry />

      <Pressable style={s.btn} onPress={entrar} disabled={busy}>
        {busy ? <ActivityIndicator color="#fff" /> : <Text style={s.btnText}>Entrar</Text>}
      </Pressable>
      {erro ? <Text style={s.erro}>{erro}</Text> : null}
      <Text style={s.api}>API: {API_BASE}</Text>
    </View>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, padding: 24, justifyContent: "center" },
  titulo: { fontSize: 26, fontWeight: "700", color: "#1F2940" },
  sub: { color: "#7987A1", marginBottom: 24 },
  label: { color: "#7987A1", fontSize: 13, marginBottom: 4 },
  input: { backgroundColor: "#fff", borderColor: "#d6d6e6", borderWidth: 1, borderRadius: 10, padding: 12, marginBottom: 14 },
  btn: { backgroundColor: "#6FA830", borderRadius: 10, padding: 14, alignItems: "center" },
  btnText: { color: "#fff", fontWeight: "600" },
  erro: { color: "#F34343", marginTop: 12 },
  api: { color: "#a9abbd", fontSize: 12, marginTop: 20 },
});
