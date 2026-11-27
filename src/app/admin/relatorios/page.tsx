"use client";
import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getSupabase } from "@/lib/supabase";

type Period={id:string;missionary_id:string;period_start:string;period_end:string;due_date:string|null;status:"upcoming"|"open"|"closed"};
type Update={id:string;reporting_period_id:string;missionary_id:string;activities:string|null;results:string|null;challenges:string|null;community_relationship:string|null;people_reached:number|null;testimony:string|null;support_situation:string|null;urgent_needs:string|null;support_needed:string|null;next_steps:string|null;prayer_requests:string|null;status:"draft"|"submitted"|"under_review"|"approved"|"revision_requested";submitted_at:string|null;reviewed_at:string|null;review_note:string|null};
type Missionary={id:string;profile_id:string};
type Profile={id:string;full_name:string};
const fmt=(v:string|null)=>v?new Date(v+"T12:00:00").toLocaleDateString("pt-BR"):"—";
const quarter=(v:string)=>{const d=new Date(v+"T12:00:00");return (Math.floor(d.getMonth()/3)+1)+"º trimestre de "+d.getFullYear();};
const status=(s?:Update["status"])=>!s?"Pendente":({draft:"Rascunho",submitted:"Enviado",under_review:"Em análise",approved:"Aprovado",revision_requested:"Complementação solicitada"}[s]);

export default function AdminReportsPage(){
 const router=useRouter();
 const [loading,setLoading]=useState(true),[busy,setBusy]=useState<string|null>(null);
 const [error,setError]=useState(""),[notice,setNotice]=useState("");
 const [periods,setPeriods]=useState<Period[]>([]),[updates,setUpdates]=useState<Update[]>([]);
 const [names,setNames]=useState<Record<string,string>>({}),[notes,setNotes]=useState<Record<string,string>>({});
 const load=useCallback(async()=>{
  setLoading(true);setError("");
  const sb=getSupabase(),{data:auth,error:authErr}=await sb.auth.getUser();
  if(authErr||!auth.user){router.replace("/login");return;}
  const {data:profile,error:profileErr}=await sb.from("profiles").select("role,account_status").eq("id",auth.user.id).maybeSingle();
  if(profileErr||profile?.role!=="admin"||profile.account_status!=="active"){setError("Área restrita à administração.");setLoading(false);return;}
  const {error:provisionError}=await sb.rpc("ensure_reporting_periods");
  if(provisionError){setError("Não foi possível preparar os períodos de acompanhamento.");setLoading(false);return;}
  const [p,m,u]=await Promise.all([
   sb.from("reporting_periods").select("id,missionary_id,period_start,period_end,due_date,status").order("period_start",{ascending:false}),
   sb.from("missionaries").select("id,profile_id"),
   sb.from("missionary_updates").select("id,reporting_period_id,missionary_id,activities,results,challenges,community_relationship,people_reached,testimony,support_situation,urgent_needs,support_needed,next_steps,prayer_requests,status,submitted_at,reviewed_at,review_note")
  ]);
  if(p.error||m.error||u.error){setError("Não foi possível carregar a fila de relatórios.");setLoading(false);return;}
  const ms=(m.data??[]) as Missionary[];
  const profileIds=ms.map(x=>x.profile_id);
  const {data:people,error:peopleError}=profileIds.length?await sb.from("profiles").select("id,full_name").in("id",profileIds):{data:[],error:null};
  if(peopleError){setError("Não foi possível carregar a identificação dos missionários.");setLoading(false);return;}
  const profileNames=Object.fromEntries(((people??[]) as Profile[]).map(x=>[x.id,x.full_name]));
  setNames(Object.fromEntries(ms.map(x=>[x.id,profileNames[x.profile_id]??"Missionário"])));
  setPeriods((p.data??[]) as Period[]);setUpdates((u.data??[]) as Update[]);
  setLoading(false);
 },[router]);
 useEffect(()=>{void load();},[load]);
 async function review(item:Update, next:Update["status"]){
  const sb=getSupabase(),{data:auth}=await sb.auth.getUser();if(!auth.user)return;
  const note=(notes[item.id]??"").trim();
  if(next==="revision_requested"&&!note){setError("Escreva a orientação antes de solicitar complementação.");return;}
  setBusy(item.id);setError("");setNotice("");
  const {error}=await sb.from("missionary_updates").update({status:next,reviewed_by:auth.user.id,reviewed_at:new Date().toISOString(),review_note:note||null}).eq("id",item.id);
  setBusy(null);
  if(error){setError("Não foi possível atualizar a análise. Confira e tente novamente.");return;}
  setNotice(next==="approved"?"Relatório aprovado.":next==="revision_requested"?"Complementação solicitada.":"Relatório colocado em análise.");
  await load();
 }
 async function logout(){await getSupabase().auth.signOut();router.replace("/login");}
 return <main className="admin-shell"><header className="admin-header"><a className="auth-brand" href="/">Escuta Missionária</a><button className="text-button" onClick={logout}>Sair</button></header>
 <section className="admin-content"><div className="eyebrow" style={{color:"var(--gold)"}}>Administração</div><h1>Relatórios trimestrais</h1><p className="admin-lead">Acompanhe os períodos e analise os relatórios enviados. O conteúdo é privado e restrito à administração e ao missionário responsável.</p>
 <div className="request-actions"><a className="text-button" href="/admin">Voltar à administração</a></div>
 {error&&<div role="alert" className="notice error">{error}</div>}{notice&&<div role="status" className="notice success">{notice}</div>}
 {loading?<p>Carregando relatórios...</p>:periods.length===0?<div className="empty-state">Nenhum período disponível.</div>:
 <div className="request-list">{periods.map(p=>{const u=updates.find(x=>x.reporting_period_id===p.id);const late=!!p.due_date&&new Date(p.due_date+"T23:59:59")<new Date()&&(!u||u.status==="draft"||u.status==="revision_requested");return <article className="request-card" key={p.id}>
 <div className="request-top"><div><h2>{names[p.missionary_id]??"Missionário"}</h2><p className="request-date">{quarter(p.period_start)} · {fmt(p.period_start)} a {fmt(p.period_end)}</p></div><span className="report-status">{late?"Atrasado":status(u?.status)}</span></div>
 <div className="request-meta"><span>Prazo: {fmt(p.due_date)}</span><span>Status: {status(u?.status)}</span>{u?.submitted_at&&<span>Enviado: {new Date(u.submitted_at).toLocaleString("pt-BR")}</span>}</div>
 {!u||u.status==="draft"?<p className="request-summary">Ainda não há relatório enviado.</p>:<>
 <div className="admin-report-content">
  {([["Resumo",u.activities],["Atividades",u.results],["Avanços e desafios",u.challenges],["Comunidade",u.community_relationship],["Pessoas acompanhadas",u.people_reached==null?null:String(u.people_reached)],["Testemunho",u.testimony],["Situação do sustento",u.support_situation],["Necessidades urgentes",u.urgent_needs],["Apoio necessário",u.support_needed],["Próximos passos",u.next_steps],["Pedidos de oração",u.prayer_requests]] as [string,string|null][]).filter(([,v])=>v).map(([k,v])=><div key={k}><strong>{k}</strong><p>{v}</p></div>)}
 </div>
 {u.status!=="approved"&&<div className="admin-review"><label htmlFor={"note-"+u.id}>Orientação / observação da administração</label><textarea id={"note-"+u.id} value={notes[u.id]??u.review_note??""} onChange={e=>setNotes(x=>({...x,[u.id]:e.target.value}))} placeholder="Use este campo para registrar uma orientação ou pedido de complementação."/>
 <div className="request-actions"><button className="reject-button" disabled={busy===u.id} onClick={()=>void review(u,"under_review")}>Em análise</button><button className="reject-button" disabled={busy===u.id} onClick={()=>void review(u,"revision_requested")}>Solicitar complementação</button><button className="submit-button" disabled={busy===u.id} onClick={()=>void review(u,"approved")}>Aprovar relatório</button></div></div>}
 {u.status==="approved"&&u.review_note&&<p className="privacy-note">Observação registrada: {u.review_note}</p>}
 </>}
 </article>;})}</div>}
 </section></main>;
}
