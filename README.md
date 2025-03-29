# 🤖 Chatbot con Pinecone, OpenAI y Azure Blob Storage

Un chatbot desarrollado para la Universidad Tecnológica - UTEC, que permite subir archivos PDF de forma segura a Azure Blob Storage, vectorizarlos con OpenAI y realizar búsquedas semánticas eficientes con Pinecone. Compatible con múltiples chatbots y control de historial de conversación.

---

## 🚀 Características

- 📂 **Carga de PDFs privados en Azure Blob Storage**
- 🔍 **Vectorización con OpenAI Embeddings**
- 🧠 **Búsqueda semántica eficiente con Pinecone**
- 🤖 **Respuestas generadas por GPT-4o**
- 💬 **Historial de conversación incluido en las respuestas**
- 🧾 **Soporte para múltiples chatbots independientes**
- 📥 **Subida, actualización y reentrenamiento de documentos por chatbot**
- 📤 **Eliminación automática de vectores anteriores al reentrenar**
- 🔒 **Archivos privados, sin acceso directo para usuarios**
- 🧪 **Probado íntegramente vía Postman**

---

## 🛠️ Tecnologías utilizadas

| Tecnología         | Descripción                                                
|--------------------|------------------------------------------------------------
| **Node.js**        | Entorno de ejecución de JavaScript                         
| **TypeScript**     | Tipado estático para JS                                     
| **OpenAI API**     | Generación de embeddings y respuestas                       
| **Pinecone**       | Base de datos vectorial para búsquedas semánticas          
| **Azure Blob**     | Almacenamiento seguro y privado de los documentos PDF      
| **Express**        | Framework para construir la API REST                       
| **Multer**         | Middleware para subir archivos a través de formularios     
| **Postman**        | Testing y validación de todos los endpoints                 
| **GitHub**         | Control de versiones y respaldo                            

---

## 📥 Instalación

### **1️⃣ Clonar el repositorio**
```bash
git clone https://github.com/bruno-fernandez-r/utec-chatbot-aws.git
cd Proyecto\ ChatBot
```

### **2️⃣ Instalar dependencias**
```bash
npm install
```

Si da error con módulos no encontrados, asegurate de instalar:

```bash
npm install express multer pdf-parse dotenv gpt-3-encoder @pinecone-database/pinecone uuid
npm install --save-dev ts-node @types/express @types/node
```

---

### **3️⃣ Configurar variables de entorno**
Crea un archivo `.env` en la raíz del proyecto y colocá lo siguiente:

```
# 🔐 OpenAI
OPENAI_API_KEY=tu_clave_de_openai
OPENAI_EMBEDDING_MODEL=text-embedding-3-small

# 📦 Pinecone
PINECONE_API_KEY=tu_clave_de_pinecone
PINECONE_ENVIRONMENT=us-east-1
PINECONE_INDEX=nombre_de_tu_indice

# ☁️ Azure Blob Storage
AZURE_STORAGE_ACCOUNT_NAME=tu_nombre_de_cuenta
AZURE_STORAGE_ACCOUNT_KEY=tu_clave_de_acceso
AZURE_CONTAINER_NAME=nombre_del_contenedor

```
> 📌 Reemplazá los valores con tus claves reales.

---

### **4️⃣ Ejecutar el servidor**
```bash
ts-node src/server.ts
```

---

## 📡 Uso desde Postman

### 📁 Subir archivo
```http
POST http://localhost:3000/api/files/upload
```

- **Body** (form-data):
  - `file`: archivo PDF
  - `chatbotId`: identificador del chatbot (ej. `bot_prueba`)

---

### 🔄 Entrenar chatbot
```http
POST http://localhost:3000/api/train/Moodle.pdf?chatbotId=bot_prueba
```

> Reemplaza vectores anteriores del archivo y reentrena con nuevo contenido.

---

### 💬 Consultar al chatbot
```http
POST http://localhost:3000/api/chat
```

- **Body JSON**:
```json
{
  "query": "¿Qué es Moodle?",
  "chatbotId": "bot_prueba",
  "sessionId": "usuario_abc123"
}
```

---

## 🎯 Ejemplo de Pregunta

```plaintext
🗣️ Usuario: ¿Cuál es el contacto de soporte técnico para la plataforma EDU?
🤖 Chatbot: El contacto de soporte técnico para la plataforma EDU es el correo electrónico entorno.virtual@utec.edu.uy
```

---

## 🔥 Mejoras futuras

- [ ] Crear interfaz web para subida y consulta de archivos
- [ ] Panel de estadísticas por chatbot
- [ ] Autenticación y control de usuarios
- [ ] Soporte para otros tipos de archivo (DOCX, TXT, etc.)

---

## 📜 Licencia

Este proyecto es propiedad de la Universidad Tecnológica del Uruguay (UTEC).
Su uso, distribución o modificación está restringido exclusivamente a fines institucionales autorizados por UTEC.
❗ No está permitido reutilizar este código fuera de los fines establecidos por la institución.

📌 **Creado por**: Bruno Fernández (https://github.com/bruno-fernandez-r) 🚀
