import { Schema, model, models, type Model, type InferSchemaType } from "mongoose";

const guestLoginSchema = new Schema(
  {
    id:                 { type: String, required: true },
    guest_id:           { type: String, required: true, unique: true },
    session_token:      { type: String, required: true },
    auth_type:          { type: String, required: true, default: "guest" },
    
    nickname:           { type: String, required: true, maxlength: 20 },
    avatar_id:          { type: String, required: true },
    handle:             { type: String },
    age:                { type: Number },
    country:            { type: String },
    bio:                { type: String },
    gender:             { type: String, enum: ["male", "female", "other", null], default: null },
    interests:          { type: [String], default: [] },
    
    age_confirmed:      { type: Boolean, required: true },
    terms_accepted:     { type: Boolean, required: true },
    terms_accepted_at:  { type: Date },
    
    ip_hash:            { type: String, required: true },
    ban_status:         { type: Boolean, default: false },
    report_count:       { type: Number, default: 0 },
    is_flagged:         { type: Boolean, default: false },
    
    created_at:         { type: Date, default: Date.now },
    last_seen_at:       { type: Date, default: Date.now },
    session_expires_at: { type: Date, required: true },
  },
  {
    timestamps: false,
    collection: "guest_login"
  }
);

guestLoginSchema.pre("save", function (this: InferSchemaType<typeof guestLoginSchema>) {
  if (this.report_count >= 3) {
    this.is_flagged = true;
  }
});

export type GuestLogin = InferSchemaType<typeof guestLoginSchema>;
export type GuestLoginModel = Model<GuestLogin>;

if (models.GuestLogin) {
  delete models.GuestLogin;
}

export const GuestLoginModel: GuestLoginModel = model<GuestLogin>("GuestLogin", guestLoginSchema);
