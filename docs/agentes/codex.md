# Bitácora — Codex

Zona: interfaz, estado de cliente, rendimiento. Ver `docs/agentes/PROTOCOLO.md` sección 2.

---

[FASE 0 · T-01] reanudado — el diagnóstico de bloqueo era incorrecto: ambos
agentes comparten un único working tree y rige el modo local de la sección
2bis; pull y push se omiten mientras no exista acceso de escritura remoto.

[FASE 0 · T-01] en curso — `package.json` y `package-lock.json` descongelados
exclusivamente para instalar Vitest y habilitar `npm test`.

[build] ocupado — Codex, T-01.

[build] libre — Codex, T-01; build sin variables terminó en 0.

[FASE 0 · T-01] hecho — Vitest configurado con jsdom, aliases TypeScript y
primer test de humo; `package.json` y `package-lock.json` vuelven a congelarse.

[FASE 0 · T-02] en curso — workflow preparado con jobs separados de lint,
typecheck, build y test para cada push o pull request hacia `diego`.

[build] ocupado — Codex, T-02; validación en copia temporal aislada de HEAD.

[build] libre — Codex, T-02; la copia temporal no pudo compilar porque
Turbopack rechaza `node_modules` enlazado fuera de su raíz; no hubo build en
el working tree compartido.

[build] ocupado — Codex, T-02; validación real sobre working tree estable.

[build] libre — Codex, T-02; build, typecheck y test terminaron en 0.

[FASE 0 · T-02] hecho — CI con lint de la zona Codex, typecheck, build y test
en jobs separados para pushes y pull requests hacia `diego`.

[FASE 1 · C-01 · BUG-001] hallazgo — `GET /api/actividades` devuelve datos sin
sesión; prueba preparada para exigir 401 antes de consultar Supabase.

[build] ocupado — Codex, BUG-001.

[build] libre — Codex, BUG-001; build terminó en 0.
