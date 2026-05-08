import { Schema, model, models, type Model, type InferSchemaType } from "mongoose";

const userSchema = new Schema(
  {
    name:             { type: String },
    email:            { type: String, unique: true, sparse: true },
    passwordHash:     { type: String, select: false },
    image:            { type: String },
    walletAddress:    { type: String, unique: true, sparse: true, lowercase: true },
    provider:         { type: String, enum: ["google", "credentials", "metamask"], required: true },
    providerAccountId:{ type: String },
    emailVerified:    { type: Boolean, default: false },
    isBlocked:        { type: Boolean, default: false },
    loginCount:       { type: Number, default: 0 },
    lastLoginAt:      { type: Date, default: Date.now },
  },
  { timestamps: true }
);

export type AppUser = InferSchemaType<typeof userSchema>;
export type AppUserModel = Model<AppUser>;
export const UserModel: AppUserModel = models.User || model("User", userSchema);
