import fs from "fs";
import path from "path";

// 📌 Ruta del archivo de caché
const CACHE_FILE = path.join(__dirname, "../../cache.json");

// 🔄 Cargar caché desde archivo
export function loadCache(): Record<string, string> {
  try {
    if (!fs.existsSync(CACHE_FILE)) {
      console.log("⚠️ Cache no encontrado. Creando uno nuevo...");
      fs.writeFileSync(CACHE_FILE, JSON.stringify({}), "utf8");
    }
    const cacheData = fs.readFileSync(CACHE_FILE, "utf8");
    return cacheData ? JSON.parse(cacheData) : {};
  } catch (error) {
    console.error("❌ Error cargando cache:", error);
    return {};
  }
}

// 💾 Guardar en caché
export function saveToCache(query: string, response: string) {
  try {
    console.log(`💾 Guardando en cache: ${query} -> ${response}`);
    const cache = loadCache();

    if (cache[query]) {
      console.log("♻️ Pregunta ya está en cache, no se sobrescribe.");
      return;
    }

    cache[query] = response;
    fs.writeFileSync(CACHE_FILE, JSON.stringify(cache, null, 2), "utf8");
    console.log("✅ Respuesta guardada en cache.");
  } catch (error) {
    console.error("❌ Error guardando en cache:", error);
  }
}

// 🔍 Buscar en caché
export function getFromCache(query: string): string | null {
  const cache = loadCache();
  return cache[query] || null;
}
