import { request } from "./client";

export interface UIConfig {
  app?: {
    name?: string;
    logo?: string;
    version?: string;
  };
  theme?: {
    name: "light" | "dark" | "auto";
  };
  sidebar?: {
    items: { name: string; icon: string; path: string }[];
  };
  quickbar?: {
    key: string;
    display: "visible" | "dropdown";
    type: "action" | "menu";
    icon: string;
    icon_alt?: string;
    label: string;
    badge?: { count: number; max: number };
    children?: { key: string; label: string; icon: string; disabled?: boolean }[];
  }[];
  dock?: Record<
    string,
    {
      enabled: boolean;
      position: "bottom" | "left" | "right";
      offset: number;
      items: { key: string; label: string; icon: string; path: string; disabled?: boolean }[];
    }
  >;
}

export async function getUIConfig(): Promise<UIConfig> {
  return request<UIConfig>("/api/v1/ui/config", { method: "GET" });
}

export async function saveUIConfig(config: Partial<UIConfig>): Promise<{ message: string }> {
  return request<{ message: string }>("/api/v1/ui/config", {
    method: "POST",
    body: JSON.stringify(config),
  });
}

export async function resetUIConfig(): Promise<{ message: string }> {
  return request<{ message: string }>("/api/v1/ui/config", {
    method: "DELETE",
  });
}
