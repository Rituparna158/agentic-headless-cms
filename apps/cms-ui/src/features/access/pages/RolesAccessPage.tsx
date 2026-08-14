import { RolesTab } from '../components/RolesTab';

export const RolesAccessPage = () => {
  return (
    <div className="flex flex-col h-full bg-background animate-in fade-in duration-500">
      <div className="px-8 pt-8 pb-4 border-b border-border/40">
        <h1 className="text-3xl font-bold tracking-tight text-foreground mb-1">
          Roles & Access
        </h1>
        <p className="text-muted-foreground">Manage roles and permissions.</p>
      </div>

      <div className="flex-1 overflow-hidden">
        <RolesTab />
      </div>
    </div>
  );
};
