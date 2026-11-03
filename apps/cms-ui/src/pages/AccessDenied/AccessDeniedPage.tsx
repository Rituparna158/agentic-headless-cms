import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Button,
} from '@repo/shared-ui';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useLogoutMutation } from '../../features/auth/hooks/useAuthMutations';

export const AccessDeniedPage = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const message =
    searchParams.get('message') ||
    'You do not have permission to access this application.';
  const { mutate: logout, isPending } = useLogoutMutation();

  const handleReturnToLogin = () => {
    logout(undefined, {
      onSettled: () => navigate('/login'),
    });
  };

  return (
    <Card>
      <CardHeader className="text-center">
        <CardTitle className="text-2xl text-destructive">
          Access Denied
        </CardTitle>
        <CardDescription>Authentication Failed</CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col items-center gap-6">
        <p className="text-center text-muted-foreground">{message}</p>
        <Button
          onClick={handleReturnToLogin}
          variant="default"
          disabled={isPending}
        >
          {isPending ? 'Logging out...' : 'Return to Login'}
        </Button>
      </CardContent>
    </Card>
  );
};
