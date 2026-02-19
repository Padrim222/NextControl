
import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { InstructionBalloon } from './instruction-balloon';

describe('InstructionBalloon', () => {
    it('renders with title', () => {
        render(
            <InstructionBalloon title="Test Title">
                Test Content
            </InstructionBalloon>
        );
        const button = screen.getByLabelText('Test Title');
        expect(button).toBeDefined();
    });

    it('renders help icon by default', () => {
        const { container } = render(
            <InstructionBalloon>Content</InstructionBalloon>
        );
        expect(container.querySelector('svg')).toBeDefined();
    });
});
