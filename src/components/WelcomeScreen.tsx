import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Sparkles } from "lucide-react";

interface WelcomeScreenProps {
  onSubmit: (name: string) => void;
}

export default function WelcomeScreen({ onSubmit }: WelcomeScreenProps) {
  const [name, setName] = useState("");

  const handleSubmit = () => {
    if (name.trim()) onSubmit(name.trim());
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-6">
      <div className="w-full max-w-sm animate-slide-up text-center">
        <div className="mb-6 flex justify-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-3xl bg-primary/10">
            <Sparkles className="h-8 w-8 text-primary" />
          </div>
        </div>
        <h1 className="mb-2 font-heading text-2xl font-bold">Hey there! 👋</h1>
        <p className="mb-8 text-sm text-muted-foreground">What should we call you?</p>
        <Input
          placeholder="Your name"
          value={name}
          onChange={e => setName(e.target.value)}
          onKeyDown={e => e.key === "Enter" && handleSubmit()}
          className="mb-4 rounded-xl py-6 text-center text-lg"
          autoFocus
        />
        <Button
          onClick={handleSubmit}
          disabled={!name.trim()}
          className="w-full rounded-xl py-6 text-base font-semibold"
        >
          Let's go!
        </Button>
      </div>
    </div>
  );
}
