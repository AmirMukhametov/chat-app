import User from "../models/user.model.js"
import Message from "../models/message.modal.js"
import cloudinary from "../lib/cloudinary.js"
import { io, getReceiverSockeId } from "../lib/socket.js"

export const getUsersForSidebar = async(req, res) => {
    try {
        const loggetInUserId = req.user._id
        const filteredUsers = await User.find({_id: {$ne:loggetInUserId}}).select("-password")

        res.status(200).json(filteredUsers)
    } catch (err) {
        console.log("Ошибка в getUsersForSidebar", err.message)
        res.status(500).json({error: "Ошибка в getUsersForSidebar"})
    }
}

export const getMessages = async(req, res) => {
    try {
        const { id:userToChatId } = req.params
        const myId = req.user._id

        const messages = await Message.find({
            $or:[
                {senderId:myId, receiverId:userToChatId},
                {senderId:userToChatId, receiverId:myId}
            ]
        })

        res.status(200).json(messages)
    } catch (err) {
        console.log("Ошибка в getMessages контроллере", err.message)
        res.status(500).json({error: "Ошибка в getMessages контроллере"})

    }
}

export const sendMessages = async(req, res) => {
    try {
        const { text, image} = req.body
        const { id: receiverId } = req.params
        const senderId = req.user._id

        let imageUrl
        if(image) {
            const uploadResponse = cloudinary.uploader.upload(image)
            imageUrl = (await uploadResponse).secure_url
        }

        const newMessage = new Message({
            senderId,
            receiverId,
            text,
            image: imageUrl
        })

        await newMessage.save()

        const receiverSockeId = getReceiverSockeId(receiverId)
        if(receiverSockeId) {
            io.to(receiverSockeId).emit("newMessage", newMessage)
        }

        res.status(201).json(newMessage)
    } catch(err) {
        console.log("Ошибка в sendMessages контроллере", err.message)
        res.status(500).json({error: "Ошибка в sendMessages контроллере"})
    }
}