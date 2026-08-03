import { signOut } from "../actions";
import { SubmitButton } from "./submit-button";

export function SignOutButton() {
  return (
    <form action={signOut}>
      <SubmitButton>Sair</SubmitButton>
    </form>
  );
}
