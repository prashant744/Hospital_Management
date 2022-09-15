const mongoose = require("mongoose");

var RoomSchema = mongoose.Schema({
  name: {
    type: String,
    unique: true,
    required: true,
  },
  availability: {
    type: Boolean,
    required: true,
    default: false,
  },
});

var Room = mongoose.model("Room", RoomSchema);

var rooms = {};
rooms["noroom"] = false;

function populateDatabase() {
  for (prop in rooms) {
    var room = Room({
      name: prop,
      availability: rooms[prop],
    });

    room.save().then(
      (disease) => {},
      (err) => {}
    );
  }
}

populateDatabase();

module.exports = { rooms, Room };
