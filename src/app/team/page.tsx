"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { supabase } from "../lib/supabase";

type Team = { id: string; owner_id: string; name: string; created_at: string };
type TeamMember = { user_id: string; team_id: string; email: string; role: "owner" | "admin" | "member"; joined_at: string };
type TeamInvite = { id: number; token: string; status: string; created_at: string; expires_at: string };
type BrandKit = { name: string; audience: string; tone: string; colors: string; website: string };
type TeamAsset = { id: number; kind: "text" | "image" | "video"; title: string; content: string; created_by: string; created_at: string };

const emptyKit: BrandKit = { name: "", audience: "", tone: "", colors: "", website: "" };
const formatDate = (value: string) => new Date(value).toLocaleDateString("ru-RU", { day: "numeric", month: "long", year: "numeric" });

export default function BusinessTeamPage() {
  const [loading, setLoading] = useState(true);
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [businessActive, setBusinessActive] = useState(false);
  const [subscriptionExpiresAt, setSubscriptionExpiresAt] = useState<string | null>(null);
  const [team, setTeam] = useState<Team | null>(null);
  const [members, setMembers] = useState<TeamMember[]>([]);
  const [invites, setInvites] = useState<TeamInvite[]>([]);
  const [assets, setAssets] = useState<TeamAsset[]>([]);
  const [brandKit, setBrandKit] = useState<BrandKit>(emptyKit);
  const [teamName, setTeamName] = useState("");
  const [inviteUrl, setInviteUrl] = useState("");
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState("");
  const [noticeError, setNoticeError] = useState(false);
  const [copiedAssetId, setCopiedAssetId] = useState<number | null>(null);

  useEffect(() => {
    void loadWorkspace();
  }, []);

  const showNotice = (text: string, isError = false) => {
    setNotice(text);
    setNoticeError(isError);
  };

  const loadWorkspace = async () => {
    setLoading(true);
    const { data: userData, error: authError } = await supabase.auth.getUser();
    const user = userData.user;
    if (authError || !user) {
      setUserEmail(null);
      setLoading(false);
      return;
    }

    setUserEmail(user.email ?? null);
    setCurrentUserId(user.id);
    const { data: subscription } = await supabase
      .from("subscriptions")
      .select("plan,status,expires_at")
      .eq("user_id", user.id)
      .maybeSingle();
    const expiresAt = subscription?.expires_at ?? null;
    const expiryOkay = !expiresAt || new Date(expiresAt).getTime() > Date.now();
    const hasBusiness = subscription?.plan === "business" && subscription?.status === "active" && expiryOkay;
    setBusinessActive(Boolean(hasBusiness));
    setSubscriptionExpiresAt(expiresAt);

    const params = new URLSearchParams(window.location.search);
    const inviteCode = params.get("invite");
    if (inviteCode) {
      const { data: accepted, error: acceptError } = await supabase.rpc("accept_business_invite", { p_token: inviteCode });
      if (acceptError) {
        showNotice(acceptError.message || "Не удалось принять приглашение.", true);
      } else if (accepted === true) {
        showNotice("Приглашение принято. Ты добавлен в рабочую команду.");
        window.history.replaceState({}, "", "/team");
      }
    }

    const { data: membership, error: membershipError } = await supabase
      .from("business_team_members")
      .select("team_id,role")
      .eq("user_id", user.id)
      .maybeSingle();

    if (membershipError) {
      console.error("Business membership load error:", membershipError);
      showNotice("Таблицы Business ещё не настроены. Сначала выполни SQL-файл 20261009_business_plan.sql в Supabase.", true);
      setLoading(false);
      return;
    }

    if (!membership?.team_id) {
      setTeam(null);
      setMembers([]);
      setInvites([]);
      setAssets([]);
      setBrandKit(emptyKit);
      setLoading(false);
      return;
    }

    const teamId = membership.team_id as string;
    const [teamResult, memberResult, inviteResult, kitResult, assetResult] = await Promise.all([
      supabase.from("business_teams").select("id,owner_id,name,created_at").eq("id", teamId).maybeSingle(),
      supabase.from("business_team_members").select("user_id,team_id,email,role,joined_at").eq("team_id", teamId).order("joined_at", { ascending: true }),
      supabase.from("business_team_invites").select("id,token,status,created_at,expires_at").eq("team_id", teamId).eq("status", "active").order("created_at", { ascending: false }),
      supabase.from("business_team_brand_kit").select("name,audience,tone,colors,website").eq("team_id", teamId).maybeSingle(),
      supabase.from("business_team_assets").select("id,kind,title,content,created_by,created_at").eq("team_id", teamId).order("created_at", { ascending: false }).limit(50),
    ]);

    if (teamResult.error) console.error("Business team load error:", teamResult.error);
    if (!teamResult.data) {
      setTeam(null);
      if (!hasBusiness) showNotice("Подписка Business владельца не активна или истекла. Доступ к общей команде приостановлен.", true);
      setLoading(false);
      return;
    }
    setTeam(teamResult.data as Team);
    setMembers((memberResult.data ?? []) as TeamMember[]);
    setInvites((inviteResult.data ?? []) as TeamInvite[]);
    setAssets((assetResult.data ?? []) as TeamAsset[]);
    setBrandKit({
      name: kitResult.data?.name ?? "",
      audience: kitResult.data?.audience ?? "",
      tone: kitResult.data?.tone ?? "",
      colors: kitResult.data?.colors ?? "",
      website: kitResult.data?.website ?? "",
    });
    setLoading(false);
  };

  const ownRole = members.find((member) => member.user_id === currentUserId)?.role;
  const isOwner = ownRole === "owner";
  const canInvite = isOwner && members.length < 5;
  const teamInviteLink = useMemo(() => inviteUrl, [inviteUrl]);

  const createTeam = async () => {
    if (teamName.trim().length < 2) {
      showNotice("Укажи название команды (не менее 2 символов).", true);
      return;
    }
    setBusy(true);
    const { error } = await supabase.rpc("create_business_team", { p_name: teamName.trim() });
    setBusy(false);
    if (error) {
      showNotice(error.message || "Не удалось создать команду.", true);
      return;
    }
    setTeamName("");
    showNotice("Рабочее пространство создано.");
    await loadWorkspace();
  };

  const createInvite = async () => {
    setBusy(true);
    const { data, error } = await supabase.rpc("create_business_invite", { p_expires_days: 7 });
    setBusy(false);
    if (error) {
      showNotice(error.message || "Не удалось создать приглашение.", true);
      return;
    }
    const token = String(data);
    const url = `${window.location.origin}/team?invite=${encodeURIComponent(token)}`;
    setInviteUrl(url);
    showNotice("Приглашение создано. Скопируй ссылку и отправь участнику.");
    await loadWorkspace();
  };

  const copyInvite = async () => {
    if (!teamInviteLink) return;
    try {
      await navigator.clipboard.writeText(teamInviteLink);
      showNotice("Ссылка приглашения скопирована.");
    } catch {
      showNotice("Не удалось скопировать автоматически. Выдели ссылку и скопируй её вручную.", true);
    }
  };

  const cancelInvite = async (token: string) => {
    setBusy(true);
    const { error } = await supabase.rpc("cancel_business_invite", { p_token: token });
    setBusy(false);
    if (error) showNotice(error.message || "Не удалось отменить приглашение.", true);
    else {
      setInviteUrl("");
      showNotice("Приглашение отменено.");
      await loadWorkspace();
    }
  };

  const removeMember = async (member: TeamMember) => {
    if (!window.confirm(`Удалить ${member.email} из команды?`)) return;
    setBusy(true);
    const { error } = await supabase.rpc("remove_business_member", { p_member_user_id: member.user_id });
    setBusy(false);
    if (error) showNotice(error.message || "Не удалось удалить участника.", true);
    else {
      showNotice("Участник удалён из команды.");
      await loadWorkspace();
    }
  };

  const saveSharedKit = async () => {
    setBusy(true);
    const { error } = await supabase.rpc("upsert_business_brand_kit", {
      p_name: brandKit.name,
      p_audience: brandKit.audience,
      p_tone: brandKit.tone,
      p_colors: brandKit.colors,
      p_website: brandKit.website,
    });
    setBusy(false);
    if (error) showNotice(error.message || "Не удалось сохранить общий Brand Kit.", true);
    else showNotice("Общий Brand Kit сохранён для команды.");
  };

  const copyAsset = async (asset: TeamAsset) => {
    try {
      await navigator.clipboard.writeText(asset.content);
      setCopiedAssetId(asset.id);
      showNotice("Материал скопирован.");
      window.setTimeout(() => setCopiedAssetId(null), 1500);
    } catch {
      showNotice("Не удалось скопировать материал.", true);
    }
  };

  if (loading) {
    return <main className="min-h-screen bg-[#f7f7f8] px-5 py-24 text-center text-zinc-950 dark:bg-[#09090b] dark:text-white"><div className="mx-auto h-10 w-10 animate-spin rounded-full border-2 border-zinc-300 border-t-purple-600" /><p className="mt-4 text-sm text-zinc-500">Загружаем Business Workspace…</p></main>;
  }

  if (!userEmail) {
    return (
      <main className="min-h-screen bg-[#f7f7f8] px-5 py-20 text-zinc-950 dark:bg-[#09090b] dark:text-white">
        <div className="mx-auto max-w-xl rounded-3xl border border-black/[0.07] bg-white p-8 text-center dark:border-white/[0.08] dark:bg-[#101014]">
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-purple-600">BIZAI BUSINESS</p>
          <h1 className="mt-3 text-3xl font-black">Рабочее пространство</h1>
          <p className="mt-3 text-sm leading-6 text-zinc-500 dark:text-zinc-400">Войди в аккаунт BizAI, чтобы создать команду или принять приглашение.</p>
          <Link href="/" className="mt-6 inline-flex rounded-xl bg-gradient-to-r from-purple-600 to-fuchsia-600 px-5 py-3 text-sm font-bold text-white">Перейти в BizAI и войти</Link>
        </div>
      </main>
    );
  }

  if (!team && !businessActive) {
    return (
      <main className="min-h-screen bg-[#f7f7f8] px-5 py-16 text-zinc-950 dark:bg-[#09090b] dark:text-white">
        <div className="mx-auto max-w-2xl rounded-3xl border border-black/[0.07] bg-white p-8 text-center dark:border-white/[0.08] dark:bg-[#101014] sm:p-10">
          <span className="text-4xl">♛</span>
          <p className="mt-4 text-xs font-bold uppercase tracking-[0.2em] text-purple-600">BIZAI BUSINESS</p>
          <h1 className="mt-3 text-3xl font-black">Команда и общие материалы</h1>
          <p className="mt-4 text-sm leading-6 text-zinc-500 dark:text-zinc-400">Business Workspace позволяет работать в команде до 5 участников, использовать общий Brand Kit и хранить общие AI-материалы. Рабочее пространство доступно при активном тарифе Business.</p>
          {notice && <p className="mt-4 rounded-xl border border-amber-500/20 bg-amber-500/10 p-3 text-sm text-amber-700 dark:text-amber-200">{notice}</p>}
          <div className="mt-6 flex flex-wrap justify-center gap-3">
            <Link href="/pricing" className="rounded-xl bg-gradient-to-r from-purple-600 to-fuchsia-600 px-5 py-3 text-sm font-bold text-white">Посмотреть тарифы</Link>
            <Link href="/" className="rounded-xl border border-black/[0.1] px-5 py-3 text-sm font-semibold dark:border-white/[0.1]">← В BizAI</Link>
          </div>
          <p className="mt-5 text-xs leading-5 text-zinc-400">Выбор тарифа на странице тарифов пока не списывает деньги и не включает Business автоматически.</p>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#f7f7f8] text-zinc-950 dark:bg-[#09090b] dark:text-white">
      <header className="sticky top-0 z-30 border-b border-black/[0.06] bg-white/85 backdrop-blur-2xl dark:border-white/[0.07] dark:bg-[#0b0b0dcc]">
        <div className="mx-auto flex h-[68px] max-w-6xl items-center justify-between px-5 sm:px-8">
          <Link href="/" className="flex items-center gap-3 font-bold tracking-tight"><span className="grid h-9 w-9 place-items-center rounded-xl bg-gradient-to-br from-purple-500 to-fuchsia-500 text-sm font-bold text-white">B</span><span className="text-lg">BizAI</span></Link>
          <div className="flex items-center gap-2"><Link href="/pricing" className="rounded-xl px-3 py-2 text-sm text-zinc-500 transition hover:text-purple-600 dark:text-zinc-400">Тарифы</Link><Link href="/" className="rounded-xl border border-black/[0.08] px-4 py-2 text-sm font-medium transition hover:bg-black/[0.04] dark:border-white/[0.1] dark:hover:bg-white/[0.05]">← В BizAI</Link></div>
        </div>
      </header>

      <section className="mx-auto max-w-6xl px-4 py-8 sm:px-8 sm:py-12">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div><p className="text-xs font-bold uppercase tracking-[0.2em] text-purple-600">BIZAI BUSINESS</p><h1 className="mt-3 text-4xl font-black tracking-[-0.04em] sm:text-5xl">{team?.name || "Рабочее пространство"}</h1><p className="mt-3 max-w-2xl text-sm leading-6 text-zinc-500 dark:text-zinc-400">Команда до 5 человек, общий Brand Kit и единая библиотека контента, который создают участники.</p></div>
          <div className="rounded-2xl border border-purple-500/20 bg-purple-500/[0.06] px-4 py-3"><p className="text-xs font-semibold text-purple-700 dark:text-purple-300">Тариф Business</p><p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">{subscriptionExpiresAt ? `До ${formatDate(subscriptionExpiresAt)}` : "Активная подписка"}</p></div>
        </div>

        {notice && <div role="status" className={`mt-6 rounded-2xl border px-4 py-3 text-sm leading-6 ${noticeError ? "border-red-300 bg-red-50 text-red-700 dark:border-red-500/20 dark:bg-red-500/10 dark:text-red-200" : "border-purple-500/20 bg-purple-500/[0.07] text-zinc-700 dark:text-zinc-200"}`}>{notice}</div>}

        {!team ? (
          <div className="mx-auto mt-8 max-w-xl rounded-3xl border border-black/[0.07] bg-white p-7 dark:border-white/[0.08] dark:bg-[#101014]">
            <h2 className="text-2xl font-bold">Создать команду</h2><p className="mt-2 text-sm leading-6 text-zinc-500 dark:text-zinc-400">После создания ты станешь владельцем, сможешь приглашать до 4 участников и делиться Brand Kit и материалами.</p>
            <label className="mt-5 block text-sm font-semibold" htmlFor="teamName">Название команды</label>
            <input id="teamName" value={teamName} onChange={(event) => setTeamName(event.target.value)} maxLength={80} placeholder="Например, Marketing Studio" className="mt-2 w-full rounded-xl border border-black/[0.1] bg-transparent px-4 py-3 text-sm outline-none focus:border-purple-500 dark:border-white/[0.12]" />
            <button type="button" disabled={busy} onClick={createTeam} className="mt-4 w-full rounded-xl bg-gradient-to-r from-purple-600 to-fuchsia-600 px-5 py-3 text-sm font-bold text-white disabled:opacity-50">{busy ? "Создаём…" : "Создать рабочее пространство"}</button>
          </div>
        ) : (
          <>
            <div className="mt-8 grid gap-4 md:grid-cols-3">
              <div className="rounded-3xl border border-black/[0.07] bg-white p-5 dark:border-white/[0.08] dark:bg-[#101014]"><p className="text-sm text-zinc-500 dark:text-zinc-400">Участники</p><p className="mt-2 text-3xl font-black">{members.length} <span className="text-base font-medium text-zinc-400">/ 5</span></p><p className="mt-2 text-xs text-zinc-400">Владелец + до 4 коллег</p></div>
              <div className="rounded-3xl border border-black/[0.07] bg-white p-5 dark:border-white/[0.08] dark:bg-[#101014]"><p className="text-sm text-zinc-500 dark:text-zinc-400">Общая библиотека</p><p className="mt-2 text-3xl font-black">{assets.length}</p><p className="mt-2 text-xs text-zinc-400">Последние 50 материалов команды</p></div>
              <div className="rounded-3xl border border-black/[0.07] bg-white p-5 dark:border-white/[0.08] dark:bg-[#101014]"><p className="text-sm text-zinc-500 dark:text-zinc-400">Приглашения</p><p className="mt-2 text-3xl font-black">{invites.length}</p><p className="mt-2 text-xs text-zinc-400">Активные ссылки на 7 дней</p></div>
            </div>

            <div className="mt-6 grid gap-6 lg:grid-cols-[0.9fr_1.1fr]">
              <section className="rounded-3xl border border-black/[0.07] bg-white p-6 dark:border-white/[0.08] dark:bg-[#101014]">
                <div className="flex items-start justify-between gap-3"><div><h2 className="text-xl font-bold">Команда</h2><p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">Участники и роли доступа</p></div><span className="rounded-full bg-purple-500/10 px-3 py-1 text-xs font-bold text-purple-700 dark:text-purple-300">{members.length}/5</span></div>
                <div className="mt-5 space-y-3">
                  {members.map((member) => <div key={member.user_id} className="flex items-center gap-3 rounded-2xl border border-black/[0.06] p-3 dark:border-white/[0.07]"><div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-gradient-to-br from-purple-500 to-fuchsia-500 text-sm font-bold text-white">{(member.email || "?")[0].toUpperCase()}</div><div className="min-w-0 flex-1"><p className="truncate text-sm font-semibold">{member.email || "Участник BizAI"}</p><p className="mt-1 text-xs text-zinc-400">{member.role === "owner" ? "Владелец" : member.role === "admin" ? "Администратор" : "Участник"}</p></div>{isOwner && member.role !== "owner" && <button type="button" disabled={busy} onClick={() => removeMember(member)} className="rounded-lg px-2 py-1 text-xs font-semibold text-red-500 hover:bg-red-500/10 disabled:opacity-50">Удалить</button>}</div>)}
                </div>
                <div className="mt-5 border-t border-black/[0.06] pt-5 dark:border-white/[0.07]">
                  <div className="flex items-center justify-between gap-3"><div><p className="text-sm font-semibold">Пригласить участника</p><p className="mt-1 text-xs leading-5 text-zinc-400">Ссылка действует 7 дней и предназначена для одного входа.</p></div><button type="button" onClick={createInvite} disabled={!canInvite || busy} className="shrink-0 rounded-xl bg-gradient-to-r from-purple-600 to-fuchsia-600 px-4 py-2.5 text-xs font-bold text-white disabled:cursor-not-allowed disabled:opacity-40">Создать ссылку</button></div>
                  {!isOwner && <p className="mt-3 text-xs text-zinc-400">Создавать приглашения может только владелец команды.</p>}
                  {members.length >= 5 && <p className="mt-3 text-xs text-amber-600">Все места в команде заняты.</p>}
                  {teamInviteLink && <div className="mt-4 rounded-xl border border-purple-500/20 bg-purple-500/[0.05] p-3"><p className="break-all text-xs leading-5">{teamInviteLink}</p><button type="button" onClick={copyInvite} className="mt-3 rounded-lg bg-purple-600 px-3 py-2 text-xs font-semibold text-white">Скопировать ссылку</button></div>}
                  {invites.length > 0 && <div className="mt-4 space-y-2">{invites.map((invite) => <div key={invite.id} className="flex items-center gap-2 rounded-xl bg-black/[0.025] p-3 dark:bg-white/[0.035]"><div className="min-w-0 flex-1"><p className="truncate text-xs font-semibold">Приглашение · {invite.token.slice(0, 8)}…</p><p className="mt-1 text-[10px] text-zinc-400">До {formatDate(invite.expires_at)}</p></div>{isOwner && <button type="button" disabled={busy} onClick={() => cancelInvite(invite.token)} className="text-xs font-semibold text-red-500">Отменить</button>}</div>)}</div>}
                </div>
              </section>

              <section className="rounded-3xl border border-black/[0.07] bg-white p-6 dark:border-white/[0.08] dark:bg-[#101014]">
                <div><h2 className="text-xl font-bold">Общий Brand Kit</h2><p className="mt-1 text-sm leading-6 text-zinc-500 dark:text-zinc-400">Единые данные бренда для участников команды. При следующей загрузке они подставятся в BizAI.</p></div>
                <div className="mt-5 grid gap-4 sm:grid-cols-2">
                  {([["name", "Название бизнеса", "Например: Coffee Studio"], ["audience", "Целевая аудитория", "Например: молодые предприниматели"], ["tone", "Фирменный тон", "Например: уверенный и дружелюбный"], ["colors", "Фирменные цвета", "Например: чёрный и фиолетовый"], ["website", "Сайт / ссылка", "https://example.com"]] as const).map(([key, label, placeholder]) => <label key={key} className={key === "website" ? "sm:col-span-2" : ""}><span className="block text-xs font-semibold">{label}</span><input value={brandKit[key]} onChange={(event) => setBrandKit((prev) => ({ ...prev, [key]: event.target.value }))} placeholder={placeholder} maxLength={500} className="mt-2 w-full rounded-xl border border-black/[0.1] bg-transparent px-3 py-2.5 text-sm outline-none focus:border-purple-500 dark:border-white/[0.12]" /></label>)}
                </div>
                <button type="button" onClick={saveSharedKit} disabled={busy} className="mt-5 rounded-xl bg-gradient-to-r from-purple-600 to-fuchsia-600 px-5 py-3 text-sm font-bold text-white disabled:opacity-50">{busy ? "Сохраняем…" : "Сохранить общий Brand Kit"}</button>
              </section>
            </div>

            <section className="mt-6 rounded-3xl border border-black/[0.07] bg-white p-6 dark:border-white/[0.08] dark:bg-[#101014]">
              <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between"><div><h2 className="text-xl font-bold">Общая библиотека</h2><p className="mt-1 text-sm leading-6 text-zinc-500 dark:text-zinc-400">Текстовые результаты и описания изображений, автоматически сохранённые из генераций участников.</p></div><button type="button" onClick={loadWorkspace} className="rounded-xl border border-black/[0.1] px-4 py-2 text-xs font-semibold dark:border-white/[0.1]">Обновить</button></div>
              {assets.length === 0 ? <div className="mt-5 rounded-2xl border border-dashed border-black/[0.1] p-8 text-center text-sm text-zinc-400 dark:border-white/[0.1]">Пока нет материалов. Создай генерацию в BizAI — она появится здесь, если аккаунт состоит в Business-команде.</div> : <div className="mt-5 grid gap-3 md:grid-cols-2">{assets.map((asset) => <article key={asset.id} className="rounded-2xl border border-black/[0.06] p-4 dark:border-white/[0.07]"><div className="flex items-start justify-between gap-3"><div className="min-w-0"><p className="text-[10px] font-bold uppercase tracking-wider text-purple-600">{asset.kind === "image" ? "Изображение / описание" : asset.kind === "video" ? "Видео / описание" : "Текст"}</p><h3 className="mt-2 line-clamp-2 text-sm font-semibold">{asset.title}</h3><p className="mt-1 text-[10px] text-zinc-400">{formatDate(asset.created_at)}</p></div><button type="button" onClick={() => copyAsset(asset)} className="shrink-0 rounded-lg border border-black/[0.08] px-3 py-2 text-xs font-semibold dark:border-white/[0.1]">{copiedAssetId === asset.id ? "Скопировано" : "Копировать"}</button></div><p className="mt-3 whitespace-pre-wrap break-words text-xs leading-5 text-zinc-500 dark:text-zinc-400">{asset.content.slice(0, 700)}{asset.content.length > 700 ? "…" : ""}</p></article>)}</div>}
            </section>
          </>
        )}
      </section>
    </main>
  );
}
