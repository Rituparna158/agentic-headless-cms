ALTER TABLE "content_workflow_states" ADD COLUMN IF NOT EXISTS "requires_review" boolean DEFAULT true NOT NULL;
