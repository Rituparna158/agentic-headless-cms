'use client';

import {
  ErrorPage,
  ErrorPageErrorCode,
  ErrorPageHeading,
  ErrorPageDesc,
  ErrorPageContent,
  ErrorPageFooter,
  ErrorPageLinks,
  ErrorPageIcons,
} from '@repo/shared-ui';
import { ButtonWithIcon } from '@repo/shared-ui';
import {
  Home,
  ArrowLeft,
  AlertTriangle,
  Wrench,
  Zap,
  Rocket,
  Settings,
} from 'lucide-react';

export default function NotFound() {
  return (
    <ErrorPage variant="default" icon={Settings}>
      <ErrorPageContent>
        <ErrorPageIcons icons={[AlertTriangle, Wrench, Zap, Rocket]}>
          <ErrorPageErrorCode errorCode="404" animationType="none" />
        </ErrorPageIcons>
        <ErrorPageHeading>Page Not Found</ErrorPageHeading>
        <ErrorPageDesc>
          The page you're looking for doesn't exist. It might have been moved,
          deleted, or the URL might be incorrect.
        </ErrorPageDesc>
        <ErrorPageLinks>
          <ButtonWithIcon
            variant="default"
            size="lg"
            icon={<ArrowLeft />}
            iconPosition="left"
            onClick={() => window.history.back()}
          >
            Go back
          </ButtonWithIcon>
          <ButtonWithIcon
            variant="default"
            size="lg"
            icon={<Home />}
            iconPosition="left"
            onClick={() => (window.location.href = '/')}
          >
            Take me home
          </ButtonWithIcon>
        </ErrorPageLinks>
      </ErrorPageContent>
      <ErrorPageFooter>ERROR 404 · PAGE NOT FOUND</ErrorPageFooter>
    </ErrorPage>
  );
}
