"use client";

import { SessionProvider } from "next-auth/react";
import { AuthProvider } from "@/context/AuthContext";
import { CartProvider } from "@/context/CartContext";
import NavBarWrapper from '@/components/layouts/NavBarWrapper';
import CustomToast from '@/app/CustomToast';
import { SidebarProvider } from "@/context/SidebarContext";
import { DashboardSidebarProvider } from "@/context/DashboardSidebarContext";

export function GlobalProvider({ children }) {
  return (
    <>
      <SessionProvider>
        <AuthProvider>
          <CartProvider>
            <SidebarProvider>
            <DashboardSidebarProvider>
            <NavBarWrapper />
            
            {children}
            </DashboardSidebarProvider>
            </SidebarProvider>
          </CartProvider>
        </AuthProvider>
      </SessionProvider>
    </>
  );
}