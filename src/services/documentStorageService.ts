import { supabase } from "@/lib/supabase";

function sanitizeSegment(value: string) {
  return value.replace(/[^a-zA-Z0-9-_]/g, "_");
}

export async function uploadEmployeeDocument(
  file: File,
  scope: "photo" | "passport" | "drivers_license" | "extra_document",
  employeeKey: string
): Promise<string> {
  const safeKey = sanitizeSegment(employeeKey || "unknown");
  const ext = (file.name.split(".").pop() || "jpg").toLowerCase();
  const fileName = `${scope}_${Date.now()}.${ext}`;
  const path = `${safeKey}/${fileName}`;

  const { error } = await supabase.storage
    .from("employee-documents")
    .upload(path, file, { upsert: true, contentType: file.type || "image/jpeg" });

  if (error) throw error;
  const { data } = supabase.storage.from("employee-documents").getPublicUrl(path);
  return data.publicUrl;
}
