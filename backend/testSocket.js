const { io } = require("socket.io-client");

const socket = io("http://localhost:5000");

socket.on("connect", () => {

    console.log("Connected to WebSocket server");

    console.log(
        "Socket ID:",
        socket.id
    );
});

socket.on("PULL_STARTED", (data) => {

    console.log(
        "PULL_STARTED:",
        data
    );

});

socket.on("PULL_RUNNING", (data) => {

    console.log(
        "PULL_RUNNING:",
        data
    );

});

socket.on("PULL_COMPLETED", (data) => {

    console.log(
        "PULL_COMPLETED:",
        data
    );

});

socket.on("PULL_FAILED", (data) => {

    console.log(
        "PULL_FAILED:",
        data
    );

});