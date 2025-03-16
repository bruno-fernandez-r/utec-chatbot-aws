// Este archivo manejará la lógica para interactuar con Pinecone, como guardar y buscar vectores.


import { generateEmbeddings } from './openaiService';
import { pinecone } from '../config/pinecone';
import * as dotenv from "dotenv";

dotenv.config();

// Verificar que la variable de entorno PINECONE_INDEX está definida
if (!process.env.PINECONE_INDEX) {
  throw new Error("❌ ERROR: PINECONE_INDEX no está definido en .env");
}

// Definir el tipo correcto para los resultados de Pinecone
interface PineconeMatch {
  id: string;
  score?: number;
  metadata?: {
    content: string;
  };
}

// Guardar datos en Pinecone
async function saveVectorData(id: string, content: string) {
  try {
    const embedding = await generateEmbeddings(content); // Generamos el embedding

    const objectToSave = {
      id: id, // Pinecone requiere un string como ID
      values: embedding, // El embedding generado es un array de números
      metadata: { content }, // Se guarda el contenido como metadato
    };

    // ✅ Obtener el índice de Pinecone desde las variables de entorno
    const index = pinecone.index(process.env.PINECONE_INDEX!);

    // ✅ USAMOS EL NUEVO FORMATO PARA upsert
    await index.upsert([
      objectToSave, // Ahora upsert acepta un ARRAY DIRECTO
    ]);

    console.log('✅ Datos guardados correctamente en Pinecone.');
  } catch (error) {
    console.error('❌ Error guardando datos en Pinecone:', error);
    throw new Error('Error guardando datos en Pinecone');
  }
}

// Buscar datos en Pinecone utilizando embeddings
async function searchVectorData(query: string): Promise<string> {
  try {
    const embedding = await generateEmbeddings(query); // Convertimos la consulta en un embedding

    // ✅ Obtener el índice de Pinecone desde las variables de entorno
    const index = pinecone.index(process.env.PINECONE_INDEX!);

    const results = await index.query({
      vector: embedding, // Eliminamos `queryRequest`, pasamos el objeto directamente
      topK: 4,
      includeMetadata: true,
    });

    if (!results.matches || results.matches.length === 0) {
      return '⚠️ No se encontraron resultados.';
    }

    // Aseguramos que `matches` existe y tiene la estructura esperada
    return results.matches
      .filter((match): match is PineconeMatch => match.metadata?.content !== undefined) // Filtramos resultados vacíos
      .map((match) => match.metadata!.content) // Mapeamos solo los valores existentes
      .join('. ');
  } catch (error) {
    console.error('❌ Error buscando datos en Pinecone:', error);
    throw new Error('Error buscando datos en Pinecone');
  }
}

export { saveVectorData, searchVectorData };
