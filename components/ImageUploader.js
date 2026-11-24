'use client';

import { useRef, useState } from 'react';
import { Upload, Link2, Trash2, Loader2 } from 'lucide-react';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { storage } from '../app/firebase';

async function compressImageFile(file, maxDimension = 1400, quality = 0.82) {
  const bitmap = await createImageBitmap(file);
  const scale = Math.min(1, maxDimension / Math.max(bitmap.width, bitmap.height));
  const width = Math.max(1, Math.round(bitmap.width * scale));
  const height = Math.max(1, Math.round(bitmap.height * scale));
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  ctx.drawImage(bitmap, 0, 0, width, height);
  bitmap.close();

  const blob = await new Promise((resolve, reject) => {
    canvas.toBlob(
      (b) => (b ? resolve(b) : reject(new Error('No se pudo comprimir la imagen'))),
      'image/jpeg',
      quality,
    );
  });

  // Smaller inline fallback in case Firebase Storage rules reject uploads
  const smallScale = Math.min(1, 720 / Math.max(width, height));
  const fallbackCanvas = document.createElement('canvas');
  fallbackCanvas.width = Math.max(1, Math.round(width * smallScale));
  fallbackCanvas.height = Math.max(1, Math.round(height * smallScale));
  fallbackCanvas.getContext('2d').drawImage(canvas, 0, 0, fallbackCanvas.width, fallbackCanvas.height);
  const dataUrlFallback = fallbackCanvas.toDataURL('image/jpeg', 0.68);

  return { blob, dataUrlFallback };
}

export default function ImageUploader({
  label,
  value,
  onChange,
  folder = 'extraescolares',
  placeholder = 'https://... o sube una imagen',
  onNotify,
  compact = false,
}) {
  const fileInputRef = useRef(null);
  const [uploading, setUploading] = useState(false);

  const handleFile = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    e.target.value = '';

    if (!file.type.startsWith('image/')) {
      onNotify?.('Selecciona un archivo de imagen válido (JPG, PNG o WebP).', 'advertencia');
      return;
    }
    if (file.size > 12 * 1024 * 1024) {
      onNotify?.('La imagen supera el límite de 12 MB.', 'advertencia');
      return;
    }

    setUploading(true);
    try {
      const { blob, dataUrlFallback } = await compressImageFile(file);
      try {
        const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_').slice(0, 60);
        const storageRef = ref(storage, `${folder}/${Date.now()}-${safeName}.jpg`);
        await uploadBytes(storageRef, blob, { contentType: 'image/jpeg' });
        const downloadUrl = await getDownloadURL(storageRef);
        onChange(downloadUrl);
        onNotify?.('Imagen subida correctamente a Firebase Storage.', 'exito');
      } catch (storageErr) {
        console.warn('Storage upload fallback:', storageErr);
        if (dataUrlFallback.length < 400_000) {
          onChange(dataUrlFallback);
          onNotify?.('Imagen optimizada e incrustada correctamente.', 'info');
        } else {
          onNotify?.('No se pudo subir la imagen a Storage. Prueba con una foto más pequeña o pega una URL.', 'error');
        }
      }
    } catch (err) {
      console.error(err);
      onNotify?.('No se pudo procesar la imagen seleccionada.', 'error');
    } finally {
      setUploading(false);
    }
  };

  const hasPreview = value && (value.startsWith('http') || value.startsWith('data:image') || value.startsWith('/'));

  return (
    <div className="space-y-2">
      {label && (
        <label className="block text-xs font-semibold uppercase tracking-wide text-slate-600 dark:text-slate-300">
          {label}
        </label>
      )}
      <div className="flex flex-col sm:flex-row gap-2">
        <div className="relative flex-1">
          <Link2 className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            value={value || ''}
            onChange={(e) => onChange(e.target.value)}
            placeholder={placeholder}
            className="w-full pl-9 pr-3 py-2 text-sm rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-[#155f9e]"
          />
        </div>
        <div className="flex gap-1.5 shrink-0">
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleFile}
            className="hidden"
          />
          <button
            type="button"
            disabled={uploading}
            onClick={() => fileInputRef.current?.click()}
            className="inline-flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 disabled:opacity-60 transition-colors"
          >
            {uploading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Upload className="w-3.5 h-3.5" />}
            <span>{uploading ? 'Subiendo...' : 'Subir foto'}</span>
          </button>
          {value && (
            <button
              type="button"
              onClick={() => onChange('')}
              aria-label="Quitar imagen"
              className="inline-flex items-center justify-center px-2.5 py-2 text-xs rounded-lg border border-slate-200 dark:border-slate-700 text-slate-500 hover:text-red-600 hover:border-red-200 dark:hover:border-red-900 transition-colors"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {hasPreview && (
        <div className="flex items-center gap-3 p-2 rounded-lg bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800">
          <img
            src={value}
            alt="Vista previa"
            className={`${compact ? 'h-12 w-16' : 'h-20 w-32'} object-cover rounded-md border border-slate-200 dark:border-slate-700 bg-white`}
          />
          <span className="text-xs text-slate-500 dark:text-slate-400 truncate flex-1">
            Vista previa cargada correctamente
          </span>
        </div>
      )}
    </div>
  );
}
