import { BlobServiceClient } from "@azure/storage-blob";

const connectionString = process.env.AZURE_STORAGE_CONNECTION_STRING!;
const containerName = process.env.AZURE_PROMPT_CONTAINER!;
const blobServiceClient = BlobServiceClient.fromConnectionString(connectionString);
const containerClient = blobServiceClient.getContainerClient(containerName);

export async function getPrompt(chatbotId: string): Promise<string | null> {
  const blobName = `prompt_${chatbotId}.txt`;
  const blobClient = containerClient.getBlobClient(blobName);
  if (!(await blobClient.exists())) return null;

  const download = await blobClient.download();
  const content = await streamToText(download.readableStreamBody);
  return content;
}

export async function setPrompt(chatbotId: string, content: string): Promise<void> {
  const blobName = `prompt_${chatbotId}.txt`;
  const blockBlobClient = containerClient.getBlockBlobClient(blobName);

  try {
    console.log(`📦 Subiendo prompt como archivo '${blobName}'...`);
    await blockBlobClient.deleteIfExists();
    await blockBlobClient.uploadData(Buffer.from(content));
    console.log(`✅ Archivo '${blobName}' cargado en Azure Blob correctamente.`);
  } catch (error) {
    console.error(`❌ Error subiendo archivo '${blobName}' a Azure Blob:`, error);
    throw error;
  }
}


export async function deletePrompt(chatbotId: string): Promise<void> {
  const blobName = `prompt_${chatbotId}.txt`;
  const blobClient = containerClient.getBlobClient(blobName);
  await blobClient.deleteIfExists();
}

async function streamToText(readable: NodeJS.ReadableStream | undefined): Promise<string> {
  if (!readable) return '';
  const chunks: any[] = [];
  for await (const chunk of readable) {
    chunks.push(chunk.toString());
  }
  return chunks.join('');
}
