import { connect } from "mongoose";

async function connectToDB() {
    try {
        await connect(process.env.MONGO_URI);
        console.log("Connected to MongoDB...");
    } catch (error) {
        console.log("Connection failed to MongoDB", error);      
    }
}

export default connectToDB;