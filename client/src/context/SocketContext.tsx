import { createContext, useContext, useEffect,useRef, type ReactNode } from "react"
import { io, Socket } from "socket.io-client";
import { useAppData } from "./AppContext";


interface ISocketContext {
    socket: Socket | null;
}

const socketContext = createContext<ISocketContext | null>({socket: null});

export const SocketProvider = ({ children }: { children: ReactNode }) => {
    const {isAuth} = useAppData()

    const socketRef = useRef<Socket | null>(null);

    useEffect(()=>{
        if(!isAuth){
            socketRef.current?.disconnect();
            socketRef.current = null;
            return;
        }
        if(socketRef.current){
            return;
        }

        const socket = io(import.meta.env.VITE_REALTIME_SERVICE_URL, {
            auth: {
                token: localStorage.getItem("token")
            },
            transports: ["websocket"]
        })

        socketRef.current = socket;
        socket.on("connect", ()=>{
            console.log("Connected to realtime server",socket.id);
        });
        socket.on("disconnect", ()=>{
            console.log("Disconnected from realtime server");
        });
        socket.on("connect_error", (err)=>{
            console.log("Connection error:", err.message);
        });
        return ()=>{
            socket.disconnect();
            socketRef.current = null;
        }
    },[isAuth]);

    return  <socketContext.Provider value={{socket: socketRef.current}}>
                {children}
            </socketContext.Provider>
}

export const useSocket = () => useContext(socketContext);