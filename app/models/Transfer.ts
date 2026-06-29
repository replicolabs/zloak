import mongoose, { Schema, Document, Model } from "mongoose";

export type TransferStatus = "pending" | "completed" | "failed";
export type SupportedCurrency = "USD" | "GBP" | "NGN";

export interface ITransfer extends Document {
  senderWallet: string;
  recipientAddress: string;
  recipientName: string | null;   
  originalAmount: number;
  originalCurrency: SupportedCurrency;
  usdcAmount: number;             
  noteCount: number;          
  depositTxHashes: string[];
  withdrawTxHashes: string[];
  status: TransferStatus;
  errorMessage: string | null;
  createdAt: Date;
  updatedAt: Date;
}

const TransferSchema = new Schema<ITransfer>(
  {
    senderWallet: { type: String, required: true, index: true },
    recipientAddress: { type: String, required: true },
    recipientName: { type: String, default: null },
    originalAmount: { type: Number, required: true },
    originalCurrency: { type: String, enum: ["USD", "GBP", "NGN"], required: true },
    usdcAmount: { type: Number, required: true },
    noteCount: { type: Number, required: true },
    depositTxHashes: { type: [String], default: [] },
    withdrawTxHashes: { type: [String], default: [] },
    status: { type: String, enum: ["pending", "completed", "failed"], default: "pending" },
    errorMessage: { type: String, default: null },
  },
  { timestamps: true }
);

const Transfer: Model<ITransfer> =
  mongoose.models.Transfer ?? mongoose.model<ITransfer>("Transfer", TransferSchema);

export default Transfer;
