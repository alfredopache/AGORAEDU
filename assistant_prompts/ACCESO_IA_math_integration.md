Integración ACCESO IA — lectura de preguntas de Matemáticas

Endpoint creado: `GET /api/exams/math-questions`

Comportamiento:
- Devuelve el contenido de `data/asignaturas/math_questions_from_dataset.json` en JSON.
- Si existe la variable de entorno `ACCESO_IA_KEY`, el endpoint requiere enviar esa clave en la cabecera `x-accesso-ia-key` o como parámetro `?key=`.

Ejemplos:

1) Llamada sin clave (si no hay `ACCESO_IA_KEY` configurada):

```bash
curl -sS http://localhost:3000/api/exams/math-questions | jq .
```

2) Llamada con clave en cabecera:

```bash
curl -sS -H "x-accesso-ia-key: $ACCESO_IA_KEY" http://localhost:3000/api/exams/math-questions | jq .
```

3) Llamada con parámetro `key`:

```bash
curl -sS "http://localhost:3000/api/exams/math-questions?key=$ACCESO_IA_KEY" | jq .
```

Notas:
- Asegúrate de arrancar la app (`npm run dev`) para que el endpoint esté disponible localmente en `http://localhost:3000`.
- Si vas a exponer este endpoint a servicios externos, configura `ACCESO_IA_KEY` en el entorno de producción y comparte la clave sólo con sistemas autorizados.
