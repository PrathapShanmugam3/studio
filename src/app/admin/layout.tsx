import {
  SidebarProvider,
  Sidebar,
  SidebarHeader,
  SidebarContent,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarInset,
  SidebarTrigger,
} from "@/components/ui/sidebar"
import { Button } from "@/components/ui/button";
import { LayoutDashboard, Package, Leaf } from "lucide-react"
import Link from "next/link"

const AdminSidebar = () => {
  return (
    <Sidebar>
      <SidebarHeader>
        <div className="flex items-center gap-2">
            <Button asChild variant="ghost" className="h-10 w-10 rounded-full p-0">
                <Link href="/products">
                    <Leaf className="h-7 w-7 text-primary" />
                </Link>
            </Button>
            <h1 className="font-headline text-xl font-bold text-primary">EcoCart Admin</h1>
        </div>
      </SidebarHeader>
      <SidebarContent>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton asChild>
              <Link href="/admin/dashboard">
                <LayoutDashboard />
                Dashboard
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
          <SidebarMenuItem>
            <SidebarMenuButton asChild>
              <Link href="/admin/products">
                <Package />
                Products
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarContent>
    </Sidebar>
  );
};

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <SidebarProvider>
        <AdminSidebar />
        <SidebarInset className="bg-background">
            <header className="flex h-14 items-center gap-4 border-b bg-card px-6 md:hidden">
                <SidebarTrigger />
                <h1 className="font-headline text-lg font-semibold text-primary">EcoCart Admin</h1>
            </header>
            <main className="flex-1 p-4 md:p-6">{children}</main>
        </SidebarInset>
    </SidebarProvider>
  )
}
