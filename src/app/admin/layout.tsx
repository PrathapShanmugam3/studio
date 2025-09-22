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
  SidebarFooter,
} from "@/components/ui/sidebar"
import { Button } from "@/components/ui/button";
import { LayoutDashboard, Package, Leaf, UserCircle, LogOut, Barcode } from "lucide-react"
import Link from "next/link"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { logout } from "@/lib/actions";

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
            <h1 className="font-headline text-xl font-bold text-primary">Thirumalai Maligai Admin</h1>
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
          <SidebarMenuItem>
            <SidebarMenuButton asChild>
              <Link href="/admin/scan">
                <Barcode />
                Scan Barcode
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarContent>
      <SidebarFooter>
         <form action={logout} className="w-full">
            <Button variant="ghost" className="w-full justify-start">
                <LogOut className="mr-2 h-4 w-4" />
                Logout
            </Button>
         </form>
      </SidebarFooter>
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
            <header className="flex h-14 items-center justify-between gap-4 border-b bg-card px-6 md:justify-end">
                <SidebarTrigger className="md:hidden" />
                <h1 className="font-headline text-lg font-semibold text-primary md:hidden">Thirumalai Maligai Admin</h1>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="rounded-full">
                      <UserCircle className="h-7 w-7 text-muted-foreground" />
                      <span className="sr-only">Toggle user menu</span>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuLabel>Admin Account</DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem asChild>
                       <form action={logout} className="w-full">
                        <button type="submit" className="w-full text-left px-2 py-1.5 text-sm">
                            Logout
                        </button>
                       </form>
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
            </header>
            <main className="flex-1 p-4 md:p-6">{children}</main>
        </SidebarInset>
    </SidebarProvider>
  )
}
