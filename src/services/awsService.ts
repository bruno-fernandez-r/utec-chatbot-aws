import AWS from 'aws-sdk';
import { v4 as uuidv4 } from 'uuid';
import path from 'path';
import * as dotenv from "dotenv";
dotenv.config();


// Configuración del SDK de AWS
const s3 = new AWS.S3({
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  region: process.env.AWS_REGION
});

const BUCKET_NAME = process.env.AWS_S3_BUCKET as string;


export async function uploadFileToS3(file: Express.Multer.File, customPath: string): Promise<string> {
  const fileExtension = path.extname(file.originalname);
  const fileName = `${customPath}/${uuidv4()}${fileExtension}`;

  const params: AWS.S3.PutObjectRequest = {
    Bucket: BUCKET_NAME,
    Key: fileName,
    Body: file.buffer,
    ContentType: file.mimetype,
  };

  await s3.upload(params).promise();

  return `https://${BUCKET_NAME}.s3.${process.env.AWS_REGION}.amazonaws.com/${fileName}`;
}

// ✅ NUEVO: Descargar archivo como Buffer desde S3
export async function getFileBufferFromS3(bucket: string, key: string): Promise<Buffer> {
  const params = {
    Bucket: bucket,
    Key: key
  };

  const data = await s3.getObject(params).promise();
  if (!data.Body || !(data.Body instanceof Buffer)) {
    throw new Error('No se pudo obtener el archivo o el contenido no es un buffer');
  }

  return data.Body;
}
