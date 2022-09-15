const mongoose = require("mongoose");

var DiseaseSchema = mongoose.Schema({
  name: {
    type: String,
    unique: true,
    required: true,
  },
  score: {
    type: Number,
    required: true,
    default: 0,
  },
});

var Disease = mongoose.model("Disease", DiseaseSchema);

var scoreOfDisease = {};

module.exports = { scoreOfDisease, Disease };
