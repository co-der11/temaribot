import mongoose from "mongoose";

const answerSchema = new mongoose.Schema({
  text: {
    type: String,
    required: true,
  },
  answeredBy: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    ref: "User",
  },
  question: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    ref: "Question",
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

export default mongoose.model("Answer", answerSchema);
