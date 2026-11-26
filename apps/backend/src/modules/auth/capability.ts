import type { Request, Response, NextFunction } from 'express';
import { HTTP_STATUS, ERROR_MESSAGES, DEFAULT_LOCALE } from '@repo/constants';
import { authService } from './auth.service.js';
import { ContentService } from '../content/content.service.js';
import { hasPermission } from '@repo/utils/rbac';
import type { Capability, CapPermission } from './types/capability.types.js';
import {
  APPEARANCE_KINDS,
  ANY_CAPABILITY,
} from './constants/capability.constants.js';

export type { Capability, CapPermission };
export { APPEARANCE_KINDS, ANY_CAPABILITY };

const capabilityOf = (p: CapPermission): string | undefined => {
  const c = p.condition;
  return c && typeof c === 'object'
    ? ((c as Record<string, unknown>).capability as string | undefined)
    : undefined;
};

/**
 * True when one of the permissions grants any of the capabilities, for the
 * given website (a permission without a website applies to all of them).
 * A wildcard `*` permission (administrators) grants everything, and an
 * explicit deny for the capability always wins.
 */
export function hasCapability(
  permissions: CapPermission[],
  wanted: Capability | Capability[],
  schemaId?: string,
): boolean {
  const caps = Array.isArray(wanted) ? wanted : [wanted];
  const inScope = (p: CapPermission) =>
    !schemaId || !p.schemaId || p.schemaId === schemaId;
  const denied = permissions.some(
    (p) =>
      p.effect === 'deny' &&
      inScope(p) &&
      (p.action === '*' || caps.includes(capabilityOf(p) as Capability)),
  );
  if (denied) return false;
  return permissions.some(
    (p) =>
      p.effect === 'allow' &&
      inScope(p) &&
      (p.action === '*' || caps.includes(capabilityOf(p) as Capability)),
  );
}

const forbid = (res: Response) =>
  res
    .status(HTTP_STATUS.FORBIDDEN)
    .json({ error: { message: ERROR_MESSAGES.RBAC.FORBIDDEN } });

/** Fresh permissions from the database (not the possibly stale token). */
export const permissionsFor = async (
  req: Request,
): Promise<CapPermission[]> => {
  if (req.user?.isApiToken) {
    return (req.user.permissions ?? []) as CapPermission[];
  }
  const appId = (req.headers['x-app-id'] as string) || 'default';
  const fresh = await authService
    .getUserPermissions(req.user!.id, appId)
    .catch(() => null);
  return (fresh ?? req.user?.permissions ?? []) as CapPermission[];
};

/** Allows the request when the user holds any of the capabilities. */
export const requireCapability =
  (wanted: Capability | Capability[], legacyAction?: string) =>
  async (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res
        .status(HTTP_STATUS.UNAUTHORIZED)
        .json({ error: { message: ERROR_MESSAGES.AUTH.NOT_AUTHENTICATED } });
    }
    try {
      const perms = await permissionsFor(req);
      if (
        hasCapability(perms, wanted, req.schemaId) ||
        (legacyAction &&
          hasPermission(perms as never, legacyAction, req.schemaId))
      ) {
        return next();
      }
      return forbid(res);
    } catch (e) {
      next(e);
    }
  };

const contentService = new ContentService();

const isAppearanceEntry = async (req: Request): Promise<boolean> => {
  const body = req.body as Record<string, unknown> | undefined;
  const bodyKind = body?.kind as string | undefined;
  const id = req.params.entryId;
  // Creating: the new entry itself must be one of the allowed kinds
  if (!id) return APPEARANCE_KINDS.includes(bodyKind as string);
  // Changing: the entry that exists must be one of them too, otherwise a
  // page could be overwritten by sending a body that claims to be a menu.
  const existing = await contentService
    .getEntryById(
      String(id),
      DEFAULT_LOCALE,
      req.schemaId,
      req.context?.applicationId,
    )
    .catch(() => null);
  const data = (existing as { data?: Record<string, unknown> } | null)?.data;
  if (!APPEARANCE_KINDS.includes(data?.kind as string)) return false;
  return bodyKind === undefined || APPEARANCE_KINDS.includes(bodyKind);
};

/**
 * Writing or publishing entries. `publish` needs the publishing capability
 * so writers can draft without being able to put things live.
 */
export const requireContentAccess =
  (mode: 'write' | 'publish' | 'delete') =>
  async (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res
        .status(HTTP_STATUS.UNAUTHORIZED)
        .json({ error: { message: ERROR_MESSAGES.AUTH.NOT_AUTHENTICATED } });
    }
    try {
      const perms = await permissionsFor(req);
      const primary: Capability =
        mode === 'publish' ? 'publish_content' : 'manage_content';
      // Roles that hold the raw action (e.g. seeded "editor") keep working
      const legacy =
        mode === 'publish'
          ? 'publish'
          : mode === 'delete'
            ? 'delete'
            : req.method === 'POST'
              ? 'create'
              : 'update';
      if (mode === 'delete') {
        // Deleting a live entry takes the publishing capability: writers may
        // only throw away their own drafts.
        if (
          hasCapability(perms, 'publish_content', req.schemaId) ||
          hasPermission(perms as never, legacy, req.schemaId)
        ) {
          return next();
        }
        if (hasCapability(perms, 'manage_content', req.schemaId)) {
          const existing = await contentService
            .getEntryById(
              String(req.params.entryId),
              DEFAULT_LOCALE,
              req.schemaId,
              req.context?.applicationId,
            )
            .catch(() => null);
          const live = existing as {
            status?: string;
            publishedData?: unknown;
          } | null;
          if (!live || (live.status !== 'published' && !live.publishedData)) {
            return next();
          }
        }
        return forbid(res);
      }
      if (
        hasCapability(perms, primary, req.schemaId) ||
        hasPermission(perms as never, legacy, req.schemaId)
      ) {
        return next();
      }
      if (
        hasCapability(perms, 'manage_appearance', req.schemaId) &&
        (await isAppearanceEntry(req))
      ) {
        return next();
      }
      return forbid(res);
    } catch (e) {
      next(e);
    }
  };

/**
 * Whether the user may know a website exists: they hold some capability (or
 * raw permission) for it, or for all websites. Used to keep the website
 * list limited to what a role was given.
 */
export const canSeeSchema = (
  permissions: CapPermission[],
  schemaId: string,
): boolean =>
  hasCapability(permissions, ANY_CAPABILITY, schemaId) ||
  hasPermission(permissions as never, 'read', schemaId);

export const canUserPublish = async (req: Request): Promise<boolean> => {
  if (!req.user) return false;
  const perms = await permissionsFor(req);
  return (
    hasCapability(perms, 'publish_content', req.schemaId) ||
    hasPermission(perms as never, 'publish', req.schemaId)
  );
};
