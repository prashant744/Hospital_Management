const express = require("express");
const _ = require("lodash");
const router = express.Router();

var { Patient } = require("./../server/models/patient.js");
var { rooms, Room } = require("./../server/models/rooms.js");
const { ObjectID } = require("mongodb");

router.get("/app/getrooms", (req, res) => {
  Room.find({}, null, { sort: { name: 1 } })
    .then((rooms) => {
      var roomsJSON = {};
      // rooms is an array with all rooms
      for (var i = 0; i < rooms.length; ++i) {
        roomsJSON[rooms[i].name] = rooms[i].availability;
      }

      res.setHeader("Content-Type", "application/json");
      res.status(200).send(JSON.stringify(roomsJSON));
    })
    .catch((err) => {
      console.log(err);
      res.setHeader("Content-Type", "application/json");
      res.status(400).send(JSON.stringify({ noroom: false }));
    });
});

router.get("/app/updateroom/:hospitalNumber/:futureRoom", (req, res) => {
  var hospitalNumber = req.params.hospitalNumber;
  var futureRoom = req.params.futureRoom;

  Promise.all([
    Room.find({}),
    Room.findOne({ name: futureRoom }),
    Patient.findOne({ hospitalNumber: hospitalNumber }),
  ])
    .then((data) => {
      var rooms = data[0];
      var futureRoomObject = data[1];
      var patient = data[2];

      if (
        rooms &&
        patient &&
        futureRoomObject &&
        futureRoomObject["availability"] === false
      ) {
        // check that all the parameters were OK

        if (patient.room !== "noroom") {
          for (var i = 0; i < rooms.length; ++i) {
            if (rooms[i].name === patient.room) {
              rooms[i].availability = false;
              rooms[i].save();
              break;
            }
          }
        }

        patient.room = futureRoomObject.name;
        patient.save();

        if (futureRoomObject.name !== "noroom") {
          for (var i = 0; i < rooms.length; ++i) {
            if (rooms[i].name === futureRoomObject.name) {
              rooms[i].availability = true;
              rooms[i].save();
              break;
            }
          }
        }
        res.redirect("/app");
      } else {
        throw Error("Bad request to change the room. Check the parameters.");
      }
    })
    .catch((err) => {
      console.log(err);
      res.redirect("/app");
    });
});

router.get(
  "/app/swappatients/:patientWithRoom/:patientWithoutRoom",
  (req, res) => {
    var patientWithRoom = req.params.patientWithRoom;
    var patientWithoutRoom = req.params.patientWithoutRoom;

    Promise.all([
      Patient.findOne({ hospitalNumber: patientWithRoom }),
      Patient.findOne({ hospitalNumber: patientWithoutRoom }),
    ])
      .then((data) => {
        var patientWithRoom = data[0];
        var patientWithoutRoom = data[1];

        // Check if the patients have room and not have a room
        if (
          patientWithRoom &&
          patientWithoutRoom &&
          patientWithRoom["room"] !== "noroom" &&
          patientWithoutRoom["room"] === "noroom"
        ) {
          // check that all the parameters were OK
          // 1. Unassign the current room of the patientWithRoom
          var roomOfPatient = patientWithRoom["room"];

          patientWithRoom.room = "noroom";
          patientWithRoom.save();

          patientWithoutRoom.room = roomOfPatient;
          patientWithoutRoom.save();

          res.redirect("/app");
        } else {
          throw Error("Bad request to change the room. Check the parameters.");
        }
      })
      .catch((err) => {
        console.log(err);
        res.redirect("/app");
      });
  }
);

router.post("/app/addroom", (req, res) => {
  var roomName = req.body.roomName;

  // check that the name is a String
  if (_.isString(roomName) && !_.isNaN(roomName)) {
    var room = Room({
      name: roomName,
      availability: false,
    });

    room
      .save()
      .then((room) => {
        console.log("Room added");
        res.status(200).redirect("/app/systemsettings");
      })
      .catch((err) => {
        console.log(err);
        res.status(400).redirect("/app/systemsettings");
      });
  } else {
    res
      .status(400)
      .redirect("/app/systemsettings", {
        messages: req.flash("success_msg", "Room added succesfully."),
      });
  }
});

router.post("/app/deleterooms", (req, res) => {
  var roomsToDelete = req.body.RD;

  if (_.isArray(roomsToDelete)) {
    for (var i = 0; i < roomsToDelete.length; ++i) {
      Room.find({
        name: roomsToDelete[i],
      })
        .remove()
        .catch((err) => {
          console.log(err);
        });

      Patient.findOneAndUpdate(
        {
          room: roomsToDelete[i],
        },
        {
          $set: {
            room: "noroom",
          },
        }
      ).catch((err) => {
        console.log(err);
      });
    }
    res.status(200).redirect("/app/systemsettings");
  } else {
    res.status(400).redirect("/app/systemsettings");
  }
});

module.exports = router;
