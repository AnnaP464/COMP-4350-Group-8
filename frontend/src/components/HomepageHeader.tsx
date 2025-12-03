/*------------------------------------------------------------
displays the header you see at the top of dashboard/homepage
that contains the welcome msg, username and buttons
--------------------------------------------------------------*/

// src/components/PageHeader.tsx
import React from "react";
import "../css/Homepage.css"; // already has navigation styles

interface PageHeaderProps {
  title: string;
  subtitle?: string;
  actions?: React.ReactNode;
}

const PageHeader: React.FC<PageHeaderProps> = ({ title, subtitle, actions }) => {
  return (
    <div className="navigation-container">
      <div className="navigation-box">
        <header className="navigation-header">
          {/* Top row: Title and subtitle */}
          <div className="navigation-header-top">
            <div>
              <h2>{title}</h2>
              {subtitle && <p>{subtitle}</p>}
            </div>
          </div>

          {/* Bottom row: Action buttons */}
          {actions && (
            <div className="navigation-header-actions">
              {actions}
            </div>
          )}
        </header>
      </div>
    </div>
  );
};

export default PageHeader;

