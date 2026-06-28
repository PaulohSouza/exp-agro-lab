import AsyncStorage from "@react-native-async-storage/async-storage";
import { chaveColeta, dedupLote, type ColetaOffline } from "./sync";

/** Fila local de coletas por experimento (offline-first). */
const key = (expId: string) => `fila_coletas:${expId}`;

export async function getFila(expId: string): Promise<ColetaOffline[]> {
  const raw = await AsyncStorage.getItem(key(expId));
  return raw ? (JSON.parse(raw) as ColetaOffline[]) : [];
}

export async function enfileirar(expId: string, coleta: ColetaOffline): Promise<ColetaOffline[]> {
  const fila = await getFila(expId);
  const nova = dedupLote([...fila.filter((c) => chaveColeta(c) !== chaveColeta(coleta)), coleta]);
  await AsyncStorage.setItem(key(expId), JSON.stringify(nova));
  return nova;
}

export async function limparFila(expId: string): Promise<void> {
  await AsyncStorage.removeItem(key(expId));
}

export async function tamanhoFila(expId: string): Promise<number> {
  return (await getFila(expId)).length;
}
