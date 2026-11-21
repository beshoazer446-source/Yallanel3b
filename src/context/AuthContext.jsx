import { useEffect, useState } from "react";
import { supabase } from "../lib/supabaseClient";
import { AuthContext } from "./authContext";

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null); // حساب الدخول (Supabase Auth)
  const [profile, setProfile] = useState(null); // بياناته: الاسم والتليفون والنوع (user / owner / admin)
  const [loading, setLoading] = useState(true);
  const [authError, setAuthError] = useState("");

  async function loadProfile(userId) {
    const { data, error } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", userId)
      .single();
    if (error) throw error;
    return data;
  }

  useEffect(() => {
    let active = true;
    let requestId = 0;

    async function applySession(session) {
      if (!active) return;
      const currentRequest = ++requestId;
      const currentUser = session?.user ?? null;
      setUser(currentUser);
      setAuthError("");

      if (!currentUser) {
        setProfile(null);
        setLoading(false);
        return;
      }

      setLoading(true);
      try {
        const currentProfile = await loadProfile(currentUser.id);
        if (active && currentRequest === requestId) setProfile(currentProfile);
      } catch (error) {
        if (active && currentRequest === requestId) {
          setProfile(null);
          setAuthError(error.message || "تعذر تحميل بيانات الحساب.");
        }
      } finally {
        if (active && currentRequest === requestId) setLoading(false);
      }
    }

    const { data: listener } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setTimeout(() => void applySession(session), 0);
      },
    );

    supabase.auth.getSession().then(({ data, error }) => {
      if (!active) return;
      if (error) throw error;
      return applySession(data.session);
    }).catch((error) => {
      if (active) {
        setAuthError(error.message || "تعذر استعادة جلسة تسجيل الدخول.");
        setLoading(false);
      }
    });

    return () => {
      active = false;
      listener.subscription.unsubscribe();
    };
  }, []);

  async function signUp({ name, phone, email, password, role = "user" }) {
    return supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          name,
          phone,
          role: role === "owner" ? "owner" : "user",
        },
      },
    });
  }

  async function signIn({ email, password }) {
    return supabase.auth.signInWithPassword({ email, password });
  }

  async function signOut() {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
  }

  async function updateProfile(changes) {
    if (!user) throw new Error("يجب تسجيل الدخول أولًا.");
    const { error } = await supabase
      .from("profiles")
      .update(changes)
      .eq("id", user.id);
    if (error) throw error;
    const updatedProfile = await loadProfile(user.id);
    setProfile(updatedProfile);
    return updatedProfile;
  }

  const value = {
    user,
    profile,
    loading,
    authError,
    signUp,
    signIn,
    signOut,
    updateProfile,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
