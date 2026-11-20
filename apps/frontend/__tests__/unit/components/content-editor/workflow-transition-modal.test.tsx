import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

import { WorkflowTransitionModal } from '@/components/content-editor/workflow-transition-modal';
import type { WorkflowTransition, WorkflowStage } from '@repo/types';

const currentStage: WorkflowStage = {
  id: 's-1',
  name: 'Draft',
  slug: 'draft',
  color: '#64748b',
  order: 0,
  isInitial: true,
  isFinal: false,
};

const transition: WorkflowTransition = {
  id: 't-1',
  name: 'Submit for Review',
  fromStage: 'draft',
  toStage: 'in_review',
  requiredRoleIds: [],
};

describe('WorkflowTransitionModal', () => {
  it('renders transition details and comments input', () => {
    render(
      <WorkflowTransitionModal
        open={true}
        onOpenChange={vi.fn()}
        transition={transition}
        currentStage={currentStage}
        targetStageName="In Review"
        onConfirm={vi.fn()}
        isPending={false}
      />,
    );

    expect(screen.getByText('Submit for Review')).toBeInTheDocument();
    expect(screen.getByText('Draft')).toBeInTheDocument();
    expect(screen.getByText('In Review')).toBeInTheDocument();
    expect(
      screen.getByPlaceholderText(
        'Add an optional note for the review history...',
      ),
    ).toBeInTheDocument();
  });

  it('calls onConfirm with entered note when confirmed', async () => {
    const user = userEvent.setup();
    const onConfirm = vi.fn();

    render(
      <WorkflowTransitionModal
        open={true}
        onOpenChange={vi.fn()}
        transition={transition}
        currentStage={currentStage}
        targetStageName="In Review"
        onConfirm={onConfirm}
        isPending={false}
      />,
    );

    const commentInput = screen.getByPlaceholderText(
      'Add an optional note for the review history...',
    );
    fireEvent.change(commentInput, {
      target: { value: 'Ready for legal review' },
    });

    const confirmBtn = screen.getByRole('button', {
      name: 'Confirm',
    });
    await user.click(confirmBtn);

    expect(onConfirm).toHaveBeenCalledWith('Ready for legal review');
  });

  it('renders null when transition is null', () => {
    const { container } = render(
      <WorkflowTransitionModal
        open={true}
        onOpenChange={vi.fn()}
        transition={null}
        currentStage={currentStage}
        onConfirm={vi.fn()}
        isPending={false}
      />,
    );

    expect(container).toBeEmptyDOMElement();
  });

  it('requires a non-empty comment for rejection / change request transitions', async () => {
    const user = userEvent.setup();
    const onConfirm = vi.fn();

    const requestChangesTransition: WorkflowTransition = {
      id: 't-3',
      name: 'Request Changes',
      fromStage: 'in_review',
      toStage: 'draft',
      requiredRoleIds: ['editor'],
    };

    const inReviewStage: WorkflowStage = {
      id: 's-2',
      name: 'In Review',
      slug: 'in_review',
      color: '#eab308',
      order: 1,
      isInitial: false,
      isFinal: false,
    };

    render(
      <WorkflowTransitionModal
        open={true}
        onOpenChange={vi.fn()}
        transition={requestChangesTransition}
        currentStage={inReviewStage}
        targetStageName="Draft"
        onConfirm={onConfirm}
        isPending={false}
      />,
    );

    expect(screen.getByText('(Required)')).toBeInTheDocument();
    expect(
      screen.getByPlaceholderText(
        'Please explain the changes needed or reason for rejection...',
      ),
    ).toBeInTheDocument();

    const confirmBtn = screen.getByRole('button', { name: 'Confirm' });
    await user.click(confirmBtn);

    // Should NOT call onConfirm without comment
    expect(onConfirm).not.toHaveBeenCalled();
    expect(
      screen.getByText(
        'Please provide feedback explaining the requested changes.',
      ),
    ).toBeInTheDocument();

    // Now enter comment and submit
    const textarea = screen.getByPlaceholderText(
      'Please explain the changes needed or reason for rejection...',
    );
    fireEvent.change(textarea, {
      target: { value: 'Please update heading and add references.' },
    });
    await user.click(confirmBtn);

    expect(onConfirm).toHaveBeenCalledWith(
      'Please update heading and add references.',
    );
  });
});
