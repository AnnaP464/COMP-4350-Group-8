/*-----------------------------------------------------
Used by components/MyEventList and MyAttendance
import React, { type CSSProperties } from "react";
-----------------------------------------------------*/

interface MyRegContainerProps {
  children: React.ReactNode;
}

/**
 * Wraps the whole "My Registrations"-style page.
 * Just renders <main className="myreg-container"> around children.
 */
export const MyRegContainer: React.FC<MyRegContainerProps> = ({ children }) => {
  return <main className="myreg-container">{children}</main>;
};

interface MyRegSectionProps {
  title: string;
  children: React.ReactNode;
  /** Optional action area on the right (e.g., Back to Dashboard button). */
  actions?: React.ReactNode;
  /** Optional extra style for the outer glass div (used for marginTop on second card). */
  style?: CSSProperties;
}

/**
 * One glass card with header (title + optional actions) and body content.
 */
export const MyRegSection: React.FC<MyRegSectionProps> = ({
  title,
  children,
  actions,
  style,
}) => {
  return (
    <div className="myreg-glass" style={style}>
      <header className="myreg-header">
        <h2 className="myreg-title">{title}</h2>
        {actions && (
          <div className="myreg-actions">
            {actions}
          </div>
        )}
      </header>

      {children}
    </div>
  );
};
