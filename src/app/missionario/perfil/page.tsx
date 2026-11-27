"use client";

import { FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getSupabase } from "@/lib/supabase";

type ProfileForm = {
  full_name: string;
  phone: string;
  biography: string;
  missionary_start_date: string;
  country: string;
  state: string;
  city: string;
  mission_area: string;
  ministry_description: string;
  marital_status: string;
  has_children: string;
  lives_in_mission_base: string;
  has_vehicle: string;
  financial_support_range: string;
};

const emptyForm: ProfileForm = {
  full_name: "",
  phone: "",
  biography: "",
  missionary_start_date: "",
  country: "",
  state: "",
  city: "",
  mission_area: "",
  ministry_description: "",
  marital_status: "",
  has_children: "",
  lives_in_mission_base: "",
  has_vehicle: "",
  financial_support_range: "",
};

function booleanToValue(value: boolean | null): string {
  if (value === true) return "yes";
  if (value === false) return "no";
  return "";
}

function valueToBoolean(value: string): boolean | null {
  if (value === "yes") return true;
  if (value === "no") return false;
  return null;
}

export default function MissionaryProfilePage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState<ProfileForm>(emptyForm);
  const [notice, setNotice] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;

    async function loadProfile() {
      const supabase = getSupabase();
      const { data: authData, error: authError } = await supabase.auth.getUser();

      if (authError || !authData.user) {
        router.replace("/login");
        return;
      }

      const { data: profile, error: profileError } = await supabase
        .from("profiles")
        .select("role, account_status, full_name, phone")
        .eq("id", authData.user.id)
        .maybeSingle();

      if (!active) return;

      if (profileError || !profile) {
        setError("Não foi possível carregar seus dados. Tente novamente ou procure a administração.");
        setLoading(false);
        return;
      }

      if (profile.role === "admin" && profile.account_status === "active") {
        router.replace("/admin");
        return;
      }

      if (profile.role !== "missionary" || profile.account_status !== "active") {
        setError("Esta área é exclusiva para missionários com acesso ativo.");
        setLoading(false);
        return;
      }

      const { data: missionary, error: missionaryError } = await supabase
        .from("missionaries")
        .select("biography, missionary_start_date, country, state, city, mission_area, ministry_description, marital_status, has_children, lives_in_mission_base, has_vehicle, financial_support_range")
        .eq("profile_id", authData.user.id)
        .maybeSingle();

      if (!active) return;

      if (missionaryError || !missionary) {
        setError("Seu cadastro missionário ainda não está disponível. Entre em contato com a administração.");
        setLoading(false);
        return;
      }

      setForm({
        full_name: profile.full_name ?? "",
        phone: profile.phone ?? "",
        biography: missionary.biography ?? "",
        missionary_start_date: missionary.missionary_start_date ?? "",
        country: missionary.country ?? "",
        state: missionary.state ?? "",
        city: missionary.city ?? "",
        mission_area: missionary.mission_area ?? "",
        ministry_description: missionary.ministry_description ?? "",
        marital_status: missionary.marital_status ?? "",
        has_children: booleanToValue(missionary.has_children),
        lives_in_mission_base: booleanToValue(missionary.lives_in_mission_base),
        has_vehicle: booleanToValue(missionary.has_vehicle),
        financial_support_range: missionary.financial_support_range ?? "",
      });
      setLoading(false);
    }

    void loadProfile();
    return () => {
      active = false;
    };
  }, [router]);

  function updateField<K extends keyof ProfileForm>(key: K, value: ProfileForm[K]) {
    setForm(current => ({ ...current, [key]: value }));
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setNotice("");
    setError("");

    const supabase = getSupabase();
    const { data: authData, error: authError } = await supabase.auth.getUser();

    if (authError || !authData.user) {
      router.replace("/login");
      return;
    }

    const { error: missionaryUpdateError } = await supabase
      .from("missionaries")
      .update({
        biography: form.biography.trim() || null,
        missionary_start_date: form.missionary_start_date || null,
        country: form.country.trim() || null,
        state: form.state.trim() || null,
        city: form.city.trim() || null,
        mission_area: form.mission_area.trim() || null,
        ministry_description: form.ministry_description.trim() || null,
        marital_status: form.marital_status || null,
        has_children: valueToBoolean(form.has_children),
        lives_in_mission_base: valueToBoolean(form.lives_in_mission_base),
        has_vehicle: valueToBoolean(form.has_vehicle),
        financial_support_range: form.financial_support_range || null,
      })
      .eq("profile_id", authData.user.id);

    if (missionaryUpdateError) {
      setError("Não foi possível salvar as informações missionárias. Confira os dados e tente novamente.");
      setSaving(false);
      return;
    }

    const { error: profileUpdateError } = await supabase
      .from("profiles")
      .update({
        full_name: form.full_name.trim(),
        phone: form.phone.trim() || null,
      })
      .eq("id", authData.user.id);

    setSaving(false);

    if (profileUpdateError) {
      setError("As informações missionárias foram salvas, mas não foi possível atualizar nome e telefone. Tente salvar novamente.");
      return;
    }

    setNotice("Perfil atualizado com sucesso.");
  }

  async function logout() {
    await getSupabase().auth.signOut();
    router.replace("/login");
  }

  return (
    <main className="admin-shell">
      <header className="admin-header">
        <a className="auth-brand" href="/missionario">Escuta Missionária</a>
        <button className="text-button" onClick={logout}>Sair</button>
      </header>

      <section className="admin-content">
        <div className="eyebrow" style={{ color: "var(--gold)" }}>Área do missionário</div>
        <h1>Meu perfil</h1>
        <p className="admin-lead">Mantenha suas informações atualizadas. Seus dados não serão publicados sem autorização específica.</p>

        {loading ? <p>Carregando seu perfil...</p> : error ? (
          <div role="alert" className="notice error">{error}</div>
        ) : (
          <div className="registration-card" style={{ maxWidth: 820 }}>
            <form onSubmit={handleSubmit}>
              <h2>Informações pessoais</h2>
              <p className="card-intro">Esses dados são usados para identificação e contato pela equipe da Escuta Missionária.</p>
              <div className="form-grid">
                <div className="field">
                  <label htmlFor="full_name">Nome completo *</label>
                  <input id="full_name" value={form.full_name} onChange={event => updateField("full_name", event.target.value)} required minLength={2} maxLength={160} />
                </div>
                <div className="field">
                  <label htmlFor="phone">Telefone</label>
                  <input id="phone" type="tel" value={form.phone} onChange={event => updateField("phone", event.target.value)} maxLength={40} />
                </div>
              </div>

              <h2 style={{ marginTop: 34 }}>Atuação missionária</h2>
              <p className="card-intro">Conte um pouco sobre sua caminhada e onde desenvolve seu trabalho.</p>
              <div className="form-grid">
                <div className="field full">
                  <label htmlFor="biography">Sua história / biografia</label>
                  <textarea id="biography" value={form.biography} onChange={event => updateField("biography", event.target.value)} maxLength={5000} placeholder="Compartilhe brevemente sua trajetória..." />
                </div>
                <div className="field">
                  <label htmlFor="missionary_start_date">Início da atuação missionária</label>
                  <input id="missionary_start_date" type="date" value={form.missionary_start_date} onChange={event => updateField("missionary_start_date", event.target.value)} />
                </div>
                <div className="field">
                  <label htmlFor="mission_area">Área de atuação</label>
                  <input id="mission_area" value={form.mission_area} onChange={event => updateField("mission_area", event.target.value)} maxLength={160} placeholder="Ex.: ensino, evangelismo, saúde..." />
                </div>
                <div className="field">
                  <label htmlFor="country">País</label>
                  <input id="country" value={form.country} onChange={event => updateField("country", event.target.value)} maxLength={100} />
                </div>
                <div className="field">
                  <label htmlFor="state">Estado / região</label>
                  <input id="state" value={form.state} onChange={event => updateField("state", event.target.value)} maxLength={100} />
                </div>
                <div className="field">
                  <label htmlFor="city">Cidade</label>
                  <input id="city" value={form.city} onChange={event => updateField("city", event.target.value)} maxLength={120} />
                </div>
                <div className="field full">
                  <label htmlFor="ministry_description">Descrição do trabalho missionário</label>
                  <textarea id="ministry_description" value={form.ministry_description} onChange={event => updateField("ministry_description", event.target.value)} maxLength={5000} placeholder="Descreva as atividades, o público atendido e os objetivos do trabalho..." />
                </div>
              </div>

              <h2 style={{ marginTop: 34 }}>Contexto e apoio</h2>
              <p className="card-intro">As informações abaixo ajudam a compreender sua realidade e necessidades. O preenchimento é opcional.</p>
              <div className="form-grid">
                <div className="field">
                  <label htmlFor="marital_status">Estado civil</label>
                  <select id="marital_status" value={form.marital_status} onChange={event => updateField("marital_status", event.target.value)}>
                    <option value="">Prefiro não informar</option>
                    <option value="solteiro">Solteiro(a)</option>
                    <option value="casado">Casado(a)</option>
                    <option value="divorciado">Divorciado(a)</option>
                    <option value="viuvo">Viúvo(a)</option>
                    <option value="outro">Outro</option>
                  </select>
                </div>
                <div className="field">
                  <label htmlFor="has_children">Tem filhos?</label>
                  <select id="has_children" value={form.has_children} onChange={event => updateField("has_children", event.target.value)}>
                    <option value="">Prefiro não informar</option>
                    <option value="yes">Sim</option>
                    <option value="no">Não</option>
                  </select>
                </div>
                <div className="field">
                  <label htmlFor="lives_in_mission_base">Mora em uma base missionária?</label>
                  <select id="lives_in_mission_base" value={form.lives_in_mission_base} onChange={event => updateField("lives_in_mission_base", event.target.value)}>
                    <option value="">Prefiro não informar</option>
                    <option value="yes">Sim</option>
                    <option value="no">Não</option>
                  </select>
                </div>
                <div className="field">
                  <label htmlFor="has_vehicle">Possui veículo?</label>
                  <select id="has_vehicle" value={form.has_vehicle} onChange={event => updateField("has_vehicle", event.target.value)}>
                    <option value="">Prefiro não informar</option>
                    <option value="yes">Sim</option>
                    <option value="no">Não</option>
                  </select>
                </div>
                <div className="field full">
                  <label htmlFor="financial_support_range">Faixa de apoio financeiro mensal</label>
                  <input id="financial_support_range" value={form.financial_support_range} onChange={event => updateField("financial_support_range", event.target.value)} maxLength={100} placeholder="Opcional — informe uma faixa aproximada, se desejar" />
                  <span className="hint">Não informe dados bancários nem valores de contas pessoais.</span>
                </div>
              </div>

              {notice && <div role="status" className="notice success">{notice}</div>}
              {error && <div role="alert" className="notice error">{error}</div>}
              <div style={{ display: "flex", gap: 14, alignItems: "center", marginTop: 24, flexWrap: "wrap" }}>
                <button className="submit-button" type="submit" disabled={saving} style={{ width: "auto", minWidth: 190 }}>
                  {saving ? "Salvando..." : "Salvar alterações"}
                </button>
                <a className="text-button" href="/missionario">Voltar à área do missionário</a>
              </div>
            </form>
          </div>
        )}
      </section>
    </main>
  );
}
