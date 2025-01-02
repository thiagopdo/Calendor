import { SignInButton, SignUpButton, UserButton } from "@clerk/nextjs";
import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";

import { Button } from "@/components/ui/button";

export default async function Home() {
  const { userId } = await auth();
  if (userId != null) redirect("/events");

  return (
    <div className="container my-4 text-center ">
      <h1 className="mb-4 text-3xl">Home Page</h1>
      <div className="flex justify-center gap-2">
        <Button asChild>
          <SignInButton />
        </Button>
        <Button asChild>
          <SignUpButton />
        </Button>
        <UserButton />
      </div>
    </div>
  );
}
