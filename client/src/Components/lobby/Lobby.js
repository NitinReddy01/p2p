import React,{useState} from 'react'
import { useNavigate } from 'react-router-dom';
import './lobby.css'

export default function Lobby() {
  const [roomId,setRoomId]=useState('');
  const navigate = useNavigate();
  let onChangeHandler=(e)=>{
    setRoomId(e.target.value);
  }
  let toRoom = (e)=>{
    e.preventDefault();
    navigate(`/${roomId}`)
  }  
  return (
    <main id="lobby-container">
        <div id="form-container">
            <div id="form__container__header">
                <p>👋 Create OR Join a Room</p>
            </div>
            <div id="form__content__wrapper">
                <form id="join-form">
                    <input type="text" name="invite_link" value={roomId} onChange={onChangeHandler} required/>
                    <input type="submit" value="Join Room" onClick={toRoom} />
                </form>
            </div>
        </div>
    </main>
  )
}
