import { draftMode } from 'next/headers';
import { redirect } from 'next/navigation';

export const draftModeHandlers = {
  /**
   * Route handler to enable Draft Mode
   */
  enable: async (request: Request) => {
    const { searchParams } = new URL(request.url);
    const redirectPath = searchParams.get('redirect') || '/';
    const draft = await draftMode();
    draft.enable();
    redirect(redirectPath);
  },

  /**
   * Route handler to disable Draft Mode
   */
  disable: async (request: Request) => {
    const { searchParams } = new URL(request.url);
    const redirectPath = searchParams.get('redirect') || '/';
    const draft = await draftMode();
    draft.disable();
    redirect(redirectPath);
  },
};
