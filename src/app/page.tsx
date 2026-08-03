import { redirect } from "next/navigation";

// Página raiz — Sprint 1 (Shell).
// O Dashboard é o ponto de entrada real do sistema (UI_UX.md, seção 5;
// INFORMATION_ARCHITECTURE.md, seção 9). "/" apenas redireciona.
export default function RootPage() {
  redirect("/dashboard");
}
