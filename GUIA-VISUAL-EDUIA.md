# 🎯 GUÍA VISUAL PASO A PASO - Activar Acceso IA

## 📍 PASO 1: Obtener tu API Key GRATUITA

### 1.1 - Ir a Groq Console
```
🌐 Abre tu navegador y ve a: https://console.groq.com/keys
```

### 1.2 - Crear cuenta
```
👤 Haz clic en "Sign Up" o "Create Account"
📧 Usa tu email (NO necesitas tarjeta de crédito)
✅ Confirma tu cuenta
```

### 1.3 - Generar API Key
```
🔑 Una vez dentro, haz clic en "Create API Key"
📝 Dale un nombre (ejemplo: "Acceso IA Blog")
📋 COPIA la clave que aparece (empieza con: gsk_...)
⚠️  IMPORTANTE: La clave solo se muestra UNA VEZ, guárdala bien
```

---

## 📍 PASO 2: Configurar tu Proyecto

### 2.1 - Abrir archivo .env.local
```
📂 En VS Code, abre el archivo: .env.local
📍 Lo encontrarás en la raíz del proyecto
```

### 2.2 - Agregar tu API Key
```
Busca esta línea:
❌ GROQ_API_KEY=tu_api_key_aqui

Reemplázala con:
✅ GROQ_API_KEY=gsk_TU_CLAVE_REAL_AQUI

Ejemplo:
✅ GROQ_API_KEY=gsk_abc123xyz456def789ghi012jkl345mno678pqr901stu234vwx567yz
```

### 2.3 - Guardar el archivo
```
💾 Presiona Ctrl + S (Windows) o Cmd + S (Mac)
✅ Verifica que se guardó (el puntito en la pestaña desaparece)
```

---

## 📍 PASO 3: Reiniciar el Servidor

### 3.1 - Abrir la terminal en VS Code
```
📟 Menú: Terminal → New Terminal
O presiona: Ctrl + Ñ (Windows) o Ctrl + ` (Mac)
```

### 3.2 - Detener el servidor actual (si está corriendo)
```
⏹️  Presiona: Ctrl + C
⏸️  Espera a que el proceso termine
```

### 3.3 - Iniciar el servidor
```
▶️  Escribe en la terminal: npm run dev
⏎  Presiona Enter
⏳ Espera a que aparezca: "Ready - started server on..."
```

Deberías ver algo como:
```bash
> blog-fp@0.1.0 dev
> next dev

  ▲ Next.js 16.1.6
  - Local:        http://localhost:3000

 ✓ Starting...
 ✓ Ready in 2.3s
```

---

## 📍 PASO 4: ¡Usar Acceso IA!

### 4.1 - Abrir el navegador
```
🌐 Abre: http://localhost:3000
```

### 4.2 - Navegar a Acceso IA
```
👀 Busca en la barra de navegación el botón morado:
   🤖 Acceso IA
🖱️  Haz clic en él
```

### 4.3 - ¡Empieza a chatear!
```
💬 Escribe tu primera pregunta, por ejemplo:
   "Explícame las ecuaciones de segundo grado"

📤 Presiona Enter o haz clic en "Enviar"
🤖 ¡Acceso IA te responderá en segundos!
```

---

## 🎉 ¡FELICIDADES!

Si llegaste hasta aquí, Acceso IA ya está funcionando. Ahora puedes:

```
✅ Hacer preguntas sobre Lengua, Matemáticas, Inglés o Ciencias Sociales
✅ Pedir ejercicios prácticos
✅ Solicitar explicaciones detalladas
✅ Prepararte para tu examen de acceso a Grado Medio
```

---

## ❓ Problemas Comunes y Soluciones

### 🔴 "El servicio de IA aún no está configurado"

**Diagnóstico:**
- La API key no está configurada o es incorrecta

**Solución:**
1. ✅ Abre `.env.local`
2. ✅ Verifica que la línea sea: `GROQ_API_KEY=gsk_...`
3. ✅ La clave debe empezar con `gsk_`
4. ✅ NO debe tener espacios ni comillas extra
5. ✅ Guarda el archivo (Ctrl+S)
6. ✅ Reinicia el servidor (Ctrl+C y luego `npm run dev`)

---

### 🔴 No veo el botón "ACCESO IA" en la navegación

**Solución:**
1. ✅ Refresca la página (F5 o Ctrl+R)
2. ✅ Verifica que el servidor esté corriendo
3. ✅ Limpia la caché del navegador (Ctrl+Shift+R)

---

### 🔴 El chatbot responde muy lento

**Causas posibles:**
- 🌐 Tu conexión a internet es lenta
- 🌍 Groq API puede estar ocupado (muy raro)

**Solución:**
- ⏳ Espera unos segundos más
- 🔄 Si tarda más de 30 segundos, recarga la página

---

### 🔴 Error de TypeScript en VS Code

**Mensaje:**
```
Cannot find module './chat-client'
```

**Solución:**
- ✅ Este error es NORMAL cuando creas archivos nuevos
- ✅ Se resolverá automáticamente al reiniciar el servidor
- ✅ O espera unos segundos a que TypeScript recompile
- ✅ Puedes ignorarlo, no afecta la funcionalidad

---

## 📊 Verificación Final

Marca cada punto cuando lo completes:

```
[ ] ✅ Tengo una cuenta en Groq Console
[ ] ✅ Generé mi API key
[ ] ✅ Copié la API key completa
[ ] ✅ Abrí el archivo .env.local
[ ] ✅ Pegué mi API key en GROQ_API_KEY=
[ ] ✅ Guardé el archivo .env.local
[ ] ✅ Reinicié el servidor (npm run dev)
[ ] ✅ El servidor está corriendo sin errores
[ ] ✅ Abrí http://localhost:3000
[ ] ✅ Veo el botón "🤖 Acceso IA" en la navegación
[ ] ✅ Hice clic en el botón
[ ] ✅ Veo la interfaz del chatbot
[ ] ✅ Escribí una pregunta de prueba
[ ] ✅ Acceso IA me respondió correctamente
```

---

## 🎓 Primeros Pasos con Acceso IA

### Preguntas de prueba para empezar:

**🔢 Matemáticas:**
```
"Explícame las propiedades de las potencias"
"Dame 5 ejercicios de ecuaciones de primer grado"
"¿Cómo se calcula el área de un círculo?"
```

**📝 Lengua:**
```
"¿Cuándo se acentúan las palabras agudas?"
"Explícame qué es un complemento directo"
"Dame ejemplos de oraciones compuestas"
```

**🌍 Inglés:**
```
"¿Cómo se forma el pasado simple en inglés?"
"Dame 10 verbos irregulares con ejemplos"
"Explícame la diferencia entre 'much' y 'many'"
```

**🌐 Ciencias Sociales:**
```
"Resúmeme la Guerra de la Independencia"
"¿Cuáles son los ríos más importantes de España?"
"Explícame qué es la Constitución Española"
```

---

## 💡 Consejos Pro

1. **Sé específico:** Cuanto más detallada tu pregunta, mejor la respuesta
2. **Pide ejemplos:** "Dame ejemplos de..." siempre ayuda
3. **Solicita ejercicios:** "Dame 10 ejercicios de..." para practicar
4. **Mantén la conversación:** Acceso IA recuerda el contexto anterior
5. **Pide aclaraciones:** Si no entiendes, pregunta de nuevo de otra forma

---

## 📞 ¿Más Ayuda?

Lee estos archivos en orden si necesitas más información:

1. **INICIO-RAPIDO-EDUIA.md** ← Empieza aquí
2. **EDUIA-IMPLEMENTACION-COMPLETA.md** ← Guía detallada
3. **app/eduia/README.md** ← Documentación técnica

---

## 🚀 ¡Todo Listo!

**Si completaste todos los pasos, Acceso IA ya está funcionando en tu proyecto.**

```
🎯 Objetivo: Ayudarte a aprobar el examen de acceso a Grado Medio
💯 Costo: COMPLETAMENTE GRATIS
⚡ Velocidad: Respuestas en menos de 2 segundos
🤖 Modelo: Llama 3.3 70B (muy potente)
📚 Materias: Lengua, Matemáticas, Inglés, Ciencias Sociales
```

**¡Mucha suerte en tu preparación! 🎓✨**

---

*Si sigues teniendo problemas, revisa la sección de "Problemas Comunes" arriba*  
*O lee la documentación completa en: EDUIA-IMPLEMENTACION-COMPLETA.md*
