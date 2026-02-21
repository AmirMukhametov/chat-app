import jwt from "jsonwebtoken"
import User from "../models/user.model.js"
import cookieParser from "cookie-parser"

export const protectRoute = async (req, res, next) => {
    try {  
        const token = req.cookies.jwt

        if(!token) {
            return res.status(401).json({ message: "Неавторизован" })
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET)

        if(!decoded) {
            return res.status(401).json({ message: "Невалидный токен" })
        }

        const user = await User.findById(decoded.userId).select("-password")

        if(!user) {
            return res.status(404).json({ message: "Пользователь не найден" })
        }

        req.user = user

        next()

    } catch(err) {
        console.log("Ошибка в protectRoute middleware: ", err.message)
        return res.status(500).json({ message: "Ошибка в protectRoute middleware" })
    }
}