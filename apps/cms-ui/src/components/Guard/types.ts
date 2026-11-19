export interface RoleGuardProps {
  /** One capability, or a list of which any one is enough. */
  requiredCapability?: string | string[];
  redirectTo?: string;
}
