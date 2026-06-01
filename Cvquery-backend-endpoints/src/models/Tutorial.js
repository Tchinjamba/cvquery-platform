const mongoose = require("mongoose");

const TutorialSchema = new mongoose.Schema(
  {
    slug: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true,
      enum: [
        "getting-started",
        "managing-sections",
        "template-editor",
        "cv-query-language",
        "importing-from-orcid",
        "exporting-your-cv",
      ],
    },

    title: {
      type: String,
      required: true,
      trim: true,
    },

    description: {
      type: String,
      default: "",
      trim: true,
    },

    category: {
      type: String,
      required: true,
      enum: ["intro", "sections", "templates", "cvquery", "integrations", "export"],
    },

    content: {
      type: String,
      required: true,
    },

    videoUrl: {
      type: String,
      default: "",
      trim: true,
    },

    duration: {
      type: Number,
      default: 0,
      min: 0,
    },

    order: {
      type: Number,
      required: true,
      min: 1,
    },

    published: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

TutorialSchema.index({ category: 1, order: 1 }, { unique: true });

module.exports = mongoose.model("Tutorial", TutorialSchema);