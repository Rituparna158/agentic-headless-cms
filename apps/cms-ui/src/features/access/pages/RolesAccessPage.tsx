import { RolesTab } from '../components/RolesTab';
import { Typography } from '@repo/shared-ui';
export const RolesAccessPage = () => {
  return (
    <div className="flex flex-col h-full bg-background animate-in fade-in duration-500">
      <div className="px-6 py-6 border-b border-border/40">
        <Typography variant="h2" className="tracking-tight mb-1">
          Roles & Access
        </Typography>
        <Typography variant="body" className="text-muted-foreground mt-1">
          Manage roles and system permissions.
        </Typography>
      </div>
      <div className="flex-1 overflow-hidden">
        <RolesTab />
      </div>
    </div>
  );
};
