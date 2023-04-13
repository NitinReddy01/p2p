import React, { useCallback, useEffect, useState,useRef } from 'react';
import camera from './Icons/camera.png';
import mic from './Icons/mic.png';
import phone from './Icons/phone.png';
import doc from './Icons/doc.png';
import './room.css'
import { Link, useParams } from 'react-router-dom';
import AgoraRTM from 'agora-rtm-sdk';
import { v4 as uuid } from 'uuid';
import TextEditor from '../Texteditor';

const APP_ID = ""

const client = AgoraRTM.createInstance(APP_ID);
const uid = uuid();
const token = null;
let localStream;
let peerConnection;
let remoteStream;

const servers = {
    iceServers: [
        {
            urls: ['stun:stun1.l.google.com:19302', 'stun:stun2.l.google.com:19302']
        }
    ]
}

let constraints = {
    video: {
        width: { min: 640, ideal: 1920, max: 1920},
        height: { min: 480, ideal: 1080, max: 1080 },
    },
    audio: true
}

export default function Room() {
    const { roomID } = useParams();
    const [channel,setChannel] = useState();
    const user1Ref = useRef();
    const user2Ref = useRef();
    const [docsDisplay,setDocsDisplay] = useState(false);
    const videosRef = useRef();

    useEffect(() => {
        const script = document.createElement('script');
        script.src = './agora-rtm-sdk-1.5.1.js';
        script.async = true;
        script.type = "text/babel"
        document.body.appendChild(script);
        return () => {
            document.body.removeChild(script);
        }
    },[]);
    let handleDocsDisplay = () =>{
        if(!docsDisplay){
            user2Ref.current.style.height='60vh';
            videosRef.current.style.height='60vh';
            setDocsDisplay(true);
        }else{
            user2Ref.current.style.height='100vh';
            videosRef.current.style.height='100vh';
            setDocsDisplay(false);
        }
    }
    let handleUserLeft = (MemberId) => {
        
        user2Ref.current.style.display = 'none'
        user1Ref.current.classList.remove('smallFrame')
    }

    let createAnswer = useCallback( async (MemberId, offer) => {
        await createPeerConnection(MemberId)

        await peerConnection.setRemoteDescription(offer)

        let answer = await peerConnection.createAnswer()
        await peerConnection.setLocalDescription(answer)

        client.sendMessageToPeer({ text: JSON.stringify({ 'type': 'answer', 'answer': answer }) }, MemberId)
    },[]);

    let handleMessageFromPeer = useCallback( async (message, MemberId) => {

        message = JSON.parse(message.text)

        if (message.type === 'offer') {
            createAnswer(MemberId, message.offer)
        }

        if (message.type === 'answer') {
            addAnswer(message.answer)
        }

        if (message.type === 'candidate') {
            if (peerConnection) {
                peerConnection.addIceCandidate(message.candidate)
            }
        }
    },[createAnswer]);

    let createOffer = useCallback( async (MemberId) => {
        await createPeerConnection(MemberId)

        let offer = await peerConnection.createOffer()
        await peerConnection.setLocalDescription(offer)

        client.sendMessageToPeer({ text: JSON.stringify({ 'type': 'offer', 'offer': offer }) }, MemberId)
    },[])

    let handleUserJoined = useCallback( async (MemberId) => {
        console.log('A new user joined the channel:', MemberId)
        createOffer(MemberId)
    },[createOffer])

    let createPeerConnection = async (MemberId) => {
        peerConnection = new RTCPeerConnection(servers)

        remoteStream = await new MediaStream()
        user2Ref.current.srcObject = remoteStream
        user2Ref.current.style.display = 'block';
        user2Ref.current.style.height='100vh'
        user2Ref.current.style.width='100vw'
        user1Ref.current.classList.add('smallFrame');
        if (!localStream) {
            localStream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false })
            user1Ref.current.srcObject = localStream
        }

        localStream.getTracks().forEach((track) => {
            peerConnection.addTrack(track, localStream)
        })

        peerConnection.ontrack = (event) => {
            event.streams[0].getTracks().forEach((track) => {
                remoteStream.addTrack(track)
            })
        }

        peerConnection.onicecandidate = async (event) => {
            if (event.candidate) {
                client.sendMessageToPeer({ text: JSON.stringify({ 'type': 'candidate', 'candidate': event.candidate }) }, MemberId)
            }
        }
    }

    let addAnswer = async (answer) => {
        if (!peerConnection.currentRemoteDescription) {
            peerConnection.setRemoteDescription(answer)
        }
    }

    let toggleCamera = async () => {
        let videoTrack = localStream.getTracks().find(track => track.kind === 'video')

        if (videoTrack.enabled) {
            videoTrack.enabled = false
            document.getElementById('camera-btn').style.backgroundColor = 'rgb(255, 80, 80)'
        } else {
            videoTrack.enabled = true
            document.getElementById('camera-btn').style.backgroundColor = 'rgb(179, 102, 249, .9)'
        }
    }

    let toggleMic = async () => {
        let audioTrack = localStream.getTracks().find(track => track.kind === 'audio')

        if (audioTrack.enabled) {
            audioTrack.enabled = false
            document.getElementById('mic-btn').style.backgroundColor = 'rgb(255, 80, 80)'
        } else {
            audioTrack.enabled = true
            document.getElementById('mic-btn').style.backgroundColor = 'rgb(179, 102, 249, .9)'
        }
    }

    let leaveChannel = useCallback(async()=>{
        await channel.leave()
        await client.logout()
    },[channel]) 

    useEffect(() => {
        window.addEventListener('beforeunload', leaveChannel);
    
        return () => {
          window.removeEventListener('beforeunload', leaveChannel);
        };
      }, [leaveChannel]);

    useEffect(() => {
        const connect = async () => {
            await client.login({ uid, token });
            const channel = await client.createChannel(roomID);
            await channel.join();
            setChannel(channel);
            channel.on('MemberJoined', handleUserJoined)
            channel.on('MemberLeft', handleUserLeft)
            client.on('MessageFromPeer', handleMessageFromPeer)

            localStream = await navigator.mediaDevices.getUserMedia(constraints)
            user1Ref.current.srcObject = localStream

            return channel;
        }
        const connection = connect();
        return () => {
            const leave = async () =>{
                const channel = await connection;
                await client.logout();
                await channel.leave();
            }
            leave();
        }
    }, [roomID,handleUserJoined,handleMessageFromPeer]);
    return (
        <>
                <div id="videos" ref={videosRef} >
                    <video className="video-player" id="user-1" ref={user1Ref} autoPlay playsInline></video>
                    <video className="video-player" id="user-2" ref={user2Ref} autoPlay playsInline></video>
                </div>
                {docsDisplay && <TextEditor/>}
            <div id="controls">
                <div className="control-container" id="camera-btn">
                    <img src={camera} alt='error' onClick={toggleCamera} />
                </div>
                <div className="control-container" id="mic-btn">
                    <img src={mic} alt='error' onClick={toggleMic} />
                </div>
                <div className="control-container" id="mic-btn">
                    <img src={doc} alt='error' onClick={handleDocsDisplay}  />
                </div>
                <Link to="/">
                    <div className="control-container" id="leave-btn">
                        <img src={phone} alt='error' />
                    </div>
                </Link>
            </div>
        </>
    )
}
