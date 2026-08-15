"use client";

import { useEffect, useRef } from "react";
import type {
  RealtimePostgresDeletePayload,
  RealtimePostgresInsertPayload,
  RealtimePostgresUpdatePayload,
} from "@supabase/supabase-js";
import { supabase } from "@/lib/supabase";

type RealtimeRow = Record<string, unknown>;

interface UseRealtimeOptions {
  table: string;
  schema?: string;
  filter?: string;
  onInsert?: (payload: RealtimePostgresInsertPayload<RealtimeRow>) => void;
  onUpdate?: (payload: RealtimePostgresUpdatePayload<RealtimeRow>) => void;
  onDelete?: (payload: RealtimePostgresDeletePayload<RealtimeRow>) => void;
  channelName?: string;
}

export function useRealtime({ table, schema = "public", filter, onInsert, onUpdate, onDelete, channelName }: UseRealtimeOptions) {
  const callbacksRef = useRef({ onInsert, onUpdate, onDelete });

  useEffect(() => {
    callbacksRef.current = { onInsert, onUpdate, onDelete };
  }, [onInsert, onUpdate, onDelete]);

  useEffect(() => {
    if (!table) return;

    const name = channelName || `${table}-realtime-${Date.now()}`;

    const config = { schema, table, ...(filter ? { filter } : {}) };

    let channel = supabase.channel(name);

    channel = channel
      .on<RealtimeRow>("postgres_changes", { ...config, event: "INSERT" }, (payload) => {
        callbacksRef.current.onInsert?.(payload);
      })
      .on<RealtimeRow>("postgres_changes", { ...config, event: "UPDATE" }, (payload) => {
        callbacksRef.current.onUpdate?.(payload);
      })
      .on<RealtimeRow>("postgres_changes", { ...config, event: "DELETE" }, (payload) => {
        callbacksRef.current.onDelete?.(payload);
      });

    channel.subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [table, schema, filter, channelName]);
}
