"use client";

import { useEffect, useRef } from "react";
import { supabase } from "@/lib/supabase";

interface UseRealtimeOptions {
  table: string;
  schema?: string;
  filter?: string;
  onInsert?: (payload: any) => void;
  onUpdate?: (payload: any) => void;
  onDelete?: (payload: any) => void;
  channelName?: string;
}

export function useRealtime({ table, schema = "public", filter, onInsert, onUpdate, onDelete, channelName }: UseRealtimeOptions) {
  const callbacksRef = useRef({ onInsert, onUpdate, onDelete });
  callbacksRef.current = { onInsert, onUpdate, onDelete };

  useEffect(() => {
    if (!table) return;

    const name = channelName || `${table}-realtime-${Date.now()}`;

    const config: Record<string, any> = { schema, table };
    if (filter) config.filter = filter;

    let channel = supabase.channel(name);

    if (onInsert) {
      channel = channel.on("postgres_changes" as any, { ...config, event: "INSERT" }, (payload: any) => {
        callbacksRef.current.onInsert?.(payload);
      }) as typeof channel;
    }

    if (onUpdate) {
      channel = channel.on("postgres_changes" as any, { ...config, event: "UPDATE" }, (payload: any) => {
        callbacksRef.current.onUpdate?.(payload);
      }) as typeof channel;
    }

    if (onDelete) {
      channel = channel.on("postgres_changes" as any, { ...config, event: "DELETE" }, (payload: any) => {
        callbacksRef.current.onDelete?.(payload);
      }) as typeof channel;
    }

    channel.subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [table, schema, filter, channelName]);
}
