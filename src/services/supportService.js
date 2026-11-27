import { supabase } from "../lib/supabaseClient";

const TICKET_FIELDS =
  "id, created_by, requester_role, category, subject, status, priority, created_at, updated_at";
const MESSAGE_FIELDS = "id, ticket_id, sender_id, body, is_read, created_at";
const IN_CHUNK = 100;

// الأدمن بس هو اللي بيعدّل التذكرة، وفي عمودين بس
const UPDATABLE_TICKET_FIELDS = ["status", "priority"];

function escapeLike(term) {
  return term.replace(/[\\%_]/g, "\\$&");
}

// بيانات أصحاب التذاكر من profiles (لو مفيش صلاحية بنكمل من غير أسماء)
async function fetchRequesters(userIds) {
  const requesters = new Map();
  for (let i = 0; i < userIds.length; i += IN_CHUNK) {
    try {
      const { data, error } = await supabase
        .from("profiles")
        .select("id, name, email, phone")
        .in("id", userIds.slice(i, i + IN_CHUNK));
      if (error) continue;
      for (const profile of data ?? []) requesters.set(String(profile.id), profile);
    } catch {
      // مش هنعطل الصفحة بسبب الأسماء
    }
  }
  return requesters;
}

async function attachRequesters(tickets) {
  const ids = [...new Set(tickets.map((ticket) => ticket.created_by).filter(Boolean))];
  const requesters = ids.length ? await fetchRequesters(ids) : new Map();
  return tickets.map((ticket) => ({
    ...ticket,
    requester: requesters.get(String(ticket.created_by)) ?? null,
  }));
}

// ---------- التذاكر ----------

// قايمة الأدمن: فلتر بالحالة والتصنيف، وبحث بالموضوع، وترقيم
export async function getAdminTickets({
  status = "all",
  category = "all",
  search = "",
  page = 0,
  pageSize = 20,
} = {}) {
  let query = supabase.from("tickets").select(TICKET_FIELDS, { count: "exact" });

  if (status !== "all") query = query.eq("status", status);
  if (category !== "all") query = query.eq("category", category);
  const term = search.trim();
  if (term) query = query.ilike("subject", `%${escapeLike(term)}%`);

  const { data, error, count } = await query
    .order("updated_at", { ascending: false })
    .range(page * pageSize, page * pageSize + pageSize - 1);
  if (error) throw error;

  return { tickets: await attachRequesters(data ?? []), total: count ?? 0 };
}

// تذكرة واحدة. withRequester=false للتحديث الدوري الخفيف.
export async function getTicket(ticketId, { withRequester = true } = {}) {
  const { data, error } = await supabase
    .from("tickets")
    .select(TICKET_FIELDS)
    .eq("id", ticketId)
    .maybeSingle();

  if (error) throw error;
  if (!data) return null;
  if (!withRequester) return data;
  const [withProfile] = await attachRequesters([data]);
  return withProfile;
}

// الأدمن بيغيّر الحالة أو الأولوية بس
export async function updateTicket(ticketId, changes) {
  const keys = Object.keys(changes);
  if (!keys.length || keys.some((key) => !UPDATABLE_TICKET_FIELDS.includes(key))) {
    throw new Error("تعديل غير مسموح على التذكرة.");
  }

  const { data, error } = await supabase
    .from("tickets")
    .update({ ...changes, updated_at: new Date().toISOString() })
    .eq("id", ticketId)
    .select(TICKET_FIELDS)
    .maybeSingle();

  if (error) throw error;
  if (!data) throw new Error("تعذر تحديث التذكرة. غالبًا مفيش صلاحية.");
  return data;
}

// ---------- تذاكري (أونر / لاعب) ----------

// كل تذاكر المستخدم الحالي (الـ RLS بترجّع تذاكره بس). الأحدث تحديثًا الأول.
export async function getMyTickets(userId, limit = 100) {
  const { data, error } = await supabase
    .from("tickets")
    .select(TICKET_FIELDS)
    .eq("created_by", userId)
    .order("updated_at", { ascending: false })
    .limit(limit);

  if (error) throw error;
  return data ?? [];
}

// إنشاء تذكرة. الرسالة الأولى بتتبعت بعدها بـ sendMessage.
// requester_role لازم يساوي دور المستخدم (owner أو user) عشان الـ RLS.
export async function createTicket({ createdBy, requesterRole, category, subject, priority }) {
  if (requesterRole !== "owner" && requesterRole !== "user") {
    throw new Error("نوع الحساب ده مش بيقدر يفتح تذاكر دعم.");
  }

  const { data, error } = await supabase
    .from("tickets")
    .insert({
      created_by: createdBy,
      requester_role: requesterRole,
      category,
      subject: subject.trim(),
      priority,
    })
    .select(TICKET_FIELDS)
    .single();

  if (error) throw error;
  return data;
}

// ---------- الرسائل ----------

export async function getMessages(ticketId) {
  const { data, error } = await supabase
    .from("ticket_messages")
    .select(MESSAGE_FIELDS)
    .eq("ticket_id", ticketId)
    .order("created_at", { ascending: true });

  if (error) throw error;
  return data ?? [];
}

export async function sendMessage({ ticketId, senderId, body }) {
  const text = body.trim();
  if (!text) throw new Error("اكتب رسالة أولًا.");

  const { data, error } = await supabase
    .from("ticket_messages")
    .insert({ ticket_id: ticketId, sender_id: senderId, body: text })
    .select(MESSAGE_FIELDS)
    .single();

  if (error) throw error;
  return data;
}

// بنحدّث عمود is_read بس، وعلى الرسائل اللي مش بتاعتنا
export async function markMessagesRead({ ticketId, viewerId }) {
  const { error } = await supabase
    .from("ticket_messages")
    .update({ is_read: true })
    .eq("ticket_id", ticketId)
    .neq("sender_id", viewerId)
    .eq("is_read", false);

  if (error) throw error;
}

// عدد الرسائل غير المقروءة (من الطرف التاني) لكل تذكرة، في استعلام واحد
export async function getUnreadCounts(ticketIds, viewerId) {
  const counts = {};
  if (!ticketIds.length) return counts;

  const { data, error } = await supabase
    .from("ticket_messages")
    .select("ticket_id")
    .in("ticket_id", ticketIds)
    .eq("is_read", false)
    .neq("sender_id", viewerId);

  if (error) throw error;
  for (const row of data ?? []) {
    counts[row.ticket_id] = (counts[row.ticket_id] ?? 0) + 1;
  }
  return counts;
}