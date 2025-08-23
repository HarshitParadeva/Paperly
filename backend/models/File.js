import mongoose from "mongoose";

const fileSchema = new mongoose.Schema({
  originalname: { type: String, required: true },
  mimetype: { type: String, required: true },
  size: { type: Number, required: true },
  path: { type: String, required: true }, // local storage path
  classroomId: { type: mongoose.Schema.Types.ObjectId, ref: "Classroom" },
  uploadedAt: { type: Date, default: Date.now }
});

export default mongoose.model("File", fileSchema);
