import { SignUp } from "@clerk/nextjs"

export default function SignUpPage() {
  return (
    <div className="flex min-h-[70vh] items-center justify-center px-4 py-12">
      <SignUp appearance={{ variables: { colorPrimary: "#BC002D" } }} />
    </div>
  )
}
