import { useCallback, useEffect, useMemo, useState } from "react";
import { View, Text, TextInput, Pressable, FlatList, StyleSheet, Alert, ActivityIndicator } from "react-native";
import { useLocalSearchParams } from "expo-router";
import { pull, push, getUser, type BundleOffline } from "../../lib/api";
import { enfileirar, getFila, limparFila } from "../../lib/queue";
import type { ColetaOffline } from "../../lib/sync";

export default function Protocolo() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [bundle, setBundle] = useState<BundleOffline | null>(null);
  const [avalId, setAvalId] = useState<string | null>(null);
  const [timingFiltro, setTimingFiltro] = useState<string | null>(null); // null = todos
  const [valores, setValores] = useState<Record<string, string>>({});
  const [filaN, setFilaN] = useState(0);
  const [status, setStatus] = useState<string | null>(null);
  const [carregando, setCarregando] = useState(true);
  const [online, setOnline] = useState(true);

  const carregar = useCallback(async () => {
    setCarregando(true);
    try {
      const b = await pull(id);
      setBundle(b);
      setAvalId((cur) => cur ?? b.experimento.avaliacoes[0]?.id ?? null);
      setOnline(true);
    } catch {
      setOnline(false);
      setStatus("Offline — usando dados locais. Conecte para baixar/sincronizar.");
    } finally {
      setFilaN((await getFila(id)).length);
      setCarregando(false);
    }
  }, [id]);

  useEffect(() => { carregar(); }, [carregar]);

  const aval = useMemo(() => bundle?.experimento.avaliacoes.find((a) => a.id === avalId) ?? null, [bundle, avalId]);
  const tratPorId = useMemo(
    () => new Map((bundle?.experimento.tratamentos ?? []).map((t) => [t.id, t])),
    [bundle],
  );

  async function lancar(parcelaId: string, texto: string) {
    setValores((v) => ({ ...v, [parcelaId]: texto }));
    if (!avalId || texto.trim() === "") return;
    const num = Number(texto.replace(",", "."));
    if (Number.isNaN(num)) return;
    const coleta: ColetaOffline = {
      avaliacaoId: avalId,
      parcelaId,
      numAmostra: 1,
      valorColetado: num,
      clientUpdatedAt: Date.now(),
      dispositivoId: (await getUser())?.id,
    };
    const fila = await enfileirar(id, coleta);
    setFilaN(fila.length);
  }

  async function sincronizar() {
    const fila = await getFila(id);
    if (fila.length === 0) { setStatus("Nada para sincronizar."); return; }
    try {
      const r = await push(fila);
      await limparFila(id);
      setFilaN(0);
      setStatus(`Sincronizado: ${r.aplicados} aplicados, ${r.conflitos.length} conflito(s).`);
      if (r.conflitos.length) Alert.alert("Conflitos", `${r.conflitos.length} lançamento(s) tinham versão mais nova no servidor e foram preservados.`);
      carregar();
    } catch (e) {
      setStatus("Falha ao sincronizar — tente novamente quando online. Dados seguem na fila.");
    }
  }

  if (carregando && !bundle) {
    return <View style={s.center}><ActivityIndicator color="#1F2940" /></View>;
  }

  return (
    <View style={{ flex: 1 }}>
      <View style={s.header}>
        <Text style={s.titulo}>{bundle?.experimento.codigo ?? ""} {bundle?.experimento.titulo ?? ""}</Text>
        {!online && <Text style={s.offline}>● offline</Text>}
      </View>

      {/* filtro de coleta por timing (mostra só as avaliações daquele momento) */}
      {(bundle?.experimento.timings?.length ?? 0) > 0 && (
        <View style={s.avalRow}>
          <Pressable onPress={() => setTimingFiltro(null)} style={[s.chipF, timingFiltro === null && s.chipFAtivo]}>
            <Text style={[s.chipText, timingFiltro === null && s.chipTextAtivo]}>Todos</Text>
          </Pressable>
          {(bundle?.experimento.timings ?? []).map((t) => (
            <Pressable key={t.id} onPress={() => setTimingFiltro(t.id)} style={[s.chipF, timingFiltro === t.id && s.chipFAtivo]}>
              <Text style={[s.chipText, timingFiltro === t.id && s.chipTextAtivo]}>{t.nome}</Text>
            </Pressable>
          ))}
        </View>
      )}

      <View style={s.avalRow}>
        {(bundle?.experimento.avaliacoes ?? [])
          .filter((a) => timingFiltro === null || a.timingId === timingFiltro)
          .map((a) => (
            <Pressable key={a.id} onPress={() => setAvalId(a.id)} style={[s.chip, a.id === avalId && s.chipAtivo]}>
              <Text style={[s.chipText, a.id === avalId && s.chipTextAtivo]}>{a.nome}</Text>
            </Pressable>
          ))}
      </View>

      <FlatList
        data={bundle?.experimento.parcelas ?? []}
        keyExtractor={(p) => p.id}
        contentContainerStyle={{ padding: 16, paddingBottom: 100 }}
        renderItem={({ item }) => (
          <View style={s.linha}>
            <Text style={s.parc}>#{item.numero}</Text>
            <Text style={s.trat}>B{item.bloco} · {tratPorId.get(item.tratamentoId)?.tag ?? "?"}</Text>
            <TextInput
              style={s.input}
              value={valores[item.id] ?? ""}
              onChangeText={(t) => lancar(item.id, t)}
              keyboardType="numeric"
              placeholder={aval?.unidadeColeta ?? "valor"}
            />
          </View>
        )}
      />

      <View style={s.rodape}>
        {status ? <Text style={s.status}>{status}</Text> : null}
        <Pressable style={s.btn} onPress={sincronizar}>
          <Text style={s.btnText}>Sincronizar ({filaN})</Text>
        </Pressable>
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  center: { flex: 1, alignItems: "center", justifyContent: "center" },
  header: { padding: 16, backgroundColor: "#fff", flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  titulo: { color: "#1F2940", fontWeight: "700", flex: 1 },
  offline: { color: "#F3934A", fontSize: 12 },
  avalRow: { flexDirection: "row", flexWrap: "wrap", gap: 8, padding: 12 },
  chip: { backgroundColor: "#e1e6f1", borderRadius: 16, paddingHorizontal: 12, paddingVertical: 6 },
  chipAtivo: { backgroundColor: "#1F2940" },
  chipF: { backgroundColor: "#eef6fc", borderColor: "#4EC2F0", borderWidth: 1, borderRadius: 16, paddingHorizontal: 10, paddingVertical: 4 },
  chipFAtivo: { backgroundColor: "#4EC2F0" },
  chipText: { color: "#1F2940", fontSize: 13 },
  chipTextAtivo: { color: "#fff" },
  linha: { flexDirection: "row", alignItems: "center", backgroundColor: "#fff", borderRadius: 8, padding: 10, marginBottom: 8 },
  parc: { width: 44, color: "#1F2940", fontWeight: "600" },
  trat: { flex: 1, color: "#7987A1", fontSize: 13 },
  input: { width: 100, borderColor: "#d6d6e6", borderWidth: 1, borderRadius: 8, padding: 8, textAlign: "right" },
  rodape: { position: "absolute", bottom: 0, left: 0, right: 0, padding: 16, backgroundColor: "#fff", borderTopColor: "#e1e1ef", borderTopWidth: 1 },
  status: { color: "#6FA830", fontSize: 13, marginBottom: 8 },
  btn: { backgroundColor: "#6FA830", borderRadius: 10, padding: 14, alignItems: "center" },
  btnText: { color: "#fff", fontWeight: "600" },
});
