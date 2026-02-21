import {create} from "zustand"
import { axiosInstance } from "../lib/axios"
import toast from "react-hot-toast";
import { io } from "socket.io-client"
import { Socket } from "socket.io-client";

const BASE_URL = import.meta.env.MODE === "development" ? "http://localhost:3001" : "/"

interface AuthState {
    authUser: any; 
    isSigningUp: boolean;
    isLoginingIn: boolean;
    isUpdatingProfile: boolean;
    isCheckingAuth: boolean;
    onlineUsers: string[]; 
    socket: Socket | null;
    checkAuth: () => Promise<void>;
    signup: (data: SignUpData) => Promise<void>; 
    logout: () => Promise<void>;
    login: (data: { email: string; password: string }) => Promise<void>;
    updateProfile: (data: { profilePic: string; }) => Promise<void>;
    connectSocket: () => void;
    disconnectSocket: () => void;
}

interface SignUpData {
    fullName: string;
    email: string;
    password: string;
}






export const useAuthStore = create<AuthState>((set, get) => ({
    authUser: null, 
    isSigningUp: false,
    isLoginingIn: false,
    isUpdatingProfile: false,
    onlineUsers: [],
    socket: null,

    isCheckingAuth: true,

    checkAuth: async() => {
        try {
            const res = await axiosInstance.get("/auth/check");

            set({authUser:res.data})
            get().connectSocket();

        } catch (err) {
            console.log("Ошибка в checkAuth")
            set({authUser:null})
        } finally {
            set({isCheckingAuth: false})
        }
    },

    signup: async(data: SignUpData) => {
        set({ isSigningUp: true})

        try {
            const res = await axiosInstance.post("/auth/signup", data)
            set({ authUser: res.data })
            toast.success("Account created successfully")
            get().connectSocket();

        } catch (error: unknown) {
            if (error && typeof error === "object" && "response" in error) {
        const err = error as { response?: { data?: { message?: string } } };
        toast.error(err.response?.data?.message || "Something went wrong");
      } else {
        toast.error("An unexpected error occurred");
      }

        } finally {
            set({ isSigningUp: false })
        }
    },

    logout: async() => {
        try {
            await axiosInstance.post("/auth/logout");
            set({ authUser: null })
            toast.success("Logged out successfully")
            get().disconnectSocket();

        } catch (error: unknown) {
             if (error && typeof error === "object" && "response" in error) {
            const err = error as { response?: { data?: { message?: string } } };
            toast.error(err.response?.data?.message || "Something went wrong");
        } else {
            toast.error("An unexpected error occurred");
        }
        }
    },

    login: async(data: { email: string; password: string }) => {
        set({ isLoginingIn: true });
    try {
      const res = await axiosInstance.post("/auth/login", data);
      set({ authUser: res.data });
      toast.success("Logged in successfully");

        get().connectSocket();
    } catch (error: unknown) {
      if (error && typeof error === "object" && "response" in error) {
                const err = error as { response?: { data?: { message?: string } } };
                toast.error(err.response?.data?.message || "Something went wrong");
            } else {
                toast.error("An unexpected error occurred");
            }
    } finally {
      set({ isLoginingIn: false });
    }
    },

    updateProfile: async(data) => {
        set({ isUpdatingProfile: true })
        try {
            const res = await axiosInstance.put("/auth/update-profile", data);
            set({ authUser: res.data})
            toast.success("Profile update successfully")
        } catch(error) {
            console.log("Ошибка в обновлении профиля", error)
             if (error && typeof error === "object" && "response" in error) {
                const err = error as { response?: { data?: { message?: string } } };
                toast.error(err.response?.data?.message || "Something went wrong");
            } else {
                toast.error("An unexpected error occurred");
            }
        } finally {
            set({ isUpdatingProfile: false })
        }
    },

    connectSocket: () => {
        const {authUser} = get()
        if(!authUser || get().socket?.connected) return
        const socket = io(BASE_URL, {
            query:{
                userId: authUser._id
            },
        })
        socket.connect()

        set({ socket:socket })

        socket.on("getOnlineUsers", (userIds) => {
            set({ onlineUsers: userIds})
        })
    },
    disconnectSocket: () => {
        const { socket } = get();
        if (socket?.connected) {
            socket.disconnect();
            set({ socket: null });
        }
    },
}))
