import { Link } from 'react-router-dom';
import { Button } from '@repo/shared-ui';
export const MfaResetCompletePage = () => {
  return (
    <div className="flex flex-col space-y-6 w-full sm:w-[350px] mx-auto text-center">
      <h1 className="text-2xl font-semibold tracking-tight text-green-600">
        MFA Reset Successful
      </h1>
      <p className="text-sm text-muted-foreground">
        Your multi-factor authentication has been successfully disabled by an
        administrator. You can now log in using just your password.
      </p>
      <Link to="/login">
        <Button className="w-full">Sign In Now</Button>
      </Link>
    </div>
  );
};
