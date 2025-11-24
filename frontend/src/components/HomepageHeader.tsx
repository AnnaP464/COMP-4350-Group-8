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
    <div className="navigation-container" style={{ alignItems: "stretch" }}>
      <div className="navigation-box">
        <header className="navigation-header">
          <div>
            <h2 className="title" style={{ margin: 0 }}>
              {title}
            </h2>
            {subtitle && (
              <p className="subtitle" style={{ marginTop: 4 }}>
                {subtitle}
              </p>
            )}
          </div>

          {actions && (
            <div className="button-box" style={{ display: "flex", gap: 8 }}>
              {actions}
            </div>
          )}
        </header>
      </div>
    </div>
  );
};

export default PageHeader;

