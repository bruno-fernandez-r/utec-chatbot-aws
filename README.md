# 🤖 Chatbot con Pinecone, OpenAI y Azure Blob Storage

Un chatbot desarrollado para la **Universidad Tecnológica - UTEC**, que permite subir archivos PDF de forma segura a Azure Blob Storage, vectorizarlos con OpenAI y realizar búsquedas semánticas eficientes con Pinecone.  
Incluye soporte para múltiples chatbots independientes, historial de conversación, y configuración de comportamiento vía prompt.

---

## 🚀 Características

- 📂 Carga de PDFs privados en Azure Blob Storage  
- 🔍 Vectorización con OpenAI Embeddings  
- 🧠 Búsqueda semántica eficiente con Pinecone  
- 🤖 Respuestas generadas por GPT-4o  
- 💬 Historial de conversación por sesión  
- 🧾 Soporte para múltiples chatbots independientes  
- 🧠 Prompt de comportamiento personalizado por chatbot  
- 📥 Entrenamiento automatizado por documento  
- 📃 Listado de archivos por chatbot  
- 🧽 Eliminación de vectores al eliminar archivos  
- 🔒 Acceso controlado a archivos  
- 🧪 Endpoints validados vía Postman  

---

## 🛠️ Tecnologías utilizadas

| Tecnología         | Descripción                                                  |
|--------------------|--------------------------------------------------------------|
| **Node.js**        | Entorno de ejecución JavaScript                              |
| **TypeScript**     | Tipado estático para mayor robustez                          |
| **OpenAI API**     | Embeddings y generación de respuestas                        |
| **Pinecone**       | Base de datos vectorial (busquedas semánticas)              |
| **Azure Blob**     | Almacenamiento seguro y privado de PDFs                     |
| **Azure Table**    | Metadatos de configuración por chatbot                      |
| **Express**        | API REST backend                                             |
| **Multer**         | Subida de archivos desde formularios                        |
| **Postman**        | Pruebas de API REST                                          |

---

## 📥 Instalación

### 1️⃣ Clonar el repositorio

```bash
git clone https://github.com/bruno-fernandez-r/utec-chatbot-aws.git
cd Proyecto\ ChatBot
```

### 2️⃣ Instalar dependencias

```bash
npm install
```

Si tenés errores, corré:

```bash
npm install express multer pdf-parse dotenv gpt-3-encoder @pinecone-database/pinecone uuid
npm install --save-dev ts-node @types/express @types/node
```

---

## ⚙️ Configuración `.env`

Crea un archivo `.env` en la raíz del proyecto y completalo con tus claves:

```env
# 🔐 OpenAI
OPENAI_API_KEY=sk-XXXXXXXXXXXXXXXXXXXXXXXX
OPENAI_EMBEDDING_MODEL=text-embedding-3-small

# 📦 Pinecone
PINECONE_API_KEY=xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx
PINECONE_ENVIRONMENT=us-east-1
PINECONE_INDEX=nombre-del-indice

# ☁️ Azure Storage
AZURE_STORAGE_ACCOUNT_NAME=nombre-cuenta
AZURE_STORAGE_ACCOUNT_KEY=clave-secreta
AZURE_STORAGE_CONNECTION_STRING=  # (opcional si ya configuraste nombre y key)
AZURE_CONTAINER_NAME=conocimiento
AZURE_PROMPT_CONTAINER=prompts
AZURE_TABLE_NAME=chatbots
```

> 🔒 Nunca publiques este archivo.

---

### 3️⃣ Ejecutar el servidor

```bash
ts-node src/server.ts
```

---

## 📡 Endpoints principales

### 📁 Subir archivo
```
POST /files/upload
```
Body `form-data`:
- `file`: archivo PDF

---

### 🔄 Entrenar chatbot
```
POST /train/:filename?chatbotId=ID_DEL_CHATBOT
```

---

### 🧾 Ver documentos entrenados
```
GET /train/:chatbotId/documents
```

---

### ❌ Eliminar archivo (y sus vectores)
```
DELETE /files/:filename
```

---

### ✍️ Editar prompt del chatbot
```
PUT /chatbots/:id/prompt
```
Body JSON:
```json
{ "prompt": "Texto de comportamiento..." }
```

---

### 💬 Consultar al chatbot
```
POST /chat
```
Body JSON:
```json
{
  "query": "¿Qué es UTEC?",
  "chatbotId": "123",
  "sessionId": "abc"
}
```

---

## 🎯 Ejemplo de Pregunta

```text
🗣️ Usuario: ¿Cuál es el contacto de soporte técnico para la plataforma EDU?
🤖 Chatbot: El contacto es entorno.virtual@utec.edu.uy
```

---

## 🔥 Mejoras futuras

- [ ] Interfaz web para gestión de chatbots
- [ ] Panel de actividad e historial de consultas
- [ ] Soporte para archivos DOCX / TXT
- [ ] Roles y autenticación

---

## 📜 Licencia

Este proyecto es propiedad de la **Universidad Tecnológica del Uruguay (UTEC)**.  
Su uso está restringido exclusivamente a fines institucionales.  
❗ **No está permitido reutilizar este código fuera de los fines autorizados por UTEC.**

📌 **Desarrollado por**: Bruno Fernández  
🔗 [github.com/bruno-fernandez-r](https://github.com/bruno-fernandez-r)