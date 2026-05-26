import * as FileSystem from 'expo-file-system';
import { SQLiteDatabase } from 'expo-sqlite';

// ─── Data interfaces ──────────────────────────────────────────────────────────

export interface FotoData {
  uri: string;
  orden: number;
}

export interface ObjetoData {
  id: number;
  nombre: string;
  descripcion: string;
  etiquetas: string[];
  fotos: FotoData[];
}

export interface ContenedorData {
  id: number;
  nombre: string;
  descripcion: string;
  ubicacion: string;
  objetos: ObjetoData[];
}

export interface InventarioData {
  contenedores: ContenedorData[];
  totalObjetos: number;
  generadoEn: Date;
}

// ─── Utility functions ────────────────────────────────────────────────────────

/**
 * Generates the PDF file name with the date in YYYY-MM-DD format.
 * Example: inventario-san-alejo-2025-01-15.pdf
 */
export function buildFileName(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `inventario-san-alejo-${year}-${month}-${day}.pdf`;
}

/**
 * Reads an image file from the local filesystem and returns it as a base64 string.
 * Returns null if the file does not exist or cannot be read.
 * Requirements: 3.8
 */
export async function readImageAsBase64(uri: string): Promise<string | null> {
  try {
    const base64 = await FileSystem.readAsStringAsync(uri, {
      encoding: 'base64',
    });
    return base64;
  } catch {
    return null;
  }
}

// ─── Data collection ──────────────────────────────────────────────────────────

/**
 * Collects all inventory data from the database.
 * - Containers are ordered alphabetically by name (ASC).
 * - Objects within each container are ordered alphabetically by name (ASC).
 * - Each object includes its tags and photos (ordered by `orden` ASC).
 * Requirements: 2.1, 2.2, 2.3, 2.4
 */
export async function collectInventoryData(
  db: SQLiteDatabase
): Promise<InventarioData> {
  // 1. Fetch all containers ordered alphabetically by name
  const contenedorRows = await db.getAllAsync<{
    id: number;
    nombre: string;
    descripcion: string;
    ubicacion: string;
  }>('SELECT id, nombre, descripcion, ubicacion FROM contenedor ORDER BY nombre ASC');

  let totalObjetos = 0;

  // 2. For each container, fetch its objects and their details
  const contenedores: ContenedorData[] = await Promise.all(
    contenedorRows.map(async (c) => {
      // Fetch objects ordered alphabetically by name
      const objetoRows = await db.getAllAsync<{
        id: number;
        nombre: string;
        descripcion: string;
      }>(
        'SELECT id, nombre, descripcion FROM objeto WHERE id_contenedor = ? ORDER BY nombre ASC',
        c.id
      );

      // 3. For each object, fetch its tags and photos
      const objetos: ObjetoData[] = await Promise.all(
        objetoRows.map(async (o) => {
          // Fetch tags for this object
          const etiquetaRows = await db.getAllAsync<{ nombre: string }>(
            `SELECT e.nombre FROM etiqueta e
             JOIN objeto_etiqueta oe ON e.id = oe.id_etiqueta
             WHERE oe.id_objeto = ?
             ORDER BY e.nombre ASC`,
            o.id
          );

          // Fetch photos ordered by orden ASC
          const fotoRows = await db.getAllAsync<{ uri: string; orden: number }>(
            'SELECT uri, orden FROM objeto_foto WHERE id_objeto = ? ORDER BY orden ASC',
            o.id
          );

          return {
            id: o.id,
            nombre: o.nombre,
            descripcion: o.descripcion,
            etiquetas: etiquetaRows.map((e) => e.nombre),
            fotos: fotoRows.map((f) => ({ uri: f.uri, orden: f.orden })),
          };
        })
      );

      totalObjetos += objetos.length;

      return {
        id: c.id,
        nombre: c.nombre,
        descripcion: c.descripcion,
        ubicacion: c.ubicacion,
        objetos,
      };
    })
  );

  return {
    contenedores,
    totalObjetos,
    generadoEn: new Date(),
  };
}

// ─── HTML generation ──────────────────────────────────────────────────────────

/**
 * Formats a Date into a human-readable string.
 * Example: "15/01/2025, 14:30:05"
 */
function formatDate(date: Date): string {
  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const year = date.getFullYear();
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  const seconds = String(date.getSeconds()).padStart(2, '0');
  return `${day}/${month}/${year}, ${hours}:${minutes}:${seconds}`;
}

/**
 * Escapes HTML special characters to prevent injection in generated content.
 */
function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

/**
 * Builds the complete HTML string for the PDF.
 * Images are embedded as base64 data URIs.
 * Requirements: 3.1, 3.2, 3.3, 3.4, 3.5, 3.6, 3.7, 3.8
 */
export async function buildHtml(data: InventarioData): Promise<string> {
  const { contenedores, totalObjetos, generadoEn } = data;
  const totalContenedores = contenedores.length;
  const fechaHora = formatDate(generadoEn);

  // Build each container section
  const contenedoresSections = await Promise.all(
    contenedores.map(async (contenedor) => {
      // Build each object section within the container
      let objetosHtml: string;

      if (contenedor.objetos.length === 0) {
        // Requirement 3.2: empty container indication
        objetosHtml = '<p class="empty-container">Este contenedor está vacío.</p>';
      } else {
        const objetosSections = await Promise.all(
          contenedor.objetos.map(async (objeto) => {
            // Etiquetas section — Requirement 3.3
            const etiquetasHtml =
              objeto.etiquetas.length > 0
                ? `<p class="tags"><strong>Etiquetas:</strong> ${objeto.etiquetas
                    .map((e) => `<span class="tag">${escapeHtml(e)}</span>`)
                    .join(' ')}</p>`
                : '';

            // Images section — Requirements 3.4, 3.5, 3.8
            let imagenesHtml = '';
            if (objeto.fotos.length > 0) {
              const imgTags: string[] = [];
              for (const foto of objeto.fotos) {
                const base64 = await readImageAsBase64(foto.uri);
                if (base64 !== null) {
                  // Requirement 3.4: max-width 100%
                  imgTags.push(
                    `<img src="data:image/jpeg;base64,${base64}" alt="Foto de ${escapeHtml(objeto.nombre)}" />`
                  );
                }
                // Requirement 3.8: if null, silently skip
              }
              // Requirement 3.5: only include images section if there are actual images
              if (imgTags.length > 0) {
                imagenesHtml = `<div class="images">${imgTags.join('\n')}</div>`;
              }
            }
            // Requirement 3.5: if no fotos, imagenesHtml stays empty — no empty space

            return `
            <div class="objeto">
              <h3 class="objeto-nombre">${escapeHtml(objeto.nombre)}</h3>
              ${objeto.descripcion ? `<p class="objeto-descripcion">${escapeHtml(objeto.descripcion)}</p>` : ''}
              ${etiquetasHtml}
              ${imagenesHtml}
            </div>`;
          })
        );
        objetosHtml = objetosSections.join('\n');
      }

      return `
      <section class="contenedor">
        <div class="contenedor-header">
          <h2 class="contenedor-nombre">${escapeHtml(contenedor.nombre)}</h2>
          ${contenedor.descripcion ? `<p class="contenedor-descripcion">${escapeHtml(contenedor.descripcion)}</p>` : ''}
          ${contenedor.ubicacion ? `<p class="contenedor-ubicacion"><strong>Ubicación:</strong> ${escapeHtml(contenedor.ubicacion)}</p>` : ''}
        </div>
        <div class="objetos">
          ${objetosHtml}
        </div>
      </section>`;
    })
  );

  // Requirement 3.6, 3.7: header with title, date/time, totals
  return `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Inventario San Alejo</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Helvetica, Arial, sans-serif;
      font-size: 13px;
      color: #1a1a1a;
      background: #ffffff;
      padding: 16px 20px;
    }
    header {
      border-bottom: 2px solid #333;
      padding-bottom: 10px;
      margin-bottom: 16px;
    }
    header h1 {
      font-size: 22px;
      font-weight: 700;
      margin-bottom: 4px;
    }
    header .meta {
      font-size: 11px;
      color: #555;
    }
    header .totals {
      margin-top: 4px;
      font-size: 12px;
      font-weight: 600;
    }
    .contenedor {
      margin-bottom: 16px;
    }
    .contenedor-header {
      background: #f5f5f5;
      border-left: 3px solid #333;
      padding: 6px 10px;
      margin-bottom: 6px;
    }
    .contenedor-nombre {
      font-size: 15px;
      font-weight: 700;
    }
    .contenedor-descripcion {
      font-size: 12px;
      color: #444;
      margin-top: 2px;
    }
    .contenedor-ubicacion {
      font-size: 12px;
      color: #444;
      margin-top: 2px;
    }
    .empty-container {
      font-style: italic;
      color: #888;
      font-size: 12px;
      padding: 4px 0 4px 10px;
    }
    .objetos {
      padding-left: 10px;
    }
    .objeto {
      border-bottom: 1px solid #e8e8e8;
      padding: 6px 0;
    }
    .objeto:last-child {
      border-bottom: none;
    }
    .objeto-nombre {
      font-size: 13px;
      font-weight: 600;
    }
    .objeto-descripcion {
      font-size: 12px;
      color: #444;
      margin-top: 2px;
    }
    .tags {
      margin-top: 4px;
      font-size: 11px;
    }
    .tag {
      display: inline-block;
      background: #e8e8e8;
      border-radius: 3px;
      padding: 1px 5px;
      margin-right: 3px;
      font-size: 11px;
    }
    .images {
      margin-top: 6px;
      display: flex;
      flex-wrap: wrap;
      gap: 6px;
    }
    .images img {
      display: block;
      max-width: 45%;
      max-height: 180px;
      object-fit: cover;
      border-radius: 3px;
    }
  </style>
</head>
<body>
  <header>
    <h1>Inventario San Alejo</h1>
    <p class="meta">Generado el: ${fechaHora}</p>
    <p class="totals">
      Contenedores: ${totalContenedores} &nbsp;|&nbsp; Objetos: ${totalObjetos}
    </p>
  </header>
  <main>
    ${contenedoresSections.join('\n')}
  </main>
</body>
</html>`;
}
