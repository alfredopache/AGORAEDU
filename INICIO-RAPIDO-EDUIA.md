# ⚡ INICIO RÁPIDO - Acceso IA 2.0 (Versión Completa)

## 🎯 Para activar Acceso IA en 5 minutos:

### 1️⃣ Obtén tu API Key GRATIS
Ve a: **https://console.groq.com/keys**
- Crea cuenta (gratis, sin tarjeta)
- Clic en "Create API Key"
- Copia la clave generada

### 2️⃣ Configura la API Key
Abre `.env.local` y reemplaza:
```env
GROQ_API_KEY=tu_clave_aquí
```

### 3️⃣ Puebla la Base de Datos con Preguntas Certificadas
```bash
npm run seed:exam
```
Esto cargará preguntas de exámenes oficiales reales de España.

### 4️⃣ Reinicia el servidor
```bash
npm run dev
```

### 5️⃣ ¡Listo!
Abre `http://localhost:3000` y haz clic en **🤖 Acceso IA**

---

## ✨ NUEVAS CARACTERÍSTICAS V2.0

### 🎯 **Modo Chat (Mejorado)**
- ✅ Full-screen con diseño profesional
- ✅ Historial de conversaciones guardado
- ✅ Sidebar con todas tus charlas anteriores
- ✅ Acciones rápidas (generar ejercicios, explicar conceptos)
- ✅ Guardado automático en Sanity

### 📝 **Modo Examen (NUEVO)**
- ✅ Preguntas de opción múltiple
- ✅ Basadas en exámenes oficiales certificados
- ✅ Selección de materia y dificultad
- ✅ Cronómetro y progreso en tiempo real
- ✅ Análisis completo de rendimiento
- ✅ Revisión de respuestas con explicaciones
- ✅ Fuentes certificadas mostradas

### 📊 **Análisis Inteligente**
- ✅ Estadísticas detalladas (correctas, incorrectas, tiempo)
- ✅ Identificación de fortalezas
- ✅ Detección de áreas de mejora
- ✅ Recomendaciones personalizadas

### 📚 **Fuentes Certificadas**
- ✅ Ministerio de Educación
- ✅ Comunidades Autónomas
- ✅ Cambridge English / British Council
- ✅ RAE (Real Academia Española)

---

## 🎨 Diseño

- 🌈 **Full-screen**: Usa toda la pantalla para mejor experiencia
- 📱 **Responsive**: Funciona perfecto en móvil y tablet
- 🌙 **Modo oscuro**: Compatible con tema claro/oscuro
- ✨ **Animaciones**: Transiciones suaves con Framer Motion
- 🎨 **Gradientes**: Morado/Rosa para Acceso IA

---

## 📚 Preguntas de ejemplo:

**Modo Chat:**
```
"Explícame las ecuaciones de segundo grado"
"Dame ejercicios de fracciones"
"Reglas de acentuación en español"
"¿Cómo se usa el Present Perfect?"
```

**Modo Examen:**
1. Selecciona materia (o "Completo" para todas)
2. Elige dificultad (Básico/Intermedio/Avanzado)
3. Cantidad de preguntas (5-30)
4. ¡Empieza el examen!

---

## ❓ ¿Problemas?

**"El servicio de IA aún no está configurado"**
→ Verifica que agregaste `GROQ_API_KEY` en `.env.local` y reiniciaste el servidor

**No hay preguntas de examen**
→ Ejecuta `npm run seed:exam` para cargar las preguntas certificadas

**El sidebar no muestra conversaciones**
→ Las conversaciones se guardan automáticamente después del primer mensaje

---

## 💡 Tips:

✅ Groq es **100% GRATIS**  
✅ No necesitas tarjeta de crédito  
✅ Límites muy generosos (7,000 requests/día)  
✅ Respuestas ultra rápidas  
✅ Historial guardado en tu propia base de datos

---

**¿Más detalles?** Lee el [EDUIA-GUIA-COMPLETA.md](./EDUIA-GUIA-COMPLETA.md)

