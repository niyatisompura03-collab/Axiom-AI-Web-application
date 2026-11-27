"use client";

import React from "react";
import { Mark } from "@/components/FigmaIcons";

interface AuthLayoutProps {
  title: string;
  description: string;
  children: React.ReactNode;
}

export default function AuthLayout({
  title,
  description,
  children,
}: AuthLayoutProps) {
  return (
    <main className="auth-page">
      {/* Top Header */}
      <header className="auth-header">
        
      </header>

      {/* Main Two-Column Split Layout */}
      <div className="auth-layout">
        {/* Left Side: Editorial Sculpture Story */}
        <section className="auth-story">
          <h1>
            A world of
            <br />
            <span>possibility.</span>
          </h1>
          <p>
            An intelligent workspace for thinking, exploring, and building.
          </p>

          <div className="sculpture" aria-hidden="true">
            <div className="sculpture-shadow" />
            <div className="sculpture-ring ring-a" />
            <div className="sculpture-ring ring-b" />
            <div className="sculpture-ring ring-c" />
            <div className="sculpture-core">
              <Mark size={36} />
            </div>
          </div>
        </section>

        {/* Right Side: Authentication Form Card */}
        <section className="auth-form-section">
          <div className="auth-form-wrap">
            <span className="auth-form-icon">
              <Mark size={32} />
            </span>
            <h2>{title}</h2>
            <p className="auth-description">{description}</p>

            {children}
          </div>
        </section>
      </div>

      {/* Footer */}
      <footer className="auth-footer">
        <span>© {new Date().getFullYear()} Axiom</span>
      </footer>
    </main>
  );
}
