"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type { ReactNode } from "react";
import { supabase } from "./lib/supabase";

type MediaType = "image" | "video";
type MediaQuality = "auto" | "standard" | "high";
type View = "home" | "create" | "history" | "favorites" | "profile" | "settings";
type AuthMode = "login" | "register" | "reset" | null;

type HistoryItem = {
  id: number;
  type: string;
  tone: string;
  language: string;
  result: string;
  favorite: boolean;
  mediaPath: string | null;
  mediaType: string | null;
  mediaUrl: string | null;
  quality?: MediaQuality;
};

const MAX_VIDEO_SIZE = 50 * 1024 * 1024;
const MAX_IMAGE_SIZE = 15 * 1024 * 1024;

const typeOptions = [
  {
    value: "Пост",
    label: "Пост",
    icon: "post",
    desc: "Соцсети и публикации",
  },
  {
    value: "Товар",
    label: "Товар",
    icon: "product",
    desc: "Описание и карточка",
  },
  {
    value: "Реклама",
    label: "Реклама",
    icon: "megaphone",
    desc: "Продающий текст",
  },
  {
    value: "Ответ клиенту",
    label: "Ответ",
    icon: "message",
    desc: "Сообщение клиенту",
  },
];
const toneOptions = ["Профессиональный", "Дружелюбный", "Продающий", "Краткий"];
const languageOptions = ["Русский", "Română", "English"];

function Icon({ name, size = 18 }: { name: string; size?: number }) {
  const common = { width: size, height: size, viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: 1.8, strokeLinecap: "round" as const, strokeLinejoin: "round" as const };
  if (name === "post") return <svg {...common}><path d="M6 3.8h8.2L19 8.6V20.2H6z" /><path d="M14 3.8v5h5M9 12h7M9 15.5h5" /><circle cx="17.5" cy="17.5" r="3" fill="currentColor" stroke="none" /><path d="M17.5 16.2v2.6M16.2 17.5h2.6" stroke="white" strokeWidth="1.2" /></svg>;
  if (name === "product") return <svg {...common}><path d="m4.5 8.2 7.5-4 7.5 4-7.5 4z" /><path d="M4.5 8.2v7.6l7.5 4 7.5-4V8.2M12 12.2v7.6" /><path d="m7.5 6.6 7.5 4" /></svg>;
  if (name === "megaphone") return <svg {...common}><path d="M4 13.5h3.5l9.2 4.7V5.8L7.5 10.5H4z" /><path d="M7.5 13.5 9 19h3l-1.7-5.5M19 9.5c1.2 1 1.2 4 0 5" /></svg>;
  if (name === "message") return <svg {...common}><path d="M4.5 5.5h15v10h-8l-4.5 3v-3h-2.5z" /><path d="M8 9.5h8M8 12.5h5" /></svg>;
  if (name === "spark") return <svg {...common}><path d="m12 3 1.5 5.5L19 10l-5.5 1.5L12 17l-1.5-5.5L5 10l5.5-1.5z" /><path d="m19 15 .7 2.3L22 18l-2.3.7L19 21l-.7-2.3L16 18l2.3-.7z" /></svg>;
  if (name === "plus") return <svg {...common}><path d="M12 5v14M5 12h14" /></svg>;
  if (name === "grid") return <svg {...common}><rect x="4" y="4" width="6" height="6" rx="1" /><rect x="14" y="4" width="6" height="6" rx="1" /><rect x="4" y="14" width="6" height="6" rx="1" /><rect x="14" y="14" width="6" height="6" rx="1" /></svg>;
  if (name === "star") return <svg {...common}><path d="m12 3 2.8 5.7 6.2.9-4.5 4.4 1.1 6.2-5.6-2.9-5.6 2.9 1.1-6.2L3 9.6l6.2-.9L12 3Z" /></svg>;
  if (name === "star-filled") return <svg {...common} fill="currentColor" stroke="currentColor"><path d="m12 3 2.8 5.7 6.2.9-4.5 4.4 1.1 6.2-5.6-2.9-5.6 2.9 1.1-6.2L3 9.6l6.2-.9L12 3Z" /></svg>;
  if (name === "user") return <svg {...common}><circle cx="12" cy="8" r="3.5" /><path d="M5 20c.8-3.2 3.2-5 7-5s6.2 1.8 7 5" /></svg>;
  if (name === "settings") return <svg {...common}><path d="M12 8.5a3.5 3.5 0 1 0 0 7 3.5 3.5 0 0 0 0-7Z" /><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.9l.1.1-1.7 1.7-.1-.1a1.7 1.7 0 0 0-1.9-.3l-.5.2a1.7 1.7 0 0 0-1 1.6v.2h-2.4v-.2a1.7 1.7 0 0 0-1-1.6l-.5-.2a1.7 1.7 0 0 0-1.9.3l-.1.1L7 17l.1-.1a1.7 1.7 0 0 0 .3-1.9l-.2-.5a1.7 1.7 0 0 0-1.6-1H5v-2.4h.2a1.7 1.7 0 0 0 1.6-1l.2-.5A1.7 1.7 0 0 0 7.1 8L7 7.9l1.7-1.7.1.1a1.7 1.7 0 0 0 1.9.3l.5-.2a1.7 1.7 0 0 0 1-1.6v-.2h2.4v.2a1.7 1.7 0 0 0 1 1.6l.5.2a1.7 1.7 0 0 0 1.9-.3l.1-.1 1.7 1.7-.1.1a1.7 1.7 0 0 0-.3 1.9l.2.5a1.7 1.7 0 0 0 1.6 1h.2v2.4h-.2a1.7 1.7 0 0 0-1.6 1l-.2.5Z" /></svg>;
  if (name === "sun") return <svg {...common}><circle cx="12" cy="12" r="4" /><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" /></svg>;
  if (name === "moon") return <svg {...common}><path d="M20 15.2A8.2 8.2 0 0 1 8.8 4a8.5 8.5 0 1 0 11.2 11.2Z" /></svg>;
  if (name === "search") return <svg {...common}><circle cx="10.8" cy="10.8" r="6.8" /><path d="m16 16 5 5" /></svg>;
  if (name === "image") return <svg {...common}><rect x="4" y="5" width="16" height="14" rx="2" /><circle cx="9" cy="10" r="1.5" /><path d="m5 17 4.5-4.5 3.2 3 2.3-2.3L19 17" /></svg>;
  if (name === "upload") return <svg {...common}><path d="M12 16V4M7 9l5-5 5 5M5 20h14" /></svg>;
  if (name === "copy") return <svg {...common}><rect x="8" y="8" width="11" height="11" rx="2" /><path d="M16 8V6a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2h2" /></svg>;
  if (name === "trash") return <svg {...common}><path d="M4 7h16M9 7V4h6v3M7 7l1 13h8l1-13M10 11v5M14 11v5" /></svg>;
  if (name === "logout") return <svg {...common}><path d="M10 5H6a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2h4M15 8l4 4-4 4M19 12H9" /></svg>;
  if (name === "arrow") return <svg {...common}><path d="M5 12h13M13 6l6 6-6 6" /></svg>;
  if (name === "close") return <svg {...common}><path d="m6 6 12 12M18 6 6 18" /></svg>;
  if (name === "play") return <svg {...common}><path d="m9 6 9 6-9 6V6Z" /></svg>;
  return <svg {...common}><circle cx="12" cy="12" r="8" /></svg>;
}

export default function Home() {
  const [view, setView] = useState<View>("home");
  const [theme, setTheme] = useState<"light" | "dark">("light");
  const [themeLoaded, setThemeLoaded] = useState(false);
  const [text, setText] = useState("");
  const [result, setResult] = useState("");
  const [image, setImage] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [fileType, setFileType] = useState<MediaType>("image");
  const [quality, setQuality] = useState<MediaQuality>("auto");
  const [savedMediaUrl, setSavedMediaUrl] = useState<string | null>(null);
  const [previewKind, setPreviewKind] = useState<"object" | "remote" | null>(null);
  const [type, setType] = useState("Пост");
  const [tone, setTone] = useState("Профессиональный");
  const [language, setLanguage] = useState("Русский");
  const [generationsLeft, setGenerationsLeft] = useState(5);
  const [subscriptionPlan, setSubscriptionPlan] = useState("free");
  const [subscriptionStatus, setSubscriptionStatus] = useState("active");
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [search, setSearch] = useState("");
  const [libraryFilter, setLibraryFilter] = useState("Все");
  const [copied, setCopied] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [authMode, setAuthMode] = useState<AuthMode>(null);
  const [authEmail, setAuthEmail] = useState("");
  const [authPassword, setAuthPassword] = useState("");
  const [authLoading, setAuthLoading] = useState(false);
  const [authMessage, setAuthMessage] = useState("");
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [proOpen, setProOpen] = useState(false);
  const [proImageUrl, setProImageUrl] = useState<string | null>(null);
  const [proImageGenerating, setProImageGenerating] = useState(false);
  const [proImageError, setProImageError] = useState("");
  const [proTool, setProTool] = useState<"standard" | "package" | "social" | "plan" | "campaign" | "brand">("standard");
  const [brandKit, setBrandKit] = useState({
    name: "",
    audience: "",
    tone: "",
    colors: "",
    website: "",
  });
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [mediaViewer, setMediaViewer] = useState<{ url: string; type: "image" | "video" } | null>(null);
  const abortRef = useRef<AbortController | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    const savedTheme = window.localStorage.getItem("bizai-theme");

    if (savedTheme === "dark" || savedTheme === "light") {
      setTheme(savedTheme);
    }

    try {
      const savedBrandKit = window.localStorage.getItem("bizai-brand-kit");
      if (savedBrandKit) {
        const parsed = JSON.parse(savedBrandKit);
        if (parsed && typeof parsed === "object") {
          setBrandKit({
            name: typeof parsed.name === "string" ? parsed.name : "",
            audience: typeof parsed.audience === "string" ? parsed.audience : "",
            tone: typeof parsed.tone === "string" ? parsed.tone : "",
            colors: typeof parsed.colors === "string" ? parsed.colors : "",
            website: typeof parsed.website === "string" ? parsed.website : "",
          });
        }
      }
    } catch {
      // Ignore malformed local Brand Kit data.
    }

    setThemeLoaded(true);
    loadAccountData();
  }, []);

  useEffect(() => {
    if (!themeLoaded) return;

    document.documentElement.classList.toggle(
      "dark",
      theme === "dark"
    );

    window.localStorage.setItem("bizai-theme", theme);
  }, [theme, themeLoaded]);

  const loadAccountData = async () => {
    const { data: userData } = await supabase.auth.getUser();
    if (!userData.user) {
      setUserEmail(null);
      setSubscriptionPlan("free");
      setSubscriptionStatus("active");
      setHistory([]);
      setGenerationsLeft(5);
      return;
    }
    const user = userData.user;
    setUserEmail(user.email ?? null);

    const { data: subscription } = await supabase.from("subscriptions").select("plan,status").eq("user_id", user.id).maybeSingle();
    if (subscription) {
      setSubscriptionPlan(subscription.plan);
      setSubscriptionStatus(subscription.status);
    }

    let { data: limit } = await supabase.from("user_limits").select("generations_left").eq("user_id", user.id).maybeSingle();
    if (!limit) {
      const { data: created } = await supabase.from("user_limits").insert({ user_id: user.id, generations_left: 5 }).select("generations_left").single();
      limit = created;
    }
    if (limit) setGenerationsLeft(limit.generations_left);

    const { data: generations } = await supabase.from("generations").select("*").eq("user_id", user.id).order("created_at", { ascending: false });
    const items = await Promise.all((generations ?? []).map(async (item) => {
      let mediaUrl: string | null = null;
      if (item.media_path) {
        const { data } = await supabase.storage.from("generation-media").createSignedUrl(item.media_path, 3600);
        mediaUrl = data?.signedUrl ?? null;
      }
      return {
        id: Number(item.id), type: item.type, tone: item.tone, language: item.language,
        result: item.result, favorite: item.favorite ?? false,
        mediaPath: item.media_path ?? null, mediaType: item.media_type ?? null, mediaUrl,
        quality: /· (Авто|Стандартное|Высокое)\s*\n\n/.exec(String(item.result))?.[1] === "Высокое"
          ? "high"
          : /· (Авто|Стандартное|Высокое)\s*\n\n/.exec(String(item.result))?.[1] === "Стандартное"
            ? "standard"
            : "auto",
      } as HistoryItem;
    }));
    setHistory(items);
  };

  const setUploadedFile = (file: File | undefined) => {
    if (!file) return;
    if (fileType === "video" && file.size > MAX_VIDEO_SIZE) {
      setResult("Видео слишком большое. Максимальный размер — 50 MB. Исходный файл не изменяется.");
      return;
    }
    if (fileType === "image" && file.size > MAX_IMAGE_SIZE) {
      setResult("Изображение слишком большое. Максимальный размер — 15 MB.");
      return;
    }
    if (preview && previewKind === "object") URL.revokeObjectURL(preview);
    setSavedMediaUrl(null);
    setProImageUrl(null);
    setProImageError("");
    setImage(file);
    setPreview(URL.createObjectURL(file));
    setPreviewKind("object");
    setResult("");
  };

  const removeFile = () => {
    if (preview && previewKind === "object") URL.revokeObjectURL(preview);
    setImage(null);
    setPreview(null);
    setSavedMediaUrl(null);
    setProImageUrl(null);
    setProImageError("");
    setPreviewKind(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const extractVideoFrames = async (file: File, signal: AbortSignal, selectedQuality: MediaQuality) => {
    if (signal.aborted) throw new DOMException("Generation cancelled", "AbortError");
    const url = URL.createObjectURL(file);
    const video = document.createElement("video");
    video.src = url; video.preload = "metadata"; video.muted = true; video.playsInline = true;
    try {
      await new Promise<void>((resolve, reject) => {
        const onLoaded = () => { cleanup(); resolve(); };
        const onError = () => { cleanup(); reject(new Error("Не удалось открыть видео")); };
        const cleanup = () => { video.removeEventListener("loadedmetadata", onLoaded); video.removeEventListener("error", onError); };
        video.addEventListener("loadedmetadata", onLoaded); video.addEventListener("error", onError);
      });
      const duration = video.duration;
      if (!Number.isFinite(duration) || duration <= 0) throw new Error("Не удалось определить длительность видео");
      const frameLimit = selectedQuality === "high" ? 10 : selectedQuality === "standard" ? 5 : 8;
      const frameCount = Math.min(frameLimit, Math.max(4, Math.ceil(duration / (selectedQuality === "high" ? 4 : selectedQuality === "standard" ? 7 : 5))));
      const canvas = document.createElement("canvas");
      const scale = Math.min(1, 1280 / video.videoWidth);
      canvas.width = Math.max(1, Math.round(video.videoWidth * scale));
      canvas.height = Math.max(1, Math.round(video.videoHeight * scale));
      const ctx = canvas.getContext("2d");
      if (!ctx) throw new Error("Не удалось создать canvas");
      const frames: string[] = [];
      for (let i = 0; i < frameCount; i++) {
        if (signal.aborted) throw new DOMException("Generation cancelled", "AbortError");
        const time = Math.min(Math.max(0, duration - 0.05), (duration * i) / Math.max(1, frameCount - 1));
        await new Promise<void>((resolve, reject) => {
          const onSeeked = () => { cleanup(); resolve(); };
          const onError = () => { cleanup(); reject(new Error("Не удалось получить кадр видео")); };
          const cleanup = () => { video.removeEventListener("seeked", onSeeked); video.removeEventListener("error", onError); };
          video.addEventListener("seeked", onSeeked); video.addEventListener("error", onError); video.currentTime = time;
        });
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        frames.push(canvas.toDataURL("image/jpeg", 0.72));
      }
      return frames;
    } finally { URL.revokeObjectURL(url); }
  };

  const getBrandKitContext = () => {
    const entries = [
      brandKit.name && `Название бизнеса: ${brandKit.name}`,
      brandKit.audience && `Целевая аудитория: ${brandKit.audience}`,
      brandKit.tone && `Фирменный стиль и тон: ${brandKit.tone}`,
      brandKit.colors && `Фирменные цвета: ${brandKit.colors}`,
      brandKit.website && `Сайт/ссылка: ${brandKit.website}`,
    ].filter(Boolean);

    return entries.length
      ? `БРЕНД-КИТ BIZAI PRO:\n${entries.join("\n")}`
      : "";
  };

  const getProToolInstruction = () => {
    const brandContext = getBrandKitContext();

    const instructions: Record<string, string> = {
      standard: "",
      package: `
РЕЖИМ PRO — КОНТЕНТ-ПАКЕТ.
Сделай единый готовый пакет для бизнеса и раздели его на понятные блоки:
1. Основной пост.
2. Короткий заголовок.
3. Короткий рекламный текст.
4. Призыв к действию (CTA).
5. Идея для Stories.
6. Короткий сценарий для Reels/TikTok.
Не объясняй процесс. Сразу выдай готовые материалы.
`,
      social: `
РЕЖИМ PRO — СОЦСЕТИ.
Подготовь адаптированный контент для Instagram, TikTok и Stories.
Для каждого формата дай отдельный готовый вариант с подходящей длиной и стилем.
Добавь сильный хук и CTA там, где это уместно.
`,
      plan: `
РЕЖИМ PRO — КОНТЕНТ-ПЛАН.
Создай практичный контент-план на 7 дней.
Для каждого дня укажи тему, формат, идею, короткий текст/тезис и CTA.
План должен быть конкретным для бизнеса из запроса, без общих советов.
`,
      campaign: `
РЕЖИМ PRO — РЕКЛАМНАЯ КАМПАНИЯ.
Создай 3 разных рекламных варианта для одной задачи:
1. Основной продающий вариант.
2. Короткий вариант для рекламы.
3. Более эмоциональный вариант.
Для каждого добавь заголовок и CTA.
Не выдумывай цену, скидки, наличие или другие факты.
`,
      brand: `
РЕЖИМ PRO — БРЕНД.
Используй данные Brand Kit, если они заполнены.
Сформируй контент строго в соответствии с фирменным стилем, аудиторией и тоном бренда.
Если Brand Kit пустой, не придумывай реальные данные компании — просто адаптируй стиль к запросу пользователя.
`,
    };

    return [instructions[proTool] || "", brandContext].filter(Boolean).join("\n\n");
  };

  const saveBrandKit = () => {
    try {
      window.localStorage.setItem("bizai-brand-kit", JSON.stringify(brandKit));
    } catch {
      // Local storage may be unavailable in restricted browser contexts.
    }
  };

  const generate = async () => {
    if (isGenerating || proImageGenerating) return;
    if (!text.trim()) { setResult("Напиши, что нужно создать — например: «Пост для кофейни с акцией 2+1»."); return; }
    const { data: userData } = await supabase.auth.getUser();
    if (!userData.user) { setAuthMode("login"); setAuthMessage("Сначала войдите в аккаунт, чтобы использовать генерации."); return; }
    const user = userData.user;
    if (image && fileType === "video" && image.size > MAX_VIDEO_SIZE) { setResult("Видео больше 50 MB. Генерация не списана, файл не изменён."); return; }

    const isPro = subscriptionPlan === "pro" && subscriptionStatus === "active";
    const { data: limit } = await supabase.from("user_limits").select("generations_left").eq("user_id", user.id).single();
    if (!limit) { setResult("Не удалось проверить лимит генераций."); return; }

    const oldLeft = limit.generations_left;
    let newLeft = oldLeft;

    if (!isPro) {
      if (oldLeft <= 0) { setGenerationsLeft(0); setProOpen(true); return; }
      newLeft = oldLeft - 1;

      const { data: updated, error: decrementError } = await supabase.from("user_limits").update({ generations_left: newLeft }).eq("user_id", user.id).eq("generations_left", oldLeft).select("generations_left").single();
      if (decrementError || !updated) { setResult("Не удалось списать генерацию. Попробуй ещё раз."); return; }

      setGenerationsLeft(updated.generations_left);
    }
    setIsGenerating(true);
    setResult("");
    setProImageUrl(null);
    setProImageError("");
    setEditingId(null);
    const controller = new AbortController();
    abortRef.current = controller;

    try {
      let imageData: string | null = null;
      let videoFrames: string[] = [];
      if (image?.type.startsWith("video/")) {
        videoFrames = await extractVideoFrames(image, controller.signal, quality);
      } else if (image?.type.startsWith("image/")) {
        imageData = await new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => resolve(String(reader.result));
          reader.onerror = () => reject(new Error("Не удалось прочитать изображение"));
          reader.readAsDataURL(image);
        });
      }
      if (controller.signal.aborted) throw new DOMException("Generation cancelled", "AbortError");

      const response = await fetch("/api/generate", {
        method: "POST", headers: { "Content-Type": "application/json" }, signal: controller.signal,
        body: JSON.stringify({
          text: `${text}${isPro ? `\n\n${getProToolInstruction()}` : ""}`,
          type,
          tone,
          language,
          quality,
          image: imageData,
          videoFrames,
        }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Ошибка генерации");
      const qualityLabel = quality === "high" ? "Высокое" : quality === "standard" ? "Стандартное" : "Авто";
      const finalResult = `🔥 ${type} · ${tone} · ${language} · ${qualityLabel}\n\n${data.result}`;
      setResult(finalResult);

      let mediaPath: string | null = null;
      let mediaType: string | null = null;
      if (image) {
        if (image.type.startsWith("video/") && image.size > MAX_VIDEO_SIZE) throw new Error("Видео превышает лимит 50 MB");
        const safeName = image.name.replace(/[^a-zA-Z0-9._-]/g, "_");
        mediaPath = `${user.id}/${crypto.randomUUID()}-${safeName}`;
        mediaType = image.type;
        const { error: uploadError } = await supabase.storage.from("generation-media").upload(mediaPath, image, { contentType: image.type, upsert: false });
        if (uploadError) {
          if (uploadError.message.toLowerCase().includes("maximum allowed size")) throw new Error("Файл превышает максимальный размер хранилища Supabase (50 MB для видео).");
          throw new Error(`Ошибка загрузки файла: ${uploadError.message}`);
        }
      }

      const { data: saved, error: saveError } = await supabase.from("generations").insert({ user_id: user.id, type, tone, language, result: finalResult, favorite: false, media_path: mediaPath, media_type: mediaType }).select("id").single();
      if (saveError) throw saveError;
      let mediaUrl: string | null = null;
      if (mediaPath) {
        const { data } = await supabase.storage.from("generation-media").createSignedUrl(mediaPath, 3600);
        mediaUrl = data?.signedUrl ?? null;
      }
      setHistory(prev => [{ id: Number(saved.id), type, tone, language, result: finalResult, favorite: false, mediaPath, mediaType, mediaUrl, quality }, ...prev]);
      setView("create");
    } catch (error) {
      if (error instanceof DOMException && error.name === "AbortError") {
        setResult("Генерация остановлена. Списанная генерация возвращена.");
      } else {
        console.error(error);
        setResult(error instanceof Error ? error.message : "Не удалось получить ответ от AI.");
      }
      if (!isPro) {
        await supabase.from("user_limits").update({ generations_left: oldLeft }).eq("user_id", user.id).eq("generations_left", newLeft);
        setGenerationsLeft(oldLeft);
      }
    } finally {
      setIsGenerating(false);
      abortRef.current = null;
    }
  };

  const generateImage = async () => {
    if (proImageGenerating || isGenerating) return;

    if (!text.trim()) {
      setProImageError("Напиши, что нужно создать — например: «Рекламное фото кофейни на закате в горах».");
      return;
    }

    if (subscriptionPlan !== "pro" || subscriptionStatus !== "active") {
      setProOpen(true);
      return;
    }

    setProImageGenerating(true);
    setProImageError("");
    setProImageUrl(null);
    setResult("");
    setEditingId(null);
    setIsEditing(false);

    try {
      const { data: sessionData } = await supabase.auth.getSession();
      const accessToken = sessionData.session?.access_token;

      if (!accessToken) {
        setAuthMode("login");
        setAuthMessage("Сначала войдите в аккаунт, чтобы использовать Pro-функции.");
        return;
      }

      const { data: userData } = await supabase.auth.getUser();
      const user = userData.user;

      if (!user) {
        setAuthMode("login");
        setAuthMessage("Сначала войдите в аккаунт, чтобы использовать Pro-функции.");
        return;
      }

      const response = await fetch("/api/generate-image", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({
          prompt: [
            text.trim(),
            getBrandKitContext(),
            "Создай рекламное изображение для бизнеса. Сохрани смысл запроса и не добавляй неподтверждённые факты.",
          ].filter(Boolean).join("\n\n"),
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Не удалось создать изображение.");
      }

      if (!data.image || typeof data.image !== "string") {
        throw new Error("AI не вернул изображение.");
      }

      // Сначала показываем результат пользователю, затем сохраняем его в Supabase.
      setProImageUrl(data.image);

      try {
        const imageResponse = await fetch(data.image);
        if (!imageResponse.ok) {
          throw new Error("Не удалось подготовить изображение для сохранения.");
        }

        const imageBlob = await imageResponse.blob();
        const contentType = imageBlob.type || "image/png";
        const extension = contentType.includes("jpeg") || contentType.includes("jpg") ? "jpg" : "png";
        const mediaPath = `${user.id}/${crypto.randomUUID()}-bizai-pro-image.${extension}`;

        const { error: uploadError } = await supabase.storage
          .from("generation-media")
          .upload(mediaPath, imageBlob, {
            contentType,
            upsert: false,
          });

        if (uploadError) {
          throw new Error(`Не удалось сохранить изображение: ${uploadError.message}`);
        }

        const historyResult = `🖼️ Изображение · BizAI Pro · ${language}\n\n${text.trim()}`;

        const { data: saved, error: saveError } = await supabase
          .from("generations")
          .insert({
            user_id: user.id,
            type: "Изображение",
            tone,
            language,
            result: historyResult,
            favorite: false,
            media_path: mediaPath,
            media_type: contentType,
          })
          .select("id")
          .single();

        if (saveError || !saved) {
          // Не оставляем сиротский файл в Storage, если запись истории не создалась.
          await supabase.storage.from("generation-media").remove([mediaPath]);
          throw new Error(`Не удалось сохранить работу: ${saveError?.message || "неизвестная ошибка"}`);
        }

        const { data: signedData, error: signedUrlError } = await supabase.storage
          .from("generation-media")
          .createSignedUrl(mediaPath, 3600);

        if (signedUrlError || !signedData?.signedUrl) {
          throw new Error(`Изображение сохранено, но не удалось открыть его из истории: ${signedUrlError?.message || "неизвестная ошибка"}`);
        }

        setProImageUrl(signedData.signedUrl);
        setResult(historyResult);
        setHistory((prev) => [
          {
            id: Number(saved.id),
            type: "Изображение",
            tone,
            language,
            result: historyResult,
            favorite: false,
            mediaPath,
            mediaType: contentType,
            mediaUrl: signedData.signedUrl,
            quality,
          },
          ...prev,
        ]);
      } catch (saveError) {
        console.error("Pro image save error:", saveError);
        setProImageError(
          saveError instanceof Error
            ? `${saveError.message}`
            : "Изображение создано, но не удалось сохранить его в истории."
        );
      }
    } catch (error) {
      console.error("Pro image generation error:", error);
      setProImageError(error instanceof Error ? error.message : "Не удалось создать изображение.");
    } finally {
      setProImageGenerating(false);
    }
  };

  const stopGeneration = () => abortRef.current?.abort();

  const resetGeneration = () => {
    setText(""); setResult(""); setProImageUrl(null); setProImageError(""); setEditingId(null); setIsEditing(false); removeFile();
  };

  const deleteHistoryItem = async (id: number) => {
    const item = history.find((entry) => entry.id === id);
    setHistory(prev => prev.filter(entry => entry.id !== id));
    if (item?.mediaPath) {
      const { error: storageError } = await supabase.storage.from("generation-media").remove([item.mediaPath]);
      if (storageError) console.error("Ошибка удаления медиа:", storageError);
    }
    const { error } = await supabase.from("generations").delete().eq("id", id);
    if (error) console.error(error);
  };

  const toggleFavorite = async (id: number) => {
    const item = history.find(x => x.id === id);
    if (!item) return;
    const favorite = !item.favorite;
    setHistory(prev => prev.map(x => x.id === id ? { ...x, favorite } : x));
    const { error } = await supabase.from("generations").update({ favorite }).eq("id", id);
    if (error) console.error(error);
  };

  const saveEdited = async () => {
    if (editingId === null) return;
    setHistory(prev => prev.map(item => item.id === editingId ? { ...item, result } : item));
    const { error } = await supabase.from("generations").update({ result }).eq("id", editingId);
    if (error) { console.error(error); return; }
    setIsEditing(false);
  };

  const copyText = async (value = result) => {
    await navigator.clipboard.writeText(value);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1800);
  };

  const blobToDataUrl = async (blob: Blob): Promise<string> => {
    return await new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(String(reader.result));
      reader.onerror = () => reject(new Error("Не удалось подготовить изображение"));
      reader.readAsDataURL(blob);
    });
  };

  const getPngBlob = async (mediaUrl: string): Promise<Blob> => {
    const response = await fetch(mediaUrl, { cache: "no-store" });
    if (!response.ok) throw new Error("Не удалось получить изображение для копирования");
    const blob = await response.blob();
    if (blob.type === "image/png") return blob;

    const objectUrl = URL.createObjectURL(blob);
    try {
      const img = new Image();
      img.src = objectUrl;
      await new Promise<void>((resolve, reject) => {
        img.onload = () => resolve();
        img.onerror = () => reject(new Error("Не удалось загрузить изображение"));
      });

      const canvas = document.createElement("canvas");
      canvas.width = img.naturalWidth;
      canvas.height = img.naturalHeight;
      const ctx = canvas.getContext("2d");
      if (!ctx) throw new Error("Не удалось подготовить изображение");
      ctx.drawImage(img, 0, 0);

      const png = await new Promise<Blob | null>((resolve) => {
        canvas.toBlob(resolve, "image/png");
      });
      if (!png) throw new Error("Не удалось подготовить PNG");
      return png;
    } finally {
      URL.revokeObjectURL(objectUrl);
    }
  };

  const escapeHtml = (value: string) =>
    value
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/\"/g, "&quot;")
      .replace(/'/g, "&#039;");

  const copyContent = async (
    value = result,
    mediaUrl?: string | null,
    mediaType?: string | null,
  ) => {
    try {
      const isImage = Boolean(mediaUrl && mediaType?.startsWith("image/"));

      if (
        isImage &&
        typeof ClipboardItem !== "undefined" &&
        navigator.clipboard?.write
      ) {
        const pngBlob = await getPngBlob(mediaUrl as string);
        const dataUrl = await blobToDataUrl(pngBlob);
        const safeText = escapeHtml(value).replace(/\n/g, "<br />");
        const html = `<div>${safeText}</div><p><img src="${dataUrl}" alt="BizAI" style="max-width:100%;height:auto;" /></p>`;

        const item = new ClipboardItem({
          "text/plain": new Blob([value], { type: "text/plain" }),
          "text/html": new Blob([html], { type: "text/html" }),
          "image/png": pngBlob,
        });

        await navigator.clipboard.write([item]);
      } else {
        await navigator.clipboard.writeText(value);
      }

      setCopied(true);
      window.setTimeout(() => setCopied(false), 1800);
    } catch (error) {
      console.error("Ошибка копирования контента:", error);
      try {
        await navigator.clipboard.writeText(value);
        setCopied(true);
        window.setTimeout(() => setCopied(false), 1800);
      } catch (fallbackError) {
        console.error("Ошибка резервного копирования текста:", fallbackError);
      }
    }
  };

  const openMedia = (url: string | null, mediaType: string | null) => {
    if (!url || !mediaType) return;
    setMediaViewer({ url, type: mediaType.startsWith("video/") ? "video" : "image" });
  };

  const clearHistory = async () => {
    if (!window.confirm("Очистить всю историю генераций?")) return;
    const { data } = await supabase.auth.getUser();
    if (!data.user) return;
    const itemsToDelete = history.filter((item) => item.mediaPath).map((item) => item.mediaPath as string);
    if (itemsToDelete.length) {
      const { error: storageError } = await supabase.storage.from("generation-media").remove(itemsToDelete);
      if (storageError) console.error("Ошибка очистки медиа:", storageError);
    }
    const { error } = await supabase.from("generations").delete().eq("user_id", data.user.id);
    if (!error) setHistory([]);
  };

  const handleRegister = async () => {
    if (!authEmail.trim() || !authPassword.trim()) { setAuthMessage("Введите email и пароль"); return; }
    setAuthLoading(true); setAuthMessage("");
    const { error } = await supabase.auth.signUp({ email: authEmail.trim(), password: authPassword });
    setAuthLoading(false);
    setAuthMessage(error ? error.message : "Аккаунт создан. Проверь почту для подтверждения.");
  };

  const handleLogin = async () => {
    if (!authEmail.trim() || !authPassword.trim()) { setAuthMessage("Введите email и пароль"); return; }
    setAuthLoading(true); setAuthMessage("");
    const { error } = await supabase.auth.signInWithPassword({ email: authEmail.trim(), password: authPassword });
    setAuthLoading(false);
    if (error) { setAuthMessage(error.message); return; }
    await loadAccountData(); setAuthMode(null); setAuthMessage("");
  };

  const handleReset = async () => {
    if (!authEmail.trim()) { setAuthMessage("Введите email"); return; }
    setAuthLoading(true); setAuthMessage("");
    const { error } = await supabase.auth.resetPasswordForEmail(authEmail.trim(), { redirectTo: window.location.origin });
    setAuthLoading(false);
    setAuthMessage(error ? error.message : "Письмо для восстановления отправлено 📩");
  };

  const logout = async () => {
    await supabase.auth.signOut();
    setUserEmail(null); setSubscriptionPlan("free"); setSubscriptionStatus("active"); setHistory([]); setGenerationsLeft(5); setView("home"); setShowProfileMenu(false);
  };

  const filteredHistory = useMemo(() => {
    const q = search.trim().toLowerCase();
    let items = history;
    if (view === "favorites") items = items.filter(x => x.favorite);
    if (libraryFilter === "Тексты") items = items.filter(x => !x.mediaType);
    if (libraryFilter === "Изображения") items = items.filter(x => x.mediaType?.startsWith("image/"));
    if (libraryFilter === "Видео") items = items.filter(x => x.mediaType?.startsWith("video/"));
    if (libraryFilter === "Избранное") items = items.filter(x => x.favorite);
    if (q) items = items.filter(x => `${x.type} ${x.tone} ${x.language} ${x.result}`.toLowerCase().includes(q));
    return items;
  }, [history, search, view, libraryFilter]);

  const isDark = theme === "dark";
  const bg = isDark ? "bg-[#09090b]" : "bg-[#f7f7f8]";
  const panel = isDark ? "bg-[#111113] border-white/[0.07]" : "bg-white border-black/[0.07]";
  const muted = isDark ? "text-zinc-400" : "text-zinc-500";
  const strong = isDark ? "text-white" : "text-zinc-950";

  return (
    <main className={`min-h-screen ${bg} ${strong} transition-colors duration-300`}>
      <div className="min-h-screen">
        <header className={`sticky top-0 z-40 border-b backdrop-blur-2xl ${isDark ? "border-white/[0.07] bg-[#0b0b0dcc]" : "border-black/[0.06] bg-white/90"}`}>
          <div className="mx-auto flex h-[68px] max-w-[1440px] items-center justify-between px-5 sm:px-8 lg:px-10">
            <button onClick={() => { setView("home"); setShowProfileMenu(false); }} className="group flex items-center gap-3">
              <LogoMark size={38} />
              <span className="text-[19px] font-bold tracking-[-0.04em]">BizAI</span>
            </button>

            <nav className="hidden items-center gap-1 md:flex">
              <TopNavButton active={view === "home"} onClick={() => { setView("home"); setShowProfileMenu(false); }}>Главная</TopNavButton>
              <TopNavButton active={view === "create"} onClick={() => { setView("create"); setShowProfileMenu(false); }}>Создать</TopNavButton>
              <TopNavButton active={view === "history"} onClick={() => { setView("history"); setShowProfileMenu(false); }}>Мои работы</TopNavButton>
              <TopNavButton active={view === "favorites"} onClick={() => { setView("favorites"); setShowProfileMenu(false); }}>Избранное</TopNavButton>
            </nav>

            <div className="relative flex items-center gap-2">
              <button aria-label="Поиск" className="hidden h-10 w-10 place-items-center rounded-full md:grid" onClick={() => setView("history")}>
                <Icon name="search" size={18} />
              </button>
              <button
                aria-label="Аккаунт"
                onClick={() => setShowProfileMenu((value) => !value)}
                className="grid h-10 w-10 place-items-center rounded-full bg-gradient-to-br from-purple-500 to-fuchsia-500 text-sm font-bold text-white shadow-[0_8px_24px_rgba(124,58,237,.22)] transition hover:scale-105"
              >
                {userEmail ? userEmail[0].toUpperCase() : "A"}
              </button>

              {showProfileMenu && (
                <ProfileDropdown
                  isDark={isDark}
                  userEmail={userEmail}
                  subscriptionPlan={subscriptionPlan}
                  onProfile={() => { setView("profile"); setShowProfileMenu(false); }}
                  onSettings={() => { setView("settings"); setShowProfileMenu(false); }}
                  onTheme={() => setTheme(isDark ? "light" : "dark")}
                  onLogin={() => { setAuthMode("login"); setShowProfileMenu(false); }}
                  onLogout={logout}
                />
              )}
            </div>
          </div>

          <div className="mx-auto flex max-w-[1440px] gap-1 overflow-x-auto px-5 pb-2 md:hidden sm:px-8">
            <MobileNavButton active={view === "home"} onClick={() => setView("home")}>Главная</MobileNavButton>
            <MobileNavButton active={view === "create"} onClick={() => setView("create")}>Создать</MobileNavButton>
            <MobileNavButton active={view === "history"} onClick={() => setView("history")}>Мои работы</MobileNavButton>
            <MobileNavButton active={view === "favorites"} onClick={() => setView("favorites")}>Избранное</MobileNavButton>
          </div>
        </header>

        <section className="mx-auto max-w-[1440px] px-4 pb-16 pt-6 sm:px-8 lg:px-10 lg:pt-8">
          {view === "home" && (
            <HomeLanding
              isDark={isDark}
              muted={muted}
              userEmail={userEmail}
              generationsLeft={generationsLeft}
              onCreate={() => setView("create")}
              onExamples={() => setView("history")}
              onOpenProfile={() => setView("profile")}
            />
          )}

          {view === "create" && (
            <CreateWorkspace
              isDark={isDark}
              panel={panel}
              muted={muted}
              strong={strong}
              type={type}
              setType={setType}
              text={text}
              setText={setText}
              tone={tone}
              setTone={setTone}
              language={language}
              setLanguage={setLanguage}
              fileType={fileType}
              setFileType={setFileType}
              preview={preview || savedMediaUrl}
              result={result}
              generationsLeft={generationsLeft}
              subscriptionPlan={subscriptionPlan}
              subscriptionStatus={subscriptionStatus}
              proImageUrl={proImageUrl}
              proImageGenerating={proImageGenerating}
              proImageError={proImageError}
              generateImage={generateImage}
              proTool={proTool}
              setProTool={setProTool}
              brandKit={brandKit}
              setBrandKit={setBrandKit}
              saveBrandKit={saveBrandKit}
              isGenerating={isGenerating}
              copied={copied}
              isEditing={isEditing}
              typeOptions={typeOptions}
              toneOptions={toneOptions}
              languageOptions={languageOptions}
              quality={quality}
              setQuality={setQuality}
              fileInputRef={fileInputRef}
              setUploadedFile={setUploadedFile}
              removeFile={removeFile}
              generate={generate}
              stopGeneration={stopGeneration}
              resetGeneration={resetGeneration}
              copyText={copyText}
              copyContent={copyContent}
              openMedia={openMedia}
              saveEdited={saveEdited}
              setIsEditing={setIsEditing}
              setResult={setResult}
            />
          )}

          {(view === "history" || view === "favorites") && (
            <LibraryWorkspace
              view={view}
              isDark={isDark}
              panel={panel}
              muted={muted}
              filteredHistory={filteredHistory}
              search={search}
              setSearch={setSearch}
              libraryFilter={libraryFilter}
              setLibraryFilter={setLibraryFilter}
              clearHistory={clearHistory}
              toggleFavorite={toggleFavorite}
              deleteHistoryItem={deleteHistoryItem}
              copyText={copyText}
              copyContent={copyContent}
              openMedia={openMedia}
              openItem={(item: HistoryItem) => {
                setResult(item.result);
                setType(item.type);
                setTone(item.tone);
                setLanguage(item.language);
                if (item.mediaType?.startsWith("video/")) setFileType("video");
                else if (item.mediaType?.startsWith("image/")) setFileType("image");
                setSavedMediaUrl(item.mediaUrl);
                setPreview(item.mediaUrl);
                setPreviewKind(item.mediaUrl ? "remote" : null);
                setQuality(item.quality ?? "auto");
                setImage(null);
                setEditingId(item.id);
                setView("create");
              }}
              onCreate={() => setView("create")}
            />
          )}

          {view === "profile" && (
            <ProfilePage
              userEmail={userEmail}
              subscriptionPlan={subscriptionPlan}
              subscriptionStatus={subscriptionStatus}
              generationsLeft={generationsLeft}
              theme={theme}
              setView={setView}
              logout={logout}
              setAuthMode={setAuthMode}
            />
          )}

          {view === "settings" && (
            <SettingsPage
              theme={theme}
              setTheme={setTheme}
              userEmail={userEmail}
              setView={setView}
            />
          )}
        </section>

        {mediaViewer && (
          <div
            className="fixed inset-0 z-[120] flex items-center justify-center bg-black/80 p-4 backdrop-blur-md"
            role="dialog"
            aria-modal="true"
            aria-label="Просмотр медиа"
            onClick={() => setMediaViewer(null)}
          >
            <div
              className="relative flex max-h-[92vh] max-w-[94vw] items-center justify-center"
              onClick={(event) => event.stopPropagation()}
            >
              {mediaViewer.type === "video" ? (
                <video src={mediaViewer.url} controls autoPlay className="max-h-[88vh] max-w-[92vw] rounded-2xl bg-black shadow-2xl" />
              ) : (
                <img src={mediaViewer.url} alt="Полноразмерное изображение" className="max-h-[88vh] max-w-[92vw] rounded-2xl object-contain shadow-2xl" />
              )}
              <button type="button" onClick={() => setMediaViewer(null)} aria-label="Закрыть просмотр" className="absolute -right-3 -top-3 grid h-10 w-10 place-items-center rounded-full bg-white text-black shadow-xl">
                <Icon name="close" size={18} />
              </button>
            </div>
          </div>
        )}

        {authMode && (
          <AuthModal
            authMode={authMode}
            authEmail={authEmail}
            authPassword={authPassword}
            authLoading={authLoading}
            authMessage={authMessage}
            isDark={isDark}
            panel={panel}
            muted={muted}
            setAuthMode={setAuthMode}
            setAuthEmail={setAuthEmail}
            setAuthPassword={setAuthPassword}
            handleLogin={handleLogin}
            handleRegister={handleRegister}
            handleReset={handleReset}
            setAuthMessage={setAuthMessage}
          />
        )}

        {proOpen && (
          <ProModal
            isDark={isDark}
            panel={panel}
            muted={muted}
            userEmail={userEmail}
            close={() => {
              setProOpen(false);
              setView("create");
            }}
            login={() => {
              setProOpen(false);
              setAuthMode("login");
            }}
          />
        )}

      </div>

      <style jsx global>{`
        :root {
          color-scheme: light;
        }

        html.dark {
          color-scheme: dark;
        }

        * {
          box-sizing: border-box;
        }

        body {
          margin: 0;
          font-family: Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
        }

        button,
        input,
        textarea,
        select {
          font: inherit;
        }

        button {
          cursor: pointer;
        }

        button:disabled {
          cursor: not-allowed;
        }

        .top-nav-button {
          position: relative;
          border-radius: 14px;
          padding: 10px 15px;
          font-size: 12px;
          font-weight: 650;
          transition: background-color .2s ease, color .2s ease, transform .2s ease;
        }

        .top-nav-button:hover {
          background: rgba(124, 58, 237, .055);
        }

        .top-nav-button.active {
          color: #6d28d9;
          background: linear-gradient(135deg, rgba(139, 92, 246, .13), rgba(217, 70, 239, .08));
        }

        .dark .top-nav-button:hover {
          background: rgba(255, 255, 255, .045);
        }

        .dark .top-nav-button.active {
          color: #c4b5fd;
          background: linear-gradient(135deg, rgba(139, 92, 246, .22), rgba(217, 70, 239, .12));
        }

        .mobile-nav-button {
          flex: 0 0 auto;
          border-radius: 999px;
          padding: 8px 13px;
          font-size: 11px;
          font-weight: 650;
          white-space: nowrap;
        }

        .mobile-nav-button.active {
          background: rgba(124, 58, 237, .1);
          color: #7c3aed;
        }

        .dark .mobile-nav-button.active {
          background: rgba(139, 92, 246, .16);
          color: #c4b5fd;
        }

        .eyebrow {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          color: #7c3aed;
          font-size: 9px;
          font-weight: 800;
          letter-spacing: .2em;
          text-transform: uppercase;
        }

        .gradient-text {
          background: linear-gradient(90deg, #7c3aed 0%, #a855f7 45%, #d946ef 100%);
          -webkit-background-clip: text;
          background-clip: text;
          color: transparent;
        }

        .soft-gradient {
          background:
            radial-gradient(circle at 80% 20%, rgba(167, 139, 250, .2), transparent 32%),
            radial-gradient(circle at 25% 65%, rgba(216, 180, 254, .18), transparent 34%),
            linear-gradient(135deg, #faf8ff 0%, #ffffff 48%, #f8f4ff 100%);
        }

        .dark .soft-gradient {
          background:
            radial-gradient(circle at 80% 20%, rgba(124, 58, 237, .17), transparent 32%),
            radial-gradient(circle at 25% 65%, rgba(168, 85, 247, .1), transparent 34%),
            linear-gradient(135deg, #111014 0%, #0b0b0e 48%, #110d18 100%);
        }

        .label {
          display: block;
          font-size: 11px;
          font-weight: 700;
        }

        .select,
        .input {
          width: 100%;
          border: 1px solid rgba(0, 0, 0, .09);
          border-radius: 14px;
          background: rgba(0, 0, 0, .025);
          padding: 11px 13px;
          font-size: 12px;
          outline: none;
          transition: border-color .2s ease, box-shadow .2s ease, background .2s ease;
        }

        .dark .select,
        .dark .input {
          border-color: rgba(255, 255, 255, .09);
          background: rgba(255, 255, 255, .035);
          color: white;
        }

        .select:focus,
        .input:focus {
          border-color: rgba(124, 58, 237, .55);
          box-shadow: 0 0 0 3px rgba(124, 58, 237, .08);
        }

        .dark select option {
          background: #15131a;
          color: white;
        }

        .media-tab {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          border: 1px solid rgba(0, 0, 0, .075);
          border-radius: 13px;
          padding: 11px;
          font-size: 11px;
          font-weight: 700;
          transition: transform .2s ease, border-color .2s ease, background .2s ease;
        }

        .dark .media-tab {
          border-color: rgba(255, 255, 255, .075);
        }

        .media-tab.selected {
          border-color: rgba(124, 58, 237, .45);
          background: rgba(124, 58, 237, .09);
          color: #7c3aed;
        }

        .dark .media-tab.selected {
          color: #c4b5fd;
          background: rgba(124, 58, 237, .15);
        }

        .media-tab:hover {
          transform: translateY(-1px);
        }

        .primary-btn {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 9px;
          border: 0;
          border-radius: 14px;
          background: #151317;
          padding: 12px 18px;
          color: white;
          font-size: 12px;
          font-weight: 750;
          box-shadow: 0 12px 28px rgba(0, 0, 0, .12);
          transition: transform .2s ease, box-shadow .2s ease, opacity .2s ease, background .2s ease;
        }

        .dark .primary-btn {
          background: white;
          color: #111113;
        }

        .primary-btn:hover {
          transform: translateY(-1px);
          box-shadow: 0 16px 34px rgba(0, 0, 0, .16);
        }

        .primary-btn:disabled {
          opacity: .45;
          transform: none;
          box-shadow: none;
        }

        .small-btn {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 7px;
          border: 1px solid rgba(0, 0, 0, .075);
          border-radius: 12px;
          padding: 9px 12px;
          font-size: 10px;
          font-weight: 700;
          transition: background .2s ease, transform .2s ease, border-color .2s ease;
        }

        .dark .small-btn {
          border-color: rgba(255, 255, 255, .075);
        }

        .small-btn:hover {
          transform: translateY(-1px);
          background: rgba(0, 0, 0, .035);
        }

        .dark .small-btn:hover {
          background: rgba(255, 255, 255, .04);
        }

        .line-clamp-4 {
          display: -webkit-box;
          -webkit-box-orient: vertical;
          -webkit-line-clamp: 4;
          overflow: hidden;
        }

        ::selection {
          background: rgba(124, 58, 237, .22);
        }
      `}</style>
    </main>
  );
}


/**
 * BizAI UI implementation contract
 *
 * This single-file screen intentionally keeps the product shell, navigation,
 * content creation workflow, library, profile, settings, authentication,
 * theme handling, media preview, generation controls, and Pro presentation
 * together so that the existing Supabase and API contracts are preserved.
 *
 * The reference composition is reproduced as a responsive web interface:
 * - the main navigation stays at the top;
 * - personal actions live inside the circular account menu;
 * - the landing screen is separate from the creation workspace;
 * - the creation workspace keeps the proven generation flow;
 * - the content-type cards use the approved custom SVG icon language;
 * - the light theme uses a warm near-white surface instead of pure white;
 * - the dark theme uses layered near-black surfaces instead of pure black;
 * - the purple accent is deliberately softened with gradients and transparency;
 * - media files are previewed without replacing the original selected file;
 * - video size validation remains at 50 MB;
 * - image size validation remains at 15 MB;
 * - generation cancellation continues to use AbortController;
 * - generation rollback remains handled by the existing Supabase logic;
 * - history remains persisted in the generations table;
 * - favorite state remains persisted in the generations table;
 * - private media continues to use signed Supabase Storage URLs;
 * - the account menu exposes profile, settings, theme, and logout;
 * - mobile navigation remains horizontal instead of introducing a sidebar.
 *
 * The following design notes are intentionally kept close to the component
 * code so future edits can be made without accidentally removing behavior.
 */
function LogoMark({ size = 40 }: { size?: number }) {
  return (
    <span
      aria-hidden="true"
      className="relative grid shrink-0 place-items-center"
      style={{ width: size, height: size }}
    >
      <svg width={size} height={size} viewBox="0 0 40 40" fill="none">
        <defs>
          <linearGradient id="bizai-logo-gradient" x1="7" y1="6" x2="34" y2="34">
            <stop offset="0" stopColor="#7C3AED" />
            <stop offset="0.55" stopColor="#8B5CF6" />
            <stop offset="1" stopColor="#C026D3" />
          </linearGradient>
        </defs>
        <path
          d="M20 4.5l3.1 10.4L33.5 18l-10.4 3.1L20 31.5l-3.1-10.4L6.5 18l10.4-3.1L20 4.5Z"
          fill="url(#bizai-logo-gradient)"
        />
        <path
          d="M29.5 25.5l1.1 3.8 3.9 1.2-3.9 1.1-1.1 3.9-1.2-3.9-3.8-1.1 3.8-1.2 1.2-3.8Z"
          fill="#A855F7"
          opacity=".9"
        />
        <circle cx="20" cy="18" r="2.4" fill="white" fillOpacity=".95" />
      </svg>
    </span>
  );
}

function TopNavButton({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`top-nav-button ${active ? "active" : ""}`}
    >
      {children}
    </button>
  );
}

function MobileNavButton({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`mobile-nav-button ${active ? "active" : ""}`}
    >
      {children}
    </button>
  );
}

function ProfileDropdown({
  isDark,
  userEmail,
  subscriptionPlan,
  onProfile,
  onSettings,
  onTheme,
  onLogin,
  onLogout,
}: {
  isDark: boolean;
  userEmail: string | null;
  subscriptionPlan: string;
  onProfile: () => void;
  onSettings: () => void;
  onTheme: () => void;
  onLogin: () => void;
  onLogout: () => void;
}) {
  return (
    <div
      className={`absolute right-0 top-[52px] z-50 w-[250px] overflow-hidden rounded-[22px] border p-2 shadow-2xl backdrop-blur-2xl ${isDark
        ? "border-white/[0.09] bg-[#151318]/95"
        : "border-black/[0.07] bg-white/95"
        }`}
    >
      <div className="flex items-center gap-3 px-3 py-3">
        <div className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-gradient-to-br from-purple-500 to-fuchsia-500 text-sm font-bold text-white">
          {userEmail ? userEmail[0].toUpperCase() : "A"}
        </div>
        <div className="min-w-0">
          <p className="truncate text-xs font-bold">
            {userEmail || "Гость"}
          </p>
          <p className="mt-1 truncate text-[10px] opacity-55">
            {userEmail
              ? subscriptionPlan === "pro"
                ? "BizAI Pro"
                : "Free plan"
              : "Войти в аккаунт"}
          </p>
        </div>
      </div>

      <div
        className={`my-1 border-t ${isDark ? "border-white/[0.07]" : "border-black/[0.06]"
          }`}
      />

      {userEmail ? (
        <>
          <ProfileMenuButton icon="user" onClick={onProfile}>
            Профиль
          </ProfileMenuButton>
          <ProfileMenuButton icon="settings" onClick={onSettings}>
            Настройки
          </ProfileMenuButton>
        </>
      ) : (
        <ProfileMenuButton icon="user" onClick={onLogin}>
          Войти
        </ProfileMenuButton>
      )}

      <ProfileMenuButton
        icon={isDark ? "sun" : "moon"}
        onClick={onTheme}
      >
        {isDark ? "Светлая тема" : "Тёмная тема"}
      </ProfileMenuButton>

      {userEmail && (
        <>
          <div
            className={`my-1 border-t ${isDark ? "border-white/[0.07]" : "border-black/[0.06]"
              }`}
          />
          <ProfileMenuButton
            icon="logout"
            danger
            onClick={onLogout}
          >
            Выйти
          </ProfileMenuButton>
        </>
      )}
    </div>
  );
}

function ProfileMenuButton({
  icon,
  onClick,
  children,
  danger = false,
}: {
  icon: string;
  onClick: () => void;
  children: ReactNode;
  danger?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-xs font-semibold transition ${danger
        ? "text-red-500 hover:bg-red-500/[0.06]"
        : "hover:bg-black/[0.035] dark:hover:bg-white/[0.045]"
        }`}
    >
      <Icon name={icon} size={16} />
      <span>{children}</span>
    </button>
  );
}

function HomeLanding({
  isDark,
  muted,
  userEmail,
  generationsLeft,
  onCreate,
  onExamples,
  onOpenProfile,
}: {
  isDark: boolean;
  muted: string;
  userEmail: string | null;
  generationsLeft: number;
  onCreate: () => void;
  onExamples: () => void;
  onOpenProfile: () => void;
}) {
  return (
    <div className="mx-auto w-full max-w-[1440px]">
      <section
        className={`relative overflow-hidden rounded-[30px] border shadow-[0_30px_90px_rgba(80,45,150,.14)] ${isDark ? "border-white/[0.08] bg-[#0c0b10]" : "border-purple-100 bg-[#f8f7ff]"
          }`}
      >
        <img
          src="/bizai-hero-bg.png"
          alt="BizAI — пример работы платформы"
          className={`absolute inset-0 h-full w-full object-cover ${isDark ? "brightness-[0.90] saturate-[0.96]" : ""}`}
        />
        <div className={`absolute inset-0 ${isDark ? "bg-[#08070d]/[0.05]" : "bg-white/[0.04]"}`} />

        <div className="relative z-10 min-h-[820px] p-7 sm:p-10 lg:p-14">
          <div className="max-w-[520px] pt-6 sm:pt-10 lg:pt-14">
            <span className={`inline-flex items-center gap-2 rounded-full border px-4 py-2 text-[10px] font-black uppercase tracking-[0.14em] backdrop-blur-md shadow-sm ${isDark
              ? "border-white/15 bg-[#17151f]/90 text-white shadow-black/20"
              : "border-purple-200/80 bg-white/92 text-purple-700 shadow-purple-900/10"
              }`}>
              <span className="h-2 w-2 rounded-full bg-gradient-to-r from-purple-500 to-fuchsia-500" />
              Ваш AI-партнёр для бизнеса
            </span>
            <h1 className={`mt-6 text-5xl font-black leading-[0.96] tracking-[-0.055em] sm:text-6xl lg:text-7xl ${isDark ? "text-white" : "text-zinc-950"}`}>
              Создавай контент для бизнеса за <span className="bg-gradient-to-r from-violet-500 via-purple-500 to-fuchsia-500 bg-clip-text text-transparent">секунды</span>
            </h1>
            <p className={`mt-6 max-w-[500px] rounded-2xl px-4 py-3 text-sm leading-6 shadow-sm backdrop-blur-md sm:text-base ${isDark
              ? "bg-[#111018]/72 text-white/90 shadow-black/20"
              : "bg-white/82 text-zinc-800 shadow-black/5"
              }`}>
              Тексты, посты, идеи, описания, сценарии, изображения и видео с помощью искусственного интеллекта.
            </p>
            <div className="mt-7 flex flex-wrap gap-3">
              <button type="button" onClick={onCreate} className="primary-btn !rounded-2xl !px-6 !py-3.5">
                Создать контент <Icon name="arrow" size={16} />
              </button>
              <button
                type="button"
                onClick={onExamples}
                className={`small-btn !rounded-2xl !px-5 !py-3.5 backdrop-blur-md ${isDark ? "border-white/15 bg-black/25 text-white hover:bg-white/10" : "bg-white/75"}`}
              >
                <Icon name="play" size={15} /> Посмотреть примеры
              </button>
            </div>
            <div className={`relative z-20 mt-7 flex items-center gap-3 text-xs ${isDark ? "text-white/85" : "text-zinc-700"}`}>
              <div className="flex -space-x-2">
                {["A", "M", "D", "K"].map((letter) => <span key={letter} className="grid h-8 w-8 place-items-center rounded-full border-2 border-white/80 bg-gradient-to-br from-purple-500 to-fuchsia-500 text-[10px] font-bold text-white shadow-sm">{letter}</span>)}
              </div>
              <span><b className={isDark ? "text-white" : "text-zinc-900"}>Уже более 10 000+</b><br />пользователей доверяют BizAI</span>
            </div>
          </div>

          <div className="absolute bottom-3 left-7 right-7 z-10 grid gap-3 sm:grid-cols-2 lg:grid-cols-4 lg:bottom-4 lg:left-10 lg:right-10">
            {[
              ["post", "Тексты для бизнеса", "Посты, описания, рекламные тексты"],
              ["image", "Изображения и видео", "Анализ и генерация контента по вашим медиа"],
              ["globe", "Много языков", "Поддержка русского, английского и румынского"],
              ["grid", "Разные стили", "Официальный, дружелюбный, креативный и другие"],
            ].map(([icon, title, description]) => (
              <button
                key={title}
                type="button"
                onClick={onCreate}
                className={`flex min-h-[88px] items-center gap-3 rounded-2xl border p-4 text-left backdrop-blur-xl transition hover:-translate-y-1 ${isDark ? "border-white/10 bg-[#11121c]/75 text-white hover:bg-[#171827]/85" : "border-black/[0.06] bg-white/80 text-zinc-950 hover:bg-white"}`}
              >
                <span className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-gradient-to-br from-purple-500/20 to-fuchsia-500/20 text-purple-600"><Icon name={icon} size={19} /></span>
                <span><b className="block text-xs">{title}</b><small className={`mt-1 block text-[9px] leading-4 ${isDark ? "text-white/60" : "text-zinc-500"}`}>{description}</small></span>
                <Icon name="arrow" size={15} />
              </button>
            ))}
          </div>
        </div>
      </section>

      <footer className={`mt-4 rounded-[26px] border p-7 sm:p-9 ${isDark ? "border-white/[0.07] bg-[#0f1016]" : "border-black/[0.06] bg-white"}`}>
        <div className="grid gap-8 md:grid-cols-[1.5fr_1fr_1fr_1fr]">
          <div>
            <div className="flex items-center gap-2 font-bold"><LogoMark size={28} /> BizAI</div>
            <p className={`mt-3 max-w-sm text-xs leading-5 ${muted}`}>Ваш AI-партнёр для создания контента для бизнеса. Экономьте время и развивайте свой бренд с помощью искусственного интеллекта.</p>
            <button type="button" onClick={onOpenProfile} className={`mt-4 text-xs font-semibold ${isDark ? "text-white" : "text-zinc-900"}`}>Аккаунт →</button>
          </div>
          <div><b className="text-xs">Продукт</b><div className={`mt-3 space-y-2 text-[11px] ${muted}`}><button type="button" onClick={onCreate} className="block hover:text-purple-600">Создать контент</button><button type="button" onClick={onExamples} className="block hover:text-purple-600">Мои работы</button><button type="button" onClick={onExamples} className="block hover:text-purple-600">Избранное</button></div></div>
          <div><b className="text-xs">Компания</b><div className={`mt-3 space-y-2 text-[11px] ${muted}`}><span className="block">О нас</span><span className="block">Партнёрская программа</span><span className="block">Контакты</span></div></div>
          <div><b className="text-xs">Помощь</b><div className={`mt-3 space-y-2 text-[11px] ${muted}`}><span className="block">Частые вопросы</span><span className="block">Конфиденциальность</span><span className="block">Условия использования</span></div></div>
        </div>
        <div className={`mt-7 flex flex-col justify-between gap-3 border-t pt-4 text-[10px] sm:flex-row ${isDark ? "border-white/[0.07] text-zinc-500" : "border-black/[0.06] text-zinc-400"}`}>
          <span>© 2026 BizAI. Все права защищены.</span><span>Создано с помощью искусственного интеллекта · Сделано с заботой для вашего бизнеса</span>
        </div>
      </footer>
      <p className={`mt-3 text-center text-[11px] ${muted}`}>{userEmail ? `Осталось ${generationsLeft} генераций` : "Создано с помощью искусственного интеллекта"}</p>
    </div>
  );
}

function HomeMiniCard({
  isDark,
  title,
  description,
  action,
  onClick,
  icon,
}: {
  isDark: boolean;
  title: string;
  description: string;
  action: string;
  onClick: () => void;
  icon: string;
}) {
  const card = isDark ? "border-white/[.08] bg-[#111116]" : "border-[#e6e4ec] bg-white";
  const muted = isDark ? "text-zinc-400" : "text-zinc-500";
  return (
    <button
      type="button"
      onClick={onClick}
      className={`group rounded-[24px] border p-6 text-left shadow-sm transition hover:-translate-y-1 hover:shadow-xl ${card}`}
    >
      <div className="flex items-start justify-between gap-4">
        <span className="grid h-11 w-11 place-items-center rounded-2xl bg-purple-500/10 text-purple-600">
          <Icon name={icon} size={19} />
        </span>
        <Icon name="arrow" size={17} />
      </div>
      <h3 className="mt-6 text-base font-bold">{title}</h3>
      <p className={`mt-2 text-xs leading-5 ${muted}`}>{description}</p>
      <span className="mt-5 inline-flex text-[11px] font-bold text-purple-600 transition group-hover:translate-x-1">{action}</span>
    </button>
  );
}

function CreateWorkspace({
  isDark,
  panel,
  muted,
  strong,
  type,
  setType,
  text,
  setText,
  tone,
  setTone,
  language,
  setLanguage,
  fileType,
  setFileType,
  preview,
  result,
  generationsLeft,
  subscriptionPlan,
  subscriptionStatus,
  proImageUrl,
  proImageGenerating,
  proImageError,
  generateImage,
  proTool,
  setProTool,
  brandKit,
  setBrandKit,
  saveBrandKit,
  isGenerating,
  copied,
  isEditing,
  typeOptions,
  toneOptions,
  languageOptions,
  quality,
  setQuality,
  fileInputRef,
  setUploadedFile,
  removeFile,
  generate,
  stopGeneration,
  resetGeneration,
  copyText,
  copyContent,
  openMedia,
  saveEdited,
  setIsEditing,
  setResult,
}: any) {
  const isPro = subscriptionPlan === "pro" && subscriptionStatus === "active";

  return (
    <div className="mx-auto max-w-[1180px]">
      <div className="mb-7 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <span className="eyebrow">AI CONTENT STUDIO</span>
          <h1 className="mt-3 text-4xl font-black tracking-[-0.045em] sm:text-5xl">
            Создать контент
          </h1>
          <p className={`mt-2 text-sm ${muted}`}>
            Опиши, что тебе нужно, и получи готовый результат.
          </p>
        </div>
        <div className={`rounded-2xl border px-4 py-3 ${panel}`}>
          <p className={`text-[10px] ${muted}`}>{isPro ? "Тариф" : "Осталось генераций"}</p>
          <p className="mt-1 text-right text-sm font-bold">
            {isPro ? "BizAI Pro" : `${generationsLeft}/5`}
          </p>
        </div>
      </div>

      <div className="grid gap-5 xl:grid-cols-[1.08fr_.92fr]">
        <div className={`rounded-[28px] border p-5 shadow-sm sm:p-7 ${panel}`}>
          <div className="flex items-start justify-between gap-4">
            <div>
              <h2 className="text-lg font-bold">Создать контент</h2>
              <p className={`mt-1 text-xs ${muted}`}>
                Выбери формат и напиши задачу.
              </p>
            </div>
            <span className="rounded-full bg-purple-500/10 px-3 py-1.5 text-[9px] font-bold text-purple-600">
              STEP 01
            </span>
          </div>

          <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
            {typeOptions.map((item: any) => (
              <button
                key={item.value}
                type="button"
                onClick={() => setType(item.value)}
                className={`rounded-2xl border p-3.5 text-left transition hover:-translate-y-0.5 sm:p-4 ${type === item.value
                  ? "border-purple-400 bg-purple-500/[0.08] shadow-[0_12px_30px_rgba(139,92,246,.12)]"
                  : "border-black/[0.07] hover:border-purple-200 dark:border-white/[0.07] dark:hover:border-purple-400/30"
                  }`}
              >
                <span
                  className={`grid h-11 w-11 place-items-center rounded-xl ${type === item.value
                    ? "bg-gradient-to-br from-purple-600 to-fuchsia-500 text-white shadow-lg shadow-purple-500/20"
                    : "bg-black/[0.04] text-zinc-500 dark:bg-white/[0.05] dark:text-zinc-300"
                    }`}
                >
                  <Icon name={item.icon} size={21} />
                </span>
                <b className="mt-3 block text-xs">{item.label}</b>
                <small className={`mt-1 block text-[10px] leading-4 ${muted}`}>
                  {item.desc}
                </small>
              </button>
            ))}
          </div>

          <div className="mt-7">
            <label className="label">Твой запрос</label>
            <div
              className={`relative mt-2 rounded-2xl border ${isDark
                ? "border-white/[0.08] bg-white/[0.025]"
                : "border-black/[0.08] bg-zinc-50"
                }`}
            >
              <textarea
                value={text}
                onChange={(event) => setText(event.target.value)}
                maxLength={1000}
                placeholder="Например: создай продающий пост для Instagram о нашей новой коллекции..."
                className="min-h-[165px] w-full resize-none bg-transparent p-4 pb-10 text-sm leading-6 outline-none"
              />
              <span className={`absolute bottom-3 right-3 text-[10px] ${muted}`}>
                {text.length}/1000
              </span>
            </div>
          </div>

          <div className="mt-6 grid gap-4 sm:grid-cols-2">
            <div>
              <label className="label">Тон</label>
              <select
                value={tone}
                onChange={(event) => setTone(event.target.value)}
                className="select mt-2"
              >
                {toneOptions.map((option: string) => (
                  <option key={option}>{option}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="label">Язык</label>
              <select
                value={language}
                onChange={(event) => setLanguage(event.target.value)}
                className="select mt-2"
              >
                {languageOptions.map((option: string) => (
                  <option key={option}>{option}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="mt-5">
            <label className="label">Качество обработки</label>
            <div className="mt-2 grid grid-cols-3 gap-2">
              {[
                ["auto", "Авто", "Оптимальный баланс"],
                ["standard", "Стандарт", "Быстрее"],
                ["high", "Высокое", "Больше деталей"],
              ].map(([value, label, desc]) => (
                <button key={value} type="button" onClick={() => setQuality(value as MediaQuality)} className={`rounded-2xl border p-3 text-left transition ${quality === value ? "border-purple-400 bg-purple-500/[0.08] text-purple-700 dark:text-purple-300" : "border-black/[0.07] hover:border-purple-200 dark:border-white/[0.07] dark:hover:border-purple-400/30"}`}>
                  <b className="block text-[11px]">{label}</b>
                  <span className={`mt-1.5 block text-xs leading-5 ${muted}`}>{desc}</span>
                </button>
              ))}
            </div>
            <p className={`mt-2 text-[10px] ${muted}`}>Исходное фото или видео сохраняется без изменения. «Высокое» влияет на качество анализа, а не изменяет оригинальный файл.</p>
          </div>

          <div className="mt-6">
            <label className="label">
              Медиа <span className="font-normal opacity-50">необязательно</span>
            </label>

            <div className="mt-2 grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => {
                  setFileType("image");
                  removeFile();
                }}
                className={`media-tab ${fileType === "image" ? "selected" : ""}`}
              >
                <Icon name="image" size={15} />
                Изображение
              </button>
              <button
                type="button"
                onClick={() => {
                  setFileType("video");
                  removeFile();
                }}
                className={`media-tab ${fileType === "video" ? "selected" : ""}`}
              >
                <Icon name="play" size={15} />
                Видео
              </button>
            </div>
          </div>

          <input
            ref={fileInputRef}
            type="file"
            accept={fileType === "image" ? "image/*" : "video/*"}
            className="hidden"
            onChange={(event) => setUploadedFile(event.target.files?.[0])}
          />

          {!preview ? (
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className={`mt-3 flex w-full items-center justify-center gap-2 rounded-2xl border border-dashed px-4 py-5 text-xs font-semibold transition ${isDark
                ? "border-white/10 hover:bg-white/[0.03]"
                : "border-black/10 hover:bg-black/[0.02]"
                }`}
            >
              <Icon name="upload" size={16} />
              Добавить {fileType === "image" ? "изображение" : "видео"}
              <span className={`text-[10px] ${muted}`}>
                до {fileType === "image" ? "15" : "50"} MB
              </span>
            </button>
          ) : (
            <div className="relative mt-3 overflow-hidden rounded-2xl border border-black/[0.07] dark:border-white/[0.07]">
              {fileType === "image" ? (
                <button
                  type="button"
                  onClick={() => openMedia(preview, "image/*")}
                  className="block w-full cursor-zoom-in"
                  title="Открыть изображение в полном размере"
                >
                  <img
                    src={preview}
                    alt="Предпросмотр загруженного изображения"
                    className="max-h-72 w-full object-contain bg-black/5"
                  />
                </button>
              ) : (
                <video
                  src={preview}
                  controls
                  className="max-h-72 w-full bg-black"
                />
              )}
              <button
                type="button"
                onClick={removeFile}
                className="absolute right-3 top-3 grid h-8 w-8 place-items-center rounded-full bg-black/70 text-white"
              >
                <Icon name="close" size={15} />
              </button>
            </div>
          )}

          {isPro && (
            <div className="mt-6 rounded-2xl border border-purple-500/15 bg-purple-500/[0.035] p-5">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-sm font-bold uppercase tracking-[0.14em] text-purple-600">BizAI Pro Studio</p>
                  <p className={`mt-1.5 text-sm leading-5 ${muted}`}>
                    Выбери режим — обычная генерация останется такой же, а Pro добавит готовый маркетинговый результат.
                  </p>
                </div>
                <span className="rounded-full bg-purple-500/10 px-3 py-1.5 text-[11px] font-bold text-purple-600">PRO</span>
              </div>

              <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {[
                  ["standard", "Обычный", "Текущая генерация"],
                  ["package", "📦 Контент-пакет", "Пост + CTA + Stories + Reels"],
                  ["social", "📱 Соцсети", "Instagram + TikTok + Stories"],
                  ["plan", "📅 Контент-план", "7 дней готовых идей"],
                  ["campaign", "🎯 Кампания", "3 рекламных варианта"],
                  ["brand", "🎨 Brand Kit", "Фирменный стиль"],
                ].map(([value, label, desc]) => (
                  <button
                    key={value}
                    type="button"
                    onClick={() => setProTool(value as typeof proTool)}
                    className={`rounded-xl border p-4 text-left transition hover:-translate-y-0.5 ${proTool === value
                        ? "border-purple-400 bg-purple-500/[0.10] shadow-[0_8px_22px_rgba(139,92,246,.10)]"
                        : "border-black/[0.06] hover:border-purple-300 dark:border-white/[0.07] dark:hover:border-purple-400/30"
                      }`}
                  >
                    <b className="block text-sm font-semibold leading-5">{label}</b>
                    <span className={`mt-1.5 block text-xs leading-5 ${muted}`}>{desc}</span>
                  </button>
                ))}
              </div>

              {proTool === "brand" && (
                <div className="mt-4 rounded-xl border border-black/[0.06] bg-white/[0.025] p-4 dark:border-white/[0.07]">
                  <div className="grid gap-2 sm:grid-cols-2">
                    {[
                      ["name", "Название бизнеса", "Например: BizAI Coffee"],
                      ["audience", "Целевая аудитория", "Например: владельцы малого бизнеса"],
                      ["tone", "Фирменный тон", "Например: уверенный, современный"],
                      ["colors", "Фирменные цвета", "Например: фиолетовый и белый"],
                      ["website", "Сайт / ссылка", "Например: example.com"],
                    ].map(([key, label, placeholder]) => (
                      <div key={key} className={key === "website" ? "sm:col-span-2" : ""}>
                        <label className="label text-sm">{label}</label>
                        <input
                          value={brandKit[key as keyof typeof brandKit]}
                          onChange={(event) => setBrandKit({ ...brandKit, [key]: event.target.value })}
                          placeholder={placeholder}
                          className="input mt-1 text-sm"
                        />
                      </div>
                    ))}
                  </div>
                  <div className="mt-4 flex flex-col items-start justify-between gap-3 sm:flex-row sm:items-center">
                    <span className={`text-xs leading-5 ${muted}`}>Данные сохраняются только в этом браузере.</span>
                    <button type="button" onClick={saveBrandKit} className="small-btn !text-sm !px-4 !py-2">
                      Сохранить Brand Kit
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          <div className="mt-7 flex flex-col gap-3 sm:flex-row sm:items-center">
            <div className={`flex-1 text-xs ${muted}`}>
              {isPro ? (
                <>
                  <b className={strong}>BizAI Pro</b> · расширенный доступ к генерациям
                </>
              ) : generationsLeft > 0 ? (
                <>
                  <b className={strong}>{generationsLeft}</b> бесплатных генераций осталось
                </>
              ) : (
                <>Лимит закончился — время перейти на Pro.</>
              )}
            </div>

            {isGenerating ? (
              <button
                type="button"
                onClick={stopGeneration}
                className="primary-btn bg-red-500 hover:bg-red-600"
              >
                ■ Остановить
              </button>
            ) : isPro ? (
              <div className="flex flex-col gap-2 sm:flex-row">
                <button
                  type="button"
                  onClick={generateImage}
                  disabled={proImageGenerating}
                  className="primary-btn"
                >
                  {proImageGenerating
                    ? "⏳ Создаём..."
                    : "🖼️ Создать изображение"}
                </button>

                <button
                  type="button"
                  onClick={generate}
                  disabled={proImageGenerating}
                  className="primary-btn"
                >
                  Создать
                  <Icon name="arrow" size={16} />
                </button>
              </div>
            ) : (
              <button
                type="button"
                disabled={generationsLeft <= 0}
                onClick={generate}
                className="primary-btn"
              >
                Создать
                <Icon name="arrow" size={16} />
              </button>
            )}
          </div>

          {proImageError && (
            <div className="mt-3 rounded-2xl border border-red-500/20 bg-red-500/5 p-3 text-xs text-red-500">
              {proImageError}
            </div>
          )}
        </div>

        <div className="space-y-5">
          <div
            className={`relative min-h-[610px] overflow-hidden rounded-[28px] border p-6 sm:p-7 ${isDark
              ? "border-purple-400/10 bg-gradient-to-br from-purple-500/10 via-fuchsia-500/[0.04] to-transparent"
              : "border-purple-100 bg-gradient-to-br from-purple-50 via-white to-fuchsia-50"
              }`}
          >
            <div className="absolute -right-16 -top-16 h-44 w-44 rounded-full bg-purple-500/15 blur-3xl" />
            <span className="eyebrow">LIVE PREVIEW</span>
            <h3 className="mt-3 text-xl font-bold">Здесь появится ваш результат</h3>
            <p className={`mt-2 text-xs leading-5 ${muted}`}>
              Заполни форму и нажми «Создать».
            </p>

            <div
              className={`mt-6 min-h-[420px] rounded-2xl border p-4 ${isDark
                ? "border-white/[0.07] bg-black/20"
                : "border-black/[0.06] bg-white/75"
                }`}
            >
              {result || proImageUrl ? (
                <div>
                  <div className="mb-4 flex items-center gap-2 text-[10px] font-bold uppercase tracking-wider text-purple-600">
                    <span className="h-1.5 w-1.5 rounded-full bg-purple-500" />
                    {proImageUrl ? "Готовое изображение" : "Готовый результат"}
                  </div>

                  {proImageUrl && (
                    <div className="mb-4 overflow-hidden rounded-2xl border border-black/[0.06] dark:border-white/[0.07]">
                      <button type="button" onClick={() => openMedia(proImageUrl, "image/*")} className="block w-full cursor-zoom-in" title="Открыть изображение в полном размере">
                        <img src={proImageUrl} alt="Сгенерированное изображение BizAI Pro" className="max-h-96 w-full object-contain bg-black/5" />
                      </button>
                    </div>
                  )}

                  {preview && result && (
                    <div className="mb-4 overflow-hidden rounded-2xl border border-black/[0.06] dark:border-white/[0.07]">
                      {fileType === "video" ? (
                        <video src={preview} controls className="max-h-64 w-full bg-black object-contain" />
                      ) : (
                        <button type="button" onClick={() => openMedia(preview, "image/*")} className="block w-full cursor-zoom-in" title="Открыть изображение в полном размере">
                          <img src={preview} alt="Результат" className="max-h-64 w-full object-contain" />
                        </button>
                      )}
                    </div>
                  )}

                  {result && (
                    <p className="whitespace-pre-line text-sm leading-7">
                      {result}
                    </p>
                  )}
                </div>
              ) : (
                <div className="grid min-h-[390px] place-items-center text-center">
                  <div>
                    <div className="mx-auto grid h-16 w-16 place-items-center rounded-2xl bg-purple-500/10 text-purple-600">
                      <LogoMark size={38} />
                    </div>
                    <p className="mt-5 text-sm font-bold">Здесь появится ваш результат</p>
                    <p className={`mt-2 text-xs ${muted}`}>
                      Заполни форму и нажми «Создать».
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {(result || proImageUrl) && (
            <div className={`rounded-[24px] border p-4 ${panel}`}>
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() =>
                    copyContent(
                      result || "🖼️ Изображение · BizAI Pro",
                      proImageUrl || preview,
                      proImageUrl ? "image/png" : fileType === "image" ? "image/*" : "video/*"
                    )
                  }
                  className="small-btn"
                >
                  <Icon name="copy" size={14} />
                  {copied
                    ? "Скопировано"
                    : proImageUrl
                      ? "Копировать изображение"
                      : preview && fileType === "image"
                        ? "Копировать фото + текст"
                        : "Копировать"}
                </button>
                {result && (
                  <button type="button" onClick={() => setIsEditing((value: boolean) => !value)} className="small-btn">
                    {isEditing ? "Закрыть редактор" : "Редактировать"}
                  </button>
                )}
                <button type="button" onClick={resetGeneration} className="small-btn">
                  Новая генерация
                </button>
              </div>

              {isEditing && result && (
                <div className="mt-3">
                  <textarea
                    value={result}
                    onChange={(event) => setResult(event.target.value)}
                    className="min-h-44 w-full rounded-2xl border border-black/[0.07] bg-transparent p-4 text-sm leading-6 outline-none dark:border-white/[0.07]"
                  />
                  <button type="button" onClick={saveEdited} className="primary-btn mt-2">
                    Сохранить изменения
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function LibraryWorkspace({
  view,
  isDark,
  panel,
  muted,
  filteredHistory,
  search,
  setSearch,
  libraryFilter,
  setLibraryFilter,
  clearHistory,
  toggleFavorite,
  deleteHistoryItem,
  copyText,
  copyContent,
  openMedia,
  openItem,
  onCreate,
}: any) {
  const isFavorites = view === "favorites";

  return (
    <div className="mx-auto max-w-[1220px]">
      <div className="mb-8 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <span className="eyebrow">YOUR LIBRARY</span>
          <h1 className="mt-3 text-4xl font-black tracking-[-0.045em]">
            {isFavorites ? "Избранное" : "Мои работы"}
          </h1>
          <p className={`mt-2 text-sm ${muted}`}>
            {isFavorites
              ? "Работы, которые ты сохранил для быстрого доступа."
              : "Все ваши генерации сохраняются здесь."}
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          <div className={`flex min-w-[230px] items-center gap-2 rounded-2xl border px-3 ${panel}`}>
            <Icon name="search" size={16} />
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Поиск по работам..."
              className="w-full bg-transparent py-3 text-xs outline-none"
            />
          </div>
          <button type="button" onClick={clearHistory} className="small-btn">
            <Icon name="trash" size={14} />
            Очистить
          </button>
        </div>
      </div>

      <div className="mb-5 flex flex-wrap gap-2">
        {["Все", "Тексты", "Изображения", "Видео", "Избранное"].map((filter) => {
          const active = filter === libraryFilter || (isFavorites && filter === "Избранное");
          return (
            <button
              key={filter}
              type="button"
              onClick={() => setLibraryFilter(filter)}
              className={`rounded-full px-3 py-1.5 text-[10px] font-bold transition ${active
                ? "bg-purple-600 text-white shadow-sm"
                : "bg-black/[0.035] text-zinc-500 hover:bg-purple-500/10 dark:bg-white/[0.05] dark:text-zinc-400"
                }`}
            >
              {filter}
            </button>
          );
        })}
      </div>

      {filteredHistory.length === 0 ? (
        <div className={`rounded-[28px] border p-16 text-center ${panel}`}>
          <div className="mx-auto grid h-16 w-16 place-items-center rounded-2xl bg-purple-500/10 text-purple-600">
            <Icon name={isFavorites ? "star" : "grid"} size={25} />
          </div>
          <h3 className="mt-5 font-bold">
            {isFavorites ? "В избранном пока пусто" : "Пока здесь пусто"}
          </h3>
          <p className={`mx-auto mt-2 max-w-sm text-sm ${muted}`}>
            Создай первую работу — она автоматически появится здесь.
          </p>
          <button type="button" onClick={onCreate} className="primary-btn mt-6">
            Создать работу
            <Icon name="arrow" size={15} />
          </button>
        </div>
      ) : (
        <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
          {filteredHistory.map((item: HistoryItem) => (
            <article
              key={item.id}
              className={`group overflow-hidden rounded-[24px] border transition hover:-translate-y-1 hover:shadow-xl ${panel}`}
            >
              {item.mediaUrl ? (
                <div className="relative aspect-[4/3] overflow-hidden bg-black/5">
                  {item.mediaType?.startsWith("video/") ? (
                    <video
                      src={item.mediaUrl}
                      controls
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <button
                      type="button"
                      onClick={() => openMedia(item.mediaUrl, item.mediaType)}
                      className="block h-full w-full cursor-zoom-in"
                      title="Открыть изображение в полном размере"
                    >
                      <img
                        src={item.mediaUrl}
                        alt="Сохранённое изображение"
                        className="h-full w-full object-cover"
                      />
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => toggleFavorite(item.id)}
                    className={`absolute right-3 top-3 grid h-9 w-9 place-items-center rounded-full bg-black/55 backdrop-blur ${item.favorite ? "text-yellow-400" : "text-white"}`}
                  >
                    <Icon name={item.favorite ? "star-filled" : "star"} size={16} />
                  </button>
                </div>
              ) : (
                <div className={`flex aspect-[4/3] items-center justify-center ${isDark ? "bg-white/[0.025]" : "bg-zinc-50"}`}>
                  <div className="max-w-[80%] text-center">
                    <span className="inline-grid h-12 w-12 place-items-center rounded-2xl bg-purple-500/10 text-purple-600">
                      <Icon name="post" size={21} />
                    </span>
                    <p className={`mt-3 line-clamp-4 whitespace-pre-line text-xs leading-5 ${muted}`}>
                      {item.result}
                    </p>
                  </div>
                </div>
              )}

              <div className="p-5">
                <div className="flex items-center justify-between gap-2">
                  <span className="rounded-full bg-purple-500/10 px-2.5 py-1 text-[9px] font-bold uppercase tracking-wider text-purple-600">
                    {item.type}
                  </span>
                  <button
                    type="button"
                    onClick={() => toggleFavorite(item.id)}
                    className={`grid h-8 w-8 place-items-center rounded-full hover:bg-black/[0.04] dark:hover:bg-white/[0.04] ${item.favorite ? "text-yellow-400" : muted}`}
                  >
                    <Icon name={item.favorite ? "star-filled" : "star"} size={15} />
                  </button>
                </div>

                <p className={`mt-3 line-clamp-4 whitespace-pre-line text-xs leading-6 ${muted}`}>
                  {item.result.replace(/^🔥.*?\n\n/, "")}
                </p>

                <div className="mt-4 flex gap-2">
                  <button type="button" onClick={() => openItem(item)} className="small-btn flex-1">
                    Открыть
                  </button>
                  <button type="button" onClick={() => copyContent(item.result, item.mediaUrl, item.mediaType)} className="small-btn" title="Копировать текст и изображение">
                    <Icon name="copy" size={14} />
                  </button>
                  <button type="button" onClick={() => deleteHistoryItem(item.id)} className="small-btn text-red-500">
                    <Icon name="trash" size={14} />
                  </button>
                </div>
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}

function AuthModal({
  authMode,
  authEmail,
  authPassword,
  authLoading,
  authMessage,
  isDark,
  panel,
  muted,
  setAuthMode,
  setAuthEmail,
  setAuthPassword,
  handleLogin,
  handleRegister,
  handleReset,
  setAuthMessage,
}: any) {
  return (
    <div className="fixed inset-0 z-[100] grid place-items-center bg-black/55 p-4 backdrop-blur-md">
      <div className={`w-full max-w-md rounded-[28px] border p-7 shadow-2xl ${panel}`}>
        <div className="flex items-start justify-between gap-4">
          <div>
            <span className="eyebrow">BIZAI ACCOUNT</span>
            <h2 className="mt-2 text-2xl font-bold">
              {authMode === "login"
                ? "С возвращением"
                : authMode === "register"
                  ? "Создай аккаунт"
                  : "Восстановление"}
            </h2>
            <p className={`mt-1 text-xs ${muted}`}>
              {authMode === "login"
                ? "Войди, чтобы продолжить работу."
                : authMode === "register"
                  ? "Сохраняй генерации и работай с историей."
                  : "Мы отправим ссылку на email."}
            </p>
          </div>
          <button type="button" onClick={() => setAuthMode(null)} className="icon-btn">
            <Icon name="close" />
          </button>
        </div>

        <div className="mt-6 space-y-4">
          <div>
            <label className="label">Email</label>
            <input
              value={authEmail}
              onChange={(event) => setAuthEmail(event.target.value)}
              type="email"
              className="input mt-2"
              placeholder="you@example.com"
            />
          </div>

          {authMode !== "reset" && (
            <div>
              <label className="label">Пароль</label>
              <input
                value={authPassword}
                onChange={(event) => setAuthPassword(event.target.value)}
                type="password"
                className="input mt-2"
                placeholder="••••••••"
              />
            </div>
          )}
        </div>

        <button
          type="button"
          disabled={authLoading}
          onClick={
            authMode === "login"
              ? handleLogin
              : authMode === "register"
                ? handleRegister
                : handleReset
          }
          className="primary-btn mt-5 w-full justify-center disabled:opacity-50"
        >
          {authLoading
            ? "Обрабатываем..."
            : authMode === "login"
              ? "Войти"
              : authMode === "register"
                ? "Создать аккаунт"
                : "Отправить ссылку"}
        </button>

        {authMessage && (
          <p className={`mt-4 rounded-2xl bg-purple-500/10 p-3 text-center text-xs ${muted}`}>
            {authMessage}
          </p>
        )}

        <div className="mt-5 flex justify-center gap-2 text-xs">
          <span className={muted}>
            {authMode === "login" ? "Нет аккаунта?" : "Уже есть аккаунт?"}
          </span>
          <button
            type="button"
            onClick={() => {
              setAuthMessage("");
              setAuthMode(authMode === "login" ? "register" : "login");
            }}
            className="font-semibold text-purple-600"
          >
            {authMode === "login" ? "Регистрация" : "Войти"}
          </button>
        </div>

        {authMode === "login" && (
          <button
            type="button"
            onClick={() => {
              setAuthMessage("");
              setAuthMode("reset");
            }}
            className={`mt-3 block w-full text-center text-xs ${muted} hover:text-purple-600`}
          >
            Забыли пароль?
          </button>
        )}
      </div>
    </div>
  );
}

function ProModal({
  panel,
  muted,
  userEmail,
  close,
  login,
}: {
  isDark: boolean;
  panel: string;
  muted: string;
  userEmail: string | null;
  close: () => void;
  login: () => void;
}) {
  return (
    <div className="fixed inset-0 z-[90] grid place-items-center bg-black/55 p-4 backdrop-blur-md">
      <div className={`w-full max-w-lg overflow-hidden rounded-[30px] border shadow-2xl ${panel}`}>
        <div className="bg-gradient-to-br from-purple-600 to-fuchsia-500 p-7 text-white">
          <span className="text-xs font-bold uppercase tracking-[.2em]">BizAI Pro</span>
          <h2 className="mt-3 text-3xl font-black">
            Больше возможностей.
            <br />
            Больше контента.
          </h2>
          <p className="mt-2 max-w-sm text-sm text-white/75">
            Расширенные лимиты и функции для регулярной работы.
          </p>
        </div>

        <div className="p-7">
          <div className="flex items-end gap-2">
            <b className="text-4xl">$4.99</b>
            <span className={`text-sm line-through ${muted}`}>$6.99</span>
            <span className={`text-xs ${muted}`}>первый месяц</span>
          </div>
          <p className={`mt-2 text-xs ${muted}`}>
            После первого месяца — $6.99/месяц.
          </p>

          <ul className={`mt-6 space-y-3 text-sm ${muted}`}>
            <li>✓ Больше генераций</li>
            <li>✓ Генерация рекламных изображений</li>
            <li>✓ Контент-пакеты для бизнеса</li>
            <li>✓ Контент-планы и рекламные кампании</li>
            <li>✓ Brand Kit для фирменного стиля</li>
            <li>✓ Работа с изображениями и видео</li>
          </ul>

          <button
            type="button"
            onClick={() => {
              if (!userEmail) {
                login();
                return;
              }

              close();
            }}
            className="primary-btn mt-7 w-full justify-center"
          >
            {userEmail ? "Продолжить" : "Войти и продолжить"}
          </button>

          <button
            type="button"
            onClick={close}
            className="mt-2 w-full py-3 text-xs font-medium opacity-60"
          >
            Позже
          </button>
        </div>
      </div>
    </div>
  );
}
function ProfilePage({ userEmail, subscriptionPlan, subscriptionStatus, generationsLeft, theme, setView, logout, setAuthMode }: { userEmail: string | null; subscriptionPlan: string; subscriptionStatus: string; generationsLeft: number; theme: "light" | "dark"; setView: (v: View) => void; logout: () => void; setAuthMode: (v: AuthMode) => void }) {
  const isDark = theme === "dark";
  const card = isDark ? "border-white/[.08] bg-[#111116]" : "border-[#e6e4ec] bg-white";
  const sub = isDark ? "bg-white/[.045] text-zinc-200" : "bg-[#f6f5f8] text-zinc-800";
  const muted = isDark ? "text-zinc-400" : "text-zinc-500";
  const isPro = subscriptionPlan === "pro";

  return (
    <div className="mx-auto max-w-4xl">
      <span className="eyebrow">ACCOUNT</span>
      <h1 className="mt-3 text-4xl font-bold tracking-[-.04em]">Профиль</h1>
      <p className={`mt-2 text-sm ${muted}`}>
        Управляйте аккаунтом, тарифом и настройками BizAI в одном месте.
      </p>
      <div className="mt-8 grid gap-5 md:grid-cols-[1.2fr_.8fr]">
        <div className={`rounded-[28px] border p-7 ${card}`}>
          <div className="flex items-center gap-5">
            <div className="grid h-20 w-20 place-items-center rounded-[24px] bg-gradient-to-br from-purple-500 to-fuchsia-500 text-2xl font-bold text-white">
              {userEmail ? userEmail[0].toUpperCase() : "?"}
            </div>
            <div>
              <h2 className="text-xl font-semibold">{userEmail || "Гость"}</h2>
              <p className={`mt-1 text-sm ${muted}`}>{userEmail ? "Ваш аккаунт BizAI" : "Войдите, чтобы сохранять работы"}</p>
            </div>
          </div>

          <div className="mt-8 grid gap-3 sm:grid-cols-2">
            <div className={`rounded-2xl p-4 ${sub}`}>
              <p className={`text-[10px] uppercase tracking-wider ${muted}`}>Тариф</p>
              <p className="mt-2 text-sm font-semibold">{isPro ? "BizAI Pro" : "Free"}</p>
            </div>
            <div className={`rounded-2xl p-4 ${sub}`}>
              <p className={`text-[10px] uppercase tracking-wider ${muted}`}>Статус</p>
              <p className="mt-2 text-sm font-semibold">{userEmail ? subscriptionStatus : "Не выполнен вход"}</p>
            </div>
          </div>

          {userEmail ? (
            <button onClick={logout} className="mt-6 flex items-center gap-2 text-xs font-semibold text-red-500">
              <Icon name="logout" size={15} />Выйти из аккаунта
            </button>
          ) : (
            <button onClick={() => setAuthMode("login")} className="primary-btn mt-6">Войти в BizAI</button>
          )}
        </div>

        <div className="space-y-5">
          <div className={`rounded-[28px] border p-6 ${card}`}>
            <p className="text-[10px] font-bold uppercase tracking-wider text-purple-600">Лимит</p>
            <div className="mt-3 flex items-end gap-2"><b className="text-4xl">{generationsLeft}</b><span className={`pb-1 text-xs ${muted}`}>генераций осталось</span></div>
            <div className={`mt-4 h-2 overflow-hidden rounded-full ${isDark ? "bg-white/5" : "bg-black/5"}`}>
              <div className="h-full rounded-full bg-gradient-to-r from-purple-500 to-fuchsia-500" style={{ width: `${Math.min(100, (generationsLeft / 5) * 100)}%` }} />
            </div>
            <button onClick={() => setView("settings")} className="small-btn mt-5 w-full">Настройки аккаунта</button>
          </div>

          <div className={`rounded-[28px] border p-6 ${isDark ? "border-purple-400/15 bg-gradient-to-br from-purple-500/10 to-fuchsia-500/[.03]" : "border-purple-200 bg-gradient-to-br from-purple-50 to-fuchsia-50"}`}>
            <div className="grid h-10 w-10 place-items-center rounded-xl bg-purple-500/10 text-purple-600"><LogoMark size={22} /></div>
            <h3 className="mt-3 font-semibold">BizAI Pro</h3>
            <p className={`mt-1 text-xs leading-5 ${muted}`}>Расширенные лимиты и возможности для бизнеса.</p>
            <button onClick={() => setView("create")} className="small-btn mt-4">Вернуться к работе</button>
          </div>
        </div>
      </div>
    </div>
  );
}

function SettingsPage({ theme, setTheme, userEmail, setView }: { theme: "light" | "dark"; setTheme: (v: "light" | "dark") => void; userEmail: string | null; setView: (v: View) => void }) {
  const isDark = theme === "dark";
  const card = isDark ? "border-white/[.08] bg-[#111116]" : "border-[#e6e4ec] bg-white";
  const muted = isDark ? "text-zinc-400" : "text-zinc-500";

  return (
    <div className="mx-auto max-w-4xl">
      <span className="eyebrow">PREFERENCES</span>
      <h1 className="mt-3 text-4xl font-bold tracking-[-.04em]">Настройки</h1>
      <p className={`mt-2 text-sm ${muted}`}>Настрой BizAI под себя. Изменения сохраняются автоматически.</p>

      <div className="mt-8 space-y-5">
        <div className={`rounded-[28px] border p-6 ${card}`}>
          <div className="flex items-center gap-3">
            <div className="grid h-11 w-11 place-items-center rounded-2xl bg-purple-500/10 text-purple-600"><Icon name={isDark ? "moon" : "sun"} /></div>
            <div>
              <h2 className="font-semibold">Внешний вид</h2>
              <p className={`mt-1 text-xs ${muted}`}>Выбери, как BizAI должен выглядеть.</p>
            </div>
          </div>

          <div className="mt-5 grid gap-4 md:grid-cols-2">
            <button type="button" onClick={() => setTheme("light")} className={`group rounded-2xl border p-4 text-left transition ${!isDark ? "border-purple-400 bg-purple-500/[.06] shadow-[0_12px_35px_rgba(124,58,237,.10)]" : "border-black/[.08] bg-white hover:border-purple-200"}`}>
              <div className="mb-4 overflow-hidden rounded-xl border border-zinc-200 bg-[#f7f7f9] p-2">
                <div className="flex items-center gap-1.5 rounded-lg bg-white px-2 py-1.5 shadow-sm"><span className="h-2 w-2 rounded-full bg-purple-500" /><span className="h-1.5 w-20 rounded-full bg-zinc-200" /><span className="ml-auto h-5 w-5 rounded-full bg-purple-500/15" /></div>
                <div className="mt-2 grid grid-cols-[.7fr_1.3fr] gap-2"><div className="h-16 rounded-lg bg-white shadow-sm" /><div className="h-16 rounded-lg bg-white shadow-sm" /></div>
              </div>
              <div className="flex items-center gap-2"><div className="grid h-8 w-8 place-items-center rounded-lg bg-amber-100 text-amber-600"><Icon name="sun" size={15} /></div><div><b className="text-sm">Светлая</b><p className={`mt-0.5 text-[10px] ${muted}`}>Чистая, мягкая и светлая</p></div></div>
              {!isDark && <span className="mt-3 inline-flex rounded-full bg-purple-600 px-2.5 py-1 text-[9px] font-bold text-white">Сейчас используется</span>}
            </button>

            <button type="button" onClick={() => setTheme("dark")} className={`group rounded-2xl border p-4 text-left transition ${isDark ? "border-purple-400 bg-purple-500/[.08] shadow-[0_12px_35px_rgba(124,58,237,.14)]" : "border-zinc-200 bg-[#fafafa] hover:border-purple-200"}`}>
              <div className="mb-4 overflow-hidden rounded-xl border border-zinc-800 bg-[#0b0b0f] p-2">
                <div className="flex items-center gap-1.5 rounded-lg bg-[#15151b] px-2 py-1.5"><span className="h-2 w-2 rounded-full bg-purple-500" /><span className="h-1.5 w-20 rounded-full bg-zinc-700" /><span className="ml-auto h-5 w-5 rounded-full bg-purple-500/20" /></div>
                <div className="mt-2 grid grid-cols-[.7fr_1.3fr] gap-2"><div className="h-16 rounded-lg bg-[#15151b]" /><div className="h-16 rounded-lg bg-[#15151b]" /></div>
              </div>
              <div className="flex items-center gap-2"><div className="grid h-8 w-8 place-items-center rounded-lg bg-indigo-100 text-indigo-600"><Icon name="moon" size={15} /></div><div><b className="text-sm">Тёмная</b><p className={`mt-0.5 text-[10px] ${muted}`}>Глубокая, контрастная и спокойная</p></div></div>
              {isDark && <span className="mt-3 inline-flex rounded-full bg-purple-600 px-2.5 py-1 text-[9px] font-bold text-white">Сейчас используется</span>}
            </button>
          </div>
        </div>

        <div className={`rounded-[28px] border p-6 ${card}`}>
          <h2 className="font-semibold">Аккаунт</h2>
          <p className={`mt-1 text-xs ${muted}`}>{userEmail || "Вы не вошли в аккаунт."}</p>
          <button onClick={() => setView("profile")} className="small-btn mt-5">Открыть профиль</button>
        </div>

        <div className={`rounded-[28px] border p-6 ${card}`}>
          <h2 className="font-semibold">Приватность и данные</h2>
          <p className={`mt-2 max-w-2xl text-xs leading-5 ${muted}`}>
            История генераций хранится в вашем аккаунте и доступна только вам.
            Загруженные изображения и видео сохраняются в приватном хранилище
            проекта и используются для генерации и просмотра ваших работ.
          </p>
        </div>
      </div>
    </div>
  );
}