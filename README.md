# Rock Lyrics Trainer

Juego web estático para memorizar letras de canciones con ganchos mnemotécnicos.

## Cómo usar

1. Clona este repo en GitHub y publica en GitHub Pages (gh-pages branch o `main` con `gh-pages` activado en settings).
2. Edita `config.json` para cambiar `projectName` y `driveFolderId` por defecto.
3. Subir letras a una carpeta pública de Google Drive (archivos `.txt` o `.md`). Cada archivo será leído como versos separados por doble salto de línea.
4. Abrir la web, pegar el ID de la carpeta (o usar el preconfigurado) y cargar.

## Notas técnicas
- Para listar archivos en Drive de forma robusta necesitarías la Drive API y una API key / OAuth; en esta versión usamos un método simple que funciona con carpetas públicas.
- La app guarda progreso localmente en `localStorage`.

## Despliegue a GitHub Pages
1. Crear repo y subir archivos.
2. En `Settings > Pages`, seleccionar rama `main` y carpeta `/ (root)`.
3. Esperar unos minutos y abrir `https://<usuario>.github.io/<repo>`.
