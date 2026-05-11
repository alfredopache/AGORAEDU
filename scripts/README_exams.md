Uso del indexador de exámenes locales

1) Coloca los archivos de exámenes en `data/asignaturas`. Soportado: `.pdf`, `.txt`, `.md`, `.json`.

2) Ejecuta desde la raíz del repositorio:

```bash
npm run index:exams
```

o directamente:

```bash
node scripts/exam_indexer.js
```

3) El script generará `data/asignaturas/index.json` con un listado de los archivos procesados y extractos de texto.

Notas:
- El proyecto ya incluye `pdfjs-dist` como dependencia, que el script usa para extraer texto de PDFs.
- Si añades muchos archivos muy grandes, el índice puede tardar en generarse; el script limita cada texto a 200000 caracteres.
- Tras generar el índice, puedes pedir al asistente que priorice estas fuentes usando el prompt sistema `assistant_prompts/math_source_system_prompt.txt`.
