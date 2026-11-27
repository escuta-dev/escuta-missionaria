"use client";

import { useCallback, useEffect, useState } from "react";
import { getSupabase } from "@/lib/supabase";

type Attachment = {
  id: string;
  update_id: string;
  missionary_id: string;
  storage_path: string;
  original_name: string;
  mime_type: string;
  size_bytes: number;
  created_at: string;
};

const BUCKET = "missionary-report-attachments";
const MAX_BYTES = 10 * 1024 * 1024;
const MAX_FILES = 5;
const ACCEPTED = ["image/jpeg", "image/png", "image/webp", "application/pdf"];

export function MissionaryReportAttachments({
  updateId,
  missionaryId,
  editable = false,
  isAdmin = false,
}: {
  updateId: string;
  missionaryId?: string;
  editable?: boolean;
  isAdmin?: boolean;
}) {
  const [items, setItems] = useState<Attachment[]>([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  const load = useCallback(async () => {
    const sb = getSupabase() as any;
    const { data, error: loadError } = await sb
      .from("missionary_update_attachments")
      .select("id,update_id,missionary_id,storage_path,original_name,mime_type,size_bytes,created_at")
      .eq("update_id", updateId)
      .order("created_at", { ascending: true });
    if (loadError) {
      setError("Não foi possível carregar os anexos.");
      return;
    }
    setItems((data ?? []) as Attachment[]);
  }, [updateId]);

  useEffect(() => { void load(); }, [load]);

  async function upload(files: FileList | null) {
    if (!files?.length || !missionaryId || !editable) return;
    setError("");
    setNotice("");
    const chosen = Array.from(files);
    if (items.length + chosen.length > MAX_FILES) {
      setError("O limite é de 5 arquivos por relatório.");
      return;
    }
    const invalid = chosen.find(file => !ACCEPTED.includes(file.type) || file.size > MAX_BYTES || file.size === 0);
    if (invalid) {
      setError("Envie somente JPG, PNG, WEBP ou PDF, com até 10 MB por arquivo.");
      return;
    }
    setBusy(true);
    const sb = getSupabase() as any;
    const { data: auth } = await sb.auth.getUser();
    if (!auth.user) {
      setError("Sua sessão expirou. Entre novamente.");
      setBusy(false);
      return;
    }
    for (const file of chosen) {
      const ext = file.name.split(".").pop()?.toLowerCase() ?? "bin";
      const path = `${missionaryId}/${updateId}/${crypto.randomUUID()}.${ext}`;
      const { error: storageError } = await sb.storage.from(BUCKET).upload(path, file, {
        contentType: file.type,
        upsert: false,
      });
      if (storageError) {
        setError("Não foi possível enviar um dos arquivos. Verifique o formato e tente novamente.");
        setBusy(false);
        await load();
        return;
      }
      const { error: metadataError } = await sb.from("missionary_update_attachments").insert({
        update_id: updateId,
        missionary_id: missionaryId,
        storage_path: path,
        original_name: file.name,
        mime_type: file.type,
        size_bytes: file.size,
        uploaded_by: auth.user.id,
      });
      if (metadataError) {
        await sb.storage.from(BUCKET).remove([path]);
        setError("O arquivo foi enviado, mas não foi possível registrar seus dados. Tente novamente.");
        setBusy(false);
        await load();
        return;
      }
    }
    setNotice("Anexo(s) enviado(s) com sucesso.");
    setBusy(false);
    await load();
  }

  async function download(item: Attachment) {
    setError("");
    const sb = getSupabase() as any;
    const { data, error: signError } = await sb.storage.from(BUCKET).createSignedUrl(item.storage_path, 60);
    if (signError || !data?.signedUrl) {
      setError("Não foi possível abrir este arquivo.");
      return;
    }
    window.open(data.signedUrl, "_blank", "noopener,noreferrer");
  }

  async function remove(item: Attachment) {
    if (!editable || isAdmin) return;
    setBusy(true);
    setError("");
    const sb = getSupabase() as any;
    const { error: storageError } = await sb.storage.from(BUCKET).remove([item.storage_path]);
    if (storageError) {
      setError("Não foi possível remover o arquivo.");
      setBusy(false);
      return;
    }
    const { error: rowError } = await sb.from("missionary_update_attachments").delete().eq("id", item.id);
    if (rowError) {
      setError("O arquivo foi removido, mas não foi possível atualizar a lista. Atualize a página.");
    } else {
      setNotice("Anexo removido.");
    }
    setBusy(false);
    await load();
  }

  const formatSize = (bytes: number) => bytes < 1024 * 1024
    ? `${Math.max(1, Math.round(bytes / 1024))} KB`
    : `${(bytes / (1024 * 1024)).toFixed(1)} MB`;

  return (
    <section className="report-attachments">
      <h3>Anexos do relatório</h3>
      <p className="hint">Fotos JPG, PNG ou WEBP e documentos PDF. Até 5 arquivos, com máximo de 10 MB cada.</p>
      {error && <div role="alert" className="notice error">{error}</div>}
      {notice && <div role="status" className="notice success">{notice}</div>}
      {items.length === 0 ? <p className="hint">Nenhum anexo adicionado.</p> : (
        <ul className="attachment-list">
          {items.map(item => (
            <li key={item.id}>
              <span><strong>{item.original_name}</strong><small>{formatSize(item.size_bytes)}</small></span>
              <div className="attachment-actions">
                <button type="button" className="text-button" onClick={() => void download(item)}>Abrir</button>
                {editable && !isAdmin && <button type="button" className="text-button" disabled={busy} onClick={() => void remove(item)}>Remover</button>}
              </div>
            </li>
          ))}
        </ul>
      )}
      {editable && !isAdmin && (
        <label className="attachment-upload">
          <span>{busy ? "Processando..." : "Adicionar arquivos"}</span>
          <input
            type="file"
            accept=".jpg,.jpeg,.png,.webp,.pdf,image/jpeg,image/png,image/webp,application/pdf"
            multiple
            disabled={busy || items.length >= MAX_FILES}
            onChange={event => {
              void upload(event.target.files);
              event.currentTarget.value = "";
            }}
          />
        </label>
      )}
      <p className="privacy-note">Os arquivos ficam em armazenamento privado. Somente o missionário responsável e a administração podem acessá-los. O envio não autoriza divulgação pública.</p>
    </section>
  );
}
