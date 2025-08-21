const Canvas = require("../models/canvas");
const User = require("../models/user");
const mongoose = require("mongoose");

const createCanvas = async (req, res) => {
    try {
        const userId = req.userId

        const newCanvas = new Canvas({
            owner: userId,
            shared: [],
            elements: []
        });

        await newCanvas.save();
        res.status(201).json({ message: "Canvas created successfully", canvasId: newCanvas._id });
    } catch (error) {
        res.status(500).json({ error: "Failed to create canvas", details: error.message });
    }
};
const updateCanvas = async (req, res) => {
    try {
        const { canvasId, elements } = req.body;
        const userId = req.userId;
        

        const canvas = await Canvas.findById(canvasId);
        if (!canvas) {
            return res.status(404).json({ error: "Canvas not found" });
        }


        const isSharedWithUser = canvas.shared.some(id => id.toString() === String(userId));
        if (canvas.owner.toString() !== String(userId) && !isSharedWithUser) {
            return res.status(403).json({ error: "Unauthorized to update this canvas" });
        }

        canvas.elements = elements;
        await canvas.save();

        

        res.json({ message: "Canvas updated successfully" });
    } catch (error) {
        res.status(500).json({ error: "Failed to update canvas", details: error.message });
    }
};
const loadCanvas = async (req, res) => {
    try {
        const canvasId = req.params.id;
        const userId = req.userId;

        const canvas = await Canvas.findById(canvasId);
        if (!canvas) {
            return res.status(404).json({ error: "Canvas not found" });
        }


        const isSharedWithUser = canvas.shared.some(id => id.toString() === String(userId));
        if (canvas.owner.toString() !== String(userId) && !isSharedWithUser) {
            return res.status(403).json({ error: "Unauthorized to access this canvas" });
        }

        res.json(canvas);
    } catch (error) {
        res.status(500).json({ error: "Failed to load canvas", details: error.message });
    }
};


const shareCanvas = async (req, res) => {
    try {
        const { email } = req.body; 
        const canvasId = req.params.id;
        const userId = req.userId; 


        const userToShare = await User.findOne({ email });
        if (!userToShare) {
            return res.status(404).json({ error: "User with this email not found" });
        }

        const canvas = await Canvas.findById(canvasId);
        if (!canvas) {
            return res.status(404).json({ error: "Canvas not found" });
        }

        if (canvas.owner.toString() !== userId) {
            return res.status(403).json({ error: "Only the owner can share this canvas" });
        }


        const sharedUserId = new mongoose.Types.ObjectId(userToShare._id);


        if (canvas.owner.toString() === sharedUserId.toString()) {
            return res.status(400).json({ error: "Owner cannot be added to shared list" });
        }
        const alreadyShared = canvas.shared.some(id => id.toString() === sharedUserId.toString());
        if (alreadyShared) {
            return res.status(400).json({ error: "Already shared with user" });
        }
        canvas.shared.push(sharedUserId);
        await canvas.save();

        res.json({ message: "Canvas shared successfully" });
    } catch (error) {
        res.status(500).json({ error: "Failed to share canvas", details: error.message });
    }
};

const unshareCanvas = async (req, res) => {
    try {
        const { userIdToRemove } = req.body;
        const canvasId = req.params.id;
        const userId = req.userId;

        const canvas = await Canvas.findById(canvasId);
        if (!canvas) {
            return res.status(404).json({ error: "Canvas not found" });
        }

        if (canvas.owner.toString() !== userId) {
            return res.status(403).json({ error: "Only the owner can unshare this canvas" });
        }

        canvas.shared = canvas.shared.filter(id => id.toString() !== userIdToRemove);
        await canvas.save();

        res.json({ message: "Canvas unshared successfully" });
    } catch (error) {
        res.status(500).json({ error: "Failed to unshare canvas", details: error.message });
    }
};

const deleteCanvas = async (req, res) => {
    try {
        const canvasId = req.params.id;
        const userId = req.userId;
        
        

        const canvas = await Canvas.findById(canvasId);
        if (!canvas) {
            
            return res.status(404).json({ error: "Canvas not found" });
        }

        

        if (canvas.owner.toString() !== userId) {
            
            return res.status(403).json({ error: "Only the owner can delete this canvas" });
        }

        
        await Canvas.findByIdAndDelete(canvasId);
        
        
        res.json({ message: "Canvas deleted successfully" });
    } catch (error) {
        console.error('Error in deleteCanvas:', error);
        res.status(500).json({ error: "Failed to delete canvas", details: error.message });
    }
};

const getUserCanvases = async (req, res) => {
    try {
        const userId = req.userId;

        const canvases = await Canvas.find({
            $or: [{ owner: userId }, { shared: userId }]
        }).sort({ createdAt: -1 });

        res.json(canvases);
    } catch (error) {
        res.status(500).json({ error: "Failed to fetch canvases", details: error.message });
    }
};

module.exports = {
    createCanvas,
    updateCanvas,
    loadCanvas,
    shareCanvas,
    unshareCanvas,
    deleteCanvas,
    getUserCanvases
};