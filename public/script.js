const socket = io("/");
const videoGrid = document.getElementById("video-grid");
const myVideo = document.createElement("video");
const showChat = document.querySelector("#showChat");
const backBtn = document.querySelector(".header__back");
myVideo.muted = true;

backBtn.addEventListener("click", () => {
  document.querySelector(".main__left").style.display = "flex";
  document.querySelector(".main__left").style.flex = "1";
  document.querySelector(".main__right").style.display = "none";
  document.querySelector(".header__back").style.display = "none";
});

showChat.addEventListener("click", () => {
  document.querySelector(".main__right").style.display = "flex";
  document.querySelector(".main__right").style.flex = "1";
  document.querySelector(".main__left").style.display = "none";
  document.querySelector(".header__back").style.display = "block";
});

const user = prompt("Enter your name");
var peers = {};

//  for production
var peer = new Peer(undefined, {
  path: "/peerjs",
  host: "/",
  port: "443",
});

console.log(peer);

/*var peer = new Peer(undefined, {
  path: "/peerjs",
  host: "localhost",
  port: "3000",
});*/

let myVideoStream;
navigator.mediaDevices
  .getUserMedia({
    audio: true,
    video: true,
  })
  .then((stream) => {
    console.log(2);
    //console.log(stream);
    myVideoStream = stream;
    addVideoStream(myVideo, "You", stream);

    peer.on("call", (call) => {
      //console.log(call);
      console.log(3);
      console.log(call);
      call.answer(stream);
      const video = document.createElement("video");
      call.on("stream", (userVideoStream) => {
        addVideoStream(video, null, userVideoStream);
      });
      call.on('close', () => {
        video.remove();
      })
      var conn = peer.connect(call.peer);
      conn.on('open', () => {
        conn.on('data', (data) => {
          console.log('Received', data);
          const userName = data;
          peers[call.peer] = { call, userName };
        });
      });
      console.log(peers);
    });

    socket.on("user-connected", (userId, userName) => {
      console.log(4);
      console.log(peers);
      connectToNewUser(userId, userName, stream);
    });

    socket.on('user-disconnected', userId => {
      if (peers[userId]) peers[userId].close();
    })
  });

const connectToNewUser = (userId, userName, stream) => {
  const call = peer.call(userId, stream);
  var conn = peer.connect(userId);
  conn.on('open', () => {
    console.log("msg sent");
    conn.send(user);
  });

  const video = document.createElement("video");
  call.on("stream", (userVideoStream) => {
    addVideoStream(video, null, userVideoStream);
  });
  call.on('close', () => {
    video.remove();
  })
  console.log(call);
  peers[userId] = { call, userName };
};

peer.on("open", (id) => {
  console.log(1);
  console.log('userID: ' + id);
  socket.emit("join-room", ROOM_ID, id, user);
});

const addVideoStream = (video, userName, stream) => {
  video.srcObject = stream;
  video.addEventListener("loadedmetadata", () => {
    video.play();
    let ele = document.createElement("div");
    ele.append(video);
    let p2 = document.createElement('b');
    if (userName)
      p2.innerHTML = userName;
    p2.style.color = 'white';
    ele.append(p2);
    videoGrid.append(ele);
  });
};

let text = document.querySelector("#chat_message");
let send = document.getElementById("send");
let messages = document.querySelector(".messages");

send.addEventListener("click", (e) => {
  if (text.value.length !== 0) {
    socket.emit("message", text.value);
    text.value = "";
  }
});

text.addEventListener("keydown", (e) => {
  if (e.key === "Enter" && text.value.length !== 0) {
    socket.emit("message", text.value);
    text.value = "";
  }
});

const inviteButton = document.querySelector("#inviteButton");
const muteButton = document.querySelector("#muteButton");
const stopVideo = document.querySelector("#stopVideo");

muteButton.addEventListener("click", () => {
  const enabled = myVideoStream.getAudioTracks()[0].enabled;
  if (enabled) {
    myVideoStream.getAudioTracks()[0].enabled = false;
    html = `<i class="fas fa-microphone-slash"></i>`;
    muteButton.classList.toggle("background__red");
    muteButton.innerHTML = html;
  } else {
    myVideoStream.getAudioTracks()[0].enabled = true;
    html = `<i class="fas fa-microphone"></i>`;
    muteButton.classList.toggle("background__red");
    muteButton.innerHTML = html;
  }
});

stopVideo.addEventListener("click", () => {
  const enabled = myVideoStream.getVideoTracks()[0].enabled;
  if (enabled) {
    myVideoStream.getVideoTracks()[0].enabled = false;
    html = `<i class="fas fa-video-slash"></i>`;
    stopVideo.classList.toggle("background__red");
    stopVideo.innerHTML = html;
  } else {
    myVideoStream.getVideoTracks()[0].enabled = true;
    html = `<i class="fas fa-video"></i>`;
    stopVideo.classList.toggle("background__red");
    stopVideo.innerHTML = html;
  }
});

inviteButton.addEventListener("click", (e) => {
  prompt(
    "Copy this link and send it to people you want to chat with",
    window.location.href
  );
});

socket.on("createMessage", (message, userName) => {
  messages.innerHTML =
    messages.innerHTML +
    `<div class="message">
        <b><i class="far fa-user-circle"></i> <span> ${userName === user ? "me" : userName
    }</span> </b>
        <span>${message}</span>
    </div>`;
});
