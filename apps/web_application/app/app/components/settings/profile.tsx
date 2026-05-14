"use client";

import { Camera, Save, Dices } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { memo } from "react";

const Profile = () => {
  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-500">
      <div className="flex flex-col sm:flex-row sm:items-center gap-6">
        <div className="relative group cursor-pointer shrink-0">
          <Avatar className="h-24 w-24 ring-2 ring-border group-hover:ring-primary/50 transition-all duration-300">
            <AvatarImage src="https://api.dicebear.com/7.x/adventurer/svg?seed=you-vibez&backgroundColor=b6e3f4,c0aede,d1d4f9,ffd5dc,ffdfbf&backgroundType=gradientLinear" alt="Your Avatar" className="object-cover" />
            <AvatarFallback className="bg-muted text-muted-foreground font-bold text-xl">YV</AvatarFallback>
          </Avatar>

          {/* Vibrant Camera Button */}
          <button className="absolute -bottom-2 -right-2 grid place-items-center h-9 w-9 rounded-full bg-linear-to-br from-violet-500 to-cyan-400 ring-4 ring-background shadow-md transition-transform hover:scale-110 active:scale-95" aria-label="Upload new avatar">
            <Camera className="h-4 w-4 text-white" aria-hidden="true" />
          </button>
        </div>

        <div className="space-y-2">
          <div>
            <p className="text-base font-semibold text-foreground">Your Avatar</p>
            <p className="text-xs font-medium text-muted-foreground">Powered by DiceBear • randomize anytime</p>
          </div>
          <Button variant="secondary" size="sm" className="rounded-full h-8 px-4 text-xs font-semibold shadow-sm hover:bg-secondary/80">
            <Dices className="h-3.5 w-3.5 mr-1.5" />
            Re-roll Avatar
          </Button>
        </div>
      </div>

      {/* Form Fields Grid */}
      <div className="grid sm:grid-cols-2 gap-6">
        <div className="space-y-2">
          <Label htmlFor="display-name" className="text-xs uppercase tracking-wider text-muted-foreground font-semibold">
            Display Name
          </Label>
          <Input id="display-name" type="text" defaultValue="You" className="rounded-xl h-11 bg-muted/50 border-border focus-visible:ring-primary focus-visible:ring-offset-0 transition-all" />
        </div>
        <div className="space-y-2">
          <Label htmlFor="handle" className="text-xs uppercase tracking-wider text-muted-foreground font-semibold">
            Handle
          </Label>
          <Input id="handle" type="text" defaultValue="@you-vibez" className="rounded-xl h-11 bg-muted/50 border-border focus-visible:ring-primary focus-visible:ring-offset-0 transition-all" />
        </div>
        <div className="space-y-2">
          <Label htmlFor="age" className="text-xs uppercase tracking-wider text-muted-foreground font-semibold">
            Age
          </Label>
          <Input id="age" type="number" defaultValue="22" className="rounded-xl h-11 bg-muted/50 border-border focus-visible:ring-primary focus-visible:ring-offset-0 transition-all" />
        </div>
        <div className="space-y-2">
          <Label htmlFor="country" className="text-xs uppercase tracking-wider text-muted-foreground font-semibold">
            Country
          </Label>
          <Input id="country" type="text" defaultValue="🇺🇸 United States" className="rounded-xl h-11 bg-muted/50 border-border focus-visible:ring-primary focus-visible:ring-offset-0 transition-all" />
        </div>
      </div>

      {/* Bio */}
      <div className="space-y-2">
        <Label htmlFor="bio" className="text-xs uppercase tracking-wider text-muted-foreground font-semibold">
          Bio
        </Label>
        <Textarea id="bio" rows={3} defaultValue="✨ vibing through life • lo-fi enthusiast • collector of memes" className="rounded-xl bg-muted/50 border-border focus-visible:ring-primary focus-visible:ring-offset-0 resize-none transition-all p-3 text-sm leading-relaxed" />
      </div>

      {/* Actions */}
      <div className="pt-4 flex items-center gap-3 border-t border-border mt-6">
        <Button variant="outline" className="rounded-xl h-11 px-6 bg-secondary text-background-button-text font-semibold">
          <Save className="h-4 w-4 mr-2" aria-hidden="true" />
          Save changes
        </Button>
        <Button variant="outline" className="rounded-xl h-11 px-6 border-border hover:bg-muted text-foreground font-semibold shadow-sm">
          Cancel
        </Button>
      </div>
    </div>
  );
}


export default memo(Profile);