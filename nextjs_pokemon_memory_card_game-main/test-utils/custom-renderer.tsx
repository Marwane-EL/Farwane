import { ReactElement, ReactNode } from 'react';
import { render, RenderOptions, RenderResult } from '@testing-library/react';
import '@testing-library/jest-dom';

const TestingWrapper = ({ children }: { children?: ReactNode }) => {
  // Add here the common components
  return <div>{children}</div>;
};

const customRender = (
  ui: ReactElement,
  options?: Omit<RenderOptions, 'queries'>
): RenderResult => render(ui, { wrapper: TestingWrapper, ...options });

// re-export everything
export * from '@testing-library/react';

// override render method
export { customRender as render };
