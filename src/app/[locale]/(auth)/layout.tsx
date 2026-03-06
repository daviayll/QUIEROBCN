export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <div className="w-full max-w-md">
        {/* Logo / brand */}
        <div className="mb-8 text-center">
          <h1 className="font-display text-3xl font-bold text-primary">QuieroBCN</h1>
          <p className="mt-1 text-sm text-muted-foreground">Tu piso en Barcelona</p>
        </div>
        {children}
      </div>
    </div>
  )
}
