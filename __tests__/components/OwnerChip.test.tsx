/**
 * Tests for components/compliance/OwnerChip.tsx
 * Covers: rendering with/without owner, initials, avatar, team label.
 */

import React from 'react';
import { render, screen } from '@testing-library/react';
import { OwnerChip } from '@/components/compliance/OwnerChip';

describe('OwnerChip', () => {
  it('renders "Unowned" when name is null', () => {
    render(<OwnerChip name={null} />);
    expect(screen.getByText('Unowned')).toBeInTheDocument();
  });

  it('renders "Unowned" when name is undefined', () => {
    render(<OwnerChip name={undefined} />);
    expect(screen.getByText('Unowned')).toBeInTheDocument();
  });

  it('renders "Unowned" when name is empty string', () => {
    render(<OwnerChip name="" />);
    expect(screen.getByText('Unowned')).toBeInTheDocument();
  });

  it('renders owner name', () => {
    render(<OwnerChip name="Sarah Connor" />);
    expect(screen.getByText('Sarah Connor')).toBeInTheDocument();
  });

  it('renders initials for two-word name', () => {
    render(<OwnerChip name="Sarah Connor" />);
    expect(screen.getByText('SC')).toBeInTheDocument();
  });

  it('renders initials for single-word name', () => {
    render(<OwnerChip name="Admin" />);
    expect(screen.getByText('AD')).toBeInTheDocument();
  });

  it('renders avatar image when avatarUrl provided', () => {
    render(<OwnerChip name="Sarah Connor" avatarUrl="/avatar.png" />);
    const img = screen.getByRole('img');
    expect(img).toHaveAttribute('src', '/avatar.png');
    expect(img).toHaveAttribute('alt', 'Sarah Connor');
  });

  it('does not render image when no avatarUrl', () => {
    render(<OwnerChip name="Sarah Connor" />);
    expect(screen.queryByRole('img')).not.toBeInTheDocument();
  });

  it('renders team label when provided', () => {
    render(<OwnerChip name="Sarah Connor" team="Compliance" />);
    expect(screen.getByText('Compliance')).toBeInTheDocument();
  });

  it('does not render team when not provided', () => {
    render(<OwnerChip name="Sarah Connor" />);
    expect(screen.queryByText('Compliance')).not.toBeInTheDocument();
  });
});
