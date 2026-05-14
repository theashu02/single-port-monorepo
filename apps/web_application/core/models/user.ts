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
    handle:           { type: String, unique: true, sparse: true },
    age:              { type: Number },
    country:          { type: String },
    bio:              { type: String }
  },
  { timestamps: true }
);

export type AppUser = InferSchemaType<typeof userSchema>;
export type AppUserModel = Model<AppUser>;

if (models.User) {
  delete models.User;
}

export const UserModel: AppUserModel = model("User", userSchema);
