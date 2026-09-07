export interface MicErrorCopy {
  title: string;
  detail: string;
}

/**
 * Turns a getUserMedia rejection into copy the player can act on. The three
 * cases need different answers: a denial is fixed in browser settings, a
 * missing device is fixed by plugging one in, and a busy device is fixed by
 * closing whatever else is holding it.
 */
export function describeMicError(error: unknown): MicErrorCopy {
  const name = (error as { name?: string } | null)?.name ?? '';

  switch (name) {
    case 'NotAllowedError':
    case 'SecurityError':
      return {
        title: 'Microphone access blocked',
        detail:
          'Your browser is blocking the microphone for this site. Open the padlock or site-settings menu in the address bar, allow Microphone, then try again.',
      };
    case 'NotFoundError':
    case 'OverconstrainedError':
      return {
        title: 'No microphone found',
        detail: 'Connect a microphone or headset, then try again.',
      };
    case 'NotReadableError':
      return {
        title: 'Microphone is in use',
        detail:
          'Another app or tab is holding the microphone. Close it — a call or recorder is the usual culprit — then try again.',
      };
    default:
      return {
        title: "Couldn't start the tuner",
        detail:
          'The microphone could not be opened. Check that this page is served over HTTPS and that a microphone is connected, then try again.',
      };
  }
}
