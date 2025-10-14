import React from "react";

export const Page = ({ children }: { children: React.ReactNode }) => (
  <div className="mx-auto w-full max-w-screen-md px-4 pb-24 pt-4 sm:px-6">
    {children}
  </div>
);
