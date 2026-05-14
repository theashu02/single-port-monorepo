"use client";

import { Camera, Save, Dices, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { memo, useEffect, useState } from "react";
import { getProfile, updateProfile, type ProfileData } from "@/core/apis/Profile_API";
import Loader from "@/components/ui/Loader";

const profileInputClassName = "h-11 rounded-xl border border-input bg-muted px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground transition-colors focus-visible:border-ring focus-visible:ring-0";
const profileTextareaClassName = "rounded-xl border border-input bg-muted px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground leading-relaxed resize-none transition-colors focus-visible:border-ring focus-visible:ring-0";

const Profile = () => {
  const [profileData, setProfileData] = useState<ProfileData>({
    name: "",
    handle: "",
    age: undefined,
    country: "",
    bio: "",
    image: "",
  });
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const data = await getProfile();
        if (data) {
          setProfileData({
            name: data.name || "",
            handle: data.handle || "",
            age: data.age || 22,
            country: data.country || "United States",
            bio: data.bio || "✨ vibing through life • lo-fi enthusiast • collector of memes",
            image: data.image || "",
          });
        }
      } catch (err) {
        console.error("Failed to load profile:", err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchProfile();
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { id, value } = e.target;
    setProfileData((prev) => ({
      ...prev,
      [id === "display-name" ? "name" : id]: id === "age" ? (value ? parseInt(value) : undefined) : value,
    }));
    setErrorMsg("");
    setSuccessMsg("");
  };

  const handleSave = async () => {
    setIsSaving(true);
    setErrorMsg("");
    setSuccessMsg("");
    try {
      const updated = await updateProfile(profileData);
      if (updated) {
        setProfileData(updated);
        setSuccessMsg("Profile updated successfully!");
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Failed to update profile";
      setErrorMsg(errorMessage);
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex h-auto justify-center items-center">
        <Loader />
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-500">
      <div className="flex flex-col sm:flex-row sm:items-center gap-6">
        <div className="relative group cursor-pointer shrink-0">
          <Avatar className="h-24 w-24 ring-2 ring-border group-hover:ring-primary/50 transition-all duration-300">
            <AvatarImage src={profileData.image || "https://api.dicebear.com/7.x/adventurer/svg?seed=you-vibez"} alt="Your Avatar" className="object-cover" />
            <AvatarFallback className="bg-muted text-muted-foreground font-bold text-xl">{profileData.name ? profileData.name.substring(0, 2).toUpperCase() : "YV"}</AvatarFallback>
          </Avatar>

          {/* Vibrant Camera Button */}
          <button className="absolute -bottom-2 -right-2 grid place-items-center h-9 w-9 rounded-full bg-primary text-primary-foreground ring-4 ring-background shadow-md transition-transform hover:scale-110 hover:bg-primary/90 active:scale-95" aria-label="Upload new avatar">
            <Camera className="h-4 w-4" aria-hidden="true" />
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

      {errorMsg && <p className="text-sm text-destructive">{errorMsg}</p>}
      {successMsg && <p className="text-sm text-green-500">{successMsg}</p>}

      {/* Form Fields Grid */}
      <div className="grid sm:grid-cols-2 gap-6">
        <div className="space-y-2">
          <Label htmlFor="display-name" className="text-xs uppercase tracking-wider text-muted-foreground font-semibold">
            Display Name
          </Label>
          <Input id="display-name" type="text" value={profileData.name || ""} onChange={handleChange} placeholder="You" className={profileInputClassName} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="handle" className="text-xs uppercase tracking-wider text-muted-foreground font-semibold">
            Handle
          </Label>
          <Input id="handle" type="text" value={profileData.handle || ""} onChange={handleChange} placeholder="@you-vibez" className={profileInputClassName} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="age" className="text-xs uppercase tracking-wider text-muted-foreground font-semibold">
            Age
          </Label>
          <Input id="age" type="number" value={profileData.age || ""} onChange={handleChange} placeholder="22" className={profileInputClassName} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="country" className="text-xs uppercase tracking-wider text-muted-foreground font-semibold">
            Country
          </Label>
          <Input id="country" type="text" value={profileData.country || ""} onChange={handleChange} placeholder="🇺🇸 United States" className={profileInputClassName} />
        </div>
      </div>

      {/* Bio */}
      <div className="space-y-2">
        <Label htmlFor="bio" className="text-xs uppercase tracking-wider text-muted-foreground font-semibold">
          Bio
        </Label>
        <Textarea id="bio" rows={3} value={profileData.bio || ""} onChange={handleChange} placeholder="✨ vibing through life • lo-fi enthusiast • collector of memes" className={profileTextareaClassName} />
      </div>

      {/* Actions */}
      <div className="pt-4 flex items-center gap-3 border-t border-border mt-6">
        <Button onClick={handleSave} disabled={isSaving} variant="outline" className="rounded-xl h-11 px-6 bg-secondary text-secondary-foreground font-semibold">
          {isSaving ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" aria-hidden="true" />}
          Save changes
        </Button>
        <Button variant="outline" className="rounded-xl h-11 px-6 border-border hover:bg-muted text-foreground font-semibold shadow-sm">
          Cancel
        </Button>
      </div>
    </div>
  );
};

export default memo(Profile);
