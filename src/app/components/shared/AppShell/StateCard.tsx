import { AppShell } from "./AppShell";
import { StateMessage, type StateMessageProps } from "../StateMessage";

type StateCardProps = StateMessageProps & { back: { href: string; crumb: string } };

/** A `StateMessage` ("not found", "couldn't load", ...) inside the signed-in detail chrome. */
export function StateCard({ back, ...message }: StateCardProps) {
  return (
    <AppShell level='detail' back={back}>
      <StateMessage {...message} />
    </AppShell>
  );
}
