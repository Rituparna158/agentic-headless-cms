'use client';

import { useState, useEffect } from 'react';
import { Button } from '@repo/shared-ui';
import { Table } from '@repo/shared-ui';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@repo/shared-ui';
import { Tabs } from '@repo/shared-ui';
import { toast } from 'sonner';
import { apiFetch } from '@/lib/api-client';
import { API_PATHS } from '@/lib/constants/api-paths';

interface MfaRequestRecord {
  id: string;
  userId: string;
  status: 'pending' | 'approved' | 'rejected';
  createdAt: string;
  user?: {
    email: string;
    firstName: string | null;
    lastName: string | null;
  };
  admin?: {
    email: string;
    firstName: string | null;
    lastName: string | null;
  };
}

export function MfaRequestsTab() {
  const [requests, setRequests] = useState<MfaRequestRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'pending' | 'history'>('pending');

  const fetchRequests = async (status: string) => {
    try {
      setLoading(true);
      const endpoint = `${API_PATHS.ACCESS.MFA_REQUESTS}?status=${status}`;
      const data = await apiFetch<MfaRequestRecord[]>(endpoint);
      setRequests(data);
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : 'Failed to fetch MFA requests',
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRequests(activeTab);
  }, [activeTab]);

  const handleAction = async (id: string, action: 'approve' | 'reject') => {
    try {
      setActionLoading(id);
      const endpoint =
        action === 'approve'
          ? API_PATHS.ACCESS.MFA_REQUEST_APPROVE(id)
          : API_PATHS.ACCESS.MFA_REQUEST_REJECT(id);

      await apiFetch(endpoint, { method: 'POST' });

      toast.success(`MFA request ${action}d successfully.`);

      await fetchRequests(activeTab);
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : `Failed to ${action} request`,
      );
    } finally {
      setActionLoading(null);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>MFA Reset Requests</CardTitle>
        <CardDescription>
          Review and approve or reject user requests to reset their Multi-Factor
          Authentication.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs
          options={['Pending', 'History']}
          selected={activeTab === 'pending' ? 0 : 1}
          value={(idx: number) =>
            setActiveTab(idx === 0 ? 'pending' : 'history')
          }
        />

        <div className="mt-4">
          {activeTab === 'pending' &&
            (loading ? (
              <div className="p-8 text-center text-muted-foreground">
                Loading...
              </div>
            ) : requests.length === 0 ? (
              <div className="py-8 text-center text-muted-foreground border rounded-md bg-muted/20">
                No pending MFA reset requests.
              </div>
            ) : (
              <div className="border rounded-md">
                <Table
                  headings={[
                    { label: 'User Email', key: 'email', sort: 'asc' },
                    { label: 'Requested', key: 'requested', sort: 'asc' },
                    { label: 'Actions', key: 'actions', sort: 'asc' },
                  ]}
                  data={requests.map((req) => ({
                    email: (
                      <div>
                        <div className="font-medium">
                          {req.user?.email || req.userId}
                        </div>
                        {(req.user?.firstName || req.user?.lastName) && (
                          <div className="text-sm text-muted-foreground">
                            {req.user.firstName} {req.user.lastName}
                          </div>
                        )}
                      </div>
                    ),
                    requested: new Intl.DateTimeFormat('en-US', {
                      dateStyle: 'medium',
                      timeStyle: 'short',
                    }).format(new Date(req.createdAt)),
                    actions: (
                      <div className="text-right space-x-2">
                        <Button
                          variant="outline"
                          size="sm"
                          disabled={actionLoading === req.id}
                          onClick={() => handleAction(req.id, 'reject')}
                        >
                          Reject
                        </Button>
                        <Button
                          variant="default"
                          size="sm"
                          disabled={actionLoading === req.id}
                          onClick={() => handleAction(req.id, 'approve')}
                        >
                          Approve
                        </Button>
                      </div>
                    ),
                  }))}
                  applySort={() => {}}
                  currentPage={1}
                  totalPages={1}
                  onPageChange={() => {}}
                />
              </div>
            ))}

          {activeTab === 'history' &&
            (loading ? (
              <div className="p-8 text-center text-muted-foreground">
                Loading...
              </div>
            ) : requests.length === 0 ? (
              <div className="py-8 text-center text-muted-foreground border rounded-md bg-muted/20">
                No history of MFA reset requests.
              </div>
            ) : (
              <div className="border rounded-md">
                <Table
                  headings={[
                    { label: 'User Email', key: 'email', sort: 'asc' },
                    { label: 'Requested', key: 'requested', sort: 'asc' },
                    { label: 'Status', key: 'status', sort: 'asc' },
                    { label: 'Admin', key: 'admin', sort: 'asc' },
                  ]}
                  data={requests.map((req) => ({
                    email: (
                      <div className="font-medium">
                        {req.user?.email || req.userId}
                      </div>
                    ),
                    requested: new Intl.DateTimeFormat('en-US', {
                      dateStyle: 'medium',
                      timeStyle: 'short',
                    }).format(new Date(req.createdAt)),
                    status: (
                      <span
                        className={`px-2 py-1 rounded-full text-xs font-medium ${
                          req.status === 'approved'
                            ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
                            : 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'
                        }`}
                      >
                        {req.status.charAt(0).toUpperCase() +
                          req.status.slice(1)}
                      </span>
                    ),
                    admin: req.admin?.email || 'System',
                  }))}
                  applySort={() => {}}
                  currentPage={1}
                  totalPages={1}
                  onPageChange={() => {}}
                />
              </div>
            ))}
        </div>
      </CardContent>
    </Card>
  );
}
