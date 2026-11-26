import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { axe } from 'vitest-axe';
import { FormField } from '@/components/ui/FormField';

describe('FormField UI Primitive', () => {
  it('renders text input with accessible labels and attributes', async () => {
    const handleChange = vi.fn();
    const { container } = render(
      <form>
        <FormField
          type="text"
          name="username"
          label="Username"
          value="john_doe"
          description="Enter your unique handle."
          onChange={handleChange}
        />
      </form>,
    );

    const input = screen.getByLabelText('Username');
    expect(input).toBeInTheDocument();
    expect(input).toHaveValue('john_doe');
    expect(input).toHaveAttribute(
      'aria-describedby',
      expect.stringContaining('username-description'),
    );

    fireEvent.change(input, { target: { value: 'jane_doe' } });
    expect(handleChange).toHaveBeenCalledWith('jane_doe');

    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });

  it('renders error message and marks aria-invalid', async () => {
    const { container } = render(
      <form>
        <FormField
          type="email"
          name="email"
          label="Email Address"
          value="invalid-email"
          error="Please provide a valid email."
          onChange={() => {}}
        />
      </form>,
    );

    const input = screen.getByLabelText('Email Address');
    expect(input).toHaveAttribute('aria-invalid', 'true');
    expect(input).toHaveAttribute(
      'aria-describedby',
      expect.stringContaining('email-error'),
    );

    const errorAlert = screen.getByRole('alert');
    expect(errorAlert).toHaveTextContent('Please provide a valid email.');

    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });

  it('renders select dropdown with options', async () => {
    const handleChange = vi.fn();
    const options = [
      { label: 'Admin', value: 'admin' },
      { label: 'Editor', value: 'editor' },
    ];

    const { container } = render(
      <form>
        <FormField
          type="select"
          name="role"
          label="User Role"
          value="editor"
          options={options}
          onChange={handleChange}
        />
      </form>,
    );

    const select = screen.getByLabelText('User Role');
    expect(select).toHaveValue('editor');

    fireEvent.change(select, { target: { value: 'admin' } });
    expect(handleChange).toHaveBeenCalledWith('admin');

    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });

  it('renders checkbox with toggle interaction', async () => {
    const handleChange = vi.fn();
    const { container } = render(
      <form>
        <FormField
          type="checkbox"
          name="agreeTerms"
          label="I agree to terms"
          checked={false}
          onChange={handleChange}
        />
      </form>,
    );

    const checkbox = screen.getByLabelText('I agree to terms');
    expect(checkbox).not.toBeChecked();

    fireEvent.click(checkbox);
    expect(handleChange).toHaveBeenCalledWith(true);

    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });

  it('renders textarea with rows', async () => {
    const handleChange = vi.fn();
    const { container } = render(
      <form>
        <FormField
          type="textarea"
          name="bio"
          label="Biography"
          value="Hello world"
          rows={5}
          onChange={handleChange}
        />
      </form>,
    );

    const textarea = screen.getByLabelText('Biography');
    expect(textarea).toHaveValue('Hello world');
    expect(textarea).toHaveAttribute('rows', '5');

    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });
});
