# 🤖 EduIA - Asistente Educativo para Grado Medio

## 📋 Descripción

EduIA es un chatbot educativo **completamente GRATUITO** especializado en ayudar a estudiantes españoles a preparar la **prueba de acceso a ciclos formativos de grado medio**.

### 🎯 Materias Cubiertas

- **📝 Lengua Castellana**: Gramática, ortografía, sintaxis, comprensión lectora
- **🔢 Matemáticas**: Álgebra, geometría, aritmética, ecuaciones
- **🌍 Inglés**: Gramática, vocabulario, tiempos verbales
- **🌐 Ciencias Sociales**: Historia, geografía, cultura general

---

## 🚀 Configuración Paso a Paso

### Paso 1: Obtener tu API Key GRATUITA de Groq

1. **Visita**: [https://console.groq.com/keys](https://console.groq.com/keys)
2. **Crea una cuenta** (gratis, sin tarjeta de crédito necesaria)
3. **Genera una API key** haciendo clic en "Create API Key"
4. **Copia** la API key generada

### Paso 2: Configurar la API Key

1. Abre el archivo `.env.local` en la raíz del proyecto
2. Encuentra la línea que dice:
   ```
   GROQ_API_KEY=tu_api_key_aqui
   ```
3. Reemplaza `tu_api_key_aqui` con tu API key real:
   ```
   GROQ_API_KEY=gsk_tu_clave_real_aqui
   ```
4. **Guarda el archivo**

### Paso 3: Reiniciar el Servidor

```bash
# Detén el servidor si está corriendo (Ctrl+C)
# Luego reinicia:
npm run dev
```

### Paso 4: ¡Usar EduIA!

1. Abre tu navegador en `http://localhost:3000`
2. Haz clic en el botón morado **"🤖 EDUIA"** en la navegación
3. ¡Empieza a hacer preguntas!

---

## 💡 Ejemplos de Uso

### Matemáticas
```
"Explícame cómo resolver ecuaciones de segundo grado paso a paso"
"Dame 5 ejercicios de fracciones con soluciones"
"¿Cómo se calcula el área de un círculo?"
```

### Lengua
```
"¿Cuáles son las reglas de acentuación en español?"
"Explícame la diferencia entre 'haber' y 'a ver'"
"Dame ejercicios de sintaxis con oraciones subordinadas"
```

### Inglés
```
"¿Cómo se forma el Present Perfect?"
"Dame ejemplos de verbos irregulares en pasado"
"Explícame la diferencia entre 'do' y 'make'"
```

### Ciencias Sociales
```
"¿Qué fue la Guerra Civil Española?"
"Explícame la geografía de España"
"Háblame sobre la Constitución Española de 1978"
```

---

## 🎨 Características

✅ **Totalmente Gratuito** - Sin costos ocultos  
✅ **Respuestas Instantáneas** - Groq API es ultra rápida  
✅ **Especializado** - Enfocado en el temario oficial  
✅ **Conversacional** - Mantiene contexto de la conversación  
✅ **Ejercicios Prácticos** - Solicita ejercicios cuando los necesites  
✅ **Explicaciones Detalladas** - Aprende paso a paso  
✅ **Disponible 24/7** - Estudia cuando quieras  

---

## 🛠️ Tecnologías Utilizadas

- **Next.js 16** - Framework de React
- **Groq API** - IA ultra rápida y gratuita (Llama 3.3 70B)
- **Framer Motion** - Animaciones suaves
- **Tailwind CSS** - Diseño moderno y responsive
- **TypeScript** - Tipado seguro

---

## 🔧 Solución de Problemas

### "El servicio de IA aún no está configurado"
- ✅ Verifica que hayas agregado tu `GROQ_API_KEY` en `.env.local`
- ✅ Asegúrate de haber reiniciado el servidor después de agregar la key
- ✅ Verifica que la API key sea correcta y esté activa

### El chatbot no responde
- ✅ Verifica tu conexión a internet
- ✅ Revisa la consola del navegador (F12) para errores
- ✅ Asegúrate de que Groq API esté funcionando: [https://status.groq.com](https://status.groq.com)

### Respuestas lentas
- ✅ Groq es muy rápido normalmente, puede ser tu conexión
- ✅ Si hay muchos usuarios, Groq puede tener rate limits (muy raros)

---

## 📊 Límites de Uso (Groq Free Tier)

Groq ofrece límites **MUY generosos** en su plan gratuito:

- ✅ **30 solicitudes por minuto**
- ✅ **7,000 solicitudes por día**
- ✅ **Sin necesidad de tarjeta de crédito**

Esto es **más que suficiente** para uso personal y estudiantes.

---

## 🎓 Consejos para Aprovechar al Máximo EduIA

1. **Sé específico**: Cuanto más detallada sea tu pregunta, mejor será la respuesta
2. **Pide ejercicios**: No solo teoría, practica con ejercicios
3. **Mantén la conversación**: El chatbot recuerda el contexto
4. **Verifica información importante**: Aunque es muy preciso, siempre confirma datos críticos
5. **Usa ejemplos reales**: Pide situaciones prácticas

---

## 🚀 Próximas Mejoras Planeadas

- [ ] Guardar conversaciones en base de datos
- [ ] Sistema de exámenes de práctica
- [ ] Seguimiento de progreso del estudiante
- [ ] Modo de estudio por temas
- [ ] Flashcards generadas por IA
- [ ] Corrección de tareas y redacciones

---

## 🤝 Soporte

¿Problemas o sugerencias? El chatbot está diseñado para ser robusto y fácil de usar. Si encuentras algún problema:

1. Revisa esta documentación
2. Verifica tu configuración de API key
3. Revisa la sección de solución de problemas

---

## 📄 Licencia

Este proyecto educativo es de código abierto y está disponible para ayudar a estudiantes de forma gratuita.

---

## 🌟 ¡Importante!

**EduIA es una herramienta de apoyo educativo**. Está diseñada para ayudarte a aprender y entender conceptos, no para hacer trampas. Úsala como complemento a tus estudios normales.

**¡Mucha suerte en tu prueba de acceso! 🎯📚**

---

**Hecho con ❤️ por AgoraEdu**
