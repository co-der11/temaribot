import mongoose from "mongoose";

const questionSchema = new mongoose.Schema({
  text: {
    type: String,
    required: true,
  },
  category: {
    type: String,
    required: true,
  },
  asker: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  tgId: {
    type: String,
    required: true,
  },
  isAnonymous: {
    type: Boolean,
    required: true,
  },
  dateCreated: {
    type: Date,
    dafault: Date.now,
  },
});

export default mongoose.model("Question", questionSchema);
