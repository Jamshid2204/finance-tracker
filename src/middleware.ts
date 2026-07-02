import { type NextRequest } from "next/server"
import { updateSession } from "@/lib/supabase/middleware"

export async function middleware(request: NextRequest) {
  return await updateSession(request)
}

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/employees/:path*",
    "/payroll/:path*",
    "/payments/:path*",
    "/reports/:path*",
    "/settings/:path*",
    "/profile/:path*",
    "/login",
  ],
}
