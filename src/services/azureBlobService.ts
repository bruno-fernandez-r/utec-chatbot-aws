import { BlobServiceClient, StorageSharedKeyCredential } from '@azure/storage-blob';
import dotenv from 'dotenv';
import stream from 'stream';

dotenv.config();

const accountName = process.env.AZURE_STORAGE_ACCOUNT_NAME!;
const accountKey = process.env.AZURE_STORAGE_ACCOUNT_KEY!;
const containerName = process.env.AZURE_CONTAINER_NAME!;

const sharedKeyCredential = new StorageSharedKeyCredential(accountName, accountKey);
const blobServiceClient = new BlobServiceClient(
  `https://${accountName}.blob.core.windows.net`,
  sharedKeyCredential
);

export class AzureBlobService {
  private static getContainerClient() {
    return blobServiceClient.getContainerClient(containerName);
  }

  static async uploadFile(buffer: string | Buffer, filename: string): Promise<string> {
    const containerClient = this.getContainerClient();
    await containerClient.createIfNotExists(); // privado por defecto

    const blockBlobClient = containerClient.getBlockBlobClient(filename);
    const readableStream = new stream.PassThrough();

    const safeBuffer = Buffer.isBuffer(buffer) ? buffer : Buffer.from(buffer);
    readableStream.end(safeBuffer);

    await blockBlobClient.uploadStream(readableStream, 4 * 1024 * 1024, 20);
    return filename;
  }

  static async listFiles(): Promise<string[]> {
    const containerClient = this.getContainerClient();
    const fileNames: string[] = [];

    for await (const blob of containerClient.listBlobsFlat()) {
      fileNames.push(blob.name);
    }

    return fileNames;
  }

  static async downloadFile(filename: string): Promise<Buffer> {
    const containerClient = this.getContainerClient();
    const blobClient = containerClient.getBlobClient(filename);

    if (!(await blobClient.exists())) {
      throw new Error('El archivo no existe en Azure Blob Storage.');
    }

    const downloadResponse = await blobClient.download();
    const chunks: Buffer[] = [];

    for await (const chunk of downloadResponse.readableStreamBody!) {
      chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
    }

    return Buffer.concat(chunks);
  }

  static async deleteFile(filename: string): Promise<void> {
    const containerClient = this.getContainerClient();
    const blobClient = containerClient.getBlobClient(filename);

    await blobClient.deleteIfExists();
  }
}
