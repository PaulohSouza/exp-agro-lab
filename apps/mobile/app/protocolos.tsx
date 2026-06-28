import { useCallback, useState } from "react";
import { View, Text, FlatList, Pressable, StyleSheet, RefreshControl } from "react-native";
import { router, useFocusEffect, Stack } from "expo-router";
import { listarExperimentos, logout, type ExperimentoLista } from "../lib/api";

export default function Protocolos() {
  const [itens, setItens] = useState<ExperimentoLista[]>([]);
  const [erro, setErro] = useState<string | null>(null);
  const [carregando, setCarregando] = useState(false);

  const carregar = useCallback(async () => {
    setCarregando(true);
    try {
      setItens(await listarExperimentos());
      setErro(null);
    } catch (e) {
      setErro(e instanceof Error ? e.message : "Falha ao carregar");
    } finally {
      setCarregando(false);
    }
  }, []);

  useFocusEffect(useCallback(() => { carregar(); }, [carregar]));

  async function sair() {
    await logout();
    router.replace("/login");
  }

  return (
    <View style={{ flex: 1 }}>
      <Stack.Screen options={{ headerRight: () => <Pressable onPress={sair}><Text style={{ color: "#4EC2F0" }}>Sair</Text></Pressable> }} />
      {erro ? <Text style={s.erro}>{erro}</Text> : null}
      <FlatList
        data={itens}
        keyExtractor={(e) => e.id}
        refreshControl={<RefreshControl refreshing={carregando} onRefresh={carregar} />}
        contentContainerStyle={{ padding: 16 }}
        ListEmptyComponent={!carregando ? <Text style={s.vazio}>Nenhum protocolo.</Text> : null}
        renderItem={({ item }) => (
          <Pressable style={s.card} onPress={() => router.push(`/protocolo/${item.id}`)}>
            <Text style={s.titulo}>{item.codigo ? `${item.codigo} — ` : ""}{item.titulo}</Text>
            <Text style={s.meta}>
              {item.ensaio} • {item.status}
              {item.compartilhadoComigo ? "  • compartilhado" : ""}
            </Text>
          </Pressable>
        )}
      />
    </View>
  );
}

const s = StyleSheet.create({
  card: { backgroundColor: "#fff", borderRadius: 10, padding: 16, marginBottom: 10 },
  titulo: { color: "#1F2940", fontWeight: "600", fontSize: 15 },
  meta: { color: "#7987A1", fontSize: 13, marginTop: 4 },
  erro: { color: "#F34343", padding: 16 },
  vazio: { color: "#a9abbd", textAlign: "center", marginTop: 40 },
});
