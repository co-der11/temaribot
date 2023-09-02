import mongoose from "mongoose";

const userSchema = new mongoose.Schema({
  tgId: {
    type: Number,
    required: true,
  },
  username: {
    type: String,
  },
  firstName: {
    type: String,
    required: true,
  },
  lastName: {
    type: String,
    required: true,
  },

  materialAllowed: {
    type: Boolean,
    default: false,
  },
  materials: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Material",
    },
  ],
  grade: {
    type: Number,
    required: true,
  },
  dateCreated: {
    type: Date,
    dafault: Date.now,
  },
});

export default mongoose.model("User", userSchema);
