import {create} from "zustand"
import { axiosInstance } from "../lib/axios"
import toast from "react-hot-toast";
import axios from "axios";
import { useAuthStore } from "./useAuthStore";

interface User {
  _id: string;
  fullName: string;
  profilePic?: string;
}

interface ChatStore {
    messages: any[];
    users: any[]; 
    selectedUser: any | null; 
    isUsersLoading: boolean;
    isMessagesLoading: boolean;
    getUsers: () => Promise<void>;
    getMessages: (userId: string) => Promise<void>;
    setSelectedUser: (user: User | null) => void;
    sendMessage: (messagesData: any) => Promise<void>; 
    subscribeToMessages: () => void;          // 👈 добавить
    unsubscribeFromMessages: () => void;  
}


export const useChatStore = create<ChatStore>((set, get) => ({
    messages: [],
    users: [],
    selectedUser: null,
    isUsersLoading: false,
    isMessagesLoading: false,


    getUsers: async() => {
        set({ isUsersLoading: true })
        try {
            const res = await axiosInstance.get("/messages/users")
            set({ users: res.data })
        } catch (err) {
            if (axios.isAxiosError(err) && err.response) {
                toast.error(err.response.data.message)
            } else {
                toast.error("An error occurred")
            }
        } finally {
            set({ isUsersLoading: false })
        }
    },
    
    getMessages: async(userId: string) => {
        set({ isMessagesLoading: true });
        try {
            const res = await axiosInstance.get(`/messages/${userId}`)
            set({ messages: res.data })
        } catch (err) {
            if (axios.isAxiosError(err) && err.response) {
                toast.error(err.response.data.message);
            } else {
                toast.error("An error occurred");
            }
        } finally {
            set({ isMessagesLoading: false });
        }
    },

    sendMessage: async (messagesData) => {
        const { selectedUser, messages } = get();
        try {
            const res = await axiosInstance.post(`/messages/send/${selectedUser._id}`, messagesData);
            set({ messages: [...messages, res.data] });
        } catch (err) {
            if (axios.isAxiosError(err) && err.response) {
                toast.error(err.response.data.message);
            } else {
                toast.error("An error occurred");
            }
        }
    },

    subscribeToMessages: () => {
    const { selectedUser } = get();
    if (!selectedUser) return;

    const socket = useAuthStore.getState().socket;
    if (!socket) return;

    socket.on("newMessage", (newMessage) => {
        const isMessageSentFromSelectedUser =
            newMessage.senderId === selectedUser._id;

        if (!isMessageSentFromSelectedUser) return;

        set({
            messages: [...get().messages, newMessage],
        });
    });
    },  

    unsubscribeFromMessages: () => {
        const socket = useAuthStore.getState().socket;
        if (!socket) return;

        socket.off("newMessage");
    },

    setSelectedUser: (user: User | null) => set({ selectedUser: user }), 

}))