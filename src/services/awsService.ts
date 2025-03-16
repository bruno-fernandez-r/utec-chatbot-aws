import { S3Client, PutObjectCommand, GetObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import fs from "fs";
import * as dotenv from "dotenv";

dotenv.config();

// Configuración del cliente S3
const s3 = new S3Client({
  region: process.env.AWS_REGION!,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
  },
});

// 📂 Subir un PDF a S3
async function uploadPDF(filePath: string, fileName: string): Promise<string> {
  try {
    const fileStream = fs.createReadStream(filePath);
    const uploadParams = {
      Bucket: process.env.AWS_S3_BUCKET!,
      Key: `pdfs/${fileName}`,
      Body: fileStream,
      ContentType: "application/pdf",
    };

    await s3.send(new PutObjectCommand(uploadParams));
    console.log(`✅ Archivo ${fileName} subido a S3.`);

    return `s3://${process.env.AWS_S3_BUCKET}/pdfs/${fileName}`;
  } catch (error) {
    console.error("❌ Error subiendo PDF a S3:", error);
    throw error;
  }
}

// 🔗 Obtener URL de descarga de un PDF
async function getPDFUrl(fileName: string): Promise<string> {
  try {
    const params = {
      Bucket: process.env.AWS_S3_BUCKET!,
      Key: `pdfs/${fileName}`,
    };

    const url = await getSignedUrl(s3, new GetObjectCommand(params), { expiresIn: 3600 });
    console.log(`🔗 URL de descarga: ${url}`);
    return url;
  } catch (error) {
    console.error("❌ Error generando URL:", error);
    throw error;
  }
}

export { uploadPDF, getPDFUrl };
