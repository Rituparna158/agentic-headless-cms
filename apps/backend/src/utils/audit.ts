import { contextStorage } from '@repo/context';

export function getAuditContext() {
  const store = contextStorage.getStore();
  return {
    actorUserId: store?.userId,
    actorAgentId: store?.agentId,
    actorType: store?.agentId
      ? 'agent'
      : store?.userId
        ? 'user'
        : ('system' as const),
    context: {
      ip: store?.ip,
      mcpToolName: store?.mcpToolName,
      promptRef: store?.promptRef,
    },
  };
}
