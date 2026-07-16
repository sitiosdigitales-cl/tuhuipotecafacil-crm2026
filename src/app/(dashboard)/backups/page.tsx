"use client";

import { useState, useEffect } from "react";
import {
  Database,
  Download,
  Trash2,
  RefreshCw,
  Clock,
  HardDrive,
  AlertCircle,
  CheckCircle,
  Plus,
} from "lucide-react";
import { toast } from "sonner";

interface Backup {
  nombre: string;
  fecha: string;
  tamano: number;
  creado: string;
}

export default function BackupsPage() {
  const [backups, setBackups] = useState<Backup[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    fetchBackups();
  }, []);

  const fetchBackups = async () => {
    try {
      const response = await fetch("/api/backup");
      const data = await response.json();
      if (data.success) {
        setBackups(data.data || []);
      }
    } catch (error) {
      console.error("Error fetching backups:", error);
    } finally {
      setLoading(false);
    }
  };

  const createBackup = async () => {
    setCreating(true);
    try {
      const response = await fetch("/api/backup", { method: "POST" });
      const data = await response.json();

      if (data.success) {
        toast.success("Respaldo creado exitosamente");
        fetchBackups();
      } else {
        toast.error(data.error || "Error al crear respaldo");
      }
    } catch (error) {
      toast.error("Error al conectar con el servidor");
    } finally {
      setCreating(false);
    }
  };

  const deleteBackup = async (fileName: string) => {
    if (!confirm(`¿Eliminar backup ${fileName}?`)) return;

    try {
      const response = await fetch(`/api/backup?file=${fileName}`, {
        method: "DELETE",
      });
      const data = await response.json();

      if (data.success) {
        toast.success("Backup eliminado");
        fetchBackups();
      } else {
        toast.error(data.error || "Error al eliminar");
      }
    } catch (error) {
      toast.error("Error al conectar con el servidor");
    }
  };

  const formatSize = (bytes: number) => {
    if (bytes === 0) return "0 B";
    const k = 1024;
    const sizes = ["B", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  const formatDate = (dateStr: string) => {
    if (!dateStr) return "N/A";
    return new Date(dateStr).toLocaleDateString("es-CL", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <div className="p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl">
              <Database size={24} className="text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-slate-900">
                Respaldo de Base de Datos
              </h1>
              <p className="text-sm text-slate-500">
                Gestiona los respaldos automáticos del CRM
              </p>
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="bg-white rounded-xl border border-slate-200 p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <HardDrive size={20} className="text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-slate-500">Total Respaldo</p>
                <p className="text-xl font-bold text-slate-900">
                  {backups.length}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl border border-slate-200 p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-100 rounded-lg">
                <CheckCircle size={20} className="text-green-600" />
              </div>
              <div>
                <p className="text-sm text-slate-500">Último Respaldo</p>
                <p className="text-lg font-bold text-slate-900">
                  {backups.length > 0
                    ? formatDate(backups[0].creado).split(",")[0]
                    : "Ninguno"}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl border border-slate-200 p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-amber-100 rounded-lg">
                <Clock size={20} className="text-amber-600" />
              </div>
              <div>
                <p className="text-sm text-slate-500">Retención</p>
                <p className="text-xl font-bold text-slate-900">5 días</p>
              </div>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="bg-white rounded-xl border border-slate-200 p-6 mb-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold text-slate-900">
                Acciones
              </h2>
              <p className="text-sm text-slate-500">
                Crea un respaldo manual de leads y documentos
              </p>
            </div>
            <div className="flex gap-3">
              <button
                onClick={fetchBackups}
                disabled={loading}
                className="flex items-center gap-2 px-4 py-2 border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors"
              >
                <RefreshCw
                  size={16}
                  className={loading ? "animate-spin" : ""}
                />
                Actualizar
              </button>
              <button
                onClick={createBackup}
                disabled={creating}
                className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-500 to-indigo-600 text-white rounded-lg hover:from-blue-600 hover:to-indigo-700 transition-all shadow-lg shadow-blue-500/25"
              >
                {creating ? (
                  <RefreshCw size={16} className="animate-spin" />
                ) : (
                  <Plus size={16} />
                )}
                Crear Respaldo
              </button>
            </div>
          </div>
        </div>

        {/* Backups List */}
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
          <div className="p-4 border-b border-slate-200">
            <h3 className="font-semibold text-slate-900">Respaldo Disponibles</h3>
          </div>

          {loading ? (
            <div className="p-8 text-center">
              <RefreshCw size={24} className="animate-spin mx-auto text-slate-400" />
              <p className="mt-2 text-sm text-slate-500">Cargando respaldos...</p>
            </div>
          ) : backups.length === 0 ? (
            <div className="p-8 text-center">
              <AlertCircle size={24} className="mx-auto text-slate-400" />
              <p className="mt-2 text-sm text-slate-500">
                No hay respaldos disponibles
              </p>
              <button
                onClick={createBackup}
                className="mt-4 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
              >
                Crear primer respaldo
              </button>
            </div>
          ) : (
            <div className="divide-y divide-slate-200">
              {backups.map((backup) => (
                <div
                  key={backup.nombre}
                  className="p-4 hover:bg-slate-50 transition-colors"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="p-2 bg-slate-100 rounded-lg">
                        <Database size={20} className="text-slate-600" />
                      </div>
                      <div>
                        <p className="font-medium text-slate-900">
                          {backup.nombre}
                        </p>
                        <p className="text-sm text-slate-500">
                          {formatDate(backup.creado)} • {formatSize(backup.tamano)}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => deleteBackup(backup.nombre)}
                        className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Info */}
        <div className="mt-6 p-4 bg-amber-50 border border-amber-200 rounded-xl">
          <div className="flex items-start gap-3">
            <AlertCircle size={20} className="text-amber-600 mt-0.5" />
            <div>
              <h4 className="font-medium text-amber-900">Información</h4>
              <ul className="mt-2 text-sm text-amber-700 space-y-1">
                <li>• Los respaldos incluyen leads y documentos</li>
                <li>• Se guardan automáticamente en Supabase Storage</li>
                <li>• Se mantienen solo los últimos 5 días (retención automática)</li>
                <li>• Para respaldo manual, ejecuta: <code className="bg-amber-100 px-1 rounded">./scripts/backup-manual.sh</code></li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
