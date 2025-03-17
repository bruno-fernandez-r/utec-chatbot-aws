import { encode } from "gpt-tokenizer"; // 🔥 Biblioteca eficiente para contar tokens
import * as dotenv from "dotenv";

dotenv.config();

/**
 * 📌 Cuenta la cantidad de tokens en un texto.
 * @param text - Texto a analizar
 * @returns Número de tokens
 */
export function countTokens(text: string): number {
  return encode(text).length;
}

// 🔍 Prueba local de conteo de tokens
if (require.main === module) {
  const testText = `
    EDU es la plataforma de educación digital de UTEC.
    Soporte técnico: entorno.virtual@utec.edu.uy
    Para más información visita https://edu.utec.edu.uy
  `;

  console.log(`📊 Cantidad de tokens en este texto: ${countTokens(testText)}`);
}

