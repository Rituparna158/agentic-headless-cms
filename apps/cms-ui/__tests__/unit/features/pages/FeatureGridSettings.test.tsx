import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import FeatureGridSettings from '../../../../src/features/pages/components/page-builder/settings/FeatureGridSettings';
import { usePageBuilderStore } from '../../../../src/features/pages/components/page-builder/stores/pageBuilderStore';

describe('FeatureGridSettings', () => {
  beforeEach(() => {
    usePageBuilderStore.getState().resetStore();
  });

  it('should render the settings panel', () => {
    render(<FeatureGridSettings targetComponentId="test-1" />);
    expect(screen.getByText('Section Title')).toBeInTheDocument();
    expect(screen.getByText(/Features \(\d+\)/)).toBeInTheDocument();
  });

  it('should prevent removing the last feature', () => {
    render(<FeatureGridSettings targetComponentId="test-1" />);

    // Default has 3 features
    expect(screen.getAllByText(/Feature \d+/).length).toBe(3);

    // Remove until 1 is left
    const getRemoveButtons = () => screen.getAllByText('Remove');
    fireEvent.click(getRemoveButtons()[0]!); // Removes first
    fireEvent.click(getRemoveButtons()[0]!); // Removes new first

    // Should be exactly 1 feature left
    expect(screen.getAllByText(/Feature \d+/).length).toBe(1);

    // Remove button should no longer exist since length <= 1
    expect(screen.queryByText('Remove')).not.toBeInTheDocument();
  });

  it('should prevent adding more than 6 features', () => {
    render(<FeatureGridSettings targetComponentId="test-1" />);

    // Default has 3 features
    const addButton = screen.getByText('+ Add');

    // Add up to 6
    fireEvent.click(addButton); // 4
    fireEvent.click(addButton); // 5
    fireEvent.click(addButton); // 6

    expect(screen.getAllByText(/Feature \d+/).length).toBe(6);

    // Add button should be disabled
    expect(addButton).toBeDisabled();

    // Clicking it again should do nothing
    fireEvent.click(addButton);
    expect(screen.getAllByText(/Feature \d+/).length).toBe(6);
  });
});
