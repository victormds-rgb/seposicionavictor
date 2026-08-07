import { signOut } from "../actions";
import { Button } from "@/components/ui/button";

export function SignOutButton() {
  return (
    <form action={signOut}>
      <Button type="submit" variant="secondary">
        Sair
      </Button>
    </form>
  );
}
