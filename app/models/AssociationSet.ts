import mongoose, { Schema, Document } from "mongoose";

export interface IAssociationSet extends Document {
  scope: string;
  labels: string[];
  root: string;
  updatedAt: Date;
}

const AssociationSetSchema = new Schema<IAssociationSet>({
  scope: { type: String, required: true, unique: true },
  labels: { type: [String], required: true, default: [] },
  root: { type: String, required: true, default: "0" },
  updatedAt: { type: Date, default: Date.now },
});

export default mongoose.models.AssociationSet ||
  mongoose.model<IAssociationSet>("AssociationSet", AssociationSetSchema);
