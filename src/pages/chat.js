import { AppBar, Typography } from "@mui/material";
import Toolbar from '@mui/material/Toolbar';

import { React, useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";

import SockJS from "sockjs-client"
import { over } from "stompjs";

import UserList from "../components/userList";
import ChatBox from "../components/chatBox";

var stompClient = null;

export default function Chat() {

    let params = useParams();

    useEffect(() => {
        // Socket connection
        let sock = new SockJS("http://localhost:8080/ws");
        stompClient = over(sock);
        stompClient.connect({}, onConnected, onFail);
    }, []);

    const [userData, setUserData] = useState(
        {
            userName: "",
            message: "",
            connected: ""
        }
    );
    
    const [globalData, setGlobalData] = useState(
        {
            userList: [],
            messages: []
        }
    );

    const onConnected = () => {
        stompClient.subscribe("/topic/public", onReceiveMessage);
        stompClient.send("/app/chat.msg",
            {},
            JSON.stringify({sender: params.name, content:"", status: "JOIN"})
        );
        setUserData({userName: params.name, message: "", connected: true}); // setstate async
    };

    const onFail = (err) => {
        console.log(err);
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        if(userData.message && stompClient) {
            var chatMessage = {
                sender: userData.userName,
                content: userData.message,
                status: 'CHAT'
            };
            stompClient.send("/app/chat.msg", {}, JSON.stringify(chatMessage));
            userData.message = "";
        }
    };

    const onReceiveMessage = (payload) => {
        let message = JSON.parse(payload.body);

        if (message.status === "JOIN") {
            globalData.userList.push(message.sender);
            console.log(message);
            globalData.messages.push(message);
            setGlobalData({...globalData, messages: globalData.messages, userList: globalData.userList});
        } else if (message.status === "LEAVE") {
            let newUsers = globalData.userList.filter((value) => {return value === message.sender;});
            setGlobalData({...globalData, userList: newUsers});
        } else {
            globalData.messages.push(message);
            setGlobalData({...globalData, messages: globalData.messages});
        }
    }

    return (
        <>
            <AppBar position="static" style={{background: "#e84927"}}>
                <Toolbar variant="dense">
                <Link to="/"><svg id="back-btn" width="30" height="30" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg"><rect width="48" height="48" fill="white" fillOpacity="0.01"/><path fillRule="evenodd" clipRule="evenodd" d="M44 40.8361C39.1069 34.8632 34.7617 31.4739 30.9644 30.6682C27.1671 29.8625 23.5517 29.7408 20.1182 30.303V41L4 23.5453L20.1182 7V17.167C26.4667 17.2172 31.8638 19.4948 36.3095 24C40.7553 28.5052 43.3187 34.1172 44 40.8361Z" fill="#ffffff" stroke="#ffffff" strokeWidth="4" strokeLinejoin="round"/></svg></Link>
                <Typography variant="h3" color="inherit" component="div">
                    UIUChat
                </Typography>
                </Toolbar>
            </AppBar>
            <div className="chat-container">
                <div className="users-container">
                    <UserList users={globalData.userList} />
                </div>
                <div className="message-container">
                    <div className="message-header">
                        <svg id="message-icon" width="48" height="48" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg"><rect width="48" height="48" fill="white" fillOpacity="0.01"/><rect width="48" height="48" fill="white" fillOpacity="0.01"/><path d="M44 6H4V36H13V41L23 36H44V6Z" fill="#002155" stroke="#002155" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round"/><path d="M14 19.5V22.5" stroke="#FFF" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round"/><path d="M24 19.5V22.5" stroke="#FFF" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round"/><path d="M34 19.5V22.5" stroke="#FFF" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round"/></svg>
                        <h3 id="topic">{params.topic}</h3>
                    </div>
                    <ChatBox msg={globalData.messages} />
                    <form onSubmit={(e) => handleSubmit(e)}>
                        <input className="chat-input" type="text" value={userData.message} onChange={(e) => {setUserData({
                            ...userData,
                            "message": e.target.value,
                        })}} />
                        <input className="chat-btn" type="submit"></input>
                    </form>
                </div>
            </div>
        </>
    ); 
}
