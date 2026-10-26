'use client';

import { useEffect } from 'react';
import {
  ErrorPage,
  ErrorPageErrorCode,
  ErrorPageHeading,
  ErrorPageDesc,
  ErrorPageContent,
  ErrorPageFooter,
  ErrorPageLinks,
  ErrorPageIcons,
  ButtonWithIcon,
} from '@repo/shared-ui';
import { AlertCircle, RotateCcw, Home } from 'lucide-react';

interface ErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function ErrorBoundary({ error, reset }: ErrorProps) {
  useEffect(() => {
    console.error('Unhandled Application Error:', error);
  }, [error]);

  const isProduction = process.env.NODE_ENV === 'production';
  const errorMessage = isProduction
    ? 'An unexpected error occurred while processing your request. Please try again.'
    : error.message ||
      'An unexpected error occurred while processing your request. Please try again.';

  return (
    <ErrorPage variant="default" icon={AlertCircle}>
      <ErrorPageContent>
        <ErrorPageIcons icons={[AlertCircle]}>
          <ErrorPageErrorCode errorCode="500" animationType="none" />
        </ErrorPageIcons>
        <ErrorPageHeading>Something went wrong</ErrorPageHeading>
        <ErrorPageDesc>{errorMessage}</ErrorPageDesc>
        <ErrorPageLinks>
          <ButtonWithIcon
            variant="default"
            size="lg"
            icon={<RotateCcw />}
            iconPosition="left"
            onClick={() => reset()}
          >
            Try again
          </ButtonWithIcon>
          <ButtonWithIcon
            variant="default"
            size="lg"
            icon={<Home />}
            iconPosition="left"
            onClick={() => (window.location.href = '/')}
          >
            Return to Dashboard
          </ButtonWithIcon>
        </ErrorPageLinks>
      </ErrorPageContent>
      <ErrorPageFooter>ERROR 500 · APPLICATION EXCEPTION</ErrorPageFooter>
    </ErrorPage>
  );
}
