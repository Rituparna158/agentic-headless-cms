import React from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@repo/shared-ui';
import { LoginForm } from '../../features/auth/components/LoginForm';

export const LoginPage = () => {
  return (
    <Card>
      <CardHeader className="text-center">
        <CardTitle className="text-xl">Agentic CMS</CardTitle>
        <CardDescription>Sign in to manage your content</CardDescription>
      </CardHeader>
      <CardContent>
        <LoginForm />
      </CardContent>
    </Card>
  );
};
