import mongoose, { Schema, Document, Model } from "mongoose";

export interface IContact extends Document {
  ownerWallet: string;   
  name: string;       
  stellarAddress: string;
  createdAt: Date;
}

const ContactSchema = new Schema<IContact>(
  {
    ownerWallet: { type: String, required: true, index: true },
    name: { type: String, required: true, trim: true },
    stellarAddress: { type: String, required: true },
  },
  { timestamps: true }
);

ContactSchema.index({ ownerWallet: 1, name: 1 }, { unique: true });

const Contact: Model<IContact> =
  mongoose.models.Contact ?? mongoose.model<IContact>("Contact", ContactSchema);

export default Contact;
