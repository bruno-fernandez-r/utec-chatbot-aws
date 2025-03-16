import { S3Client, PutObjectCommand, GetObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import fs from "fs";
import * as dotenv from "dotenv";

dotenv.config();

// Configurar el cliente de S3 con las credenciales
const s3 = new S3Client({
  region: process.env.AWS_REGION!,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
  },
});

// 📂 Archivo de prueba a subir
const filePath = "./documentos/test.pdf"; // Ruta del archivo en tu proyecto
const fileName = "test.pdf"; // Nombre con el que se guardará en S3

// 📤 Función para subir un archivo a S3
async function uploadTestFile() {
  try {
    // Verificar si el archivo existe antes de subirlo
    if (!fs.existsSync(filePath)) {
      console.error(`❌ El archivo ${filePath} no existe.`);
      return;
    }

    const fileStream = fs.createReadStream(filePath);

    const uploadParams = {
      Bucket: process.env.AWS_S3_BUCKET!,
      Key: `pdfs/${fileName}`,
      Body: fileStream,
      ContentType: "application/pdf",
    };

    await s3.send(new PutObjectCommand(uploadParams));
    console.log(`✅ Archivo "${fileName}" subido correctamente a S3.`);
  } catch (error) {
    console.error("❌ Error subiendo archivo a S3:", error);
  }
}

// 📥 Función para obtener la URL de descarga del archivo en S3
async function getFileUrl() {
  try {
    const params = {
      Bucket: process.env.AWS_S3_BUCKET!,
      Key: `pdfs/${fileName}`,
    };

    const url = await getSignedUrl(s3, new GetObjectCommand(params), { expiresIn: 3600 }); // URL válida por 1 hora
    console.log(`📥 URL de descarga del archivo: ${url}`);
  } catch (error) {
    console.error("❌ Error obteniendo la URL de S3:", error);
  }
}

// 🔄 Ejecutar la prueba
async function runTest() {
  await uploadTestFile(); // 📤 Subir archivo
  await getFileUrl(); // 📥 Obtener URL
}

runTest();
