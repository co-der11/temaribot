import mongoose from "mongoose";

const tutorSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  tgId: {
    type: String,
    required: true,
  },
  age: {
    type: Number,
    required: true,
  },
  experience: {
    type: Number,
    required: true,
  },
  cvId: {
    type: String,
    required: true,
  },
  city: {
    type: String,
    required: true,
  },
  educationLevel: {
    type: String,
    required: true,
  },
  verified: {
    type: Boolean,
    default: false,
  },
  availableOnline: {
    type: Boolean,
    default: false,
  },
  schedule: {
    type: String,
    required: true,
  },
  rating: {
    type: Number,
    required: true,
    default: 0,
  },
  dateCreated: {
    type: Date,
    required: true,
  },
});

export default mongoose.model("Tutor", tutorSchema);
