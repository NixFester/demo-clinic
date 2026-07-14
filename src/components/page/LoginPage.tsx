import Image from "next/image";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import LoginForm from "../shared/LoginForm";

export default function LoginPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-emerald-50 to-teal-50 p-4">
      <Card className="w-full max-w-md shadow-lg">
        <CardHeader className="text-center space-y-3">
          <div className="mx-auto flex items-center justify-center">
            <Image src="/logo-elrhea.png" alt="Elrhea Clinic" width={80} height={80} className="object-contain" priority />
          </div>
          <CardTitle className="text-2xl font-bold text-emerald-700">Elrhea Clinic</CardTitle>
          <CardDescription>Jl Bendo 3, Lempongsari, Gajahmungkur, Semarang, 50231</CardDescription>
        </CardHeader>
        <CardContent>
          <LoginForm />
        </CardContent>
      </Card>
    </div>
  );
}
