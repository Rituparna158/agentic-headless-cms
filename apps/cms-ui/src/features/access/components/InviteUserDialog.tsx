import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { accessApi } from '../api/access.api';
import { InviteUserPayload, Role } from '../types/access.types';
import { Button, FormField, Typography } from '@repo/shared-ui';
import { X, Copy, Check } from 'lucide-react';
interface InviteUserDialogProps {
  onClose: () => void;
}
export const InviteUserDialog = ({ onClose }: InviteUserDialogProps) => {
  const queryClient = useQueryClient();
  const [formData, setFormData] = useState<InviteUserPayload>({
    email: '',
    firstName: '',
    lastName: '',
    roleId: '',
  });
  const [inviteUrl, setInviteUrl] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const { data: rolesResponse, isLoading: rolesLoading } = useQuery({
    queryKey: ['roles'],
    queryFn: () => accessApi.getRoles({ page: 1, pageSize: 100 }),
  });
  const roles = rolesResponse?.data?.data || [];
  const mutation = useMutation({
    mutationFn: (data: InviteUserPayload) => accessApi.inviteUser(data),
    onSuccess: (res) => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      if (res.data.inviteUrl) {
        setInviteUrl(res.data.inviteUrl);
      } else {
        onClose();
      }
    },
    onError: (error) => {
      console.error('Failed to invite user', error);
      alert('Failed to invite user');
    },
  });
  const handleCopy = async () => {
    if (inviteUrl) {
      await navigator.clipboard.writeText(inviteUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-card w-full max-w-md rounded-xl border border-border/40 shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
        <div className="flex items-center justify-between px-6 py-4 border-b border-border/40">
          <Typography variant="h4" className="font-semibold">
            {inviteUrl ? 'Invitation Sent' : 'Invite New User'}
          </Typography>
          <button
            onClick={onClose}
            className="text-muted-foreground hover:text-foreground transition-colors"
          >
            <X size={20} />
          </button>
        </div>
        <div className="p-6">
          {inviteUrl ? (
            <div className="space-y-6">
              <div className="p-4 bg-green-500/10 text-green-600 border border-green-500/20 rounded-lg text-sm">
                User has been invited successfully! Since you are in a
                non-production environment, you can share the link below with
                them.
              </div>

              <div className="space-y-2">
                <Typography variant="label">Invite Link</Typography>
                <div className="flex items-center gap-2">
                  <input
                    value={inviteUrl}
                    readOnly
                    className="flex h-10 w-full rounded-md border border-input bg-muted font-mono text-xs px-3 py-2"
                  />
                  <Button
                    variant="outline"
                    type="button"
                    onClick={handleCopy}
                    className="shrink-0"
                  >
                    {copied ? (
                      <Check size={16} className="text-green-500" />
                    ) : (
                      <Copy size={16} />
                    )}
                  </Button>
                </div>
              </div>
              <div className="flex justify-end">
                <Button type="button" onClick={onClose}>
                  Done
                </Button>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <FormField>
                <Typography variant="label" className="mb-1 block">
                  Email Address *
                </Typography>
                <input
                  type="email"
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-ring"
                  placeholder="user@example.com"
                  value={formData.email}
                  onChange={(e) =>
                    setFormData({ ...formData, email: e.target.value })
                  }
                />
              </FormField>
              <div className="grid grid-cols-2 gap-4">
                <FormField>
                  <Typography variant="label" className="mb-1 block">
                    First Name
                  </Typography>
                  <input
                    type="text"
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-ring"
                    placeholder="John"
                    value={formData.firstName || ''}
                    onChange={(e) =>
                      setFormData({ ...formData, firstName: e.target.value })
                    }
                  />
                </FormField>
                <FormField>
                  <Typography variant="label" className="mb-1 block">
                    Last Name
                  </Typography>
                  <input
                    type="text"
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-ring"
                    placeholder="Doe"
                    value={formData.lastName || ''}
                    onChange={(e) =>
                      setFormData({ ...formData, lastName: e.target.value })
                    }
                  />
                </FormField>
              </div>
              <FormField>
                <Typography variant="label" className="mb-1 block">
                  Role *
                </Typography>
                <select
                  className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                  value={formData.roleId}
                  onChange={(e) =>
                    setFormData({ ...formData, roleId: e.target.value })
                  }
                  required
                >
                  <option value="" disabled>
                    Select a role...
                  </option>
                  {rolesLoading ? (
                    <option disabled>Loading roles...</option>
                  ) : (
                    roles.map((role: Role) => (
                      <option key={role.id} value={role.id}>
                        {role.name}
                      </option>
                    ))
                  )}
                </select>
              </FormField>
              <div className="flex justify-end gap-3 pt-4 border-t border-border/40">
                <Button variant="outline" type="button" onClick={onClose}>
                  Cancel
                </Button>
                <Button
                  onClick={() => mutation.mutate(formData)}
                  disabled={
                    mutation.isPending || !formData.email || !formData.roleId
                  }
                >
                  {mutation.isPending ? 'Sending...' : 'Send Invite'}
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
