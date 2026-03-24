export type UploadLocale = "en" | "es";

const translations: Record<string, Record<UploadLocale, string>> = {
  // Header
  "header.title": { en: "Document Upload Portal", es: "Portal de Carga de Documentos" },
  "header.secured_by": { en: "Secured by Requity Group", es: "Asegurado por Requity Group" },

  // Progress
  "progress.conditions_cleared": {
    en: "{cleared} of {total} conditions cleared",
    es: "{cleared} de {total} condiciones completadas",
  },
  "progress.items_attention": {
    en: "{count} item{s} need{verb} your attention",
    es: "{count} elemento{s} requiere{verb} su atencion",
  },

  // Section headers
  "section.action_needed": { en: "Action Needed", es: "Accion Requerida" },
  "section.in_review": { en: "In Review", es: "En Revision" },
  "section.cleared": { en: "Cleared", es: "Completado" },
  "section.other_documents": { en: "Other Documents", es: "Otros Documentos" },

  // Statuses
  "status.pending": { en: "Pending", es: "Pendiente" },
  "status.submitted": { en: "Submitted", es: "Enviado" },
  "status.under_review": { en: "Under Review", es: "En Revision" },
  "status.approved": { en: "Approved", es: "Aprobado" },
  "status.waived": { en: "Waived", es: "Exento" },
  "status.not_applicable": { en: "Not Applicable", es: "No Aplica" },
  "status.needs_revision": { en: "Needs Revision", es: "Necesita Revision" },

  // Upload
  "upload.drop_or_click": { en: "Drop files or click to upload", es: "Arrastre archivos o haga clic para subir" },
  "upload.add_more": { en: "Add more files", es: "Agregar mas archivos" },
  "upload.upload_revised": { en: "Upload revised document", es: "Subir documento revisado" },
  "upload.submit": { en: "Submit for Review", es: "Enviar para Revision" },
  "upload.submitting": { en: "Submitting...", es: "Enviando..." },
  "upload.uploading": { en: "Uploading {name}...", es: "Subiendo {name}..." },
  "upload.add_comment": {
    en: "Add a note (optional) e.g. 'Jan, Feb, Mar statements attached'",
    es: "Agregar una nota (opcional) ej. 'Estados de cuenta de Ene, Feb, Mar adjuntos'",
  },
  "upload.remaining": { en: "{count} upload{s} remaining", es: "{count} carga{s} restante{s}" },
  "upload.download_template": { en: "Download Template", es: "Descargar Plantilla" },

  // Revision
  "revision.requested": { en: "Revision Requested", es: "Revision Solicitada" },

  // Documents
  "docs.previously_uploaded": { en: "Previously uploaded", es: "Subido previamente" },
  "docs.ready_to_submit": { en: "Ready to submit", es: "Listo para enviar" },
  "docs.files_count": { en: "{count} file{s}", es: "{count} archivo{s}" },

  // Messaging
  "messages.title": { en: "Messages", es: "Mensajes" },
  "messages.disclaimer": {
    en: "This is a secure messaging channel for your loan with Requity Group. Please do not share passwords, full Social Security numbers, or bank login credentials here. Use the upload area above for sensitive documents.",
    es: "Este es un canal de mensajeria seguro para su prestamo con Requity Group. Por favor no comparta contrasenas, numeros de Seguro Social completos o credenciales bancarias aqui. Use el area de carga de arriba para documentos sensibles.",
  },
  "messages.type_message": { en: "Type a message...", es: "Escriba un mensaje..." },
  "messages.send": { en: "Send", es: "Enviar" },
  "messages.no_messages": { en: "No messages yet", es: "Sin mensajes aun" },
  "messages.send_prompt": { en: "Send a message to your loan team", es: "Envie un mensaje a su equipo de prestamo" },
  "messages.you": { en: "You", es: "Usted" },
  "messages.as": { en: "as", es: "como" },
  "messages.who_are_you": { en: "Who are you?", es: "Quien es usted?" },
  "messages.messaging_as": { en: "Messaging as", es: "Enviando como" },
  "messages.switch": { en: "Switch", es: "Cambiar" },
  "messages.press_enter": { en: "Press Enter to send", es: "Presione Enter para enviar" },

  // Errors / Invalid
  "invalid.expired": {
    en: "This link has expired",
    es: "Este enlace ha expirado",
  },
  "invalid.expired_desc": {
    en: "Please contact your loan officer to request a new upload link.",
    es: "Por favor contacte a su oficial de prestamo para solicitar un nuevo enlace de carga.",
  },
  "invalid.revoked": {
    en: "This link is no longer active",
    es: "Este enlace ya no esta activo",
  },
  "invalid.revoked_desc": {
    en: "Please contact your loan officer to request a new upload link.",
    es: "Por favor contacte a su oficial de prestamo para solicitar un nuevo enlace de carga.",
  },
  "invalid.max_uploads_reached": {
    en: "Upload limit reached",
    es: "Limite de carga alcanzado",
  },
  "invalid.max_uploads_reached_desc": {
    en: "The maximum number of files have been uploaded through this link.",
    es: "Se ha alcanzado el numero maximo de archivos subidos a traves de este enlace.",
  },
  "invalid.not_found": {
    en: "Link not found",
    es: "Enlace no encontrado",
  },
  "invalid.not_found_desc": {
    en: "This upload link doesn't exist. Please check the URL or contact your loan officer.",
    es: "Este enlace de carga no existe. Por favor verifique la URL o contacte a su oficial de prestamo.",
  },
  "invalid.server_error": {
    en: "Something went wrong",
    es: "Algo salio mal",
  },
  "invalid.server_error_desc": {
    en: "Please try again later or contact your loan officer.",
    es: "Por favor intente mas tarde o contacte a su oficial de prestamo.",
  },
};

export function t(
  key: string,
  locale: UploadLocale,
  replacements?: Record<string, string | number>
): string {
  const entry = translations[key];
  if (!entry) return key;
  let text = entry[locale] || entry["en"] || key;
  if (replacements) {
    for (const [k, v] of Object.entries(replacements)) {
      text = text.replace(`{${k}}`, String(v));
    }
  }
  return text;
}
