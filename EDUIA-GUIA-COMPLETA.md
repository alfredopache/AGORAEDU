# 🚀 ACCESO IA 2.0 - GUÍA COMPLETA

## 📋 Índice
1. [Características Principales](#características-principales)
2. [Instalación y Configuración](#instalación-y-configuración)
3. [Modo Chat](#modo-chat)
4. [Modo Examen](#modo-examen)
5. [Historial y Sidebar](#historial-y-sidebar)
6. [Análisis de Rendimiento](#análisis-de-rendimiento)
7. [Fuentes Certificadas](#fuentes-certificadas)
8. [Solución de Problemas](#solución-de-problemas)

---

## ✨ Características Principales

### 🎯 **Dos Modos de Estudio**

#### 💬 **Modo Chat**
- Conversaciones ilimitadas con IA especializada
- Historial guardado automáticamente
- Acciones rápidas (ejercicios, explicaciones, resúmenes)
- Contexto mantenido durante toda la conversación
- Guardado automático en base de datos

#### 📝 **Modo Examen**
- Preguntas de opción múltiple certificadas
- Selección de materia y dificultad
- Cronómetro y barra de progreso
- Análisis completo de resultados
- Revisión detallada con explicaciones
- Fuentes oficiales verificadas

### 📊 **Sistema de Análisis**
- Identificación de fortalezas y debilidades
- Recomendaciones personalizadas
- Estadísticas de tiempo y precisión
- Seguimiento de progreso

### 🗂️ **Gestión de Conversaciones**
- Sidebar con todas tus conversaciones
- Organización por materia
- Búsqueda rápida
- Carga instantánea de chats anteriores

---

## 🛠️ Instalación y Configuración

### Paso 1: Obtener API Key de Groq (GRATIS)

1. Ve a: https://console.groq.com/keys
2. Crea una cuenta (sin tarjeta de crédito)
3. Genera una API Key
4. Cópiala (empieza con `gsk_...`)

### Paso 2: Configurar Variables de Entorno

Abre `.env.local` y agrega:

```env
GROQ_API_KEY=gsk_tu_clave_real_aqui
```

### Paso 3: Poblar Base de Datos con Preguntas

Ejecuta el script de seed para cargar preguntas certificadas:

```bash
npm run seed:exam
```

Este comando cargará preguntas de:
- ✅ Matemáticas (ecuaciones, geometría, fracciones)
- ✅ Lengua Castellana (gramática, ortografía, sintaxis)
- ✅ Inglés (verbos, gramática, vocabulario)
- ✅ Ciencias Sociales (historia, geografía)

### Paso 4: Iniciar el Servidor

```bash
npm run dev
```

### Paso 5: Acceder a Acceso IA

1. Abre: http://localhost:3000
2. Haz clic en el botón morado **🤖 Acceso IA**
3. ¡Empieza a usar!

---

## 💬 Modo Chat

### Interfaz Full-Screen

El modo chat ahora usa **toda la pantalla** para una mejor experiencia:

- **Área principal**: Mensajes del chat con scroll infinito
- **Sidebar derecho**: Historial de todas tus conversaciones
- **Input grande**: Área de texto expandible
- **Acciones rápidas**: Botones para generar contenido

### Características del Chat

#### 🎯 Acciones Rápidas

1. **Generar ejercicios**: Clic → escribe el tema → obtén ejercicios
2. **Explicar concepto**: Obtén explicaciones detalladas paso a paso
3. **Resumir tema**: Resúmenes concisos de cualquier tema

#### 💾 Guardado Automático

- Las conversaciones se guardan automáticamente después de cada mensaje
- No necesitas hacer clic en "guardar"
- Accede a ellas desde el sidebar en cualquier momento

#### 🏷️ Organización por Materia

Las conversaciones se clasifican automáticamente:
- 📝 Lengua (detecta: gramática, ortografía, sintaxis)
- 🔢 Matemáticas (detecta: ecuaciones, números, geometría)
- 🌍 Inglés (detecta: inglés, english, verbos)
- 🌐 Sociales (detecta: historia, geografía, social)

### Ejemplos de Uso en Chat

#### Para estudiar teoría:
```
"Explícame paso a paso cómo resolver ecuaciones de segundo grado"
"¿Cuáles son todas las reglas de acentuación en español?"
"Enséñame los tiempos verbales en inglés"
```

#### Para practicar:
```
"Dame 15 ejercicios de fracciones con diferentes dificultades"
"Ponme a prueba sobre verbos irregulares en inglés"
"Genera 10 problemas de geometría con soluciones"
```

#### Para resolver dudas:
```
"No entiendo la diferencia entre Complemento Directo e Indirecto"
"¿Por qué se usa 'for' y no 'since' en esta oración?"
"Explícame qué es un sistema de ecuaciones"
```

---

## 📝 Modo Examen

### Configuración del Examen

#### 1. Selección de Materia
- 🔢 **Matemáticas**: Álgebra, geometría, aritmética
- 📝 **Lengua**: Gramática, ortografía, sintaxis
- 🌍 **Inglés**: Gramática, vocabulario, verbos
- 🌐 **Ciencias Sociales**: Historia, geografía
- 🎯 **Completo**: Mix de todas las materias

#### 2. Nivel de Dificultad
- ⭐ **Básico**: Conceptos fundamentales
- ⭐⭐ **Intermedio**: Nivel estándar del examen
- ⭐⭐⭐ **Avanzado**: Preguntas complejas

#### 3. Cantidad de Preguntas
- Mínimo: 5 preguntas
- Máximo: 30 preguntas
- Recomendado: 10-15 para práctica rápida

### Durante el Examen

#### Interfaz
- **Barra de progreso**: Muestra tu avance
- **Contador de preguntas**: Pregunta 3 de 10
- **Opciones A, B, C, D**: Botones grandes y claros
- **Metadata visible**: Materia, tema, dificultad
- **Badge de certificación**: Si es pregunta oficial

#### Metadata de cada Pregunta
- 📚 **Materia**: Qué área cubre
- 🏷️ **Tema**: Concepto específico
- ⭐ **Dificultad**: Nivel de complejidad
- 🏆 **Fuente certificada**: De qué examen oficial proviene
- 📅 **Año**: Cuándo se usó esa pregunta

#### Navegación
- Solo puedes avanzar (no retroceder)
- Una vez respondes, pasas a la siguiente
- Al terminar, ves los resultados inmediatamente

### Resultados del Examen

#### Estadísticas Principales
```
✅ Respuestas Correctas: 8/10
❌ Respuestas Incorrectas: 2/10
⏱️ Tiempo Total: 5:23
📊 Tiempo Promedio: 32s/pregunta
💯 Puntuación: 80%
```

#### Análisis de Rendimiento

**Fortalezas detectadas:**
- Conceptos que dominas bien
- Áreas donde destacas
- Habilidades identificadas

**Áreas de mejora:**
- Temas que necesitas repasar
- Conceptos confusos
- Tipos de preguntas problemáticas

**Recomendaciones personalizadas:**
- Sugerencias específicas según tu rendimiento
- Temas a estudiar
- Estrategias de mejora

#### Revisión Completa

Después del examen, puedes revisar:
- ✅ Todas las preguntas
- ✅ Tu respuesta seleccionada
- ✅ La respuesta correcta marcada en verde
- ✅ Explicación detallada de cada respuesta
- ✅ Fuente certificada de cada pregunta
- ✅ Por qué tu respuesta fue correcta o incorrecta

---

## 🗂️ Historial y Sidebar

### Sidebar Derecho

**Qué contiene:**
- 📂 Todas tus conversaciones guardadas
- 📅 Fecha de cada conversación
- 🏷️ Materia detectada
- 💬 Título generado del primer mensaje

**Funciones:**
- 🆕 Botón "Nuevo Chat" arriba
- 🔄 Botón "Actualizar" abajo
- 🖱️ Click en cualquier conversación para cargarla
- 📱 Hamburger menu en móvil

### Organización Automática

Las conversaciones se etiquetan por color según materia:
- 🟣 **Morado**: Lengua
- 🔴 **Rosa**: Matemáticas
- 🔵 **Azul**: Inglés
- 🟢 **Verde**: Ciencias Sociales
- ⚪ **Gris**: General

### Carga Instantánea

- Click en una conversación → se carga completa
- Mantiene todo el historial
- Puedes continuar la conversación desde donde la dejaste

---

## 📊 Análisis de Rendimiento

### Generación Automática

Después de cada examen, Acceso IA analiza:
1. Tu puntuación global
2. Tiempo empleado por pregunta
3. Patrones de aciertos/errores
4. Comparación con el estándar

### Tipos de Análisis

#### Por Puntuación:
- **80-100%**: Excelente → Sugerencia de aumentar dificultad
- **60-79%**: Bueno → Refuerzo de temas específicos
- **0-59%**: Necesita mejora → Vuelta a fundamentos

#### Por Tiempo:
- **< 30s/pregunta**: Quizás muy rápido → Más cuidado
- **30-120s/pregunta**: ✅ Buen equilibrio
- **> 120s/pregunta**: Trabajar en velocidad

#### Por Materia:
- Detecta en qué temas fallas más
- Sugiere áreas específicas de estudio
- Recomienda usar Chat para dudas

---

## 🏆 Fuentes Certificadas

### Preguntas Verificadas

Todas las preguntas del modo examen provienen de:

#### Instituciones Oficiales:
- **Ministerio de Educación** (Nacional)
- **Comunidades Autónomas**: Madrid, Andalucía, Cataluña, Valencia, Galicia, Castilla y León
- **RAE**: Real Academia Española (Lengua)
- **Cambridge English / British Council**: Inglés certificado

#### Información Mostrada:
```
🏆 Fuente Certificada
   Ministerio de Educación - Nacional (2024)
   [Ver fuente original →]
```

### Actualización de Preguntas

Las preguntas se pueden actualizar:
1. Accede a Sanity Studio: http://localhost:3000/admin
2. Ve a "Preguntas de Examen"
3. Agrega/edita preguntas
4. Marca fuente y año

---

## 🎨 Diseño Visual

### Paleta de Colores

- **Principal**: Gradiente morado → rosa
- **Chat Usuario**: Azul → morado
- **IA**: Morado → rosa
- **Correcta**: Verde
- **Incorrecta**: Rojo
- **Info**: Azul

### Elementos Visuales

- **Avatares**: Robot (IA) vs Usuario
- **Badges**: Materias con colores distintos
- **Progress bars**: Animadas con Framer Motion
- **Cards**: Borde y sombra suave
- **Buttons**: Gradientes y hover effects

### Responsive

- **Desktop**: Sidebar fijo + área principal
- **Tablet**: Sidebar colapsable
- **Mobile**: Hamburger menu + full-screen

---

## 🔧 Arquitectura Técnica

### Frontend (Client Components)
```
app/eduia/
  ├── page.tsx                 # Página principal (Server)
  └── components/
      ├── main-layout.tsx      # Layout con sidebar
      ├── chat-mode.tsx        # Modo chat
      ├── exam-mode.tsx        # Modo examen
      └── conversation-sidebar.tsx  # Sidebar historial
```

### Backend (API Routes)
```
app/api/
  ├── chat/
  │   └── route.ts            # Endpoint chat con Groq
  ├── conversations/
  │   ├── route.ts            # GET/POST/DELETE conversaciones
  │   └── [id]/route.ts       # GET conversación específica
  └── exam/
      ├── questions/route.ts   # GET preguntas filtradas
      └── submit/route.ts      # POST guardar intento
```

### Base de Datos (Sanity Schemas)
```
sanity/schemaTypes/
  ├── chatConversation.ts     # Conversaciones guardadas
  ├── examQuestion.ts         # Preguntas de examen
  └── examAttempt.ts          # Intentos de examen
```

### Scripts
```
scripts/
  └── seed-exam-questions.ts  # Poblar preguntas certificadas
```

---

## 📚 Uso Detallado

### Modo Chat: Use Cases

#### 1️⃣ **Estudiar Teoría**
```
Usuario: "Explícame el teorema de Pitágoras"
Acceso IA: [Explicación detallada con ejemplos y diagramas verbales]

Usuario: "Dame un ejemplo práctico"
Acceso IA: [Ejemplo con números concretos y solución paso a paso]
```

#### 2️⃣ **Generar Ejercicios**
```
Usuario: "Dame 10 ejercicios de fracciones"
Acceso IA: [Lista de 10 ejercicios con diferentes dificultades]

Usuario: "Ayúdame con el ejercicio 5"
Acceso IA: [Solución paso a paso del ejercicio 5]
```

#### 3️⃣ **Resolver Dudas**
```
Usuario: "¿Cuándo se usa 'haber' y cuándo 'a ver'?"
Acceso IA: [Explicación con reglas y múltiples ejemplos]

Usuario: "¿Y 'haver' existe?"
Acceso IA: [Aclaración sobre el error ortográfico común]
```

#### 4️⃣ **Preparación Específica**
```
Usuario: "¿Qué temas de historia suelen preguntar en el examen?"
Acceso IA: [Lista de temas más frecuentes con contenido clave]
```

### Modo Examen: Flujo Completo

#### Configuración (30 segundos)
```
1. Selecciona materia → Click en "Matemáticas"
2. Elige dificultad → Click en "Intermedio ⭐⭐"
3. Ajusta cantidad → Slider a 10 preguntas
4. Click en "Iniciar Examen"
```

#### Durante el Examen (10-15 minutos)
```
- Pregunta aparece con 4 opciones
- Lees la pregunta cuidadosamente
- Ves la metadata (tema, fuente, año)
- Seleccionas una opción → Click
- Automáticamente avanza a la siguiente
- Barra de progreso se actualiza
```

#### Resultados (5 minutos de revisión)
```
1. Ves tu puntuación grande y colorida
2. Estadísticas en 4 cards
3. Análisis de rendimiento detallado
4. Scroll down para revisar todas las preguntas
5. Verde = correcta, Rojo = tu error
6. Lees explicaciones de cada respuesta
7. Ves fuentes oficiales
8. Click en "Hacer Otro Examen"
```

---

## 📊 Sistema de Evaluación

### Cálculo de Puntuación

```
Puntuación = (Respuestas Correctas / Total Preguntas) × 100
```

### Criterios de Análisis

#### Excelente (80-100%):
- ✅ "Excelente comprensión general"
- ✅ "Buen manejo del tiempo"
- 📈 Recomendación: Aumentar dificultad

#### Bueno (60-79%):
- ✅ "Comprensión básica sólida"
- ⚠️ "Algunos conceptos necesitan refuerzo"
- 📈 Recomendación: Practicar temas específicos

#### Necesita Mejora (0-59%):
- ⚠️ "Necesitas reforzar fundamentos"
- ⚠️ "Considera repasar el temario"
- 📈 Recomendación: Usar modo Chat para dudas

### Análisis de Velocidad

- **Óptimo**: 30-120 segundos por pregunta
- **Muy rápido**: < 30s → Posible descuido
- **Muy lento**: > 120s → Falta de práctica

---

## 🏆 Fuentes Certificadas

### Instituciones Verificadas

#### **Nacionales:**
- Ministerio de Educación y Formación Profesional
- Real Academia Española (RAE)
- Cambridge English / British Council

#### **Autonómicas:**
- Comunidad de Madrid
- Junta de Andalucía
- Generalitat de Catalunya
- Generalitat Valenciana
- Xunta de Galicia
- Junta de Castilla y León

### Verificación de Fuentes

Cada pregunta muestra:
```yaml
Fuente: Ministerio de Educación
Región: Nacional
Año: 2024
URL: [enlace a documento oficial] (opcional)
```

### Cómo se Validan

1. Preguntas extraídas de exámenes oficiales públicos
2. Verificadas contra temario oficial de Grado Medio
3. Contrastadas con materiales educativos certificados
4. Actualizadas anualmente

---

## 🛠️ Gestión de Contenido (Sanity Studio)

### Agregar Preguntas Nuevas

1. Ve a: http://localhost:3000/admin
2. Click en "Preguntas de Examen"
3. Click en "+"
4. Completa el formulario:

```yaml
Pregunta: [Texto de la pregunta]
Materia: [Selector]
Tema: [Texto libre]
Dificultad: [Básico/Intermedio/Avanzado]

Opciones:
  - Opción A: [texto] ✅ Correcta
  - Opción B: [texto] ❌
  - Opción C: [texto] ❌
  - Opción D: [texto] ❌

Explicación: [Por qué la A es correcta]

Fuente:
  - Nombre: Ministerio de Educación
  - Año: 2024
  - Región: Nacional
  - URL: [opcional]

Activa: ✅ Sí
```

5. Click en "Publish"

### Editar/Desactivar Preguntas

- Para editar: Click en la pregunta → Modificar → Publish
- Para desactivar: Quitar check de "Activa"
- Para eliminar: Click en "..." → Delete

---

## 🚀 Características Avanzadas

### 1. **Múltiples Sesiones**

Cada navegador tiene su propio `sessionId`:
- Diferentes dispositivos = diferentes historiales
- Usa localStorage para persistencia
- No necesitas login (por ahora)

### 2. **Detección Inteligente de Materia**

El sistema detecta automáticamente la materia por palabras clave:
```javascript
'ecuación' || 'número' → Matemáticas
'gramática' || 'ortografía' → Lengua
'inglés' || 'english' → Inglés
'historia' || 'geografía' → Ciencias Sociales
```

### 3. **Preguntas Aleatorias**

En modo examen:
- Las preguntas se mezclan aleatoriamente
- Nunca el mismo orden dos veces
- Evita memorización de posiciones

### 4. **Guardado Robusto**

- Guardado automático después de cada mensaje
- Retry automático si falla
- No se pierden datos

---

## ❓ Solución de Problemas

### 🔴 "El servicio de IA aún no está configurado"

**Causa**: Falta API key de Groq

**Solución**:
```bash
1. Abre .env.local
2. Verifica: GROQ_API_KEY=gsk_...
3. La clave debe empezar con 'gsk_'
4. Guarda el archivo (Ctrl+S)
5. Reinicia: npm run dev
```

---

### 🔴 No aparecen preguntas en Modo Examen

**Causa**: Base de datos vacía

**Solución**:
```bash
npm run seed:exam
```

Verás en consola:
```
🌱 Iniciando seed de preguntas...
📝 Creando pregunta: ¿Cuál es el resultado...
📝 Creando pregunta: Si un rectángulo tiene...
✅ ¡Completado! 15 preguntas creadas.
```

---

### 🔴 Sidebar no muestra conversaciones

**Causa**: No hay conversaciones guardadas aún

**Solución**:
1. Inicia una conversación en modo Chat
2. Envía al menos 1 mensaje
3. Espera la respuesta de Acceso IA
4. La conversación se guarda automáticamente
5. Refresca para ver en sidebar

---

### 🔴 Error de TypeScript en imports

**Causa**: Next.js no ha recompilado archivos nuevos

**Solución**:
1. Detén el servidor (Ctrl+C)
2. Limpia caché: `rm -rf .next`
3. Reinicia: `npm run dev`
4. Espera a que compile completamente

---

### 🔴 Respuestas muy lentas

**Causas posibles**:
- Conexión a internet lenta
- Groq API bajo carga (raro)
- Rate limit alcanzado (muy raro)

**Solución**:
- Verifica tu internet
- Espera 1-2 minutos
- Chequea: https://status.groq.com

---

## 📈 Roadmap Futuro

### Próximas Características:

- [ ] **Sistema de usuarios**: Login y perfiles
- [ ] **Estadísticas globales**: Progreso a lo largo del tiempo
- [ ] **Flashcards**: Generación automática desde conversaciones
- [ ] **Modo competición**: Ranking de mejores puntuaciones
- [ ] **Estudio programado**: Calendario de repaso
- [ ] **Más fuentes**: Más exámenes oficiales
- [ ] **Exportar conversaciones**: PDF de tus chats
- [ ] **Modo voz**: Hablar con Acceso IA
- [ ] **Imágenes**: Soporte para problemas con gráficos
- [ ] **Comunidad**: Compartir preguntas entre usuarios

---

## 💻 Comandos Útiles

```bash
# Desarrollo
npm run dev                # Iniciar servidor desarrollo

# Seed
npm run seed:exam         # Cargar preguntas de examen

# Build
npm run build             # Compilar para producción
npm start                 # Iniciar producción

# Linting
npm run lint              # Verificar código
```

---

## 📞 Soporte

### Documentación:
1. **INICIO-RAPIDO-EDUIA.md** → Guía rápida
2. **EDUIA-GUIA-COMPLETA.md** → Este archivo
3. **GUIA-VISUAL-EDUIA.md** → Paso a paso visual

### Debugging:
1. Abre consola del navegador (F12)
2. Ve a la pestaña "Console"
3. Busca errores en rojo
4. Cópialos para investigar

### Verificar Estado:
```bash
# Ver errores de compilación
npm run build

# Ver logs del servidor
# En la terminal donde corre npm run dev
```

---

## 🎓 Mejores Prácticas

### Para Estudiantes:

1. **Usa el modo Chat primero**: Estudia teoría y resuelve dudas
2. **Luego practica con exámenes**: Valida lo que aprendiste
3. **Revisa tus errores**: Lee las explicaciones
4. **Practica regularmente**: Consistencia > Intensidad
5. **Aumenta dificultad gradualmente**: Básico → Intermedio → Avanzado

### Para Profesores/Administradores:

1. **Agrega preguntas propias** en Sanity Studio
2. **Desactiva preguntas obsoletas** (quitar check "Activa")
3. **Actualiza fuentes** con nuevos exámenes cada año
4. **Monitorea uso** en Sanity Studio

---

## 🌟 Ventajas de Acceso IA 2.0

| Característica | Beneficio |
|---------------|-----------|
| 💬 **Chat Full-Screen** | Más espacio, mejor lectura |
| 🗂️ **Historial Guardado** | Nunca pierdas una conversación |
| 📝 **Modo Examen** | Práctica realista con timer |
| 🏆 **Fuentes Certificadas** | Confianza en el contenido |
| 📊 **Análisis Inteligente** | Sabe dónde mejorar |
| 🎯 **Opciones Múltiples** | Como el examen real |
| ⚡ **Ultra Rápido** | Groq responde en < 1s |
| 💯 **100% Gratis** | Sin costos ocultos |

---

## 🎯 Objetivos de Aprendizaje

Acceso IA 2.0 está diseñado para ayudarte a:

1. ✅ **Comprender conceptos** profundamente
2. ✅ **Practicar** con casos reales
3. ✅ **Identificar** tus áreas débiles
4. ✅ **Mejorar** sistemáticamente
5. ✅ **Ganar confianza** antes del examen real
6. ✅ **Aprobar** la prueba de acceso

---

## 🎉 ¡Empieza Ahora!

### Checklist de Inicio:
```
[ ] ✅ Groq API key configurada
[ ] ✅ npm run seed:exam ejecutado
[ ] ✅ npm run dev corriendo
[ ] ✅ Acceso IA abierto en navegador
[ ] ✅ Primera conversación creada
[ ] ✅ Primer examen completado
```

---

**¡Mucha suerte en tu preparación para el acceso a Grado Medio! 🎓📚✨**

---

*Desarrollado con ❤️ para AgoraEdu*  
*Next.js 16 • Groq API • Sanity CMS • Tailwind CSS • TypeScript • Framer Motion*
