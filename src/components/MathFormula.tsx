import React, { useMemo } from 'react';
import katex from 'katex';

interface MathFormulaProps {
  latex: string;
}

export const MathFormula: React.FC<MathFormulaProps> = ({ latex }) => {
  const html = useMemo(() => {
    try {
      return katex.renderToString(latex, {
        displayMode: true,
        throwOnError: false,
        strict: false,
      });
    } catch {
      return latex;
    }
  }, [latex]);

  return (
    <div
      className="katex-formula-box"
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
};
