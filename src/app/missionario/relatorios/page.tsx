"use client";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { getSupabase } from "@/lib/supabase";

type Period = { id: string; period_start: string; period_end: string; due_date: string | null; status: "upcoming" | "open" | "closed" };
type Report = {
 id: string; reporting_period_id: string; activities: string | null; results: string | null;
 challenges: string | null; community_relationship: string | null; people_reached: number | null;
 testimony: string | null; support_situation: string | null; urgent_needs: string | null;
 support_needed: string | null; next_steps: string | null; prayer_requests: string | null;
 status: "draft" | "submitted" | "under_review" | "approved" | "revision_requested";
 review_note: string | null;
};
type FormState = Record<"activities" | "results" | "challenges" | "community_relationship" | "people_reached" | "testimony" | "support_situation" | "urgent_needs" | "support_needed" | "next_steps" | "prayer_requests", string>;
const blank: FormState = { activities:"", results:"", challenges:"", community_relationship:"", people_reached:"", testimony:"", support_situation:"", urgent_needs:"", support_needed:"", next_steps:"", prayer_requests:"" };
const fields: {key:keyof FormState; label:string; type?:"number"}[] = [
 {key:"activities",label:"Resumo do trimestre"},{key:"results",label:"Principais atividades realizadas"},
 {key:"challenges",label:"Avanços, conquistas e desafios"},{key:"community_relationship",label:"Relacionamento com a comunidade"},
 {key:"people_reached",label:"Pessoas alcançadas ou acompanhadas (opcional)",type:"number"},
 {key:"testimony",label:"Testemunho ou história marcante"},{key:"support_situation",label:"Como está a situação do sustento?"},
 {key:"urgent_needs",label:"Necessidades urgentes"},{key:"support_needed",label:"Que tipo de apoio seria importante?"},
 {key:"next_steps",label:"Planos e próximos passos"},{key:"prayer_requests",label:"Pedidos de oração"}
];
const date = (v:string|null) => v ? new Date(v+"T12:00:00").toLocaleDateString("pt-BR") : "Não definido";
const title = (p:Period) => { const d=new Date(p.period_start+"T12:00:00"); return (Math.floor(d.getMonth()/3)+1)+"º trimestre de "+d.getFullYear(); };
const label = (s?:Report["status"]) => !s ? "Não iniciado" : ({draft:"Rascunho",submitted:"Enviado — aguardando análise",under_review:"Em análise",approved:"Aprovado",revision_requested:"Complementação solicitada"}[s]);

export default function MissionaryReportsPage() {
 const router=useRouter();
 const [loading,setLoading]=useState(true), [saving,setSaving]=useState(false);
 const [error,setError]=useState(""), [notice,setNotice]=useState("");
 const [periods,setPeriods]=useState<Period[]>([]), [reports,setReports]=useState<Report[]>([]);
 const [missionaryId,setMissionaryId]=useState(""), [selectedId,setSelectedId]=useState("");
 const [form,setForm]=useState<FormState>(blank);
 const selected=useMemo(()=>periods.find(p=>p.id===selectedId)??null,[periods,selectedId]);
 const report=useMemo(()=>reports.find(r=>r.reporting_period_id===selectedId),[reports,selectedId]);
 const editable=!report || report.status==="draft" || report.status==="revision_requested";

 async function load() {
  setLoading(true); setError("");
  const sb=getSupabase(), {data:auth,error:authErr}=await sb.auth.getUser();
  if(authErr||!auth.user){router.replace("/login");return;}
  const {data:profile,error:profileErr}=await sb.from("profiles").select("role,account_status").eq("id",auth.user.id).maybeSingle();
  if(profileErr||!profile||profile.account_status!=="active"){setError("Não foi possível validar seu acesso.");setLoading(false);return;}
  if(profile.role==="admin"){router.replace("/admin");return;}
  if(profile.role!=="missionary"){setError("Área exclusiva para missionários ativos.");setLoading(false);return;}
  const {data:m,error:mErr}=await sb.from("missionaries").select("id").eq("profile_id",auth.user.id).maybeSingle();
  if(mErr||!m){setError("Não foi possível localizar seu cadastro missionário.");setLoading(false);return;}
  setMissionaryId(m.id);
  const [p,u]=await Promise.all([
   sb.from("reporting_periods").select("id,period_start,period_end,due_date,status").eq("missionary_id",m.id).order("period_start",{ascending:false}),
   sb.from("missionary_updates").select("id,reporting_period_id,activities,results,challenges,community_relationship,people_reached,testimony,support_situation,urgent_needs,support_needed,next_steps,prayer_requests,status,review_note").eq("missionary_id",m.id)
  ]);
  if(p.error||u.error) setError("Não foi possível carregar os relatórios.");
  else {setPeriods((p.data??[]) as Period[]);setReports((u.data??[]) as Report[]);if(!selectedId&&p.data?.length)setSelectedId(p.data[0].id);}
  setLoading(false);
 }
 useEffect(()=>{void load();},[]);
 useEffect(()=>{
  if(!selectedId)return;
  const r=reports.find(x=>x.reporting_period_id===selectedId);
  setForm(r?{activities:r.activities??"",results:r.results??"",challenges:r.challenges??"",community_relationship:r.community_relationship??"",people_reached:r.people_reached==null?"":String(r.people_reached),testimony:r.testimony??"",support_situation:r.support_situation??"",urgent_needs:r.urgent_needs??"",support_needed:r.support_needed??"",next_steps:r.next_steps??"",prayer_requests:r.prayer_requests??""}:blank);
  setNotice("");
 },[selectedId,reports]);
 async function save(submit:boolean) {
  if(!selected||!missionaryId||!editable)return;
  setSaving(true);setError("");setNotice("");
  const sb=getSupabase(), payload={
   activities:form.activities.trim()||null,results:form.results.trim()||null,challenges:form.challenges.trim()||null,
   community_relationship:form.community_relationship.trim()||null,people_reached:form.people_reached.trim()?Number(form.people_reached):null,
   testimony:form.testimony.trim()||null,support_situation:form.support_situation.trim()||null,
   urgent_needs:form.urgent_needs.trim()||null,support_needed:form.support_needed.trim()||null,
   next_steps:form.next_steps.trim()||null,prayer_requests:form.prayer_requests.trim()||null
  };
  let id=report?.id;
  if(!id){const {data,error}=await sb.from("missionary_updates").insert({reporting_period_id:selected.id,missionary_id:missionaryId,status:"draft"}).select("id").single();if(error||!data){setError("Não foi possível iniciar o relatório.");setSaving(false);return;}id=data.id;}
  const {error}=await sb.from("missionary_updates").update({...payload,status:submit?"submitted":"draft"}).eq("id",id);
  if(error){setError("Não foi possível salvar. Tente novamente.");setSaving(false);return;}
  setNotice(submit?"Relatório enviado para análise.":"Rascunho salvo.");await load();setSaving(false);
 }
 async function logout(){await getSupabase().auth.signOut();router.replace("/login");}
 return <main className="admin-shell"><header className="admin-header"><a className="auth-brand" href="/">Escuta Missionária</a><button className="text-button" onClick={logout}>Sair</button></header>
 <section className="admin-content"><div className="eyebrow" style={{color:"var(--gold)"}}>Área do missionário</div><h1>Relatórios trimestrais</h1>
 <p className="admin-lead">Compartilhe como foi o trimestre. Seus relatórios são privados e visíveis somente para você e para a administração.</p>
 {error&&<div role="alert" className="notice error">{error}</div>}{notice&&<div role="status" className="notice success">{notice}</div>}
 {loading?<p>Carregando períodos...</p>:periods.length===0?<div className="empty-state"><h2>Nenhum período disponível</h2><p>A administração ainda precisa preparar os períodos de acompanhamento.</p></div>:
 <div className="report-layout"><aside className="report-period-list"><h2>Períodos</h2>{periods.map(p=>{const r=reports.find(x=>x.reporting_period_id===p.id);const late=!!p.due_date&&new Date(p.due_date+"T23:59:59")<new Date()&&(!r||r.status==="draft"||r.status==="revision_requested");return <button key={p.id} className={"report-period-button "+(selectedId===p.id?"selected":"")} onClick={()=>setSelectedId(p.id)}><strong>{title(p)}</strong><span>{label(r?.status)}</span>{late&&<small>Prazo encerrado — envio continua disponível</small>}{p.status==="upcoming"&&<small>Período futuro</small>}</button>;})}</aside>
 {selected&&<section className="report-form-card"><div className="report-form-heading"><div><span className="eyebrow" style={{color:"var(--gold)"}}>Atualização do trabalho</span><h2>{title(selected)}</h2><p>Período: {date(selected.period_start)} a {date(selected.period_end)} · Prazo: {date(selected.due_date)}</p></div><span className="report-status">{label(report?.status)}</span></div>
 {report?.review_note&&<div className="notice error"><strong>Orientação da administração:</strong> {report.review_note}</div>}
 <div className="form-grid report-fields">{fields.map(f=><div className="field full" key={f.key}><label htmlFor={f.key}>{f.label}</label>{f.type==="number"?<input id={f.key} type="number" min="0" step="1" value={form[f.key]} disabled={!editable} onChange={e=>setForm(x=>({...x,[f.key]:e.target.value}))}/>:<textarea id={f.key} value={form[f.key]} disabled={!editable} onChange={e=>setForm(x=>({...x,[f.key]:e.target.value}))}/>}</div>)}</div>
 {editable?<div className="request-actions report-actions"><button className="reject-button" disabled={saving} onClick={()=>void save(false)}>Salvar rascunho</button><button className="submit-button" disabled={saving} onClick={()=>void save(true)}>{saving?"Enviando...":"Enviar para análise"}</button></div>:<p className="privacy-note">Este relatório não está disponível para edição nesta etapa.</p>}
 <p className="privacy-note">Nenhuma informação será divulgada publicamente sem autorização específica e separada. Anexos e fotos serão incluídos em etapa posterior, após configuração do armazenamento privado.</p>
 </section>}</div>}
 </section></main>;
}
